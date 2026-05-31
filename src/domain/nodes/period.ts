import type { PeriodRange, YarukotoNode } from "./types";
import { addDays, daysBetween, parseDateKey, toDateKey } from "../../utils/date";

export type TimelineMode = "short" | "medium" | "long" | "xlong";

export type PeriodBounds = {
  end: string;
  start: string;
};

export type PeriodBarStyle = {
  endMarkerLeft: string;
  left: string;
  truncatedLeft: boolean;
  truncatedRight: boolean;
  width: string;
};

export type TimelineLineStyle = {
  left: string;
};

export type TimelineMarker = {
  dateKey: string;
  kind: "month" | "quarter" | "week";
  label: string | null;
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
  const values = ranges.filter(
    (range): range is PeriodRange => range !== null && range !== undefined,
  );
  if (values.length === 0) {
    return null;
  }
  return {
    end: values.reduce(
      (latest, range) => (range.end > latest ? range.end : latest),
      values[0].end,
    ),
    start: values.reduce(
      (earliest, range) => (range.start < earliest ? range.start : earliest),
      values[0].start,
    ),
  };
}

export function getPeriodBounds(nodes: Array<Pick<YarukotoNode, "dueDate" | "startDate">>) {
  return mergePeriodRanges(nodes.map(getNodePeriodDates));
}

function addMonths(dateKey: string, amount: number) {
  const next = parseDateKey(dateKey);
  next.setMonth(next.getMonth() + amount);
  return toDateKey(next);
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

function alignToMonthStart(dateKey: string) {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), 1));
}

function alignToMonthEnd(dateKey: string) {
  const date = parseDateKey(dateKey);
  return toDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function getQuarterLabel(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()} Q${Math.floor(date.getMonth() / 3) + 1}`;
}

export function getTimelineModeFromRanges(
  ranges: Array<PeriodRange | null | undefined>,
): TimelineMode | null {
  const merged = mergePeriodRanges(ranges);
  if (!merged) {
    return null;
  }
  const totalDays = Math.max(
    0,
    daysBetween(parseDateKey(merged.start), parseDateKey(merged.end)),
  );
  if (totalDays <= 45) {
    return "short";
  }
  if (totalDays <= 180) {
    return "medium";
  }
  if (totalDays <= 365) {
    return "long";
  }
  return "xlong";
}

export function getTimelinePeriodColumnMinWidth(mode: TimelineMode | null) {
  switch (mode) {
    case "medium":
      return 520;
    case "long":
    case "xlong":
      return 720;
    case "short":
    default:
      return 320;
  }
}

function getXlongBounds(merged: PeriodRange, todayKey: string): PeriodBounds {
  if (todayKey < merged.start) {
    const start = alignToMonthStart(merged.start);
    return {
      end: alignToMonthEnd(addMonths(start, 11)),
      start,
    };
  }

  if (todayKey > merged.end) {
    const end = alignToMonthEnd(merged.end);
    const endMonthStart = alignToMonthStart(end);
    const start = alignToMonthStart(addMonths(endMonthStart, -11));
    return { end, start };
  }

  const start = alignToMonthStart(todayKey);
  return {
    end: alignToMonthEnd(addMonths(start, 11)),
    start,
  };
}

export function getTimelineBoundsForMode(
  merged: PeriodRange,
  mode: TimelineMode,
  todayKey = toDateKey(new Date()),
): PeriodBounds {
  switch (mode) {
    case "short":
      return {
        end: alignToWeekEnd(merged.end),
        start: alignToWeekStart(merged.start),
      };
    case "medium":
    case "long":
      return {
        end: alignToMonthEnd(merged.end),
        start: alignToMonthStart(merged.start),
      };
    case "xlong":
      return getXlongBounds(merged, todayKey);
  }
}

export function getTimelineBoundsFromRanges(
  ranges: Array<PeriodRange | null | undefined>,
  todayKey = toDateKey(new Date()),
): PeriodBounds | null {
  const merged = mergePeriodRanges(ranges);
  const mode = getTimelineModeFromRanges(ranges);
  if (!merged || !mode) {
    return null;
  }
  return getTimelineBoundsForMode(merged, mode, todayKey);
}

export function getTimelineBounds(
  nodes: Array<Pick<YarukotoNode, "dueDate" | "startDate">>,
  todayKey = toDateKey(new Date()),
): PeriodBounds | null {
  return getTimelineBoundsFromRanges(nodes.map(getNodePeriodDates), todayKey);
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

export function getTimelineMarkers(
  bounds: PeriodBounds | null,
  mode: TimelineMode | null,
): TimelineMarker[] {
  if (!bounds || !mode) {
    return [];
  }

  const markers: TimelineMarker[] = [];

  if (mode === "short") {
    const totalDays = Math.max(
      1,
      daysBetween(parseDateKey(bounds.start), parseDateKey(bounds.end)),
    );
    for (let offset = 7; offset < totalDays; offset += 7) {
      const date = addDays(parseDateKey(bounds.start), offset);
      markers.push({
        dateKey: toDateKey(date),
        kind: "week",
        label: null,
        left: `${(offset / totalDays) * 100}%`,
      });
    }
    return markers;
  }

  let current = parseDateKey(alignToMonthStart(bounds.start));
  current.setMonth(current.getMonth() + 1);
  while (toDateKey(current) < bounds.end) {
    const dateKey = toDateKey(current);
    const left = getTimelinePosition(bounds, dateKey);
    if (left) {
      if (mode === "medium") {
        markers.push({
          dateKey,
          kind: "month",
          label: `${current.getMonth() + 1}月`,
          left,
        });
      } else {
        markers.push({
          dateKey,
          kind: current.getMonth() % 3 === 0 ? "quarter" : "month",
          label: current.getMonth() % 3 === 0 ? getQuarterLabel(dateKey) : null,
          left,
        });
      }
    }
    current.setMonth(current.getMonth() + 1);
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

  if (range.end < bounds.start) {
    return {
      endMarkerLeft: "0%",
      left: "0px",
      truncatedLeft: true,
      truncatedRight: false,
      width: "10px",
    };
  }

  if (range.start > bounds.end) {
    return {
      endMarkerLeft: "100%",
      left: "calc(100% - 10px)",
      truncatedLeft: false,
      truncatedRight: true,
      width: "10px",
    };
  }

  const clippedStart = range.start < bounds.start ? bounds.start : range.start;
  const clippedEnd = range.end > bounds.end ? bounds.end : range.end;
  const leftDays = Math.max(
    0,
    daysBetween(parseDateKey(bounds.start), parseDateKey(clippedStart)),
  );
  const visibleDays = Math.max(
    0.35,
    daysBetween(parseDateKey(clippedStart), parseDateKey(clippedEnd)),
  );
  const endDays = Math.max(
    0,
    daysBetween(parseDateKey(bounds.start), parseDateKey(clippedEnd)),
  );
  const leftPercent = (leftDays / totalDays) * 100;
  const widthPercent = (visibleDays / totalDays) * 100;
  const endPercent = (endDays / totalDays) * 100;

  return {
    endMarkerLeft: `${Math.max(0, Math.min(100, endPercent))}%`,
    left: `${Math.max(0, Math.min(100, leftPercent))}%`,
    truncatedLeft: range.start < bounds.start,
    truncatedRight: range.end > bounds.end,
    width: `max(6px, ${Math.min(100 - leftPercent, widthPercent)}%)`,
  };
}
