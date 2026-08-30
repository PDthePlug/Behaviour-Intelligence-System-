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
import { habitLab, type LabCartridge, type LabComponent, type LabStep } from "@/lib/habit-lab";

export const decisionLab = decisionLabData as LabCartridge;
export const moneyLab = moneyLabData as LabCartridge;
export const identityLab = identityLabData as LabCartridge;
export const attentionLab = attentionLabData as LabCartridge;
export const timeLab = timeLabData as LabCartridge;
export const riskLab = riskLabData as LabCartridge;
export const trustLab = trustLabData as LabCartridge;
export const influenceLab = influenceLabData as LabCartridge;
export const leadershipLab = leadershipLabData as LabCartridge;
export const purposeLab = purposeLabData as LabCartridge;
export const resilienceLab = resilienceLabData as LabCartridge;
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
