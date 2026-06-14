import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildCalendarMonthModel } from "@/domain/nodes/calendar";
import type { YarukotoNode } from "@/domain/nodes/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMonthLabel } from "@/utils/date";
import { CalendarWeekRow } from "./CalendarViewItems";

const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];

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
            {nodes.length}件 ・ H / L で前後移動
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

          {model.weeks.map((week) => (
            <CalendarWeekRow
              key={week.index}
              overflowByDate={model.singleDayOverflowByDate}
              rangeSegments={model.rangeSegmentsByWeek.get(week.index) ?? []}
              selectedId={selectedId}
              singleDayItemsByDate={model.singleDayItemsByDate}
              week={week}
              onSelectNode={onSelectNode}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
