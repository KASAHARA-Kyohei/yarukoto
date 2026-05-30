import type { YarukotoNode } from "../types";
import { statusBadgeClass, typeBadgeClass } from "@/nodeAppearance";
import { getMonthLabel, toDateKey } from "../utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const todayKey = toDateKey(new Date());
  const nodesByDate = new Map<string, YarukotoNode[]>();

  for (const node of nodes) {
    if (!node.dueDate) {
      continue;
    }
    const items = nodesByDate.get(node.dueDate) ?? [];
    items.push(node);
    nodesByDate.set(node.dueDate, items);
  }

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const moveMonth = (amount: number) => {
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/70 px-4 py-3">
        <Button
          variant="outline"
          onClick={() => moveMonth(-1)}
          type="button"
        >
          前月
        </Button>
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-semibold tracking-wide">{getMonthLabel(month)}</h2>
          <span className="text-xs text-muted-foreground">{nodes.length} scheduled</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onChangeMonth(new Date())}
            type="button"
          >
            今日
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={() => moveMonth(1)}
          type="button"
        >
          翌月
        </Button>
      </div>
      <div className="grid grid-cols-7 border-b border-border bg-card text-center text-xs font-semibold uppercase text-muted-foreground">
        {WEEK_DAYS.map((day) => (
          <div className="border-r border-border/70 py-3 last:border-r-0" key={day}>
            {day}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[repeat(6,minmax(118px,1fr))] overflow-auto p-3">
        {days.map((date) => {
          const dateKey = toDateKey(date);
          const dayNodes = nodesByDate.get(dateKey) ?? [];
          const isCurrentMonth = date.getMonth() === month.getMonth();
          const isToday = dateKey === todayKey;

          return (
            <div
              className={cn(
                "min-h-[118px] border-b border-r border-border/70 p-2.5 shadow-sm first:rounded-tl last:rounded-br",
                isCurrentMonth ? "bg-card" : "bg-muted/60 text-muted-foreground",
              )}
              key={dateKey}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-sm font-semibold",
                    isToday ? "bg-primary text-primary-foreground" : "",
                  )}
                >
                  {date.getDate()}
                </span>
                {dayNodes.length > 0 ? (
                  <Badge variant="secondary" className="h-5 px-2 text-[11px]">
                    {dayNodes.length}
                  </Badge>
                ) : null}
              </div>
              <div className="max-h-[calc(100%-2.25rem)] space-y-1 overflow-y-auto pr-1">
                {dayNodes.slice(0, 6).map((node) => (
                  <button
                    className={cn(
                      "block w-full truncate rounded-md border px-2 py-1.5 text-left text-xs leading-tight shadow-sm transition-colors",
                      selectedId === node.id
                        ? "border-primary bg-accent text-accent-foreground"
                        : statusBadgeClass(node.status),
                    )}
                    data-node-focus-id={node.id}
                    key={node.id}
                    onClick={() => onSelectNode(node.id)}
                    title={node.title}
                    type="button"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={cn("h-4 px-1 text-[10px]", typeBadgeClass(node.type))}
                      >
                        {node.type}
                      </Badge>
                      <span className="font-semibold">{node.status}</span>
                    </span>
                    <span className="ml-1">{node.title}</span>
                  </button>
                ))}
                {dayNodes.length > 6 ? (
                  <div className="px-1 text-[11px] text-muted-foreground">
                    +{dayNodes.length - 6}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
