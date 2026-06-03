import { useCallback, useState } from "react";
import {
  addDaysToDateKey,
  addMonthsToDateKey,
  getInitialDateKey,
  parseDateInput,
} from "@/app/dateEditing";
import type { DateEditMode, DateField, DetailField } from "@/app/types";
import { isDateField } from "@/app/types";
import type { UpdateNodeInput, YarukotoNode } from "@/domain/nodes/types";

export function useDateEditingState({
  activeDetailField,
  selectedNode,
  updateSelected,
}: {
  activeDetailField: DetailField;
  selectedNode: YarukotoNode | null;
  updateSelected: (patch: UpdateNodeInput) => void | Promise<void>;
}) {
  const [activeDateField, setActiveDateField] = useState<DateField | null>(
    null,
  );
  const [dateEditMode, setDateEditMode] = useState<DateEditMode | null>(null);
  const [dateDraftValue, setDateDraftValue] = useState("");
  const [dateInputError, setDateInputError] = useState<string | null>(null);
  const [calendarCursorDate, setCalendarCursorDate] = useState<string | null>(
    null,
  );

  const getDateFieldValue = useCallback(
    (field: DateField) => {
      if (!selectedNode) {
        return null;
      }
      return field === "startDate"
        ? selectedNode.startDate
        : selectedNode.dueDate;
    },
    [selectedNode],
  );

  const updateDateField = useCallback(
    (field: DateField, value: string | null) => {
      void updateSelected(
        field === "startDate" ? { startDate: value } : { dueDate: value },
      );
    },
    [updateSelected],
  );

  const resetDateInteraction = useCallback(() => {
    setActiveDateField(null);
    setDateEditMode(null);
    setDateDraftValue("");
    setDateInputError(null);
    setCalendarCursorDate(null);
  }, []);

  const openDatePicker = useCallback(
    (field: DateField) => {
      const currentValue = getDateFieldValue(field);
      setActiveDateField(field);
      setDateEditMode("calendar");
      setDateDraftValue(currentValue ?? "");
      setDateInputError(null);
      setCalendarCursorDate(getInitialDateKey(currentValue));
    },
    [getDateFieldValue],
  );

  const closeDatePicker = useCallback(() => {
    if (dateEditMode === "calendar") {
      resetDateInteraction();
    }
  }, [dateEditMode, resetDateInteraction]);

  const openDateTextEdit = useCallback(
    (field: DateField) => {
      const currentValue = getDateFieldValue(field);
      setActiveDateField(field);
      setDateEditMode("text");
      setDateDraftValue(currentValue ?? "");
      setDateInputError(null);
      setCalendarCursorDate(null);
    },
    [getDateFieldValue],
  );

  const cancelDateTextEdit = useCallback(() => {
    if (dateEditMode === "text") {
      resetDateInteraction();
    }
  }, [dateEditMode, resetDateInteraction]);

  const moveCalendarCursorByDays = useCallback((amount: number) => {
    setCalendarCursorDate((currentValue) =>
      addDaysToDateKey(getInitialDateKey(currentValue), amount),
    );
  }, []);

  const moveCalendarCursorByMonths = useCallback((amount: number) => {
    setCalendarCursorDate((currentValue) =>
      addMonthsToDateKey(getInitialDateKey(currentValue), amount),
    );
  }, []);

  const moveCalendarCursorToToday = useCallback(() => {
    setCalendarCursorDate(getInitialDateKey(null));
  }, []);

  const commitCalendarDate = useCallback(() => {
    if (!activeDateField) {
      return;
    }
    updateDateField(activeDateField, getInitialDateKey(calendarCursorDate));
    resetDateInteraction();
  }, [
    activeDateField,
    calendarCursorDate,
    resetDateInteraction,
    updateDateField,
  ]);

  const commitDateTextEdit = useCallback(() => {
    if (!activeDateField) {
      return;
    }
    const result = parseDateInput(dateDraftValue);
    if (result.error) {
      setDateInputError(result.error);
      return;
    }
    updateDateField(activeDateField, result.value);
    resetDateInteraction();
  }, [activeDateField, dateDraftValue, resetDateInteraction, updateDateField]);

  const clearDateField = useCallback(
    (field: DateField) => {
      updateDateField(field, null);
      if (activeDateField === field) {
        resetDateInteraction();
      }
    },
    [activeDateField, resetDateInteraction, updateDateField],
  );

  const clearActiveDate = useCallback(() => {
    if (!isDateField(activeDetailField)) {
      return;
    }
    clearDateField(activeDetailField);
  }, [activeDetailField, clearDateField]);

  const handleDateOpenChange = useCallback(
    (field: DateField, open: boolean) => {
      if (open) {
        openDatePicker(field);
        return;
      }
      if (activeDateField === field && dateEditMode === "calendar") {
        resetDateInteraction();
      }
    },
    [activeDateField, dateEditMode, openDatePicker, resetDateInteraction],
  );

  const handleDateSelect = useCallback(
    (field: DateField, dateKey: string) => {
      updateDateField(field, dateKey);
      resetDateInteraction();
    },
    [resetDateInteraction, updateDateField],
  );

  return {
    activeDateField,
    calendarCursorDate,
    cancelDateTextEdit,
    clearActiveDate,
    clearDateField,
    closeDatePicker,
    commitCalendarDate,
    commitDateTextEdit,
    dateDraftValue,
    dateEditMode,
    dateInputError,
    handleDateOpenChange,
    handleDateSelect,
    moveCalendarCursorByDays,
    moveCalendarCursorByMonths,
    moveCalendarCursorToToday,
    openDatePicker,
    openDateTextEdit,
    resetDateInteraction,
    setDateDraftValue,
  };
}
