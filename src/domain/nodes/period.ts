import type { PeriodRange, YarukotoNode } from "./types";
import { addDays, daysBetween, parseDateKey, toDateKey } from "../../utils/date";

export type PeriodBounds = {
  end: string;
  start: string;
};

export type PeriodBarStyle = {
  left: string;
  width: string;
};

export type TimelineLineStyle = {
  left: string;
};

export type TimelineWeekMarker = {
  dateKey: string;
  left: string;
};

export type DueState = {
  barClassName: string;
  textClassName: string;
};

export function isInvalidDateRange({
  dueDate,
  startDate,
}: {
  dueDate: string | null;
  startDate: string | null;
}) {
  return Boolean(startDate && dueDate && startDate > dueDate);
}

export function getNodePeriodDates(node: Pick<YarukotoNode, "dueDate" | "startDate">) {
  const start = node.startDate ?? node.dueDate;
  const end = node.dueDate ?? node.startDate;
  if (!start || !end) {
    return null;
  }
  return start <= end ? { start, end } : { start: end, end: start };
}

export function getDueState(dueDate: string | null): DueState {
  if (!dueDate) {
    return {
      barClassName: "bg-slate-400/70",
      textClassName: "text-muted-foreground",
    };
  }

  const today = toDateKey(new Date());
  if (dueDate < today) {
    return {
      barClassName: "bg-destructive/80",
      textClassName: "text-destructive",
    };
  }
  if (dueDate === today) {
    return {
      barClassName: "bg-primary",
      textClassName: "text-primary",
    };
  }
  if (dueDate <= toDateKey(addDays(new Date(), 7))) {
    return {
      barClassName: "bg-amber-500",
      textClassName: "text-amber-800",
    };
  }
  return {
    barClassName: "bg-emerald-500/80",
    textClassName: "text-muted-foreground",
  };
}

export function formatShortDate(dateKey: string) {
  return dateKey.slice(5).replace("-", "/");
}

export function formatPeriodLabel(startDate: string | null, dueDate: string | null) {
  if (startDate && dueDate) {
    const [start, end] =
      startDate <= dueDate ? [startDate, dueDate] : [dueDate, startDate];
    return `${formatShortDate(start)}-${formatShortDate(end)}`;
  }
  if (startDate) {
    return `開始 ${formatShortDate(startDate)}`;
  }
  if (dueDate) {
    return `終了 ${formatShortDate(dueDate)}`;
  }
  return "期間なし";
}

export function mergePeriodRanges(
  ranges: Array<PeriodRange | null | undefined>,
): PeriodRange | null {
  const values = ranges.filter((range): range is PeriodRange => range !== null && range !== undefined);
  if (values.length === 0) {
    return null;
  }
  return {
    end: values.reduce((latest, range) => (range.end > latest ? range.end : latest), values[0].end),
    start: values.reduce((earliest, range) => (range.start < earliest ? range.start : earliest), values[0].start),
  };
}

export function getPeriodBounds(nodes: Array<Pick<YarukotoNode, "dueDate" | "startDate">>) {
  return mergePeriodRanges(nodes.map(getNodePeriodDates));
}

function alignToWeekStart(dateKey: string) {
  const date = parseDateKey(dateKey);
  const offset = (date.getDay() + 6) % 7;
  return toDateKey(addDays(date, -offset));
}

function alignToWeekEnd(dateKey: string) {
  const date = parseDateKey(dateKey);
  const offset = 6 - ((date.getDay() + 6) % 7);
  return toDateKey(addDays(date, offset));
}

export function getTimelineBoundsFromRanges(
  ranges: Array<PeriodRange | null | undefined>,
): PeriodBounds | null {
  const merged = mergePeriodRanges(ranges);
  if (!merged) {
    return null;
  }
  return {
    end: alignToWeekEnd(merged.end),
    start: alignToWeekStart(merged.start),
  };
}

export function getTimelineBounds(
  nodes: Array<Pick<YarukotoNode, "dueDate" | "startDate">>,
): PeriodBounds | null {
  return getTimelineBoundsFromRanges(nodes.map(getNodePeriodDates));
}

export function getTimelinePosition(bounds: PeriodBounds | null, dateKey: string) {
  if (!bounds) {
    return null;
  }
  const totalDays = Math.max(
    1,
    daysBetween(parseDateKey(bounds.start), parseDateKey(bounds.end)),
  );
  const offsetDays = daysBetween(parseDateKey(bounds.start), parseDateKey(dateKey));
  if (offsetDays < 0 || offsetDays > totalDays) {
    return null;
  }
  return `${(offsetDays / totalDays) * 100}%`;
}

export function getTodayLineStyle(
  bounds: PeriodBounds | null,
  todayKey = toDateKey(new Date()),
): TimelineLineStyle | null {
  const left = getTimelinePosition(bounds, todayKey);
  return left ? { left } : null;
}

export function getTimelineWeekMarkers(bounds: PeriodBounds | null) {
  if (!bounds) {
    return [];
  }

  const totalDays = Math.max(
    1,
    daysBetween(parseDateKey(bounds.start), parseDateKey(bounds.end)),
  );
  const markers: TimelineWeekMarker[] = [];

  for (let offset = 7; offset < totalDays; offset += 7) {
    const date = addDays(parseDateKey(bounds.start), offset);
    markers.push({
      dateKey: toDateKey(date),
      left: `${(offset / totalDays) * 100}%`,
    });
  }

  return markers;
}

export function getPeriodBarStyle(
  nodeOrRange: Pick<YarukotoNode, "dueDate" | "startDate"> | PeriodRange,
  bounds: PeriodBounds | null,
): PeriodBarStyle | null {
  const range =
    "startDate" in nodeOrRange
      ? getNodePeriodDates(nodeOrRange)
      : nodeOrRange;
  if (!bounds || !range) {
    return null;
  }
  const totalDays = Math.max(
    1,
    daysBetween(parseDateKey(bounds.start), parseDateKey(bounds.end)),
  );
  const offsetDays = Math.max(
    0,
    daysBetween(parseDateKey(bounds.start), parseDateKey(range.start)),
  );
  const durationDays = Math.max(
    0,
    daysBetween(parseDateKey(range.start), parseDateKey(range.end)),
  );
  const left = Math.min(100, (offsetDays / totalDays) * 100);
  const width = Math.max(4, ((durationDays || 0.35) / totalDays) * 100);

  return {
    left: `${left}%`,
    width: `${Math.min(100 - left, width)}%`,
  };
}
