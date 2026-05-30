import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseDateKey } from "@/utils/date";

function formatDateLabel(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日`;
}

export function DatePicker({
  clearLabel = "日付を削除",
  onChange,
  placeholder = "日付なし",
  triggerRef,
  value,
}: {
  clearLabel?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  value: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(() => (value ? parseDateKey(value) : new Date()));

  useEffect(() => {
    if (value) {
      setMonth(parseDateKey(value));
    }
  }, [value]);

  return (
    <div className="flex gap-2" data-keyboard-editing="true">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "min-w-0 flex-1 justify-start overflow-hidden px-3 font-normal",
              !value && "text-muted-foreground",
            )}
            ref={triggerRef}
            type="button"
            variant="outline"
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {value ? formatDateLabel(value) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <Calendar
            month={month}
            selectedDate={value}
            onChangeMonth={setMonth}
            onSelectDate={(dateKey) => {
              onChange(dateKey);
              setIsOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value ? (
        <Button
          aria-label={clearLabel}
          size="icon"
          type="button"
          variant="ghost"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
