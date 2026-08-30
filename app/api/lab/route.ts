import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { labComponentResponses, learnerProfiles } from "@/db/schema";
import { applyExperimentAction, experimentView, storedExperimentFromView, type ExperimentAction, type ExperimentView } from "@/lib/experiment";
import { type ChecklistProps, type LabComponent, type LikertProps, parseWorkbookPrompt, type ReflectionProps } from "@/lib/habit-lab";
import { componentForLab, defaultLab, labById, labComponentIds, labComponents, labStepIds } from "@/lib/lab-catalog";
import { evidenceClassForComponent, measurementDefinitionForComponent, pairedSelfReportChange } from "@/lib/measurement";
import { sessionFromRequest } from "@/lib/session";

type LabPayload = { cartridgeId?: string; stepId?: string; componentId?: string; payload?: unknown; isComplete?: boolean };
type StoredRow = typeof labComponentResponses.$inferSelect;
type Learner = typeof learnerProfiles.$inferSelect;

function failure(message: string, status = 400) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function learnerForRequest(request: Request) {
  const sessionId = sessionFromRequest(request);
  if (!sessionId) return null;
  const db = getDb();
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.sessionId, sessionId)).limit(1);
  return profile ?? null;
}

function safeParse(payload: string) {
  try { return JSON.parse(payload) as unknown; } catch { return null; }
}

function normalisedResponse(row: StoredRow, component: LabComponent | undefined, now = Date.now()) {
  const storedPayload = safeParse(row.payload);
  const temporal = component?.type === "DailyExperiment" ? experimentView(storedPayload, now) : null;
  return {
    stepId: row.stepId,
    componentId: row.componentId,
    payload: temporal ?? storedPayload,
    isComplete: component?.type === "DailyExperiment" ? Boolean(temporal?.reviewAvailable) : row.isComplete,
    beiTarget: row.beiTarget,
    measurementVersion: row.measurementVersion,
    evidenceClass: row.evidenceClass,
    updatedAt: row.updatedAt,
  };
}

function validatedCompletion(component: LabComponent, payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  if (component.type === "StoryNarrative") return "selectedIndex" in payload && typeof payload.selectedIndex === "number";
  if (component.type === "PrivateReflection") {
    const answers = "answers" in payload && payload.answers && typeof payload.answers === "object" ? payload.answers as Record<string, unknown> : {};
    return parseWorkbookPrompt((component.props as ReflectionProps).prompt).items.every((item) => String(answers[item.id] ?? "").trim());
  }
  if (component.type === "LikertMatrix") {
    const answers = "answers" in payload && payload.answers && typeof payload.answers === "object" ? payload.answers as Record<string, unknown> : {};
    return (component.props as LikertProps).items.every((_, index) => typeof answers[String(index)] === "number");
  }
  if (component.type === "WorkbookChecklist") {
    const selected = "selectedIndices" in payload && Array.isArray(payload.selectedIndices) ? payload.selectedIndices : [];
    return selected.length >= ((component.props as ChecklistProps).minimumSelections ?? 1);
  }
  if (component.type === "MindfulBreath") return "completed" in payload && payload.completed === true;
  if (component.type === "EvidenceSummary") {
    const answers = "answers" in payload && payload.answers && typeof payload.answers === "object" ? payload.answers as Record<string, unknown> : {};
    return "summaryAction" in payload && payload.summaryAction === "confirm" && String(answers.synthesis ?? "").trim().length > 0;
  }
  if (component.type === "CompletionCertificate") return "certificateAction" in payload && payload.certificateAction === "accept";
  return false;
}

function experimentFromResponses(components: LabComponent[], responses: ReturnType<typeof normalisedResponse>[]) {
  const experiment = components.find((component) => component.type === "DailyExperiment");
  const payload = responses.find((response) => response.componentId === experiment?.id)?.payload;
  return payload && typeof payload === "object" && "experimentVersion" in payload ? payload as ExperimentView : null;
}

function certificateContext(profile: Learner) {
  if (profile.deliveryEdition === "school") return profile.grade ? `School Edition · Grade ${profile.grade}` : "School Edition";
  if (profile.deliveryEdition === "workplace") return profile.organisation ? `Workplace Edition · ${profile.organisation}` : "Workplace Edition";
  return profile.programme ? `Youth Programme Edition · ${profile.programme}` : "Youth Programme Edition";
}

export async function GET(request: Request) {
  const requestedCartridgeId = new URL(request.url).searchParams.get("cartridgeId") ?? defaultLab.cartridgeId;
  const lab = labById(requestedCartridgeId);
  if (!lab) return failure("That learner Lab is not published.", 404);
  const steps = lab.timeline.steps;
  const components = labComponents(lab);
  const componentById = new Map(components.map((component) => [component.id, component]));
  const learner = await learnerForRequest(request);
  if (!learner) return Response.json({ responses: [], summary: { completedComponents: 0, completedSteps: [], currentStepId: steps[0]?.id, totalComponents: components.length, totalSteps: steps.length } }, { headers: { "Cache-Control": "no-store" } });

  const db = getDb();
  const rows = await db.select().from(labComponentResponses)
    .where(and(eq(labComponentResponses.learnerId, learner.id), eq(labComponentResponses.cartridgeId, lab.cartridgeId)))
    .orderBy(desc(labComponentResponses.updatedAt));
  const responses = rows.filter((row) => componentById.has(row.componentId)).map((row) => normalisedResponse(row, componentById.get(row.componentId)));
  const completeIds = new Set(responses.filter((response) => response.isComplete).map((response) => response.componentId));
  const completedSteps = steps.filter((step) => step.components.every((component) => completeIds.has(component.id))).map((step) => step.id);
  const currentStepId = steps.find((step) => !completedSteps.includes(step.id))?.id ?? null;
  return Response.json({ responses, summary: { completedComponents: completeIds.size, completedSteps, currentStepId, totalComponents: components.length, totalSteps: steps.length, cartridgeId: lab.cartridgeId } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const learner = await learnerForRequest(request);
  if (!learner) return failure("Open or create your learner profile before entering the Lab.", 401);
  let body: LabPayload;
  try { body = await request.json() as LabPayload; } catch { return failure("That interaction request was incomplete."); }
  const lab = labById(body.cartridgeId ?? defaultLab.cartridgeId);
  if (!lab) return failure("That learner Lab is not published.", 404);
  const stepId = body.stepId ?? "";
  const componentId = body.componentId ?? "";
  if (!labStepIds(lab).has(stepId) || !labComponentIds(lab).has(componentId)) return failure("That interaction is not part of this learner cartridge.");
  const step = lab.timeline.steps.find((candidate) => candidate.id === stepId);
  if (!step?.components.some((component) => component.id === componentId)) return failure("That interaction does not belong to this investigation.");
  const component = componentForLab(lab, componentId);
  if (!component) return failure("That interaction could not be resolved in this learner cartridge.");

  const db = getDb();
  const now = Date.now();
  const components = labComponents(lab);
  const componentById = new Map(components.map((candidate) => [candidate.id, candidate]));
  const existingRows = await db.select().from(labComponentResponses)
    .where(and(eq(labComponentResponses.learnerId, learner.id), eq(labComponentResponses.cartridgeId, lab.cartridgeId)));
  const existingResponses = existingRows.filter((row) => componentById.has(row.componentId)).map((row) => normalisedResponse(row, componentById.get(row.componentId), now));
  const responseById = new Map(existingResponses.map((response) => [response.componentId, response]));
  const componentIndex = components.findIndex((candidate) => candidate.id === component.id);
  const firstIncompleteBefore = components.slice(0, componentIndex).find((candidate) => !responseById.get(candidate.id)?.isComplete);
  if (firstIncompleteBefore) return failure("Complete the earlier activity before opening this evidence point.", 409);

  let savedPayload = body.payload ?? null;
  let isComplete = false;
  if (component.type === "DailyExperiment") {
    try {
      const existing = existingRows.find((row) => row.componentId === component.id);
      const requestedAction = body.payload as ExperimentAction;
      const governedAction = requestedAction?.experimentAction === "start" ? { ...requestedAction, timeZone: learner.timeZone } : requestedAction;
      const view = applyExperimentAction(existing ? safeParse(existing.payload) : null, governedAction, now);
      savedPayload = storedExperimentFromView(view);
      isComplete = view.reviewAvailable;
    } catch (error) {
      return failure(error instanceof Error ? error.message : "Your experiment record could not be saved.", 409);
    }
  } else {
    isComplete = validatedCompletion(component, savedPayload);
    if (component.type === "EvidenceSummary") {
      if (!isComplete) return failure("Write and confirm your synthesis before saving the evidence summary.");
      const changes = pairedSelfReportChange(lab, existingResponses);
      const experiment = experimentFromResponses(components, existingResponses);
      savedPayload = { ...(savedPayload as object), derived: { changes, capturedDays: experiment?.answeredDays ?? 0, appliedCount: experiment?.appliedCount ?? 0, missingDays: experiment?.missedDays ?? 0, calculatedAt: now } };
    }
    if (component.type === "CompletionCertificate") {
      if (!isComplete) return failure("Accept the completion record before BIS issues the certificate.");
      const changes = pairedSelfReportChange(lab, existingResponses).map(({ construct, pre, post, difference }) => ({ construct, pre, post, difference }));
      const experiment = experimentFromResponses(components, existingResponses);
      savedPayload = {
        certificateAction: "accept",
        certificate: {
          certificateId: `BIS-V1-L${lab.source?.labNumber ?? 0}-${new Date(now).getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
          learnerName: `${learner.firstName} ${learner.surname}`,
          completedAt: now,
          context: certificateContext(learner),
          cartridgeId: lab.cartridgeId,
          labTitle: lab.title,
          labVersion: lab.version,
          evidence: { capturedDays: experiment?.answeredDays ?? 0, appliedCount: experiment?.appliedCount ?? 0, missingDays: experiment?.missedDays ?? 0, changes },
          claimsBoundary: lab.measurement.claimsBoundary,
        },
      };
    }
  }

  const serialized = JSON.stringify(savedPayload);
  if (serialized.length > 32_000) return failure("This evidence record is too long to save in one activity.");
  const measurementDefinition = measurementDefinitionForComponent(lab, componentId);
  const measurementVersion = measurementDefinition?.measurementVersion ?? lab.measurement.manualVersion;
  const evidenceClass = evidenceClassForComponent(lab, component) ?? "unclassified";
  await db.insert(labComponentResponses).values({
    id: crypto.randomUUID(), learnerId: learner.id, cartridgeId: lab.cartridgeId, stepId, componentId,
    payload: serialized, isComplete, beiTarget: component.beiTarget, measurementVersion, evidenceClass, updatedAt: now,
  }).onConflictDoUpdate({
    target: [labComponentResponses.learnerId, labComponentResponses.cartridgeId, labComponentResponses.componentId],
    set: { stepId, payload: serialized, isComplete, beiTarget: component.beiTarget, measurementVersion, evidenceClass, updatedAt: now },
  });
  const response = normalisedResponse({
    id: "response", learnerId: learner.id, cartridgeId: lab.cartridgeId, stepId, componentId,
    payload: serialized, isComplete, beiTarget: component.beiTarget ?? null, measurementVersion, evidenceClass, updatedAt: now,
  }, component, now);
  return Response.json({ saved: true, response }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
