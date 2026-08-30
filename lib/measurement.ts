import type { BeiIndicator, LabCartridge, LabComponent } from "@/lib/habit-lab";

export const BIS_MEASUREMENT_MANUAL_VERSION = "BIS-MM-0.1.0";
export const BIS_MEASUREMENT_STATUS = "descriptive_evidence" as const;

export type EvidenceLedgerItem = {
  indicator: BeiIndicator;
  captured: boolean;
  capturedComponentIds: string[];
};

type EvidenceResponse = { componentId: string; isComplete: boolean; payload?: unknown };

export function measurementDefinitionForComponent(lab: LabCartridge, componentId: string) {
  return lab.beiSchema.find((indicator) => indicator.sourceComponentIds.includes(componentId));
}

export function evidenceClassForComponent(lab: LabCartridge, component: LabComponent) {
  return measurementDefinitionForComponent(lab, component.id)?.evidenceClass ?? null;
}

export function buildEvidenceLedger(lab: LabCartridge, responses: EvidenceResponse[]): EvidenceLedgerItem[] {
  const complete = new Set(responses.filter((response) => response.isComplete).map((response) => response.componentId));
  return lab.beiSchema.map((indicator) => ({
    indicator,
    capturedComponentIds: indicator.sourceComponentIds.filter((componentId) => complete.has(componentId)),
    captured: indicator.sourceComponentIds.some((componentId) => complete.has(componentId)),
  }));
}

export function responseScore(payload: unknown): number | null {
  if (!payload || typeof payload !== "object") return null;
  if ("beiScore" in payload && typeof payload.beiScore === "number") return payload.beiScore;
  if ("totalScore" in payload && typeof payload.totalScore === "number") return payload.totalScore;
  if ("averageScore" in payload && typeof payload.averageScore === "number") return payload.averageScore;
  return null;
}

export function pairedSelfReportChange(lab: LabCartridge, responses: EvidenceResponse[]) {
  const responseByComponent = new Map(responses.map((response) => [response.componentId, response]));
  return lab.beiSchema.flatMap((indicator) => {
    if (!indicator.pairedWith || indicator.timepoint !== "pre") return [];
    const postIndicator = lab.beiSchema.find((candidate) => candidate.code === indicator.pairedWith);
    if (!postIndicator) return [];
    const preResponse = indicator.sourceComponentIds.map((id) => responseByComponent.get(id)).find(Boolean);
    const postResponse = postIndicator.sourceComponentIds.map((id) => responseByComponent.get(id)).find(Boolean);
    const pre = responseScore(preResponse?.payload);
    const post = responseScore(postResponse?.payload);
    if (!preResponse?.isComplete || !postResponse?.isComplete || pre === null || post === null) return [];
    return [{
      preCode: indicator.code,
      postCode: postIndicator.code,
      construct: indicator.construct,
      pre,
      post,
      difference: Number((post - pre).toFixed(2)),
      interpretation: "Learner-reported difference; no causal, diagnostic or benchmark claim.",
    }];
  });
}

export function validateMeasurementRegistry(lab: LabCartridge): string[] {
  const componentIds = new Set(lab.timeline.steps.flatMap((step) => step.components.map((component) => component.id)));
  const errors: string[] = [];
  if (lab.measurement.manualVersion !== BIS_MEASUREMENT_MANUAL_VERSION) errors.push("Measurement manual version does not match the application registry.");
  if (lab.measurement.modelStatus !== BIS_MEASUREMENT_STATUS) errors.push("Measurement status must remain descriptive evidence.");
  for (const indicator of lab.beiSchema) {
    if (indicator.reportingStatus !== "descriptive_only") errors.push(`${indicator.code} is not restricted to descriptive reporting.`);
    if (!indicator.sourceComponentIds.length) errors.push(`${indicator.code} has no source component.`);
    for (const componentId of indicator.sourceComponentIds) if (!componentIds.has(componentId)) errors.push(`${indicator.code} references missing component ${componentId}.`);
  }
  return errors;
}
