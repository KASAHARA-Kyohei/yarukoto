import { useLanguage } from "@/app/LanguageProvider";
import type { TaskProgressInfo } from "@/domain/nodes/progress";
import { cn } from "@/lib/utils";

function getProgressBarClassName(value: number) {
  if (value >= 100) {
    return "bg-emerald-500";
  }
  if (value > 0) {
    return "bg-amber-500";
  }
  return "bg-slate-400";
}

function getProgressWidth(value: number) {
  if (value <= 0) {
    return "0%";
  }
  return `${Math.max(value, 4)}%`;
}

export function TaskProgressInline({
  progress,
}: {
  progress: TaskProgressInfo | null;
}) {
  if (!progress) {
    return <div className="h-6" />;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="w-9 shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
        {progress.value}%
      </span>
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", getProgressBarClassName(progress.value))}
          style={{ width: getProgressWidth(progress.value) }}
        />
      </div>
    </div>
  );
}

export function TaskProgressDetail({
  progress,
}: {
  progress: TaskProgressInfo | null;
}) {
  const { t } = useLanguage();
  if (!progress) {
    return null;
  }

  return (
    <div className="grid gap-1.5 text-sm font-medium">
      <span>progress</span>
      <div className="rounded-md border border-border/70 bg-muted/25 px-3 py-2">
        <TaskProgressInline progress={progress} />
        <div className="mt-1 text-xs font-normal text-muted-foreground">
          {progress.source === "children-average"
            ? t.progressFromChildren(progress.childTaskCount)
            : t.progressFromStatus}
        </div>
      </div>
    </div>
  );
}
