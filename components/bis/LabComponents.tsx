"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BellRing, BookOpen, CalendarDays, Check, Download, ListChecks, LockKeyhole, Pause, Play, Printer, RotateCcw, ShieldCheck, Sparkles, Wind } from "lucide-react";
import {
  BreathProps,
  ChecklistProps,
  CompletionCertificateProps,
  DailyExperimentProps,
  EvidenceSummaryProps,
  LabCartridge,
  LabComponent,
  LikertProps,
  parseWorkbookPrompt,
  ReflectionProps,
  StoryNarrativeProps,
} from "@/lib/habit-lab";
import { pairedSelfReportChange } from "@/lib/measurement";
import { contextualiseWorkbookText, type DeliveryEdition } from "@/lib/product-architecture";
import type { ExperimentDayState, ExperimentView } from "@/lib/experiment";
import { SaveComponent, SavedResponse, type LearnerProfile, type ResponseMap } from "./types";

type RendererProps = {
  stepId: string;
  component: LabComponent;
  saved?: SavedResponse;
  onSave: SaveComponent;
  deliveryEdition: DeliveryEdition;
  lab: LabCartridge;
  responses: ResponseMap;
  profile: LearnerProfile;
};

function InlineText({ text }: { text: string }) {
  const pieces = text.replace(/_{3,}/g, "").replace(/[ \t]{2,}/g, " ").split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
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

type DayDraft = { moment: string; status?: 0 | 1; notes: string };

function currentLocalDate(timeZone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date())
      .reduce((values, part) => ({ ...values, [part.type]: part.value }), {} as Record<string, string>);
    return `${parts.year}-${parts.month}-${parts.day}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function downloadExperimentCalendar(view: ExperimentView, labTitle: string) {
  const compact = view.startDate.replaceAll("-", "");
  const time = (value: string) => value.replace(":", "") + "00";
  const safeTitle = labTitle.replace(/[;,\\]/g, " ");
  const event = (label: string, eventTime: string, description: string) => [
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@bis.appliedcommerce`,
    `DTSTART;TZID=${view.timeZone}:${compact}T${time(eventTime)}`,
    "RRULE:FREQ=DAILY;COUNT=7",
    `SUMMARY:${label} · ${safeTitle}`,
    `DESCRIPTION:${description}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT5M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${description}`,
    "END:VALARM",
    "END:VEVENT",
  ];
  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Applied Commerce//BIS Experiment//EN",
    "CALSCALE:GREGORIAN",
    ...event("Notice today’s behaviour", view.morningReminder, "Remember the behaviour or rule you are observing today."),
    ...event("Record today’s evidence", view.eveningReminder, "Open BIS and record only the day you have just experienced."),
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${labTitle.split(":")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-")}-7-day-reminders.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function DayCard({ day, props, draft, saving, onChange, onSave }: { day: ExperimentDayState; props: DailyExperimentProps; draft: DayDraft; saving: boolean; onChange: (next: DayDraft) => void; onSave: () => void }) {
  const editable = day.state === "available" || day.state === "grace" || day.state === "recorded";
  const record = day.record;
  return (
    <article className={`experiment-day state-${day.state}`}>
      <header><span>Day {day.dayNumber}<small>{day.scheduledDate}</small></span><em>{day.state === "available" ? "Open today" : day.state === "grace" ? "Morning grace" : day.state === "recorded" ? "Recorded" : day.state === "missed" ? "Missing evidence" : "Not yet available"}</em></header>
      {!editable ? <div className="experiment-locked"><LockKeyhole size={18} /><strong>{day.state === "scheduled" ? "This day has not happened yet." : "This capture window has closed."}</strong><p>{day.state === "scheduled" ? "BIS will open it on its scheduled date." : "It remains missing data and is not scored as ‘not done’."}</p></div> : (
        <>
          {day.state === "grace" && <p className="grace-note">You may record yesterday from memory until 12:00 local time. BIS marks it as retrospective.</p>}
          <label>{props.momentLabel}<textarea rows={3} value={draft.moment} onChange={(event) => onChange({ ...draft, moment: event.target.value })} placeholder="Record one moment you actually experienced…" /></label>
          <fieldset><legend>Did you apply your chosen rule?</legend><div>{([0, 1] as const).map((status) => <button type="button" key={status} className={draft.status === status ? "selected" : ""} onClick={() => onChange({ ...draft, status })}><span>{draft.status === status && <Check size={13} />}</span>{props.statusLabels[status]}</button>)}</div></fieldset>
          <label>{props.notesLabel}<input value={draft.notes} onChange={(event) => onChange({ ...draft, notes: event.target.value })} placeholder="Optional context…" /></label>
          <button className="day-save" disabled={saving || !draft.moment.trim() || draft.status === undefined} onClick={onSave}>{saving ? "Saving today…" : record ? "Update this day" : "Save today’s evidence"}</button>
        </>
      )}
    </article>
  );
}

function DailyExperiment({ stepId, component, saved, onSave, deliveryEdition, lab, profile }: RendererProps) {
  const props = component.props as DailyExperimentProps;
  const view = saved?.payload && typeof saved.payload === "object" && "experimentVersion" in saved.payload ? saved.payload as ExperimentView : null;
  const browserTimeZone = profile.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Johannesburg";
  const [setup, setSetup] = useState({ startDate: currentLocalDate(browserTimeZone), timeZone: browserTimeZone, morningReminder: "08:00", eveningReminder: "19:00" });
  const [drafts, setDrafts] = useState<Record<number, DayDraft>>(() => Object.fromEntries((view?.days ?? []).map((day) => [day.dayNumber, { moment: day.record?.moment ?? "", status: day.record?.status, notes: day.record?.notes ?? "" }])));
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [savingSetup, setSavingSetup] = useState(false);
  const [message, setMessage] = useState("");

  async function startExperiment() {
    setSavingSetup(true);
    setMessage("");
    try {
      await onSave(stepId, component.id, { experimentAction: "start", ...setup }, false);
      setMessage("Your seven-day field experiment is scheduled. Future days remain locked.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your experiment could not be started.");
    } finally {
      setSavingSetup(false);
    }
  }

  async function saveDay(dayNumber: number) {
    const draft = drafts[dayNumber];
    if (!draft || draft.status === undefined) return;
    setSavingDay(dayNumber);
    setMessage("");
    try {
      await onSave(stepId, component.id, { experimentAction: "record", dayNumber, ...draft }, false);
      setMessage(`Day ${dayNumber} is saved. BIS will open the next day only after you experience it.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Today’s evidence could not be saved.");
    } finally {
      setSavingDay(null);
    }
  }

  return (
    <section className="lab-interaction experiment-interaction">
      <div className="interaction-label"><CalendarDays size={14} /><span>Seven-day field experiment</span><em className={view?.reviewAvailable ? "saved" : ""}>{view ? `${view.answeredDays}/7 days captured` : "Not started"}</em></div>
      <div className="experiment-instructions"><MarkdownCopy markdown={contextualiseWorkbookText(props.instructions, deliveryEdition)} /></div>
      {!view ? (
        <div className="experiment-setup">
          <div><BellRing size={21} /><span><small>SET YOUR FIELD WINDOW</small><h3>One real day at a time.</h3><p>Choose when to begin and when your device calendar should remind you to notice and record.</p></span></div>
          <div className="experiment-setup-grid"><label>Start date<input type="date" value={setup.startDate} onChange={(event) => setSetup({ ...setup, startDate: event.target.value })} /></label><label>Profile time zone<input readOnly value={setup.timeZone} /><small>Change this in Profile before starting if it is incorrect.</small></label><label>Morning notice<input type="time" value={setup.morningReminder} onChange={(event) => setSetup({ ...setup, morningReminder: event.target.value })} /></label><label>Evening record<input type="time" value={setup.eveningReminder} onChange={(event) => setSetup({ ...setup, eveningReminder: event.target.value })} /></label></div>
          <button className="experiment-start" disabled={savingSetup} onClick={startExperiment}>{savingSetup ? "Scheduling…" : "Begin seven-day experiment"}</button>
        </div>
      ) : (
        <>
          <div className="experiment-status"><div><small>{view.status === "scheduled" ? "SCHEDULED" : view.reviewAvailable ? "REVIEW READY" : `DAY ${view.currentDay} OF 7`}</small><strong>{view.startDate} → {view.days[6]?.scheduledDate}</strong><span>{view.timeZone} · {view.morningReminder} notice · {view.eveningReminder} record</span></div><button onClick={() => downloadExperimentCalendar(view, lab.title)}><Download size={15} /> Add reminders to calendar</button></div>
          <div className="experiment-days">{view.days.map((day) => <DayCard key={day.dayNumber} day={day} props={props} draft={drafts[day.dayNumber] ?? { moment: day.record?.moment ?? "", status: day.record?.status, notes: day.record?.notes ?? "" }} saving={savingDay === day.dayNumber} onChange={(next) => setDrafts((current) => ({ ...current, [day.dayNumber]: next }))} onSave={() => saveDay(day.dayNumber)} />)}</div>
          <div className="experiment-evidence-stats"><span><strong>{view.answeredDays}</strong> days captured</span><span><strong>{view.appliedCount}</strong> rules applied</span><span><strong>{view.missedDays}</strong> missing days</span></div>
          <p className={view.reviewAvailable ? "experiment-ready" : "experiment-waiting"}>{view.reviewAvailable ? "Seven calendar days have elapsed. Your evidence review is now available." : "The review remains locked until Day 7. Missing days remain visible as missing evidence."}</p>
        </>
      )}
      {message && <p className="experiment-message"><ShieldCheck size={13} /> {message}</p>}
    </section>
  );
}

function evidenceHighlights(responses: ResponseMap, excludedId: string) {
  return Object.values(responses).flatMap((response) => {
    if (response.componentId === excludedId || !response.payload || typeof response.payload !== "object" || !("answers" in response.payload)) return [];
    const answers = response.payload.answers && typeof response.payload.answers === "object" ? Object.values(response.payload.answers) : [];
    return answers.map(String).map((answer) => answer.trim()).filter((answer) => answer.length > 12);
  }).slice(0, 5);
}

function EvidenceSummary({ stepId, component, saved, onSave, lab, responses, deliveryEdition }: RendererProps) {
  const props = component.props as EvidenceSummaryProps;
  const changes = pairedSelfReportChange(lab, Object.values(responses));
  const experiment = lab.timeline.steps.flatMap((step) => step.components).find((candidate) => candidate.type === "DailyExperiment");
  const experimentView = experiment ? responses[experiment.id]?.payload as ExperimentView | undefined : undefined;
  const savedSynthesis = (saved?.payload as { answers?: { synthesis?: string } } | undefined)?.answers?.synthesis ?? "";
  const [synthesis, setSynthesis] = useState(savedSynthesis);
  const [saving, setSaving] = useState(false);
  const highlights = evidenceHighlights(responses, component.id);

  async function saveSummary() {
    setSaving(true);
    try {
      await onSave(stepId, component.id, { summaryAction: "confirm", answers: { synthesis } }, synthesis.trim().length > 0);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="lab-interaction evidence-summary-interaction">
      <div className="interaction-label"><Sparkles size={14} /><span>Behaviour Evidence Summary</span><em className={saved?.isComplete ? "saved" : ""}><ShieldCheck size={12} /> Descriptive evidence</em></div>
      <div className="evidence-summary-hero"><small>AUTOMATICALLY RETRIEVED</small><h3>Your evidence, brought together.</h3><p>BIS retrieves your earlier answers and calculates only approved descriptive differences. You do not re-enter baseline values.</p></div>
      <div className="evidence-summary-grid">
        {changes.length ? changes.map((change) => <article key={`${change.preCode}:${change.postCode}`}><small>{change.construct}</small><strong>{change.pre} <span>→</span> {change.post}</strong><p>Difference {change.difference > 0 ? "+" : ""}{change.difference}</p></article>) : <article><small>PRE / POST</small><strong>Evidence pending</strong><p>Complete the paired post-Lab ratings to calculate change.</p></article>}
        <article><small>7-DAY RECORD</small><strong>{experimentView?.answeredDays ?? 0} <span>/ 7</span></strong><p>{experimentView?.appliedCount ?? 0} rules applied · {experimentView?.missedDays ?? 0} missing</p></article>
      </div>
      {highlights.length > 0 && <div className="evidence-highlights"><small>EARLIER REFLECTIONS RETRIEVED</small>{highlights.map((highlight, index) => <blockquote key={`${highlight}-${index}`}>{highlight}</blockquote>)}</div>}
      <div className="summary-synthesis"><label htmlFor={`${component.id}-synthesis`}>{contextualiseWorkbookText(props.prompt, deliveryEdition).split("\n").filter(Boolean).at(-1) ?? "What does this evidence tell you now?"}</label><textarea id={`${component.id}-synthesis`} rows={4} value={synthesis} onChange={(event) => setSynthesis(event.target.value)} placeholder="Write one clear sentence in your own words…" /><button disabled={saving || !synthesis.trim()} onClick={saveSummary}>{saving ? "Saving summary…" : "Confirm my evidence summary"}</button></div>
      <p className="evidence-boundary-note">This is a learner-reported descriptive evidence record—not a psychometric score, diagnosis, benchmark or proof that the Lab caused change.</p>
    </section>
  );
}

function CompletionCertificate({ stepId, component, saved, onSave, lab, profile }: RendererProps) {
  const props = component.props as CompletionCertificateProps;
  const payload = saved?.payload as { certificate?: { certificateId: string; learnerName: string; completedAt: number; context: string; evidence: { capturedDays: number; appliedCount: number; changes: Array<{ construct: string; pre: number; post: number; difference: number }> } } } | undefined;
  const certificate = payload?.certificate;
  const [saving, setSaving] = useState(false);
  const name = certificate?.learnerName ?? `${profile.firstName} ${profile.surname}`;
  const context = certificate?.context ?? (profile.deliveryEdition === "school" ? profile.grade || "School Edition" : profile.deliveryEdition === "workplace" ? profile.organisation || "Workplace Edition" : profile.programme || "Youth Programme Edition");

  async function accept() {
    setSaving(true);
    try {
      await onSave(stepId, component.id, { certificateAction: "accept" }, true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="lab-interaction certificate-interaction">
      <div className="interaction-label"><ShieldCheck size={14} /><span>Completion credential</span><em className={saved?.isComplete ? "saved" : ""}>{saved?.isComplete ? "Issued" : "Ready to issue"}</em></div>
      <article className="completion-certificate">
        <div className="certificate-mark"><Sparkles size={25} /><span>APPLIED COMMERCE®<small>Behaviour Intelligence Series™</small></span></div>
        <small>CERTIFICATE OF COMPLETION</small>
        <h2>{props.title ?? `${lab.title.split(":")[0]} Completion Certificate`}</h2>
        <p>This certifies that</p><strong className="certificate-name">{name}</strong><p>completed the source-faithful</p><h3>{lab.title}</h3>
        <div className="certificate-meta"><span><small>DELIVERY CONTEXT</small>{context}</span><span><small>COMPLETION DATE</small>{certificate ? new Date(certificate.completedAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" }) : "Issued on acceptance"}</span><span><small>CERTIFICATE ID</small>{certificate?.certificateId ?? "Generated securely on acceptance"}</span></div>
        <p className="certificate-boundary">Completion records participation in the Lab. The accompanying private evidence record remains descriptive and is not a validated psychometric result.</p>
        <footer><span>Behaviour comes before results.</span><b>BIS · {lab.version}</b></footer>
      </article>
      {certificate && <div className="certificate-evidence-record"><h3>Private descriptive evidence record</h3><p>{certificate.evidence.capturedDays}/7 days captured · {certificate.evidence.appliedCount} rules applied</p>{certificate.evidence.changes.map((change) => <div key={change.construct}><span>{change.construct}</span><strong>{change.pre} → {change.post} ({change.difference > 0 ? "+" : ""}{change.difference})</strong></div>)}</div>}
      <div className="certificate-actions">{!saved?.isComplete ? <button disabled={saving} onClick={accept}>{saving ? "Issuing certificate…" : "Accept & issue certificate"}</button> : <button onClick={() => window.print()}><Printer size={16} /> Print or save certificate</button>}</div>
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
  if (props.component.type === "EvidenceSummary") return <EvidenceSummary {...props} />;
  if (props.component.type === "CompletionCertificate") return <CompletionCertificate {...props} />;
  return <MindfulBreath {...props} />;
}
