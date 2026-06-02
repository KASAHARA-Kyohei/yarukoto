import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildCalendarMonthModel,
  MAX_VISIBLE_DAY_ITEMS,
  type CalendarDayItem,
  type CalendarRangeSegment,
  type CalendarWeekModel,
} from "@/domain/nodes/calendar";
import { getNodeDisplayTitle } from "@/domain/nodes/nodeAppearance";
import type { YarukotoNode } from "@/domain/nodes/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMonthLabel } from "@/utils/date";

const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];

function getStatusSurface(status: YarukotoNode["status"], invalid = false) {
  if (invalid) {
    return {
      bar: "border-amber-300/80 bg-amber-100 text-amber-950",
      dot: "bg-amber-500",
      text: "text-amber-900",
    };
  }

  switch (status) {
    case "Done":
      return {
        bar: "border-emerald-300/70 bg-emerald-100/95 text-emerald-950",
        dot: "bg-emerald-500",
        text: "text-emerald-900",
      };
    case "Doing":
      return {
        bar: "border-amber-300/70 bg-amber-100/95 text-amber-950",
        dot: "bg-amber-500",
        text: "text-amber-900",
      };
    case "Next":
      return {
        bar: "border-sky-300/70 bg-sky-100/95 text-sky-950",
        dot: "bg-sky-500",
        text: "text-sky-900",
      };
    case "Inbox":
    default:
      return {
        bar: "border-slate-300/80 bg-slate-100/90 text-slate-900",
        dot: "bg-slate-400",
        text: "text-slate-700",
      };
  }
}

function getSingleDayKindLabel(kind: CalendarDayItem["kind"]) {
  switch (kind) {
    case "due":
      return "締";
    case "start":
      return "始";
    case "invalid":
    default:
      return "!";
  }
}

function getRangeAreaHeight(week: CalendarWeekModel) {
  return Math.max(0, week.laneCount * 24);
}

function getRangeStyle(segment: CalendarRangeSegment) {
  return {
    left: `calc(${(segment.colStart / 7) * 100}% + 6px)`,
    top: `${segment.lane * 24}px`,
    width: `calc(${(segment.colSpan / 7) * 100}% - 12px)`,
  };
}

function CalendarRangeBar({
  isSelected,
  onSelectNode,
  segment,
}: {
  isSelected: boolean;
  onSelectNode: (nodeId: string) => void;
  segment: CalendarRangeSegment;
}) {
  const surface = getStatusSurface(segment.node.status);
  const title = getNodeDisplayTitle(segment.node);

  return (
    <button
      className={cn(
        "absolute flex h-5 items-center overflow-hidden border px-2 text-left text-[11px] font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        surface.bar,
        segment.continuesLeft ? "rounded-l-sm" : "rounded-l-full",
        segment.continuesRight ? "rounded-r-sm" : "rounded-r-full",
        isSelected && "ring-2 ring-primary/45",
      )}
      data-node-focus-id={segment.node.id}
      style={getRangeStyle(segment)}
      title={`${title} (${segment.segmentStart} - ${segment.segmentEnd})`}
      type="button"
      onClick={() => onSelectNode(segment.node.id)}
    >
      {segment.showsTitle ? (
        <span className="truncate">{title}</span>
      ) : (
        <span className="sr-only">{title}</span>
      )}
    </button>
  );
}

function CalendarSingleDayItem({
  isSelected,
  item,
  onSelectNode,
}: {
  isSelected: boolean;
  item: CalendarDayItem;
  onSelectNode: (nodeId: string) => void;
}) {
  const surface = getStatusSurface(item.node.status, item.kind === "invalid");
  const title = getNodeDisplayTitle(item.node);

  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left text-[11px] leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        surface.bar,
        isSelected && "ring-2 ring-primary/45",
      )}
      data-node-focus-id={item.node.id}
      title={title}
      type="button"
      onClick={() => onSelectNode(item.node.id)}
    >
      <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded bg-background/65 px-1 text-[9px] font-semibold text-muted-foreground">
        {getSingleDayKindLabel(item.kind)}
      </span>
      <span className="truncate font-medium">{title}</span>
    </button>
  );
}

export function CalendarView({
  month,
  nodes,
  onChangeMonth,
  onSelectNode,
  selectedId,
}: {
  month: Date;
  nodes: YarukotoNode[];
  onChangeMonth: (month: Date) => void;
  onSelectNode: (nodeId: string) => void;
  selectedId: string | null;
}) {
  const model = useMemo(() => buildCalendarMonthModel(nodes, month), [month, nodes]);

  const moveMonth = (amount: number) => {
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            aria-label="前月"
            size="icon"
            type="button"
            variant="outline"
            onClick={() => moveMonth(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label="翌月"
            size="icon"
            type="button"
            variant="outline"
            onClick={() => moveMonth(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold tracking-tight">{getMonthLabel(month)}</h2>
          <p className="text-xs text-muted-foreground">
            {nodes.length}件 ・ Ctrl+h / Ctrl+l で前後移動
          </p>
        </div>
        <Button
          size="sm"
          type="button"
          variant="secondary"
          onClick={() => onChangeMonth(new Date())}
        >
          今月
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-sm">
          <div className="grid grid-cols-7 border-b border-border/70 bg-muted/25">
            {WEEK_DAYS.map((day, index) => (
              <div
                className={cn(
                  "px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide",
                  index === 0
                    ? "text-rose-500"
                    : index === 6
                      ? "text-sky-600"
                      : "text-muted-foreground",
                )}
                key={day}
              >
                {day}
              </div>
            ))}
          </div>

          {model.weeks.map((week) => {
            const segments = model.rangeSegmentsByWeek.get(week.index) ?? [];
            const rangeAreaHeight = getRangeAreaHeight(week);

            return (
              <section className="relative border-t border-border/60 first:border-t-0" key={week.index}>
                <div className="grid grid-cols-7">
                  {week.days.map((day) => {
                    const dayItems = model.singleDayItemsByDate.get(day.dateKey) ?? [];
                    const visibleItems = dayItems.slice(0, MAX_VISIBLE_DAY_ITEMS);
                    const overflowCount = model.singleDayOverflowByDate.get(day.dateKey) ?? 0;

                    return (
                      <div
                        className={cn(
                          "min-h-[156px] border-r border-border/60 px-2 py-2 last:border-r-0",
                          day.isCurrentMonth ? "bg-background/90" : "bg-muted/15",
                        )}
                        key={day.dateKey}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "grid h-7 w-7 place-items-center rounded-full text-sm font-semibold",
                              day.isToday
                                ? "bg-foreground text-background"
                                : day.isCurrentMonth
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                            )}
                          >
                            {day.date.getDate()}
                          </span>
                          {(segments.length > 0 || dayItems.length > 0) && (
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {segments.filter(
                                (segment) =>
                                  segment.segmentStart <= day.dateKey &&
                                  segment.segmentEnd >= day.dateKey,
                              ).length + dayItems.length}
                            </span>
                          )}
                        </div>

                        <div style={{ height: `${rangeAreaHeight}px` }} />

                        <div className="mt-2 space-y-1.5">
                          {visibleItems.map((item) => (
                            <CalendarSingleDayItem
                              isSelected={selectedId === item.node.id}
                              item={item}
                              key={`${day.dateKey}-${item.node.id}-${item.kind}`}
                              onSelectNode={onSelectNode}
                            />
                          ))}
                          {overflowCount > 0 ? (
                            <div className="px-1 text-[11px] font-medium text-muted-foreground">
                              +{overflowCount}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {segments.length > 0 ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-10 px-1.5"
                    style={{ height: `${rangeAreaHeight}px` }}
                  >
                    {segments.map((segment) => (
                      <div className="pointer-events-auto" key={`${segment.node.id}-${segment.weekIndex}`}>
                        <CalendarRangeBar
                          isSelected={selectedId === segment.node.id}
                          onSelectNode={onSelectNode}
                          segment={segment}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
