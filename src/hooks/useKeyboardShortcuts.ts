import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  DETAIL_FIELDS,
  type ActivePane,
  type CenterView,
  type DateField,
  type DetailField,
  type DetailSelectField,
  isDateField,
} from "@/app/types";
import { getChildren } from "@/domain/nodes/tree";
import {
  type FlatTreeNode,
  type YarukotoNode,
} from "@/domain/nodes/types";

export function isEditableTagName(tagName: string) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.closest("[data-keyboard-editing='true']")) {
    return true;
  }
  return isEditableTagName(target.tagName);
}

export function getNextPane(activePane: ActivePane, direction: 1 | -1) {
  const panes: ActivePane[] = ["projects", "center"];
  const index = panes.indexOf(activePane);
  const nextIndex = Math.min(panes.length - 1, Math.max(0, index + direction));
  return panes[nextIndex];
}

export function getNextCenterView(activeView: CenterView, direction: 1 | -1) {
  const views: CenterView[] = ["tree", "calendar", "report"];
  const index = views.indexOf(activeView);
  const nextIndex = (index + direction + views.length) % views.length;
  return views[nextIndex];
}

export function getNextDetailField(
  activeDetailField: DetailField,
  direction: 1 | -1,
) {
  const index = DETAIL_FIELDS.indexOf(activeDetailField);
  const nextIndex = Math.min(
    DETAIL_FIELDS.length - 1,
    Math.max(0, index + direction),
  );
  return DETAIL_FIELDS[nextIndex];
}

export function useKeyboardShortcuts({
  activeDateField,
  activeDetailField,
  activePane,
  centerView,
  cancelDateTextEdit,
  clearActiveDate,
  closeDatePicker,
  closeDetailSelect,
  commitCalendarDate,
  commitDateTextEdit,
  commitOpenDetailSelect,
  cycleStatusValue,
  cycleTypeValue,
  createChild,
  createRootAndEdit,
  createRootInProjects,
  createSiblingBelow,
  deleteSelected,
  detailFieldRefs,
  expandedIds,
  indentSelected,
  isDetailDialogOpen,
  isDatePickerOpen,
  isDateTextEditing,
  isFocusHintOpen,
  isMutating,
  isShortcutHelpOpen,
  moveCalendarCursorByDays,
  moveCalendarCursorByMonths,
  moveCalendarCursorToToday,
  moveCalendarMonth,
  moveCenterView,
  moveOpenDetailSelect,
  moveSelectedDown,
  moveSelectedUp,
  nodes,
  openDatePicker,
  openDateTextEdit,
  openDetailSelect,
  openDetailSelectField,
  outdentSelected,
  onCloseDetailDialog,
  onCloseShortcutHelp,
  onOpenDetailDialog,
  onOpenFocusHint,
  onOpenShortcutHelp,
  pendingUndoDelete,
  restorePendingDelete,
  roots,
  resetCalendarMonthToToday,
  selectNode,
  setActiveDetailField,
  setActivePane,
  selectedId,
  selectedNode,
  toggleExpanded,
  visibleNodes,
}: {
  activeDateField: DateField | null;
  activeDetailField: DetailField;
  activePane: ActivePane;
  centerView: CenterView;
  cancelDateTextEdit: () => void;
  clearActiveDate: () => void;
  closeDatePicker: () => void;
  closeDetailSelect: () => void;
  commitCalendarDate: () => void;
  commitDateTextEdit: () => void;
  commitOpenDetailSelect: () => void;
  cycleStatusValue: (direction: 1 | -1) => void;
  cycleTypeValue: (direction: 1 | -1) => void;
  createChild: () => Promise<unknown>;
  createRootAndEdit: () => Promise<unknown>;
  createRootInProjects: () => Promise<unknown>;
  createSiblingBelow: () => Promise<unknown>;
  deleteSelected: () => Promise<unknown>;
  detailFieldRefs: {
    dueDate: RefObject<HTMLButtonElement | null>;
    memo: RefObject<HTMLTextAreaElement | null>;
    startDate: RefObject<HTMLButtonElement | null>;
    status: RefObject<HTMLButtonElement | null>;
    title: RefObject<HTMLInputElement | null>;
    type: RefObject<HTMLButtonElement | null>;
  };
  expandedIds: Set<string>;
  indentSelected: () => Promise<void>;
  isDetailDialogOpen: boolean;
  isDatePickerOpen: boolean;
  isDateTextEditing: boolean;
  isFocusHintOpen: boolean;
  isMutating: boolean;
  isShortcutHelpOpen: boolean;
  moveCalendarCursorByDays: (amount: number) => void;
  moveCalendarCursorByMonths: (amount: number) => void;
  moveCalendarCursorToToday: () => void;
  moveCalendarMonth: (direction: 1 | -1) => void;
  moveCenterView: (direction: 1 | -1) => void;
  moveOpenDetailSelect: (direction: 1 | -1) => void;
  moveSelectedDown: () => Promise<void>;
  moveSelectedUp: () => Promise<void>;
  nodes: YarukotoNode[];
  openDatePicker: (field: DateField) => void;
  openDateTextEdit: (field: DateField) => void;
  openDetailSelect: (field: DetailSelectField) => void;
  openDetailSelectField: DetailSelectField | null;
  onCloseDetailDialog: () => void;
  onCloseShortcutHelp: () => void;
  onOpenDetailDialog: () => void;
  onOpenFocusHint: () => void;
  onOpenShortcutHelp: () => void;
  pendingUndoDelete: { title: string } | null;
  restorePendingDelete: () => Promise<unknown>;
  outdentSelected: () => Promise<void>;
  roots: YarukotoNode[];
  resetCalendarMonthToToday: () => void;
  selectNode: (nodeId: string) => void;
  setActiveDetailField: (field: DetailField) => void;
  setActivePane: (pane: ActivePane) => void;
  selectedId: string | null;
  selectedNode: YarukotoNode | null;
  toggleExpanded: (nodeId: string) => void;
  visibleNodes: FlatTreeNode[];
}) {
  const lastDRef = useRef(0);

  const blurActiveDialogElement = useCallback(() => {
    const activeElement = document.activeElement;
    if (
      activeElement instanceof HTMLElement &&
      activeElement.closest("[data-slot='dialog-content']")
    ) {
      activeElement.blur();
    }
  }, []);

  const movePane = useCallback(
    (direction: 1 | -1) => {
      setActivePane(getNextPane(activePane, direction));
    },
    [activePane, setActivePane],
  );

  const moveRootSelection = useCallback(
    (direction: 1 | -1) => {
      if (roots.length === 0) {
        return;
      }
      const currentIndex = roots.findIndex((root) => root.id === selectedId);
      const fallbackIndex = direction > 0 ? 0 : roots.length - 1;
      const nextIndex =
        currentIndex === -1
          ? fallbackIndex
          : Math.min(roots.length - 1, Math.max(0, currentIndex + direction));
      selectNode(roots[nextIndex].id);
    },
    [roots, selectNode, selectedId],
  );

  const moveDetailField = useCallback(
    (direction: 1 | -1) => {
      blurActiveDialogElement();
      setActiveDetailField(getNextDetailField(activeDetailField, direction));
    },
    [activeDetailField, blurActiveDialogElement, setActiveDetailField],
  );

  const focusActiveDetailField = useCallback(() => {
    const nextField = detailFieldRefs[activeDetailField].current;
    const activeElement = document.activeElement;

    if (
      activeElement instanceof HTMLElement &&
      activeElement !== nextField &&
      activeElement.closest("[data-slot='dialog-content']")
    ) {
      activeElement.blur();
    }

    nextField?.focus();
  }, [activeDetailField, detailFieldRefs]);

  const focusDetailField = useCallback(
    (field: DetailField) => {
      const nextField = detailFieldRefs[field].current;
      const activeElement = document.activeElement;

      if (
        activeElement instanceof HTMLElement &&
        activeElement !== nextField &&
        activeElement.closest("[data-slot='dialog-content']")
      ) {
        activeElement.blur();
      }

      nextField?.focus();
    },
    [detailFieldRefs],
  );

  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (!selectedId || visibleNodes.length === 0) {
        return;
      }
      const index = visibleNodes.findIndex(({ node }) => node.id === selectedId);
      const nextIndex = Math.min(
        visibleNodes.length - 1,
        Math.max(0, index + direction),
      );
      const nextNode = visibleNodes[nextIndex]?.node;
      if (nextNode) {
        selectNode(nextNode.id);
      }
    },
    [selectNode, selectedId, visibleNodes],
  );

  const handleH = useCallback(() => {
    if (!selectedNode) {
      return;
    }
    const children = getChildren(nodes, selectedNode.id);
    if (children.length > 0 && expandedIds.has(selectedNode.id)) {
      toggleExpanded(selectedNode.id);
      return;
    }
    if (selectedNode.parentId) {
      selectNode(selectedNode.parentId);
    }
  }, [expandedIds, nodes, selectNode, selectedNode, toggleExpanded]);

  const handleL = useCallback(() => {
    if (!selectedNode) {
      return;
    }
    const children = getChildren(nodes, selectedNode.id);
    if (children.length === 0) {
      return;
    }
    if (!expandedIds.has(selectedNode.id)) {
      toggleExpanded(selectedNode.id);
      return;
    }
    selectNode(children[0].id);
  }, [expandedIds, nodes, selectNode, selectedNode, toggleExpanded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isShortcutHelpOpen) {
        if (event.key === "Escape" || event.key === "?") {
          event.preventDefault();
          onCloseShortcutHelp();
        }
        return;
      }
      if (isFocusHintOpen) {
        return;
      }
      if (isEditableTarget(event.target)) {
        if (event.key === "Escape") {
          (event.target as HTMLElement).blur();
        }
        return;
      }
      if (isMutating) {
        return;
      }

      const run = (action: () => void | Promise<unknown>) => {
        event.preventDefault();
        void action();
      };

      if (event.key === "?") {
        run(onOpenShortcutHelp);
        return;
      }
      if (event.key === "f") {
        run(onOpenFocusHint);
        return;
      }
      if (event.key === "u" && pendingUndoDelete) {
        run(restorePendingDelete);
        return;
      }
      if (isDetailDialogOpen && isDateTextEditing) {
        switch (event.key) {
          case "Enter":
            run(commitDateTextEdit);
            break;
          case "Escape":
            run(cancelDateTextEdit);
            break;
        }
        return;
      }
      if (isDetailDialogOpen && isDatePickerOpen) {
        switch (event.key) {
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
        return;
      }
      if (isDetailDialogOpen && openDetailSelectField) {
        switch (event.key) {
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
        return;
      }
      if (isDetailDialogOpen) {
        switch (event.key) {
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
        return;
      }
      if (event.ctrlKey && event.key === "h") {
        if (activePane === "center" && centerView === "calendar") {
          run(() => moveCalendarMonth(-1));
        }
        return;
      }
      if (event.ctrlKey && event.key === "l") {
        if (activePane === "center" && centerView === "calendar") {
          run(() => moveCalendarMonth(1));
        }
        return;
      }
      if (event.ctrlKey && event.key === "Tab") {
        run(() => moveCenterView(event.shiftKey ? -1 : 1));
        return;
      }
      if (event.key === "Tab") {
        run(() => movePane(event.shiftKey ? -1 : 1));
        return;
      }
      if (event.key === "R" && activePane !== "projects") {
        run(createRootAndEdit);
        return;
      }

      if (event.key !== "d") {
        lastDRef.current = 0;
      }

      if (activePane === "projects") {
        switch (event.key) {
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
        return;
      }

      if (centerView === "calendar") {
        switch (event.key) {
          case "i":
          case "Enter":
            run(onOpenDetailDialog);
            break;
          case "t":
            run(resetCalendarMonthToToday);
            break;
        }
        return;
      }

      if (centerView === "report") {
        switch (event.key) {
          case "i":
          case "Enter":
            run(onOpenDetailDialog);
            break;
        }
        return;
      }

      switch (event.key) {
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
          run(onOpenDetailDialog);
          break;
        case "Enter":
          run(onOpenDetailDialog);
          break;
        case "a":
          run(createChild);
          break;
        case "o":
          run(createSiblingBelow);
          break;
        case "d": {
          const currentTime = Date.now();
          if (currentTime - lastDRef.current < 650) {
            run(deleteSelected);
            lastDRef.current = 0;
          } else {
            lastDRef.current = currentTime;
          }
          break;
        }
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
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeDateField,
    activeDetailField,
    activePane,
    centerView,
    cancelDateTextEdit,
    clearActiveDate,
    blurActiveDialogElement,
    closeDatePicker,
    closeDetailSelect,
    commitCalendarDate,
    commitDateTextEdit,
    commitOpenDetailSelect,
    cycleStatusValue,
    cycleTypeValue,
    createChild,
    createRootAndEdit,
    createRootInProjects,
    createSiblingBelow,
    deleteSelected,
    focusDetailField,
    focusActiveDetailField,
    handleH,
    handleL,
    indentSelected,
    isDetailDialogOpen,
    isDatePickerOpen,
    isDateTextEditing,
    isFocusHintOpen,
    isMutating,
    isShortcutHelpOpen,
    moveCalendarCursorByDays,
    moveCalendarCursorByMonths,
    moveCalendarCursorToToday,
    moveCalendarMonth,
    moveCenterView,
    moveOpenDetailSelect,
    moveDetailField,
    moveSelectedDown,
    moveSelectedUp,
    movePane,
    moveRootSelection,
    moveSelection,
    openDatePicker,
    openDateTextEdit,
    openDetailSelect,
    openDetailSelectField,
    onCloseDetailDialog,
    onCloseShortcutHelp,
    onOpenDetailDialog,
    onOpenFocusHint,
    onOpenShortcutHelp,
    pendingUndoDelete,
    outdentSelected,
    resetCalendarMonthToToday,
    restorePendingDelete,
    setActivePane,
  ]);
}
