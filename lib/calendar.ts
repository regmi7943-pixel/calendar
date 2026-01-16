import { differenceInWeeks, differenceInDays, startOfYear, endOfYear } from 'date-fns';

export type CalendarType = 'life' | 'year' | 'goal';

export interface CalendarData {
  total: number;
  elapsed: number;
  remaining: number;
  label?: string;
  type: CalendarType;
}

// 80 years in weeks
export const LIFE_EXPECTANCY_YEARS = 80;
export const WEEKS_PER_YEAR = 52;
export const TOTAL_LIFE_WEEKS = LIFE_EXPECTANCY_YEARS * WEEKS_PER_YEAR;

export function getLifeInWeeks(birthDate: Date): CalendarData {
  const now = new Date();
  const weeksLived = Math.max(0, differenceInWeeks(now, birthDate));

  return {
    total: TOTAL_LIFE_WEEKS,
    elapsed: Math.min(weeksLived, TOTAL_LIFE_WEEKS),
    remaining: Math.max(0, TOTAL_LIFE_WEEKS - weeksLived),
    type: 'life',
    label: `${LIFE_EXPECTANCY_YEARS} Years in Weeks`
  };
}

export function getYearProgress(): CalendarData {
  const now = new Date();
  const start = startOfYear(now);
  const end = endOfYear(now);

  const totalDays = differenceInDays(end, start) + 1;
  const currentDay = Math.min(Math.max(0, differenceInDays(now, start) + 1), totalDays);

  return {
    total: totalDays,
    elapsed: currentDay,
    remaining: totalDays - currentDay,
    type: 'year',
    label: now.getFullYear().toString()
  };
}

export function getGoalProgress(goalDate: Date): CalendarData {
  const now = new Date();
  const daysRemaining = Math.max(0, differenceInDays(goalDate, now));

  return {
    total: daysRemaining + 1,
    elapsed: 0,
    remaining: daysRemaining,
    type: 'goal',
    label: 'Days Until Goal'
  };
}
