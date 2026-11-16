import { DEFAULT_LANGUAGE, type Language } from "@/app/language";

const englishDate = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const englishMonth = new Intl.DateTimeFormat("en", { year: "numeric", month: "long" });
const englishShortMonth = new Intl.DateTimeFormat("en", { month: "short" });

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthLabel(date: Date, language: Language = DEFAULT_LANGUAGE) {
  return language === "en"
    ? englishMonth.format(date)
    : `${date.getFullYear()}年 ${getShortMonthLabel(date, language)}`;
}

export function getShortMonthLabel(date: Date, language: Language) {
  return language === "en" ? englishShortMonth.format(date) : `${date.getMonth() + 1}月`;
}

export function formatDateLabel(date: Date, language: Language) {
  return language === "en"
    ? englishDate.format(date)
    : `${getMonthLabel(date, language)} ${date.getDate()}日`;
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function daysBetween(start: Date, end: Date) {
  const startTime = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  ).getTime();
  const endTime = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime();
  return Math.round((endTime - startTime) / 86_400_000);
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}
