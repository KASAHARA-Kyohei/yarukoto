import { useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { FlatTreeNode } from "../types";
import { statusBadgeClass, typeBadgeClass } from "@/nodeAppearance";
import {
  getPeriodBarStyle,
  getTimelineBoundsFromRanges,
  getTimelineWeekMarkers,
  getTodayLineStyle,
  isInvalidDateRange,
} from "@/period";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { addDays, toDateKey } from "@/utils/date";

const INDENT_STEP = 22;
const INDENT_START = 18;
const TREE_ROW_GAP = 20;
const TREE_COLUMNS = "minmax(320px, 520px) 68px 74px minmax(240px, 1fr)";

function dueState(dueDate: string | null) {
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

function formatShortDate(dateKey: string) {
  return dateKey.slice(5).replace("-", "/");
}

function formatPeriodLabel(startDate: string | null, dueDate: string | null) {
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

function TimelineTrack({
  aggregateBarStyle,
  barClassName,
  barStyle,
  boundsLabel,
  isInvalidRange,
  todayLineStyle,
  weekMarkers,
}: {
  aggregateBarStyle: { left: string; width: string } | null;
  barClassName: string;
  barStyle: { left: string; width: string } | null;
  boundsLabel: string;
  isInvalidRange: boolean;
  todayLineStyle: { left: string } | null;
  weekMarkers: Array<{ dateKey: string; left: string }>;
}) {
  return (
    <div className="relative h-6 overflow-hidden rounded-md bg-muted/55">
      {weekMarkers.map((marker) => (
        <span
          className="absolute inset-y-0 w-px bg-border/45"
          key={marker.dateKey}
          style={{ left: marker.left }}
        />
      ))}
      {todayLineStyle ? (
        <span
          aria-label="today"
          className="absolute inset-y-0 w-px bg-primary/80"
          style={todayLineStyle}
        />
      ) : null}
      {aggregateBarStyle ? (
        <div
          aria-label={`${boundsLabel} children`}
          className="absolute top-3.5 h-1 rounded-full bg-foreground/18"
          style={aggregateBarStyle}
        />
      ) : null}
      {barStyle ? (
        <div
          aria-label={boundsLabel}
          className={cn(
            "absolute top-1.5 h-2 rounded-full shadow-[inset_0_-1px_0_rgba(255,255,255,0.18)]",
            isInvalidRange ? "bg-amber-500" : barClassName,
          )}
          style={barStyle}
        />
      ) : null}
    </div>
  );
}

function IndentGuides({
  depth,
  guideColumns,
  isLastSibling,
}: {
  depth: number;
  guideColumns: boolean[];
  isLastSibling: boolean;
}) {
  if (depth === 0) {
    return null;
  }

  const branchLeft = INDENT_START + (depth - 1) * INDENT_STEP;

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0">
      {guideColumns.slice(0, -1).map((shouldContinue, index) =>
        shouldContinue ? (
          <span
            className="absolute top-0 w-px rounded-full bg-border/70"
            key={index}
            style={{
              bottom: -TREE_ROW_GAP,
              left: INDENT_START + index * INDENT_STEP,
            }}
          />
        ) : null,
      )}
      <span
        className="absolute w-px rounded-none bg-border/70"
        style={{
          height: `calc(50% + ${TREE_ROW_GAP}px)`,
          left: branchLeft,
          top: -TREE_ROW_GAP,
        }}
      />
      {!isLastSibling ? (
        <span
          className="absolute top-1/2 w-px rounded-full bg-border/70"
          style={{ bottom: -TREE_ROW_GAP, left: branchLeft }}
        />
      ) : null}
      <span
        className="absolute top-1/2 h-px w-3 -translate-y-1/2 rounded-full bg-border/70"
        style={{ left: branchLeft }}
      />
    </div>
  );
}

export function TreeView({
  expandedIds,
  onSelectNode,
  onToggleExpanded,
  selectedId,
  visibleNodes,
}: {
  expandedIds: Set<string>;
  onSelectNode: (nodeId: string) => void;
  onToggleExpanded: (nodeId: string) => void;
  selectedId: string | null;
  visibleNodes: FlatTreeNode[];
}) {
  const timelineBounds = useMemo(
    () => {
      const ranges = [
        ...visibleNodes.map(({ node }) =>
          node.startDate || node.dueDate
            ? {
                end: node.dueDate ?? node.startDate ?? "",
                start: node.startDate ?? node.dueDate ?? "",
              }
            : null,
        ),
        ...visibleNodes.map(({ descendantPeriod }) => descendantPeriod),
      ];
      return getTimelineBoundsFromRanges(ranges);
    },
    [visibleNodes],
  );
  const weekMarkers = useMemo(
    () => getTimelineWeekMarkers(timelineBounds),
    [timelineBounds],
  );
  const todayLineStyle = useMemo(
    () => getTodayLineStyle(timelineBounds),
    [timelineBounds],
  );

  return (
    <div className="flex-1 overflow-auto px-2 py-3">
      {visibleNodes.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          ルートを追加してください。
        </div>
      ) : (
        <div className="min-w-[720px]">
          <div
            className="mb-2 grid items-end gap-y-1 px-2 text-[11px] font-medium uppercase text-muted-foreground/90"
            style={{ gridTemplateColumns: TREE_COLUMNS }}
          >
            <div className="pl-2">Title</div>
            <div>Type</div>
            <div>Status</div>
            <div className="pr-2">
              <div className="text-right">Period</div>
              {timelineBounds ? (
                <div className="relative mt-1 h-5 overflow-hidden rounded-md bg-muted/35 px-2 text-[10px] normal-case text-muted-foreground">
                  {weekMarkers.map((marker) => (
                    <span
                      className="absolute inset-y-0 w-px bg-border/45"
                      key={marker.dateKey}
                      style={{ left: marker.left }}
                    />
                  ))}
                  {todayLineStyle ? (
                    <span
                      className="absolute inset-y-0 w-px bg-primary/80"
                      style={todayLineStyle}
                    />
                  ) : null}
                  <div className="absolute inset-x-2 top-1 flex items-center justify-between">
                    <span>{formatShortDate(timelineBounds.start)}</span>
                    <span>{formatShortDate(timelineBounds.end)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          {visibleNodes.map(
            ({
              childCount,
              descendantPeriod,
              guideColumns,
              isLastSibling,
              node,
              depth,
              hasChildren,
            }) => {
              const isSelected = node.id === selectedId;
              const isExpanded = expandedIds.has(node.id);
              const due = dueState(node.dueDate);
              const periodStyle = getPeriodBarStyle(node, timelineBounds);
              const aggregateBarStyle = descendantPeriod
                ? getPeriodBarStyle(descendantPeriod, timelineBounds)
                : null;
              const isInvalidRange = isInvalidDateRange(node);
              const periodLabel =
                node.startDate || node.dueDate
                  ? formatPeriodLabel(node.startDate, node.dueDate)
                  : descendantPeriod
                    ? `子 ${formatPeriodLabel(
                        descendantPeriod.start,
                        descendantPeriod.end,
                      )}`
                    : "期間なし";
              return (
                <div
                  className={cn(
                    "group mb-1 grid h-11 items-center rounded-md border text-sm transition-colors",
                    isInvalidRange && "border-amber-300/70",
                    isSelected
                      ? "border-primary/70 bg-background"
                      : "border-transparent hover:bg-muted",
                  )}
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  style={{ gridTemplateColumns: TREE_COLUMNS }}
                >
                  <div className="relative flex min-w-0 items-center pl-2">
                    <IndentGuides
                      depth={depth}
                      guideColumns={guideColumns}
                      isLastSibling={isLastSibling}
                    />
                    <div
                      className="flex min-w-0 items-center"
                      style={{ marginLeft: depth * INDENT_STEP }}
                    >
                      <div
                        className={cn(
                          "flex h-7 shrink-0 items-center justify-center",
                          hasChildren ? "mr-2 w-7" : "mr-1 w-3",
                        )}
                      >
                        {hasChildren ? (
                          <button
                            aria-label={isExpanded ? "折りたたみ" : "展開"}
                            className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleExpanded(node.id);
                            }}
                            type="button"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="h-7 w-3" />
                        )}
                      </div>
                      <button
                        className={cn(
                          "min-w-0 truncate rounded-md px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected && "bg-accent",
                        )}
                        data-node-focus-id={node.id}
                        type="button"
                      >
                        <span className="font-medium">{node.title}</span>
                        {hasChildren ? (
                          <span className="ml-2 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {childCount}
                          </span>
                        ) : null}
                      </button>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "justify-self-start px-1.5 py-0 text-[11px]",
                      typeBadgeClass(node.type),
                    )}
                  >
                    {node.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "justify-self-start px-1.5 py-0 text-[11px]",
                      statusBadgeClass(node.status),
                    )}
                  >
                    {node.status}
                  </Badge>
                  <div className="mr-2 min-w-0">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      {isInvalidRange ? (
                        <span className="text-[10px] font-medium text-amber-800">
                          日付逆転
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/70">
                          {descendantPeriod && !node.startDate && !node.dueDate
                            ? "子期間"
                            : hasChildren && descendantPeriod
                              ? "親+子"
                              : "期間"}
                        </span>
                      )}
                      <span
                        className={cn(
                          "truncate text-[10px] font-medium",
                          isInvalidRange
                            ? "text-amber-800"
                            : due.textClassName,
                        )}
                        title={periodLabel}
                      >
                        {periodLabel}
                      </span>
                    </div>
                    <TimelineTrack
                      aggregateBarStyle={aggregateBarStyle}
                      barClassName={due.barClassName}
                      barStyle={periodStyle}
                      boundsLabel={periodLabel}
                      isInvalidRange={isInvalidRange}
                      todayLineStyle={todayLineStyle}
                      weekMarkers={weekMarkers}
                    />
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
