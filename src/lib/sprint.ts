// Sprint calculation engine.
// Sprint = 14 days, starts Tuesday, ends two Tuesdays later (day 13).
// Auto-generates sprint number based on an epoch Tuesday.

import { addDays, differenceInCalendarDays, format, isWeekend, nextTuesday, startOfDay } from "date-fns";

export { addDays };

// Epoch: the first Tuesday of "Sprint 1". Tunable.
// Using a Tuesday in the past so historical sprints exist.
export const SPRINT_EPOCH_TUESDAY = new Date("2026-01-06T00:00:00"); // a Tuesday
export const SPRINT_DURATION_DAYS = 14;

export interface SprintInfo {
  number: number;
  name: string;
  startDate: Date;
  endDate: Date; // exclusive end = start + 14 (the next Tuesday)
  status: "active" | "upcoming" | "completed";
  daysRemaining: number;
  totalDays: number;
  elapsedDays: number;
  progressPct: number; // calendar progress
  currentWeek: 1 | 2;
  remainingWorkingDays: number;
  workingDaysElapsed: number;
  totalWorkingDays: number;
  isWeekendToday: boolean;
}

/** Find the Tuesday that starts the sprint containing `date`. */
export function sprintStartForDate(date: Date): Date {
  const ref = startOfDay(date);
  const epoch = startOfDay(SPRINT_EPOCH_TUESDAY);
  const diff = differenceInCalendarDays(ref, epoch);
  // number of full 14-day cycles since epoch
  const cycles = Math.floor(diff / SPRINT_DURATION_DAYS);
  let start = addDays(epoch, cycles * SPRINT_DURATION_DAYS);
  if (diff < 0) {
    // before epoch — step back a sprint
    start = addDays(epoch, (cycles - 1) * SPRINT_DURATION_DAYS);
  }
  return start;
}

export function sprintForDate(date: Date): SprintInfo {
  const start = sprintStartForDate(date);
  const end = addDays(start, SPRINT_DURATION_DAYS); // exclusive
  return buildSprintInfo(start, end, date);
}

function buildSprintInfo(start: Date, end: Date, today: Date): SprintInfo {
  const t = startOfDay(today);
  const totalDays = SPRINT_DURATION_DAYS;
  const elapsedDays = Math.max(0, Math.min(totalDays, differenceInCalendarDays(t, startOfDay(start))));
  const daysRemaining = Math.max(0, totalDays - elapsedDays);
  const progressPct = Math.round((elapsedDays / totalDays) * 100);
  const currentWeek: 1 | 2 = elapsedDays < 7 ? 1 : 2;

  // count working days (Mon-Fri) within sprint up to today
  let workingDaysElapsed = 0;
  let totalWorkingDays = 0;
  for (let i = 0; i < totalDays; i++) {
    const d = addDays(start, i);
    const isWk = isWeekend(d);
    if (!isWk) {
      totalWorkingDays++;
      if (i < elapsedDays) workingDaysElapsed++;
    }
  }
  const remainingWorkingDays = totalWorkingDays - workingDaysElapsed;

  let status: SprintInfo["status"] = "active";
  if (t < startOfDay(start)) status = "upcoming";
  else if (t >= startOfDay(end)) status = "completed";

  return {
    number: sprintNumberFromStart(start),
    name: `Sprint ${sprintNumberFromStart(start)}`,
    startDate: start,
    endDate: end,
    status,
    daysRemaining,
    totalDays,
    elapsedDays,
    progressPct,
    currentWeek,
    remainingWorkingDays,
    workingDaysElapsed,
    totalWorkingDays,
    isWeekendToday: isWeekend(t),
  };
}

export function sprintNumberFromStart(start: Date): number {
  const epoch = startOfDay(SPRINT_EPOCH_TUESDAY);
  const diff = differenceInCalendarDays(startOfDay(start), epoch);
  return Math.round(diff / SPRINT_DURATION_DAYS) + 1;
}

export function getSprintByNumber(num: number): SprintInfo {
  const epoch = startOfDay(SPRINT_EPOCH_TUESDAY);
  const start = addDays(epoch, (num - 1) * SPRINT_DURATION_DAYS);
  const end = addDays(start, SPRINT_DURATION_DAYS);
  return buildSprintInfo(start, end, new Date());
}

export function listSprints(count: number, opts?: { includeFuture?: number }): SprintInfo[] {
  const current = sprintForDate(new Date());
  const out: SprintInfo[] = [];
  const future = opts?.includeFuture ?? 1;
  for (let i = current.number - count + 1; i <= current.number + future; i++) {
    if (i < 1) continue;
    out.push(getSprintByNumber(i));
  }
  return out;
}

export interface SprintDay {
  date: Date;
  label: string;
  shortLabel: string;
  isWeekend: boolean;
  isToday: boolean;
  isPast: boolean;
  weekNumber: 1 | 2;
  dayIndex: number; // 0-13
}

export function sprintTimeline(start: Date, end: Date, today = new Date()): SprintDay[] {
  const days: SprintDay[] = [];
  const t = startOfDay(today);
  for (let i = 0; i < SPRINT_DURATION_DAYS; i++) {
    const d = addDays(start, i);
    days.push({
      date: d,
      label: format(d, "EEE, MMM d"),
      shortLabel: format(d, "d"),
      isWeekend: isWeekend(d),
      isToday: differenceInCalendarDays(t, startOfDay(d)) === 0,
      isPast: startOfDay(d) < t,
      weekNumber: i < 7 ? 1 : 2,
      dayIndex: i,
    });
  }
  return days;
}

/** Working-day helper used by burndown computations. */
export function countWorkingDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const s = startOfDay(start);
  const e = startOfDay(end);
  let cur = s;
  while (cur <= e) {
    if (!isWeekend(cur)) count++;
    cur = addDays(cur, 1);
  }
  return count;
}

export function nextSprintStart(date = new Date()): Date {
  const cur = sprintStartForDate(date);
  return addDays(cur, SPRINT_DURATION_DAYS);
}

export function prevSprintStart(date = new Date()): Date {
  const cur = sprintStartForDate(date);
  return addDays(cur, -SPRINT_DURATION_DAYS);
}

/** Generate the ideal burndown line for a sprint given total scope. */
export function idealBurndown(start: Date, total: number, today = new Date()) {
  const days = sprintTimeline(start, addDays(start, SPRINT_DURATION_DAYS), today);
  const workingDays = days.filter((d) => !d.isWeekend);
  const n = workingDays.length;
  return workingDays.map((d, i) => ({
    day: d.shortLabel,
    label: d.label,
    ideal: Math.max(0, Math.round(total * (1 - i / Math.max(1, n - 1)) * 10) / 10),
    isWeekend: d.isWeekend,
  }));
}

/** Format helpers */
export function fmtDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy");
}

export function fmtDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return format(date, "MMM d");
}

export function relativeDay(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const diff = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 0 && diff <= 7) return `In ${diff} days`;
  if (diff < 0 && diff >= -7) return `${Math.abs(diff)} days ago`;
  return format(date, "MMM d");
}

export function daysUntil(d: Date | string): number {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return Infinity;
  return differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
}
