import attentionLabData from "@/data/attention-lab.json";
import decisionLabData from "@/data/decision-lab.json";
import identityLabData from "@/data/identity-lab.json";
import influenceLabData from "@/data/influence-lab.json";
import leadershipLabData from "@/data/leadership-lab.json";
import moneyLabData from "@/data/money-lab.json";
import purposeLabData from "@/data/purpose-lab.json";
import resilienceLabData from "@/data/resilience-lab.json";
import riskLabData from "@/data/risk-lab.json";
import timeLabData from "@/data/time-lab.json";
import trustLabData from "@/data/trust-lab.json";
import { habitLab as habitLabSource, type DailyExperimentProps, type LabCartridge, type LabComponent, type LabStep, type LikertProps } from "@/lib/habit-lab";

const decisionSummaryDuplicates = new Set([
  "comp_profile_perceived",
  "comp_profile_hidden",
  "comp_profile_emotion",
  "comp_profile_cost",
  "comp_profile_equation",
  "comp_profile_confidence",
  "comp_profile_quality",
  "comp_profile_grade",
  "comp_profile_date",
]);

const obsoleteExperimentFields = new Set([
  "comp_exp_days_completed",
  "comp_exp_applied_count",
  "comp_exp_notes_text",
  "comp_exp_notes",
]);

function normaliseComponent(component: LabComponent, lab: LabCartridge): LabComponent {
  const isCertificate = component.id === "comp_certificate" || component.id === "comp_cert_story";
  if (isCertificate) {
    return { id: component.id, type: "CompletionCertificate", props: { title: `${lab.title.split(":")[0]} Completion Certificate` } };
  }

  const isSummary = component.id === "comp_09_bei10" || component.id === "comp_profile_summary" || component.id === "comp_profile_pattern";
  if (isSummary) {
    return {
      id: component.id,
      type: "EvidenceSummary",
      beiTarget: component.beiTarget,
      props: { prompt: "Review the retrieved evidence. In one clear sentence, what does it tell you about the behaviour pattern you are changing?" },
    };
  }

  if (component.id === "comp_exp_matrix" && component.type === "LikertMatrix") {
    const source = component.props as LikertProps;
    const subject = lab.cartridgeId.startsWith("decision") ? "decision or choice" : "habit moment or routine";
    return {
      id: component.id,
      type: "DailyExperiment",
      beiTarget: component.beiTarget,
      props: {
        instructions: `Your seven-day field experiment begins on the date you choose. BIS opens one day at a time. Each day, record one ${subject} you actually experienced and whether you applied your chosen rule. Future days stay locked; an unrecorded day remains missing evidence, never a zero.`,
        days: 7,
        statusLabels: [source.labels[0] ?? "Not done", source.labels[1] ?? "Done"],
        momentLabel: lab.cartridgeId.startsWith("decision") ? "Decision or choice observed" : "Habit moment or routine observed",
        notesLabel: "What helped or got in the way? (optional)",
      } satisfies DailyExperimentProps,
    };
  }

  if ((component.beiTarget === "BEI-07" || component.beiTarget === "BEI-08") && component.type === "StoryNarrative") {
    const props = component.props as { episodeId: string; markdown: string; pivots?: Array<{ text: string; beiScore?: number }> };
    const markdown = props.markdown
      .replace(/(BEI-07:\s*[^\n]+?)\s+Shift Index/gi, "$1 Self-Rating (Post)")
      .replace(/^BEI-0[78]-Post:\s*[_ ]+\/\s*10\s*$/gim, "Select your post-Lab rating below.")
      .replace(/^Shift:\s*.*$/gim, "BIS will calculate the pre-to-post difference automatically in your Behaviour Evidence Summary.");
    return { ...component, props: { ...props, markdown } };
  }

  if (component.type === "DailyExperiment") {
    const props = component.props as DailyExperimentProps;
    return {
      ...component,
      props: {
        ...props,
        instructions: `This field experiment lasts seven calendar days. BIS opens one day at a time. Each day, record one ${props.momentLabel.toLowerCase()} you actually experienced and whether you applied your chosen rule. Future days stay locked. An unrecorded day remains missing evidence; it is never converted into “not done”.`,
      },
    };
  }

  return component;
}

/**
 * Runtime governance layer. Source JSON remains an auditable transcription;
 * this layer turns it into one coherent longitudinal instrument.
 */
export function normaliseLabInstrument(source: LabCartridge): LabCartridge {
  const steps = source.timeline.steps.map((step) => {
    let components = step.components
      .filter((component) => !obsoleteExperimentFields.has(component.id))
      .filter((component) => source.cartridgeId !== "decision-lab-2026" || !decisionSummaryDuplicates.has(component.id))
      .map((component) => normaliseComponent(component, source));

    if (step.id === "step_baseline_00") {
      const order = new Map([["comp_baseline_story", 0], ["comp_baseline_index", 1], ["comp_baseline_profile", 2]]);
      components = [...components].sort((left, right) => (order.get(left.id) ?? 99) - (order.get(right.id) ?? 99));
    }

    return { ...step, components };
  });
  return { ...source, timeline: { ...source.timeline, steps } };
}

export const habitLab = normaliseLabInstrument(habitLabSource);
export const decisionLab = normaliseLabInstrument(decisionLabData as LabCartridge);
export const moneyLab = normaliseLabInstrument(moneyLabData as LabCartridge);
export const identityLab = normaliseLabInstrument(identityLabData as LabCartridge);
export const attentionLab = normaliseLabInstrument(attentionLabData as LabCartridge);
export const timeLab = normaliseLabInstrument(timeLabData as LabCartridge);
export const riskLab = normaliseLabInstrument(riskLabData as LabCartridge);
export const trustLab = normaliseLabInstrument(trustLabData as LabCartridge);
export const influenceLab = normaliseLabInstrument(influenceLabData as LabCartridge);
export const leadershipLab = normaliseLabInstrument(leadershipLabData as LabCartridge);
export const purposeLab = normaliseLabInstrument(purposeLabData as LabCartridge);
export const resilienceLab = normaliseLabInstrument(resilienceLabData as LabCartridge);
export const publishedLabs = [
  habitLab,
  decisionLab,
  moneyLab,
  identityLab,
  attentionLab,
  timeLab,
  riskLab,
  trustLab,
  influenceLab,
  leadershipLab,
  purposeLab,
  resilienceLab,
] as const;
export const defaultLab = habitLab;

const publishedById = new Map<string, LabCartridge>(publishedLabs.map((lab) => [lab.cartridgeId, lab]));

export function labById(cartridgeId: string | null | undefined): LabCartridge | undefined {
  return cartridgeId ? publishedById.get(cartridgeId) : undefined;
}

export function labSteps(lab: LabCartridge): LabStep[] {
  return lab.timeline.steps;
}

export function labComponents(lab: LabCartridge): LabComponent[] {
  return lab.timeline.steps.flatMap((step) => step.components);
}

export function labStepIds(lab: LabCartridge): Set<string> {
  return new Set(lab.timeline.steps.map((step) => step.id));
}

export function labComponentIds(lab: LabCartridge): Set<string> {
  return new Set(labComponents(lab).map((component) => component.id));
}

export function componentForLab(lab: LabCartridge, componentId: string): LabComponent | undefined {
  return labComponents(lab).find((component) => component.id === componentId);
}
