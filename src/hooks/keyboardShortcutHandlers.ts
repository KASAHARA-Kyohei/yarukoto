import {
  type ActivePane,
  type DateField,
  type DetailField,
  type DetailSelectField,
  isDateField,
} from "@/app/types";

type ShortcutAction = () => void | Promise<unknown>;
export type RunShortcut = (action: ShortcutAction) => void;

export function handleDateTextShortcut({
  key,
  run,
  commitDateTextEdit,
  cancelDateTextEdit,
}: {
  key: string;
  run: RunShortcut;
  commitDateTextEdit: () => void;
  cancelDateTextEdit: () => void;
}) {
  switch (key) {
    case "Enter":
      run(commitDateTextEdit);
      break;
    case "Escape":
      run(cancelDateTextEdit);
      break;
  }
  return true;
}

export function handleDatePickerShortcut({
  key,
  run,
  closeDatePicker,
  commitCalendarDate,
  moveCalendarCursorByDays,
  moveCalendarCursorByMonths,
  moveCalendarCursorToToday,
}: {
  key: string;
  run: RunShortcut;
  closeDatePicker: () => void;
  commitCalendarDate: () => void;
  moveCalendarCursorByDays: (amount: number) => void;
  moveCalendarCursorByMonths: (amount: number) => void;
  moveCalendarCursorToToday: () => void;
}) {
  switch (key) {
    case "h":
      run(() => moveCalendarCursorByDays(-1));
      break;
    case "l":
      run(() => moveCalendarCursorByDays(1));
      break;
    case "j":
      run(() => moveCalendarCursorByDays(7));
      break;
    case "k":
      run(() => moveCalendarCursorByDays(-7));
      break;
    case "H":
      run(() => moveCalendarCursorByMonths(-1));
      break;
    case "L":
      run(() => moveCalendarCursorByMonths(1));
      break;
    case "t":
      run(moveCalendarCursorToToday);
      break;
    case "Enter":
      run(commitCalendarDate);
      break;
    case "Escape":
      run(closeDatePicker);
      break;
  }
  return true;
}

export function handleDetailSelectShortcut({
  key,
  run,
  closeDetailSelect,
  commitOpenDetailSelect,
  moveOpenDetailSelect,
}: {
  key: string;
  run: RunShortcut;
  closeDetailSelect: () => void;
  commitOpenDetailSelect: () => void;
  moveOpenDetailSelect: (direction: 1 | -1) => void;
}) {
  switch (key) {
    case "j":
      run(() => moveOpenDetailSelect(1));
      break;
    case "k":
      run(() => moveOpenDetailSelect(-1));
      break;
    case "Enter":
      run(commitOpenDetailSelect);
      break;
    case "Escape":
      run(closeDetailSelect);
      break;
  }
  return true;
}

export function handleDetailDialogShortcut({
  activeDetailField,
  key,
  run,
  clearActiveDate,
  cycleStatusValue,
  cycleTypeValue,
  focusActiveDetailField,
  focusDetailField,
  moveDetailField,
  onCloseDetailDialog,
  openDatePicker,
  openDateTextEdit,
  openDetailSelect,
}: {
  activeDetailField: DetailField;
  key: string;
  run: RunShortcut;
  clearActiveDate: () => void;
  cycleStatusValue: (direction: 1 | -1) => void;
  cycleTypeValue: (direction: 1 | -1) => void;
  focusActiveDetailField: () => void;
  focusDetailField: (field: DetailField) => void;
  moveDetailField: (direction: 1 | -1) => void;
  onCloseDetailDialog: () => void;
  openDatePicker: (field: DateField) => void;
  openDateTextEdit: (field: DateField) => void;
  openDetailSelect: (field: DetailSelectField) => void;
}) {
  switch (key) {
    case "j":
      run(() => moveDetailField(1));
      break;
    case "k":
      run(() => moveDetailField(-1));
      break;
    case "h":
      if (activeDetailField === "type") {
        run(() => cycleTypeValue(-1));
      } else if (activeDetailField === "status") {
        run(() => cycleStatusValue(-1));
      }
      break;
    case "l":
      if (activeDetailField === "type") {
        run(() => cycleTypeValue(1));
      } else if (activeDetailField === "status") {
        run(() => cycleStatusValue(1));
      }
      break;
    case "i":
      if (isDateField(activeDetailField)) {
        run(() => openDateTextEdit(activeDetailField));
      } else {
        run(focusActiveDetailField);
      }
      break;
    case "Enter":
      if (activeDetailField === "type" || activeDetailField === "status") {
        run(() => {
          focusDetailField(activeDetailField);
          openDetailSelect(activeDetailField);
        });
      } else if (isDateField(activeDetailField)) {
        run(() => {
          focusDetailField(activeDetailField);
          openDatePicker(activeDetailField);
        });
      } else {
        run(focusActiveDetailField);
      }
      break;
    case "x":
      if (isDateField(activeDetailField)) {
        run(clearActiveDate);
      }
      break;
    case "Escape":
      run(onCloseDetailDialog);
      break;
  }
  return true;
}

export function handleProjectsShortcut({
  key,
  run,
  createRootInProjects,
  moveRootSelection,
  setActivePane,
}: {
  key: string;
  run: RunShortcut;
  createRootInProjects: () => Promise<unknown>;
  moveRootSelection: (direction: 1 | -1) => void;
  setActivePane: (pane: ActivePane) => void;
}) {
  switch (key) {
    case "j":
      run(() => moveRootSelection(1));
      break;
    case "k":
      run(() => moveRootSelection(-1));
      break;
    case "l":
    case "Enter":
      run(() => setActivePane("center"));
      break;
    case "o":
      run(createRootInProjects);
      break;
    case "Escape":
      run(() => setActivePane("center"));
      break;
  }
  return true;
}

export function handleCalendarViewShortcut({
  key,
  run,
  onOpenDetailDialog,
  resetCalendarMonthToToday,
}: {
  key: string;
  run: RunShortcut;
  onOpenDetailDialog: () => void;
  resetCalendarMonthToToday: () => void;
}) {
  switch (key) {
    case "i":
    case "Enter":
      run(onOpenDetailDialog);
      break;
    case "t":
      run(resetCalendarMonthToToday);
      break;
  }
  return true;
}

export function handleReportViewShortcut({
  key,
  run,
  onOpenDetailDialog,
}: {
  key: string;
  run: RunShortcut;
  onOpenDetailDialog: () => void;
}) {
  switch (key) {
    case "i":
    case "Enter":
      run(onOpenDetailDialog);
      break;
  }
  return true;
}

export function handleTreeViewShortcut({
  key,
  run,
  createChild,
  createSiblingBelow,
  deleteSelected,
  handleH,
  handleL,
  indentSelected,
  moveSelectedDown,
  moveSelectedUp,
  moveSelection,
  onCopyLlmReview,
  onCloseDetailDialog,
  onOpenDetailDialog,
  onOpenLlmImport,
  outdentSelected,
  registerDeleteKey,
}: {
  key: string;
  run: RunShortcut;
  createChild: () => Promise<unknown>;
  createSiblingBelow: () => Promise<unknown>;
  deleteSelected: () => Promise<unknown>;
  handleH: () => void;
  handleL: () => void;
  indentSelected: () => Promise<void>;
  moveSelectedDown: () => Promise<void>;
  moveSelectedUp: () => Promise<void>;
  moveSelection: (direction: 1 | -1) => void;
  onCopyLlmReview: () => Promise<void>;
  onCloseDetailDialog: () => void;
  onOpenDetailDialog: () => void;
  onOpenLlmImport: () => Promise<void>;
  outdentSelected: () => Promise<void>;
  registerDeleteKey: () => boolean;
}) {
  switch (key) {
    case "j":
      run(() => moveSelection(1));
      break;
    case "k":
      run(() => moveSelection(-1));
      break;
    case "h":
      run(handleH);
      break;
    case "l":
      run(handleL);
      break;
    case "i":
    case "Enter":
      run(onOpenDetailDialog);
      break;
    case "a":
      run(createChild);
      break;
    case "o":
      run(createSiblingBelow);
      break;
    case "y":
      run(onCopyLlmReview);
      break;
    case "p":
      run(onOpenLlmImport);
      break;
    case "d":
      if (registerDeleteKey()) {
        run(deleteSelected);
      }
      break;
    case "J":
      run(moveSelectedDown);
      break;
    case "K":
      run(moveSelectedUp);
      break;
    case ">":
      run(indentSelected);
      break;
    case "<":
      run(outdentSelected);
      break;
    case "Escape":
      run(onCloseDetailDialog);
      break;
  }
  return true;
}
