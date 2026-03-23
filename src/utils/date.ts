import { format, addMonths, differenceInMonths, isBefore, parseISO, startOfMonth } from 'date-fns';

export function formatDate(date: string | Date, fmt: string = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM yyyy');
}

export function addMonthsToDate(date: string | Date, months: number): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return addMonths(d, months);
}

export function monthsBetween(start: string | Date, end: string | Date): number {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : end;
  return differenceInMonths(e, s);
}

export function getMonthsElapsed(startDate: string): number {
  const start = startOfMonth(parseISO(startDate));
  const now = startOfMonth(new Date());
  return Math.max(0, differenceInMonths(now, start));
}

export function isOverdue(dueDate: string | Date): boolean {
  const d = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return isBefore(d, new Date());
}

export function getNextDueDate(startDate: string, monthsElapsed: number): Date {
  return addMonths(parseISO(startDate), monthsElapsed + 1);
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
