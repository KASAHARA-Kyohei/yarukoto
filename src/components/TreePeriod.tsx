import { cn } from "@/lib/utils";
import {
  formatPeriodLabel,
  formatShortDate,
  getDueState,
  getPeriodBarStyle,
  isInvalidDateRange,
  type PeriodBarStyle,
  type PeriodBounds,
  type TimelineLineStyle,
  type TimelineWeekMarker,
} from "@/domain/nodes/period";
import type { PeriodRange, YarukotoNode } from "@/domain/nodes/types";

function TimelineTrack({
  aggregateBarStyle,
  barClassName,
  barStyle,
  boundsLabel,
  isInvalidRange,
  todayLineStyle,
  weekMarkers,
}: {
  aggregateBarStyle: PeriodBarStyle | null;
  barClassName: string;
  barStyle: PeriodBarStyle | null;
  boundsLabel: string;
  isInvalidRange: boolean;
  todayLineStyle: TimelineLineStyle | null;
  weekMarkers: TimelineWeekMarker[];
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

export function TreePeriodHeader({
  timelineBounds,
  todayLineStyle,
  weekMarkers,
}: {
  timelineBounds: PeriodBounds | null;
  todayLineStyle: TimelineLineStyle | null;
  weekMarkers: TimelineWeekMarker[];
}) {
  return (
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
  );
}

export function TreePeriodCell({
  descendantPeriod,
  hasChildren,
  node,
  timelineBounds,
  todayLineStyle,
  weekMarkers,
}: {
  descendantPeriod: PeriodRange | null;
  hasChildren: boolean;
  node: Pick<YarukotoNode, "dueDate" | "startDate">;
  timelineBounds: PeriodBounds | null;
  todayLineStyle: TimelineLineStyle | null;
  weekMarkers: TimelineWeekMarker[];
}) {
  const due = getDueState(node.dueDate);
  const periodStyle = getPeriodBarStyle(node, timelineBounds);
  const aggregateBarStyle = descendantPeriod
    ? getPeriodBarStyle(descendantPeriod, timelineBounds)
    : null;
  const isInvalidRange = isInvalidDateRange(node);
  const periodLabel =
    node.startDate || node.dueDate
      ? formatPeriodLabel(node.startDate, node.dueDate)
      : descendantPeriod
        ? `子 ${formatPeriodLabel(descendantPeriod.start, descendantPeriod.end)}`
        : "期間なし";
  const periodHint =
    descendantPeriod && !node.startDate && !node.dueDate
      ? "子期間"
      : hasChildren && descendantPeriod
        ? "親+子"
        : "期間";

  return (
    <div className="mr-2 min-w-0">
      <div className="mb-1 flex items-center justify-between gap-2">
        {isInvalidRange ? (
          <span className="text-[10px] font-medium text-amber-800">
            日付逆転
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/70">
            {periodHint}
          </span>
        )}
        <span
          className={cn(
            "truncate text-[10px] font-medium",
            isInvalidRange ? "text-amber-800" : due.textClassName,
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
  );
}
