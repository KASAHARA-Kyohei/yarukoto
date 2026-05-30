import { addDays, parseDateKey, toDateKey } from "@/utils/date";

export function getInitialDateKey(
  value: string | null,
  baseDate: Date = new Date(),
) {
  return value ?? toDateKey(baseDate);
}

export function addDaysToDateKey(dateKey: string, amount: number) {
  return toDateKey(addDays(parseDateKey(dateKey), amount));
}

export function addMonthsToDateKey(dateKey: string, amount: number) {
  const next = parseDateKey(dateKey);
  next.setMonth(next.getMonth() + amount);
  return toDateKey(next);
}

export function parseDateInput(input: string): {
  error: string | null;
  value: string | null;
} {
  const trimmed = input.trim();
  if (trimmed === "") {
    return { error: null, value: null };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      error: "YYYY-MM-DD 形式で入力してください。",
      value: null,
    };
  }

  const parsed = parseDateKey(trimmed);
  if (Number.isNaN(parsed.getTime()) || toDateKey(parsed) !== trimmed) {
    return {
      error: "存在する日付を入力してください。",
      value: null,
    };
  }

  return { error: null, value: trimmed };
}
