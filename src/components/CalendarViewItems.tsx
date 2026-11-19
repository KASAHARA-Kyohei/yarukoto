import { useLanguage } from "@/app/LanguageProvider";
import type { Messages } from "@/app/messages";
import {
  MAX_VISIBLE_DAY_ITEMS,
  type CalendarDayItem,
  type CalendarRangeSegment,
  type CalendarWeekModel,
} from "@/domain/nodes/calendar";
import {
  getNodeDisplayTitle,
  nodeTitleClass,
} from "@/domain/nodes/nodeAppearance";
import type { YarukotoNode } from "@/domain/nodes/types";
import { cn } from "@/lib/utils";
import { NodeEditButton } from "./NodeEditButton";

export function getStatusSurface(
  status: YarukotoNode["status"],
  invalid = false,
) {
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

export function getRangeAreaHeight(week: CalendarWeekModel) {
  return Math.max(0, week.laneCount * 24);
}

function getSingleDayKindLabel(kind: CalendarDayItem["kind"], t: Messages) {
  switch (kind) {
    case "due":
      return t.calendarDue;
    case "start":
      return t.calendarStart;
    case "invalid":
    default:
      return "!";
  }
}

function getRangeStyle(segment: CalendarRangeSegment) {
  return {
    left: `calc(${(segment.colStart / 7) * 100}% + 6px)`,
    top: `${segment.lane * 24}px`,
    width: `calc(${(segment.colSpan / 7) * 100}% - 12px)`,
  };
}

export function CalendarRangeBar({
  editDisabled,
  isSelected,
  onEditNode,
  onSelectNode,
  segment,
}: {
  editDisabled: boolean;
  isSelected: boolean;
  onEditNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  segment: CalendarRangeSegment;
}) {
  const { language } = useLanguage();
  const surface = getStatusSurface(segment.node.status);
  const title = getNodeDisplayTitle(segment.node, language);

  return (
    <div
      className={cn(
        "absolute flex h-6 items-center border text-[11px] font-medium shadow-sm transition",
        surface.bar,
        segment.continuesLeft ? "rounded-l-sm" : "rounded-l-full",
        segment.continuesRight ? "rounded-r-sm" : "rounded-r-full",
        isSelected && "ring-2 ring-primary/45",
      )}
      style={getRangeStyle(segment)}
    >
      <button
        className="flex h-full min-w-0 flex-1 items-center rounded-[inherit] px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-node-focus-id={segment.node.id}
        title={`${title} (${segment.segmentStart} - ${segment.segmentEnd})`}
        type="button"
        onClick={() => onSelectNode(segment.node.id)}
      >
        <span
          className={cn(
            segment.showsTitle ? "truncate" : "sr-only",
            nodeTitleClass(segment.node.status),
          )}
        >
          {title}
        </span>
      </button>
      <NodeEditButton
        className="mr-0.5 text-current"
        disabled={editDisabled}
        node={segment.node}
        onEditNode={onEditNode}
      />
    </div>
  );
}

export function CalendarSingleDayItem({
  editDisabled,
  isSelected,
  item,
  onEditNode,
  onSelectNode,
}: {
  editDisabled: boolean;
  isSelected: boolean;
  item: CalendarDayItem;
  onEditNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}) {
  const { language, t } = useLanguage();
  const surface = getStatusSurface(item.node.status, item.kind === "invalid");
  const title = getNodeDisplayTitle(item.node, language);

  return (
    <div
      className={cn(
        "flex w-full items-center rounded-md border text-[11px] leading-tight transition",
        surface.bar,
        isSelected && "ring-2 ring-primary/45",
      )}
    >
      <button
        className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-1.5 pr-1 pl-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        data-node-focus-id={item.node.id}
        title={title}
        type="button"
        onClick={() => onSelectNode(item.node.id)}
      >
        <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded bg-background/65 px-1 text-[9px] font-semibold text-muted-foreground">
          {getSingleDayKindLabel(item.kind, t)}
        </span>
        <span className={cn("truncate font-medium", nodeTitleClass(item.node.status))}>
          {title}
        </span>
      </button>
      <NodeEditButton
        className="mr-0.5 text-current"
        disabled={editDisabled}
        node={item.node}
        onEditNode={onEditNode}
      />
    </div>
  );
}

export function CalendarWeekRow({
  editDisabled,
  overflowByDate,
  rangeSegments,
  selectedId,
  singleDayItemsByDate,
  week,
  onEditNode,
  onSelectNode,
}: {
  editDisabled: boolean;
  overflowByDate: Map<string, number>;
  rangeSegments: CalendarRangeSegment[];
  selectedId: string | null;
  singleDayItemsByDate: Map<string, CalendarDayItem[]>;
  week: CalendarWeekModel;
  onEditNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}) {
  const rangeAreaHeight = getRangeAreaHeight(week);

  return (
    <section
      className="relative border-t border-border/60 first:border-t-0"
      key={week.index}
    >
      <div className="grid grid-cols-7">
        {week.days.map((day) => {
          const dayItems = singleDayItemsByDate.get(day.dateKey) ?? [];
          const visibleItems = dayItems.slice(0, MAX_VISIBLE_DAY_ITEMS);
          const overflowCount = overflowByDate.get(day.dateKey) ?? 0;
          const rangeCount = rangeSegments.filter(
            (segment) =>
              segment.segmentStart <= day.dateKey &&
              segment.segmentEnd >= day.dateKey,
          ).length;

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
                {rangeCount + dayItems.length > 0 ? (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {rangeCount + dayItems.length}
                  </span>
                ) : null}
              </div>

              <div style={{ height: `${rangeAreaHeight}px` }} />

              <div className="mt-2 space-y-1.5">
                {visibleItems.map((item) => (
                  <CalendarSingleDayItem
                    editDisabled={editDisabled}
                    isSelected={selectedId === item.node.id}
                    item={item}
                    key={`${day.dateKey}-${item.node.id}-${item.kind}`}
                    onEditNode={onEditNode}
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

      {rangeSegments.length > 0 ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-10 px-1.5"
          style={{ height: `${rangeAreaHeight}px` }}
        >
          {rangeSegments.map((segment) => (
            <div
              className="pointer-events-auto"
              key={`${segment.node.id}-${segment.weekIndex}`}
            >
              <CalendarRangeBar
                editDisabled={editDisabled}
                isSelected={selectedId === segment.node.id}
                onEditNode={onEditNode}
                onSelectNode={onSelectNode}
                segment={segment}
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
