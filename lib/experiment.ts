export const BIS_EXPERIMENT_VERSION = 2 as const;
export const BIS_EXPERIMENT_DAYS = 7 as const;

export type ExperimentRecord = {
  dayNumber: number;
  scheduledDate: string;
  moment: string;
  status: 0 | 1;
  notes: string;
  capturedAt: number;
  captureMode: "same_day" | "retrospective_grace";
};

export type StoredExperiment = {
  experimentVersion: typeof BIS_EXPERIMENT_VERSION;
  startedAt: number;
  startDate: string;
  timeZone: string;
  morningReminder: string;
  eveningReminder: string;
  records: ExperimentRecord[];
};

export type ExperimentDayState = {
  dayNumber: number;
  scheduledDate: string;
  state: "scheduled" | "available" | "grace" | "recorded" | "missed";
  record?: ExperimentRecord;
};

export type ExperimentView = StoredExperiment & {
  status: "scheduled" | "active" | "review_ready";
  currentDay: number | null;
  reviewAvailable: boolean;
  answeredDays: number;
  appliedCount: number;
  missedDays: number;
  totalDays: typeof BIS_EXPERIMENT_DAYS;
  days: ExperimentDayState[];
};

export type ExperimentAction =
  | {
      experimentAction: "start";
      startDate: string;
      timeZone: string;
      morningReminder: string;
      eveningReminder: string;
    }
  | {
      experimentAction: "record";
      dayNumber: number;
      moment: string;
      status: 0 | 1;
      notes?: string;
    };

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function validTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-ZA", { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

function datePartsAt(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
  };
}

function dateNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function addCalendarDays(date: string, days: number) {
  const next = new Date(dateNumber(date) + days * 86_400_000);
  return next.toISOString().slice(0, 10);
}

export function calendarDayDifference(from: string, to: string) {
  return Math.round((dateNumber(to) - dateNumber(from)) / 86_400_000);
}

export function localDateForTimeZone(timestamp: number, timeZone: string) {
  return datePartsAt(timestamp, timeZone).date;
}

export function isStoredExperiment(payload: unknown): payload is StoredExperiment {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<StoredExperiment>;
  return candidate.experimentVersion === BIS_EXPERIMENT_VERSION
    && typeof candidate.startedAt === "number"
    && typeof candidate.startDate === "string"
    && typeof candidate.timeZone === "string"
    && Array.isArray(candidate.records);
}

export function experimentView(payload: unknown, now = Date.now()): ExperimentView | null {
  if (!isStoredExperiment(payload) || !validTimeZone(payload.timeZone) || !datePattern.test(payload.startDate)) return null;
  const local = datePartsAt(now, payload.timeZone);
  const elapsed = calendarDayDifference(payload.startDate, local.date);
  const records = payload.records
    .filter((record) => Number.isInteger(record.dayNumber) && record.dayNumber >= 1 && record.dayNumber <= BIS_EXPERIMENT_DAYS)
    .sort((a, b) => a.dayNumber - b.dayNumber);
  const recordByDay = new Map(records.map((record) => [record.dayNumber, record]));
  const daySevenRecorded = recordByDay.has(BIS_EXPERIMENT_DAYS);
  const reviewAvailable = elapsed >= BIS_EXPERIMENT_DAYS || (elapsed === BIS_EXPERIMENT_DAYS - 1 && daySevenRecorded);
  const currentDay = elapsed < 0 ? null : Math.min(Math.max(elapsed + 1, 1), BIS_EXPERIMENT_DAYS);
  const status = elapsed < 0 ? "scheduled" : reviewAvailable ? "review_ready" : "active";

  const days: ExperimentDayState[] = Array.from({ length: BIS_EXPERIMENT_DAYS }, (_, index) => {
    const dayNumber = index + 1;
    const scheduledDate = addCalendarDays(payload.startDate, index);
    const record = recordByDay.get(dayNumber);
    if (record) return { dayNumber, scheduledDate, state: "recorded", record };
    if (elapsed < index) return { dayNumber, scheduledDate, state: "scheduled" };
    if (elapsed === index) return { dayNumber, scheduledDate, state: "available" };
    if (elapsed === index + 1 && local.hour < 12) return { dayNumber, scheduledDate, state: "grace" };
    return { dayNumber, scheduledDate, state: "missed" };
  });

  return {
    ...payload,
    records,
    status,
    currentDay,
    reviewAvailable,
    answeredDays: records.length,
    appliedCount: records.filter((record) => record.status === 1).length,
    missedDays: days.filter((day) => day.state === "missed").length,
    totalDays: BIS_EXPERIMENT_DAYS,
    days,
  };
}

export function applyExperimentAction(existing: unknown, action: ExperimentAction, now = Date.now()) {
  if (action.experimentAction === "start") {
    const timeZone = action.timeZone.trim();
    if (!validTimeZone(timeZone)) throw new Error("Choose a valid timezone before starting your experiment.");
    if (!datePattern.test(action.startDate)) throw new Error("Choose a valid experiment start date.");
    if (!timePattern.test(action.morningReminder) || !timePattern.test(action.eveningReminder)) throw new Error("Choose valid morning and evening reminder times.");
    const today = localDateForTimeZone(now, timeZone);
    const daysAhead = calendarDayDifference(today, action.startDate);
    if (daysAhead < 0 || daysAhead > 30) throw new Error("Your experiment can start today or within the next 30 days.");
    const current = experimentView(existing, now);
    if (current?.records.length) throw new Error("This seven-day experiment has already started and cannot be reset after evidence has been recorded.");
    const stored: StoredExperiment = {
      experimentVersion: BIS_EXPERIMENT_VERSION,
      startedAt: now,
      startDate: action.startDate,
      timeZone,
      morningReminder: action.morningReminder,
      eveningReminder: action.eveningReminder,
      records: [],
    };
    return experimentView(stored, now)!;
  }

  const current = experimentView(existing, now);
  if (!current) throw new Error("Start your seven-day experiment before recording a day.");
  const day = current.days.find((candidate) => candidate.dayNumber === action.dayNumber);
  if (!day || (day.state !== "available" && day.state !== "grace" && day.state !== "recorded")) {
    throw new Error("That day is not available. BIS only opens a day after you have experienced it.");
  }
  const moment = action.moment.trim().slice(0, 2_000);
  const notes = action.notes?.trim().slice(0, 2_000) ?? "";
  if (!moment) throw new Error("Record the moment or action you observed today.");
  if (action.status !== 0 && action.status !== 1) throw new Error("Record whether you applied your rule today.");
  const record: ExperimentRecord = {
    dayNumber: action.dayNumber,
    scheduledDate: day.scheduledDate,
    moment,
    status: action.status,
    notes,
    capturedAt: now,
    captureMode: day.state === "grace" ? "retrospective_grace" : "same_day",
  };
  const stored: StoredExperiment = {
    experimentVersion: BIS_EXPERIMENT_VERSION,
    startedAt: current.startedAt,
    startDate: current.startDate,
    timeZone: current.timeZone,
    morningReminder: current.morningReminder,
    eveningReminder: current.eveningReminder,
    records: [...current.records.filter((candidate) => candidate.dayNumber !== action.dayNumber), record].sort((a, b) => a.dayNumber - b.dayNumber),
  };
  return experimentView(stored, now)!;
}

export function storedExperimentFromView(view: ExperimentView): StoredExperiment {
  return {
    experimentVersion: BIS_EXPERIMENT_VERSION,
    startedAt: view.startedAt,
    startDate: view.startDate,
    timeZone: view.timeZone,
    morningReminder: view.morningReminder,
    eveningReminder: view.eveningReminder,
    records: view.records,
  };
}
