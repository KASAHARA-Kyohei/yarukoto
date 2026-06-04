import type { ReactNode } from "react";
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
  type TimelineMarker,
  type TimelineMode,
} from "@/domain/nodes/period";
import type { PeriodRange, YarukotoNode } from "@/domain/nodes/types";

function TrackMarkers({ markers }: { markers: TimelineMarker[] }) {
  return (
    <>
      {markers.map((marker) => (
        <span
          className={cn(
            "absolute inset-y-0 w-px",
            marker.kind === "week" ? "bg-border/35" : "bg-border/50",
          )}
          key={marker.dateKey}
          style={{ left: marker.left }}
        />
      ))}
    </>
  );
}

function TimelineRail({ children }: { children: ReactNode }) {
  return <div className="absolute inset-y-0 inset-x-2">{children}</div>;
}

function TruncationMarks({
  barClassName,
  side,
  top,
}: {
  barClassName: string;
  side: "left" | "right";
  top: number;
}) {
  return (
    <span
      className={cn(
        "absolute z-10 flex gap-[2px]",
        side === "left" ? "left-0 pl-[1px]" : "right-0 pr-[1px]",
      )}
      style={{ top }}
    >
      <span
        className={cn(
          "h-2 w-px rotate-[25deg] rounded-full",
          barClassName,
          side === "right" && "-rotate-[25deg]",
        )}
      />
      <span
        className={cn(
          "h-2 w-px rotate-[25deg] rounded-full",
          barClassName,
          side === "right" && "-rotate-[25deg]",
        )}
      />
    </span>
  );
}

function TimelineTrack({
  aggregateBarStyle,
  barClassName,
  barStyle,
  boundsLabel,
  isInvalidRange,
  markers,
  todayLineStyle,
}: {
  aggregateBarStyle: PeriodBarStyle | null;
  barClassName: string;
  barStyle: PeriodBarStyle | null;
  boundsLabel: string;
  isInvalidRange: boolean;
  markers: TimelineMarker[];
  todayLineStyle: TimelineLineStyle | null;
}) {
  const effectiveBarClassName = isInvalidRange ? "bg-amber-500" : barClassName;

  return (
    <div className="relative h-6 overflow-hidden rounded-md bg-muted/55">
      <TimelineRail>
        <TrackMarkers markers={markers} />
        {todayLineStyle ? (
          <span
            aria-label="today"
            className="absolute inset-y-0 z-[1] w-px bg-primary/80"
            style={todayLineStyle}
          />
        ) : null}
        {aggregateBarStyle ? (
          <>
            <div
              aria-label={`${boundsLabel} children`}
              className="absolute top-3.5 h-1 rounded-full bg-foreground/18"
              style={aggregateBarStyle}
            />
            {aggregateBarStyle.truncatedLeft ? (
              <TruncationMarks
                barClassName="bg-foreground/25"
                side="left"
                top={14}
              />
            ) : null}
            {aggregateBarStyle.truncatedRight ? (
              <TruncationMarks
                barClassName="bg-foreground/25"
                side="right"
                top={14}
              />
            ) : null}
          </>
        ) : null}
        {barStyle ? (
          <>
            <div
              aria-label={boundsLabel}
              className={cn(
                "absolute top-1.5 h-2 rounded-full shadow-[inset_0_-1px_0_rgba(255,255,255,0.18)]",
                effectiveBarClassName,
              )}
              style={barStyle}
            />
            <span
              className={cn(
                "absolute top-2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-background shadow-sm",
                effectiveBarClassName,
              )}
              style={{ left: barStyle.endMarkerLeft }}
            />
            {barStyle.truncatedLeft ? (
              <TruncationMarks
                barClassName={effectiveBarClassName}
                side="left"
                top={4}
              />
            ) : null}
            {barStyle.truncatedRight ? (
              <TruncationMarks
                barClassName={effectiveBarClassName}
                side="right"
                top={4}
              />
            ) : null}
          </>
        ) : null}
      </TimelineRail>
    </div>
  );
}

function TimelineLabels({
  markers,
}: {
  markers: TimelineMarker[];
}) {
  return (
    <>
      {markers
        .filter((marker) => marker.label)
        .map((marker) => (
          <span
            className={cn(
              "absolute top-0.5 -translate-x-1/2 whitespace-nowrap text-[9px]",
              marker.kind === "quarter"
                ? "font-semibold text-foreground/75"
                : "text-muted-foreground/80",
            )}
            key={`${marker.dateKey}-${marker.kind}`}
            style={{ left: marker.left }}
          >
            {marker.label}
          </span>
        ))}
    </>
  );
}

export function TreePeriodHeader({
  markers,
  timelineBounds,
  timelineMode,
  todayLineStyle,
}: {
  markers: TimelineMarker[];
  timelineBounds: PeriodBounds | null;
  timelineMode: TimelineMode | null;
  todayLineStyle: TimelineLineStyle | null;
}) {
  return (
    <div className="pr-2">
      {timelineBounds ? (
        <div className="relative h-7 overflow-hidden rounded-md bg-muted/25 text-[10px] normal-case text-muted-foreground/90">
          <TimelineRail>
            <TrackMarkers markers={markers} />
            {todayLineStyle ? (
              <span
                className="absolute inset-y-0 z-[1] w-px bg-primary/80"
                style={todayLineStyle}
              />
            ) : null}
            {timelineMode === "medium" || timelineMode === "long" || timelineMode === "xlong" ? (
              <TimelineLabels markers={markers} />
            ) : null}
          </TimelineRail>
          <div className="absolute inset-x-2 bottom-0.5 flex items-center justify-between">
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
  markers,
  node,
  timelineBounds,
  todayLineStyle,
}: {
  descendantPeriod: PeriodRange | null;
  markers: TimelineMarker[];
  node: Pick<YarukotoNode, "dueDate" | "startDate">;
  timelineBounds: PeriodBounds | null;
  todayLineStyle: TimelineLineStyle | null;
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
        ? formatPeriodLabel(descendantPeriod.start, descendantPeriod.end)
        : null;

  return (
    <div className="mr-2 min-w-0">
      <div className="mb-0.5 flex min-h-4 items-center justify-end gap-2">
        {isInvalidRange ? (
          <span className="text-[10px] font-medium text-amber-800">
            日付逆転
          </span>
        ) : null}
        {periodLabel ? (
          <span
            className={cn(
              "truncate text-[10px] font-medium",
              isInvalidRange ? "text-amber-800" : due.textClassName,
            )}
            title={periodLabel}
          >
            {periodLabel}
          </span>
        ) : null}
      </div>
      <TimelineTrack
        aggregateBarStyle={aggregateBarStyle}
        barClassName={due.barClassName}
        barStyle={periodStyle}
        boundsLabel={periodLabel ?? "timeline"}
        isInvalidRange={isInvalidRange}
        markers={markers}
        todayLineStyle={todayLineStyle}
      />
    </div>
  );
}
