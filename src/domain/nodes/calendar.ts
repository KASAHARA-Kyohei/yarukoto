import { addDays, daysBetween, parseDateKey, toDateKey } from "@/utils/date";
import type { YarukotoNode } from "./types";

export const MAX_VISIBLE_DAY_ITEMS = 3;

export type CalendarDayItemKind = "due" | "invalid" | "start";

export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayIndex: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  weekIndex: number;
};

export type CalendarDayItem = {
  dateKey: string;
  kind: CalendarDayItemKind;
  node: YarukotoNode;
};

export type CalendarRangeSegment = {
  colSpan: number;
  colStart: number;
  continuesLeft: boolean;
  continuesRight: boolean;
  lane: number;
  node: YarukotoNode;
  segmentEnd: string;
  segmentStart: string;
  showsTitle: boolean;
  weekIndex: number;
};

export type CalendarWeekModel = {
  days: CalendarDay[];
  end: string;
  index: number;
  laneCount: number;
  start: string;
};

export type CalendarMonthModel = {
  days: CalendarDay[];
  rangeSegmentsByWeek: Map<number, CalendarRangeSegment[]>;
  singleDayItemsByDate: Map<string, CalendarDayItem[]>;
  singleDayOverflowByDate: Map<string, number>;
  weeks: CalendarWeekModel[];
};

function getGridStart(month: Date) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  return addDays(monthStart, -monthStart.getDay());
}

function compareDateKeys(left: string, right: string) {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

function compareCalendarNodes(left: YarukotoNode, right: YarukotoNode) {
  const leftDate = left.dueDate ?? left.startDate ?? "";
  const rightDate = right.dueDate ?? right.startDate ?? "";
  const leftDateOrder = compareDateKeys(leftDate, rightDate);
  if (leftDateOrder !== 0) {
    return leftDateOrder;
  }
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }
  return left.title.localeCompare(right.title);
}

function getVisibleRangeStart(node: YarukotoNode, gridStart: string) {
  return node.startDate && node.startDate > gridStart ? node.startDate : gridStart;
}

function createDays(month: Date, todayKey: string) {
  const gridStart = getGridStart(month);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      dateKey: toDateKey(date),
      dayIndex: index % 7,
      isCurrentMonth: date.getMonth() === month.getMonth(),
      isToday: toDateKey(date) === todayKey,
      weekIndex: Math.floor(index / 7),
    };
  });
}

function buildSingleDayItems(
  nodes: YarukotoNode[],
  gridStart: string,
  gridEnd: string,
) {
  const singleDayItemsByDate = new Map<string, CalendarDayItem[]>();

  const pushItem = (item: CalendarDayItem) => {
    const items = singleDayItemsByDate.get(item.dateKey) ?? [];
    items.push(item);
    singleDayItemsByDate.set(item.dateKey, items);
  };

  for (const node of nodes) {
    if (!node.startDate && !node.dueDate) {
      continue;
    }

    if (node.startDate && node.dueDate && node.startDate <= node.dueDate) {
      continue;
    }

    const dateKey =
      node.startDate && node.dueDate
        ? node.dueDate >= gridStart && node.dueDate <= gridEnd
          ? node.dueDate
          : node.startDate
        : node.dueDate ?? node.startDate;
    if (!dateKey || dateKey < gridStart || dateKey > gridEnd) {
      continue;
    }

    pushItem({
      dateKey,
      kind:
        node.startDate && node.dueDate
          ? "invalid"
          : node.dueDate
            ? "due"
            : "start",
      node,
    });
  }

  for (const [dateKey, items] of singleDayItemsByDate) {
    items.sort((left, right) => {
      const kindOrder = { invalid: 0, due: 1, start: 2 };
      const kindDiff = kindOrder[left.kind] - kindOrder[right.kind];
      if (kindDiff !== 0) {
        return kindDiff;
      }
      return compareCalendarNodes(left.node, right.node);
    });
    singleDayItemsByDate.set(dateKey, items);
  }

  return singleDayItemsByDate;
}

function buildRangeSegments(
  weeks: CalendarWeekModel[],
  nodes: YarukotoNode[],
  gridStart: string,
  gridEnd: string,
) {
  const rangeSegmentsByWeek = new Map<number, CalendarRangeSegment[]>();

  for (const week of weeks) {
    const candidates = nodes
      .filter(
        (node) =>
          node.startDate &&
          node.dueDate &&
          node.startDate <= node.dueDate &&
          node.startDate <= week.end &&
          node.dueDate >= week.start &&
          node.dueDate >= gridStart &&
          node.startDate <= gridEnd,
      )
      .sort((left, right) => {
        const leftStart = left.startDate ?? left.dueDate ?? "";
        const rightStart = right.startDate ?? right.dueDate ?? "";
        const startOrder = compareDateKeys(leftStart, rightStart);
        if (startOrder !== 0) {
          return startOrder;
        }
        return compareCalendarNodes(left, right);
      });

    const laneEnds: string[] = [];
    const segments: CalendarRangeSegment[] = [];

    for (const node of candidates) {
      const segmentStart =
        node.startDate && node.startDate > week.start ? node.startDate : week.start;
      const segmentEnd =
        node.dueDate && node.dueDate < week.end ? node.dueDate : week.end;
      const firstVisibleStart = getVisibleRangeStart(node, gridStart);

      let lane = laneEnds.findIndex((laneEnd) => laneEnd < segmentStart);
      if (lane === -1) {
        lane = laneEnds.length;
      }
      laneEnds[lane] = segmentEnd;

      segments.push({
        colSpan: daysBetween(parseDateKey(segmentStart), parseDateKey(segmentEnd)) + 1,
        colStart: week.days.findIndex((day) => day.dateKey === segmentStart),
        continuesLeft: Boolean(node.startDate && node.startDate < segmentStart),
        continuesRight: Boolean(node.dueDate && node.dueDate > segmentEnd),
        lane,
        node,
        segmentEnd,
        segmentStart,
        showsTitle: firstVisibleStart === segmentStart,
        weekIndex: week.index,
      });
    }

    rangeSegmentsByWeek.set(week.index, segments);
    week.laneCount = laneEnds.length;
  }

  return rangeSegmentsByWeek;
}

export function buildCalendarMonthModel(
  nodes: YarukotoNode[],
  month: Date,
  todayKey = toDateKey(new Date()),
): CalendarMonthModel {
  const days = createDays(month, todayKey);
  const weeks = Array.from({ length: 6 }, (_, index) => {
    const weekDays = days.slice(index * 7, index * 7 + 7);
    return {
      days: weekDays,
      end: weekDays[6].dateKey,
      index,
      laneCount: 0,
      start: weekDays[0].dateKey,
    };
  });
  const gridStart = days[0].dateKey;
  const gridEnd = days[days.length - 1].dateKey;
  const singleDayItemsByDate = buildSingleDayItems(nodes, gridStart, gridEnd);
  const singleDayOverflowByDate = new Map<string, number>();

  for (const [dateKey, items] of singleDayItemsByDate) {
    singleDayOverflowByDate.set(
      dateKey,
      Math.max(0, items.length - MAX_VISIBLE_DAY_ITEMS),
    );
  }

  const rangeSegmentsByWeek = buildRangeSegments(weeks, nodes, gridStart, gridEnd);

  return {
    days,
    rangeSegmentsByWeek,
    singleDayItemsByDate,
    singleDayOverflowByDate,
    weeks,
  };
}
