import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";
import { CalendarIcon, X } from "lucide-react";
import type { DateEditMode } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { parseDateKey, toDateKey } from "@/utils/date";

function formatDateLabel(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日`;
}

export function DatePicker({
  calendarCursorDate,
  clearLabel = "日付を削除",
  error,
  mode,
  onCancelTextEdit,
  onClear,
  onCommitTextEdit,
  onDraftValueChange,
  onOpenChange,
  onSelectDate,
  placeholder = "日付なし",
  textInputValue,
  triggerRef,
  value,
}: {
  calendarCursorDate: string | null;
  clearLabel?: string;
  error?: string | null;
  mode: DateEditMode | null;
  onCancelTextEdit: () => void;
  onClear: () => void;
  onCommitTextEdit: () => void;
  onDraftValueChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  onSelectDate: (dateKey: string) => void;
  placeholder?: string;
  textInputValue: string;
  triggerRef?: RefObject<HTMLButtonElement | null>;
  value: string | null;
}) {
  const [month, setMonth] = useState(() =>
    parseDateKey(calendarCursorDate ?? value ?? toDateKey(new Date())),
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isCalendarOpen = mode === "calendar";
  const isTextEditing = mode === "text";
  const displayedDate = calendarCursorDate ?? value;

  useEffect(() => {
    const activeDate = calendarCursorDate ?? value;
    if (activeDate) {
      setMonth(parseDateKey(activeDate));
      return;
    }
    setMonth(new Date());
  }, [calendarCursorDate, value]);

  useEffect(() => {
    if (!isTextEditing) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isTextEditing]);

  const handleTextKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommitTextEdit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      onCancelTextEdit();
    }
  };

  return (
    <div className="grid gap-1.5">
      <div className="flex gap-2">
        {isTextEditing ? (
          <Input
            className="flex-1"
            data-keyboard-editing="true"
            placeholder="YYYY-MM-DD"
            ref={inputRef}
            value={textInputValue}
            onBlur={onCancelTextEdit}
            onChange={(event) => onDraftValueChange(event.currentTarget.value)}
            onKeyDown={handleTextKeyDown}
          />
        ) : (
          <Popover open={isCalendarOpen} onOpenChange={onOpenChange}>
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
                selectedDate={displayedDate}
                onChangeMonth={setMonth}
                onSelectDate={onSelectDate}
              />
            </PopoverContent>
          </Popover>
        )}
        {value || isTextEditing ? (
          <Button
            aria-label={clearLabel}
            size="icon"
            type="button"
            variant="ghost"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      {error ? (
        <div className="text-xs text-destructive">{error}</div>
      ) : null}
    </div>
  );
}
