export type RoutineSetTemplate = {
  weight: string;
  reps: string;
};

export type RoutineExerciseTemplate = {
  name: string;
  lastPerformance: string | null;
  sets: RoutineSetTemplate[];
};

export type RoutineTemplate = {
  id: string;
  name: string;
  dayLabel: string;
  estimatedMinutes: number;
  exercises: RoutineExerciseTemplate[];
};

export type WorkoutHistoryEntry = {
  id: string;
  routineName: string;
  finishedLabel: string;
  elapsedSeconds: number;
  volumeKg: number;
  setCount: number;
  bestLift: string;
  bestDetail: string;
};

export type WeekDay = {
  day: string;
  date: string;
  done: boolean;
  isToday: boolean;
};

export type WorkoutHome = {
  routine: RoutineTemplate;
  history: WorkoutHistoryEntry[];
  week: WeekDay[];
  completedThisWeek: number;
  streakWeeks: number;
  todayLabel: string;
};

export const WORKOUT_TIME_ZONE = "America/Argentina/Buenos_Aires";

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

const WEEK_LETTERS = ["L", "M", "X", "J", "V", "S", "D"] as const;

type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

export function zonedDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: WORKOUT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
    weekday: value("weekday"),
  };
}

export function dateKey(date: CalendarDate) {
  return `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
}

export function addCalendarDays(
  date: CalendarDate,
  amount: number,
): CalendarDate {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + amount));

  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

export function startOfWeek(date: Date): CalendarDate {
  const zoned = zonedDateParts(date);
  const index = WEEKDAY_INDEX[zoned.weekday] ?? 0;

  return addCalendarDays(zoned, -index);
}

export function formatTodayLabel(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: WORKOUT_TIME_ZONE,
  })
    .format(date)
    .toLocaleUpperCase("es-AR");
}

export function formatHistoryLabel(date: Date) {
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: WORKOUT_TIME_ZONE,
  }).format(date);

  return label.charAt(0).toLocaleUpperCase("es-AR") + label.slice(1);
}

export function buildWeek(now: Date, trainedDayKeys: Set<string>): WeekDay[] {
  const today = zonedDateParts(now);
  const todayKey = dateKey(today);
  const monday = startOfWeek(now);

  return WEEK_LETTERS.map((day, index) => {
    const date = addCalendarDays(monday, index);
    const key = dateKey(date);

    return {
      day,
      date: String(date.day),
      done: trainedDayKeys.has(key),
      isToday: key === todayKey,
    };
  });
}

export function countStreakWeeks(now: Date, trainedWeekKeys: Set<string>) {
  let cursor = startOfWeek(now);

  if (!trainedWeekKeys.has(dateKey(cursor))) {
    cursor = addCalendarDays(cursor, -7);
  }

  let streak = 0;

  while (trainedWeekKeys.has(dateKey(cursor))) {
    streak += 1;
    cursor = addCalendarDays(cursor, -7);
  }

  return streak;
}
