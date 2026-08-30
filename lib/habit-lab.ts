import cartridgeData from "@/data/habit-lab.json";

export type PivotChoice = {
  text: string;
  beiScore?: number;
};

export type StoryNarrativeProps = {
  episodeId: string;
  markdown: string;
  pivots?: PivotChoice[];
};

export type ReflectionProps = {
  prompt: string;
  placeholder?: string;
  isPrivate?: boolean;
};

export type LikertProps = {
  question: string;
  items: string[];
  labels: string[];
  values?: number[];
};

export type BreathProps = {
  prompt?: string;
  inhaleSeconds: number;
  holdSeconds: number;
  exhaleSeconds: number;
  cycles: number;
};

export type ChecklistProps = {
  question: string;
  items: string[];
  minimumSelections?: number;
};

export type DailyExperimentProps = {
  instructions: string;
  days: number;
  statusLabels: [string, string];
  momentLabel: string;
  notesLabel: string;
};

export type LabComponent = {
  id: string;
  type: "StoryNarrative" | "PrivateReflection" | "LikertMatrix" | "MindfulBreath" | "WorkbookChecklist" | "DailyExperiment";
  beiTarget?: string;
  props: StoryNarrativeProps | ReflectionProps | LikertProps | BreathProps | ChecklistProps | DailyExperimentProps;
};

export type LabStep = {
  id: string;
  title: string;
  difficulty: string;
  tensionLevel: number;
  prerequisites?: string[];
  components: LabComponent[];
};

export type BeiIndicator = {
  code: string;
  type: "scale" | "boolean";
  range: number[];
  description: string;
  measurementVersion: string;
  construct: string;
  evidenceClass: "self_report" | "practice_record" | "reflection_output" | "facilitator_observation" | "outcome";
  timepoint: "pre" | "during" | "post" | "summary";
  scoringRule: string;
  sourceComponentIds: string[];
  reportingStatus: "descriptive_only";
  interpretationLimit: string;
  pairedWith?: string;
};

export type MeasurementMetadata = {
  manualVersion: string;
  modelStatus: "descriptive_evidence";
  claimsBoundary: string;
};

export type CartridgeSource = {
  document: string;
  volume: number;
  labNumber: number;
  learnerWorkbookPages: [number, number];
  interpretationStatus: "source_faithful_digital_cartridge";
};

export type LabCartridge = {
  cartridgeId: string;
  version: string;
  title: string;
  description: string;
  theme: { primary: string; accent: string; background: string };
  source?: CartridgeSource;
  measurement: MeasurementMetadata;
  beiSchema: BeiIndicator[];
  timeline: { steps: LabStep[] };
  signature: string;
};

export type HabitLabCartridge = LabCartridge;

export const habitLab = cartridgeData as LabCartridge;
export const habitLabSteps = habitLab.timeline.steps;
export const habitLabComponents = habitLabSteps.flatMap((step) => step.components);
export const habitLabComponentIds = new Set(habitLabComponents.map((component) => component.id));
export const habitLabStepIds = new Set(habitLabSteps.map((step) => step.id));

export function componentById(componentId: string) {
  return habitLabComponents.find((component) => component.id === componentId);
}

export function stepById(stepId: string) {
  return habitLabSteps.find((step) => step.id === stepId);
}

export type StructuredQuestion = {
  id: string;
  header?: string;
  label: string;
  placeholder: string;
  rows: number;
};

export type ParsedWorkbookPrompt = {
  title: string;
  items: StructuredQuestion[];
  isStructured: boolean;
};

/**
 * Preserves the Portal B rule that one learner question becomes one visible
 * interaction, while retaining the canonical cartridge component IDs.
 */
export function parseWorkbookPrompt(prompt: string): ParsedWorkbookPrompt {
  if (!prompt.trim()) {
    return {
      title: "",
      items: [{ id: "main", label: "Private reflection", placeholder: "Write your response…", rows: 4 }],
      isStructured: false,
    };
  }

  const rawLines = prompt.split("\n").map((line) => line.trim()).filter(Boolean);
  const numberedLines = rawLines.filter((line) => /^\d+\.\s+/.test(line));

  if (numberedLines.length >= 2) {
    const title = rawLines.filter((line) => !/^\d+\.\s+/.test(line)).join(" ");
    return {
      title: title || "Reflection questions",
      isStructured: true,
      items: numberedLines.map((line, index) => ({
        id: `q_${index + 1}`,
        label: line,
        placeholder: "Write your reflection answer here…",
        rows: 3,
      })),
    };
  }

  const items: StructuredQuestion[] = [];
  let title = "";
  let currentHeader = "";

  for (const line of rawLines) {
    if (
      line.startsWith("Step") ||
      line.startsWith("🔎") ||
      line.startsWith("⭐") ||
      line.startsWith("BEHAVIOUR") ||
      line.startsWith("Letter") ||
      line.startsWith("Final") ||
      line.startsWith("My Commitment")
    ) {
      title = title ? `${title} — ${line}` : line;
      continue;
    }

    if ((line.startsWith("\"") && line.endsWith("\"")) || line.startsWith("●") || line.startsWith("Examples:")) {
      currentHeader = currentHeader ? `${currentHeader}\n${line}` : line;
      continue;
    }

    const cleanLine = line.replace(/^[✍️\s]+/, "").trim();
    const isLabel = cleanLine.endsWith(":") || cleanLine.includes("✍️") || cleanLine.includes("___") || cleanLine.endsWith("?") || cleanLine.startsWith("Dear Future Me");

    if (isLabel) {
      const baseId = cleanLine
        .replace(/[^a-zA-Z0-9]/g, "_")
        .toLowerCase()
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      const id = items.some((item) => item.id === baseId) ? `${baseId}_${items.length + 1}` : baseId || `field_${items.length + 1}`;
      const isShort = /count|total|date|signed|grade|days|number/.test(id);
      items.push({
        id,
        header: currentHeader || undefined,
        label: cleanLine,
        placeholder: isShort ? "Enter a short answer…" : "Write your response…",
        rows: isShort ? 1 : 3,
      });
      currentHeader = "";
    } else if (items.length === 0 && !title) {
      title = line;
    } else if (!currentHeader) {
      currentHeader = line;
    }
  }

  if (items.length >= 2) return { title, items, isStructured: true };

  return {
    title: "",
    isStructured: false,
    items: [{
      id: "main",
      label: rawLines.join("\n"),
      placeholder: "Write your reflections…",
      rows: 4,
    }],
  };
}
