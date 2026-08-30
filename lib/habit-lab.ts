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

export type EvidenceSummaryProps = {
  prompt: string;
};

export type CompletionCertificateProps = {
  title?: string;
};

export type LabComponent = {
  id: string;
  type: "StoryNarrative" | "PrivateReflection" | "LikertMatrix" | "MindfulBreath" | "WorkbookChecklist" | "DailyExperiment" | "EvidenceSummary" | "CompletionCertificate";
  beiTarget?: string;
  props: StoryNarrativeProps | ReflectionProps | LikertProps | BreathProps | ChecklistProps | DailyExperimentProps | EvidenceSummaryProps | CompletionCertificateProps;
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

function cleanWorkbookText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/[＿_]{2,}/g, " ")
    .replace(/\s+([?.:,])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

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

  const cleanedPrompt = prompt.replace(/\r/g, "");
  if (/last three purchases/i.test(cleanedPrompt) && /feeling/i.test(cleanedPrompt)) {
    return {
      title: "Look at your last three purchases. Capture each purchase and the feeling you were trying to get from it.",
      isStructured: true,
      items: [1, 2, 3].flatMap((number) => ([
        { id: `purchase_${number}`, label: `Purchase ${number}`, placeholder: "What did you buy?", rows: 1 },
        { id: `feeling_${number}`, label: `Feeling behind purchase ${number}`, placeholder: "What feeling were you trying to get?", rows: 2 },
      ])).concat([{ id: "spending_driver", label: "What feeling is most often driving your spending?", placeholder: "Name the pattern you notice…", rows: 3 }]),
    };
  }

  if (/letter to my future self/i.test(cleanedPrompt) || /dear future me/i.test(cleanedPrompt)) {
    const guidance = cleanedPrompt.split("\n").map(cleanWorkbookText).filter(Boolean).filter((line) => !/^dear future me[,.:]?$/i.test(line)).join("\n");
    return {
      title: "Letter to my future self",
      isStructured: true,
      items: [{ id: "future_self_letter", header: guidance, label: "Dear Future Me,", placeholder: "Write your letter in your own words…", rows: 8 }],
    };
  }

  const rawLines = cleanedPrompt.split("\n").map(cleanWorkbookText).filter(Boolean);
  const numberedLines = rawLines.flatMap((line) => {
    const matches = [...line.matchAll(/(?:^|\s)(\d+)\.\s+(.+?)(?=(?:\s\d+\.\s)|$)/g)];
    return matches.map((match) => `${match[1]}. ${match[2].trim()}`);
  });

  if (numberedLines.length >= 2) {
    const title = rawLines.filter((line) => !/^\d+\.\s+/.test(line)).join(" ");
    return {
      title: title || "Reflection questions",
      isStructured: true,
      items: numberedLines.map((line, index) => ({
        id: `q_${index + 1}`,
        label: cleanWorkbookText(line),
        placeholder: "Write your reflection answer here…",
        rows: 3,
      })),
    };
  }

  const questionSentences = [...rawLines.join(" ").matchAll(/(?:^|[.!]\s+)([^?]{5,}\?)/g)]
    .map((match) => cleanWorkbookText(match[1]))
    .filter((question, index, all) => all.indexOf(question) === index);
  if (questionSentences.length >= 2) {
    return {
      title: "Answer each question separately",
      isStructured: true,
      items: questionSentences.map((question, index) => ({ id: `question_${index + 1}`, label: question, placeholder: "Write your answer to this question…", rows: 3 })),
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

    const cleanLine = cleanWorkbookText(line.replace(/^[✍️\s]+/, ""));
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
      label: cleanWorkbookText(rawLines.join("\n")),
      placeholder: "Write your reflections…",
      rows: 4,
    }],
  };
}

export function responseUnitsForComponent(component: LabComponent) {
  if (component.type === "LikertMatrix") return Math.max((component.props as LikertProps).items.length, 1);
  if (component.type === "PrivateReflection") return Math.max(parseWorkbookPrompt((component.props as ReflectionProps).prompt).items.length, 1);
  if (component.type === "WorkbookChecklist") return Math.max((component.props as ChecklistProps).items.length, 1);
  if (component.type === "DailyExperiment") return Math.max((component.props as DailyExperimentProps).days, 1);
  return 1;
}

export function responseUnitsCaptured(component: LabComponent, payload: unknown, complete: boolean) {
  if (!payload || typeof payload !== "object") return complete ? responseUnitsForComponent(component) : 0;
  if (component.type === "LikertMatrix" || component.type === "PrivateReflection") {
    const answers = "answers" in payload && payload.answers && typeof payload.answers === "object" ? Object.values(payload.answers) : [];
    return answers.filter((answer) => String(answer ?? "").trim()).length;
  }
  if (component.type === "DailyExperiment") {
    return "records" in payload && Array.isArray(payload.records) ? payload.records.length : 0;
  }
  return complete ? responseUnitsForComponent(component) : 0;
}
