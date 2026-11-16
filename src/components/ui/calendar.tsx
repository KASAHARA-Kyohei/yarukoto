import { useLanguage } from "@/app/LanguageProvider";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getMonthLabel, toDateKey } from "@/utils/date";

export function Calendar({
  month,
  onChangeMonth,
  onSelectDate,
  selectedDate,
}: {
  month: Date;
  onChangeMonth: (month: Date) => void;
  onSelectDate: (dateKey: string) => void;
  selectedDate: string | null;
}) {
  const { language, t } = useLanguage();
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const todayKey = toDateKey(new Date());
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  const moveMonth = (amount: number) => {
    onChangeMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };

  return (
    <div className="w-[286px] p-3">
      <div className="mb-3 flex items-center justify-between">
        <Button
          aria-label={t.previousMonth}
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => moveMonth(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">{getMonthLabel(month, language)}</div>
        <Button
          aria-label={t.nextMonth}
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => moveMonth(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {t.weekdays.map((day) => (
          <div className="py-1" key={day}>
            {day}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const dateKey = toDateKey(date);
          const isCurrentMonth = date.getMonth() === month.getMonth();
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayKey;

          return (
            <button
              className={cn(
                "grid h-8 w-8 place-items-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                !isCurrentMonth && "text-muted-foreground/45",
                isToday && "border border-primary/40",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
