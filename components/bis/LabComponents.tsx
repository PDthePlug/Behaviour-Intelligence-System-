"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CalendarDays, Check, ListChecks, LockKeyhole, Pause, Play, RotateCcw, ShieldCheck, Wind } from "lucide-react";
import {
  BreathProps,
  ChecklistProps,
  DailyExperimentProps,
  LabComponent,
  LikertProps,
  parseWorkbookPrompt,
  ReflectionProps,
  StoryNarrativeProps,
} from "@/lib/habit-lab";
import { contextualiseWorkbookText, type DeliveryEdition } from "@/lib/product-architecture";
import { SaveComponent, SavedResponse } from "./types";

type RendererProps = {
  stepId: string;
  component: LabComponent;
  saved?: SavedResponse;
  onSave: SaveComponent;
  deliveryEdition: DeliveryEdition;
};

function InlineText({ text }: { text: string }) {
  const pieces = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return <>{pieces.map((piece, index) => piece.startsWith("**") && piece.endsWith("**") ? <strong key={`${piece}-${index}`}>{piece.slice(2, -2)}</strong> : <span key={`${piece}-${index}`}>{piece}</span>)}</>;
}

function MarkdownCopy({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return (
    <div className="workbook-copy">
      {blocks.map((block, index) => {
        if (block === "---") return <hr key={index} />;
        if (block.startsWith("### ")) return <h3 key={index}><InlineText text={block.slice(4)} /></h3>;
        const lines = block.split("\n").filter(Boolean);
        if (lines.every((line) => /^[●•-]\s*/.test(line))) {
          return <ul key={index}>{lines.map((line) => <li key={line}><InlineText text={line.replace(/^[●•-]\s*/, "")} /></li>)}</ul>;
        }
        return <p key={index}>{lines.map((line, lineIndex) => <span key={`${line}-${lineIndex}`}><InlineText text={line} />{lineIndex < lines.length - 1 && <br />}</span>)}</p>;
      })}
    </div>
  );
}

function StoryNarrative({ stepId, component, saved, onSave, deliveryEdition }: RendererProps) {
  const props = component.props as StoryNarrativeProps;
  const savedPayload = saved?.payload as { selectedIndex?: number } | undefined;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(savedPayload?.selectedIndex ?? null);
  const [saving, setSaving] = useState(false);
  const pivots = props.pivots ?? [];

  async function select(index: number) {
    setSelectedIndex(index);
    setSaving(true);
    try {
      await onSave(stepId, component.id, { selectedIndex: index, beiScore: pivots[index]?.beiScore ?? 5 }, true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="lab-interaction story-interaction">
      <div className="interaction-label"><BookOpen size={14} /><span>Read</span>{saved?.isComplete && <em><Check size={12} /> Complete</em>}</div>
      <article className="narrative-paper">
        <BookOpen className="narrative-watermark" aria-hidden="true" />
        <MarkdownCopy markdown={contextualiseWorkbookText(props.markdown, deliveryEdition)} />
      </article>
      <div className={pivots.length > 5 ? "pivot-grid scale" : "pivot-grid"}>
        {pivots.map((pivot, index) => (
          <button key={`${pivot.text}-${index}`} disabled={saving} className={selectedIndex === index ? "pivot-choice selected" : "pivot-choice"} onClick={() => select(index)}>
            <span>{selectedIndex === index && <Check size={13} />}</span>
            <b>{pivot.text}</b>
          </button>
        ))}
        {pivots.length === 0 && <button disabled={saving} className="pivot-choice continue" onClick={() => select(-1)}><span><Check size={13} /></span><b>Continue</b></button>}
      </div>
    </section>
  );
}

function PrivateReflection({ stepId, component, saved, onSave, deliveryEdition }: RendererProps) {
  const props = component.props as ReflectionProps;
  const parsed = useMemo(() => parseWorkbookPrompt(contextualiseWorkbookText(props.prompt, deliveryEdition)), [props.prompt, deliveryEdition]);
  const savedAnswers = ((saved?.payload as { answers?: Record<string, string> } | undefined)?.answers ?? {});
  const [answers, setAnswers] = useState<Record<string, string>>(savedAnswers);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const firstUnanswered = parsed.items.findIndex((item) => !(savedAnswers[item.id] ?? "").trim());
  const [activeIndex, setActiveIndex] = useState(firstUnanswered === -1 ? Math.max(parsed.items.length - 1, 0) : firstUnanswered);

  function changeAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setSaveError("");
  }

  async function commit(index: number) {
    const item = parsed.items[index];
    if (!item || !(answers[item.id] ?? "").trim()) {
      setSaveError("Give this question an honest response before continuing.");
      return;
    }
    const complete = parsed.items.every((question) => (answers[question.id] ?? "").trim().length > 0);
    setSaving(true);
    setSaveError("");
    try {
      await onSave(stepId, component.id, { answers }, complete);
      if (index < parsed.items.length - 1) setActiveIndex(index + 1);
    } catch {
      setSaveError("Your reflection could not be saved. Try once more.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="lab-interaction reflection-interaction">
      <div className="interaction-label"><LockKeyhole size={14} /><span>{parsed.isStructured ? "Guided reflection" : "Private reflection"}</span><em className={saved?.isComplete ? "saved" : ""}><ShieldCheck size={12} /> {saved?.isComplete ? "Saved safely" : "Private to you"}</em></div>
      {parsed.title && <div className="reflection-title">{parsed.title}</div>}
      <div className="reflection-sequence">
        {parsed.items.map((item, index) => {
          if (index > activeIndex) return null;
          const answered = (answers[item.id] ?? "").trim().length > 0;
          const committed = index < activeIndex || (saved?.isComplete && answered);
          return (
            <div className={committed ? "reflection-question committed" : "reflection-question"} key={item.id}>
              {item.header && !committed && <p className="question-context">{item.header}</p>}
              <label htmlFor={`${component.id}-${item.id}`}>{item.label}</label>
              {committed ? <blockquote>{answers[item.id]}</blockquote> : item.rows === 1 ? (
                <input id={`${component.id}-${item.id}`} value={answers[item.id] ?? ""} onChange={(event) => changeAnswer(item.id, event.target.value)} placeholder={props.placeholder || item.placeholder} />
              ) : (
                <textarea id={`${component.id}-${item.id}`} rows={item.rows} value={answers[item.id] ?? ""} onChange={(event) => changeAnswer(item.id, event.target.value)} placeholder={props.placeholder || item.placeholder} />
              )}
              {!committed && <button className="reflection-commit" disabled={saving || !answered} onClick={() => commit(index)}>{saving ? "Saving…" : index === parsed.items.length - 1 ? "Save reflection" : "Save and reveal next"}</button>}
            </div>
          );
        })}
      </div>
      {saveError && <p className="interaction-error">{saveError}</p>}
    </section>
  );
}

function LikertMatrix({ stepId, component, saved, onSave, deliveryEdition }: RendererProps) {
  const props = component.props as LikertProps;
  const savedAnswers = ((saved?.payload as { answers?: Record<string, number> } | undefined)?.answers ?? {});
  const [answers, setAnswers] = useState<Record<string, number>>(savedAnswers);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const answeredCount = Object.keys(answers).length;
  const optionValues = props.values?.length === props.labels.length ? props.values : props.labels.map((_, index) => index + 1);

  async function choose(itemIndex: number, score: number) {
    const nextAnswers: Record<string, number> = { ...answers, [String(itemIndex)]: score };
    setAnswers(nextAnswers);
    setSavingIndex(itemIndex);
    const complete = props.items.every((_, index) => nextAnswers[String(index)] !== undefined);
    const totalScore = Object.values(nextAnswers).reduce((total, value) => total + value, 0);
    const averageScore = complete ? Number((totalScore / props.items.length).toFixed(1)) : 0;
    const responseScale = optionValues.join(",");
    try {
      await onSave(stepId, component.id, { answers: nextAnswers, totalScore, answeredCount: Object.keys(nextAnswers).length, responseScale, ...(optionValues.length > 2 ? { averageScore } : {}) }, complete);
    } finally {
      setSavingIndex(null);
    }
  }

  return (
    <section className="lab-interaction matrix-interaction">
      <div className="interaction-label"><span>Workbook evidence item</span><em className={answeredCount === props.items.length ? "saved" : ""}>{answeredCount}/{props.items.length}</em></div>
      <h3>{contextualiseWorkbookText(props.question, deliveryEdition)}</h3>
      <div className="matrix-progress"><i style={{ width: `${(answeredCount / Math.max(props.items.length, 1)) * 100}%` }} /></div>
      <div className="matrix-items">
        {props.items.map((item, itemIndex) => (
          <article key={item}>
            <small>Indicator {String(itemIndex + 1).padStart(2, "0")}</small>
            <p>{contextualiseWorkbookText(item, deliveryEdition)}</p>
            <div className="matrix-options">
              {optionValues.map((score, optionIndex) => <button key={score} disabled={savingIndex === itemIndex} className={answers[itemIndex] === score ? "selected" : ""} onClick={() => choose(itemIndex, score)}><b>{score}</b><span>{props.labels[optionIndex]}</span></button>)}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function WorkbookChecklist({ stepId, component, saved, onSave, deliveryEdition }: RendererProps) {
  const props = component.props as ChecklistProps;
  const savedSelection = ((saved?.payload as { selectedIndices?: number[] } | undefined)?.selectedIndices ?? []);
  const [selectedIndices, setSelectedIndices] = useState<number[]>(savedSelection);
  const [saving, setSaving] = useState(false);
  const minimumSelections = props.minimumSelections ?? 1;

  async function toggle(index: number) {
    const next = selectedIndices.includes(index)
      ? selectedIndices.filter((candidate) => candidate !== index)
      : [...selectedIndices, index].sort((a, b) => a - b);
    setSelectedIndices(next);
    setSaving(true);
    try {
      await onSave(stepId, component.id, {
        selectedIndices: next,
        selectedItems: next.map((itemIndex) => props.items[itemIndex]),
        selectedCount: next.length,
      }, next.length >= minimumSelections);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="lab-interaction checklist-interaction">
      <div className="interaction-label"><ListChecks size={14} /><span>Workbook checklist</span><em className={selectedIndices.length >= minimumSelections ? "saved" : ""}>{selectedIndices.length} selected</em></div>
      <h3>{contextualiseWorkbookText(props.question, deliveryEdition)}</h3>
      <div className="workbook-checklist" role="group" aria-label={props.question}>
        {props.items.map((item, index) => {
          const selected = selectedIndices.includes(index);
          return <button key={item} type="button" aria-pressed={selected} disabled={saving} className={selected ? "selected" : ""} onClick={() => toggle(index)}><span>{selected && <Check size={14} />}</span><b>{contextualiseWorkbookText(item, deliveryEdition)}</b></button>;
        })}
      </div>
      <p className="checklist-guidance"><ShieldCheck size={13} /> Select every source-workbook area that applies. No risk label or score is generated.</p>
    </section>
  );
}

type DailyRecord = {
  date: string;
  moment: string;
  status?: 0 | 1;
  notes: string;
};

function DailyExperiment({ stepId, component, saved, onSave, deliveryEdition }: RendererProps) {
  const props = component.props as DailyExperimentProps;
  const savedRecords = (saved?.payload as { records?: DailyRecord[] } | undefined)?.records ?? [];
  const [records, setRecords] = useState<DailyRecord[]>(() => Array.from({ length: props.days }, (_, index) => ({
    date: savedRecords[index]?.date ?? "",
    moment: savedRecords[index]?.moment ?? "",
    status: savedRecords[index]?.status,
    notes: savedRecords[index]?.notes ?? "",
  })));
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState("");
  const answeredDays = records.filter((record) => record.status !== undefined).length;
  const recordComplete = records.every((record) => Boolean(record.date && record.moment.trim() && record.status !== undefined));
  const hasProgress = records.some((record) => record.date || record.moment.trim() || record.status !== undefined || record.notes.trim());

  function updateRecord(index: number, update: Partial<DailyRecord>) {
    setRecords((current) => current.map((record, recordIndex) => recordIndex === index ? { ...record, ...update } : record));
    setSavedNotice("");
  }

  async function saveRecord() {
    setSaving(true);
    setSavedNotice("");
    try {
      await onSave(stepId, component.id, {
        records,
        completedCount: records.filter((record) => record.status === 1).length,
        answeredDays,
        totalDays: props.days,
        responseScale: "0,1",
      }, recordComplete);
      setSavedNotice(recordComplete ? "Seven-day record complete." : "Progress saved. Return after your next observation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="lab-interaction experiment-interaction">
      <div className="interaction-label"><CalendarDays size={14} /><span>Seven-day practice record</span><em className={recordComplete ? "saved" : ""}>{answeredDays}/{props.days} days recorded</em></div>
      <div className="experiment-instructions"><MarkdownCopy markdown={contextualiseWorkbookText(props.instructions, deliveryEdition)} /></div>
      <div className="experiment-days">
        {records.map((record, index) => (
          <article key={index}>
            <header><span>Day {index + 1}</span>{record.status !== undefined && <em>{props.statusLabels[record.status]}</em>}</header>
            <label>Date<input type="date" value={record.date} onChange={(event) => updateRecord(index, { date: event.target.value })} /></label>
            <label>{props.momentLabel}<textarea rows={2} value={record.moment} onChange={(event) => updateRecord(index, { moment: event.target.value })} placeholder="Record the moment in your own words…" /></label>
            <fieldset><legend>Did you apply your rule?</legend><div>{([0, 1] as const).map((status) => <button type="button" key={status} className={record.status === status ? "selected" : ""} onClick={() => updateRecord(index, { status })}><span>{record.status === status && <Check size={13} />}</span>{props.statusLabels[status]}</button>)}</div></fieldset>
            <label>{props.notesLabel}<input value={record.notes} onChange={(event) => updateRecord(index, { notes: event.target.value })} placeholder="Optional context…" /></label>
          </article>
        ))}
      </div>
      <div className="experiment-save"><button disabled={saving || !hasProgress} onClick={saveRecord}>{saving ? "Saving…" : recordComplete ? "Complete seven-day record" : "Save experiment progress"}</button>{savedNotice && <p><Check size={13} /> {savedNotice}</p>}</div>
    </section>
  );
}

function MindfulBreath({ stepId, component, saved, onSave }: RendererProps) {
  const props = component.props as BreathProps;
  const total = (props.inhaleSeconds + props.holdSeconds + props.exhaleSeconds) * props.cycles;
  const alreadyComplete = Boolean((saved?.payload as { completed?: boolean } | undefined)?.completed || saved?.isComplete);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(alreadyComplete ? total : 0);
  const savedRef = useRef(alreadyComplete);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setElapsed((current) => {
        if (current + 1 >= total) {
          window.clearInterval(timer);
          setPlaying(false);
          if (!savedRef.current) {
            savedRef.current = true;
            void onSave(stepId, component.id, { completed: true, durationSeconds: total }, true);
          }
          return total;
        }
        return current + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, total, stepId, component.id, onSave]);

  const cycleLength = props.inhaleSeconds + props.holdSeconds + props.exhaleSeconds;
  const withinCycle = elapsed % cycleLength;
  const cycle = Math.min(props.cycles, Math.floor(elapsed / cycleLength) + 1);
  const complete = elapsed >= total;
  const phase = complete ? "Complete" : withinCycle < props.inhaleSeconds ? "Inhale" : withinCycle < props.inhaleSeconds + props.holdSeconds ? "Hold" : "Exhale";
  const secondsLeft = Math.max(0, total - elapsed);

  return (
    <section className="lab-interaction breath-interaction">
      <div className="interaction-label"><Wind size={14} /><span>Intentional pause</span><em>{complete ? "Complete" : `${secondsLeft}s remaining`}</em></div>
      <div className={playing ? `breath-orbit ${phase.toLowerCase()}` : complete ? "breath-orbit complete" : "breath-orbit"}>
        <div><small>{complete ? "Pause" : `Cycle ${cycle} of ${props.cycles}`}</small><strong>{phase}</strong></div>
      </div>
      <p className="breath-prompt">{props.prompt}</p>
      {!complete && <div className="breath-controls"><button onClick={() => { setPlaying(false); setElapsed(0); }} aria-label="Restart pause"><RotateCcw size={18} /></button><button className="play" onClick={() => setPlaying((current) => !current)}>{playing ? <Pause size={21} /> : <Play size={21} />}</button></div>}
      {complete && <p className="pause-complete"><Check size={15} /> Pause completed. Continue when you are ready.</p>}
    </section>
  );
}

export function LabComponentRenderer(props: RendererProps) {
  if (props.component.type === "StoryNarrative") return <StoryNarrative {...props} />;
  if (props.component.type === "PrivateReflection") return <PrivateReflection {...props} />;
  if (props.component.type === "LikertMatrix") return <LikertMatrix {...props} />;
  if (props.component.type === "WorkbookChecklist") return <WorkbookChecklist {...props} />;
  if (props.component.type === "DailyExperiment") return <DailyExperiment {...props} />;
  return <MindfulBreath {...props} />;
}
