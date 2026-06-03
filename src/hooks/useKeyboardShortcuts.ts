import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  DETAIL_FIELDS,
  type ActivePane,
  type CenterView,
  type DateField,
  type DetailField,
  type DetailSelectField,
} from "@/app/types";
import { getChildren } from "@/domain/nodes/tree";
import {
  type FlatTreeNode,
  type YarukotoNode,
} from "@/domain/nodes/types";
import {
  handleCalendarViewShortcut,
  handleDatePickerShortcut,
  handleDateTextShortcut,
  handleDetailDialogShortcut,
  handleDetailSelectShortcut,
  handleProjectsShortcut,
  handleReportViewShortcut,
  handleTreeViewShortcut,
} from "./keyboardShortcutHandlers";

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
  cycleTheme,
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
  cycleTheme: () => void;
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

      if (event.ctrlKey && event.key === "t") {
        run(cycleTheme);
        return;
      }
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
        handleDateTextShortcut({
          key: event.key,
          run,
          cancelDateTextEdit,
          commitDateTextEdit,
        });
        return;
      }
      if (isDetailDialogOpen && isDatePickerOpen) {
        handleDatePickerShortcut({
          key: event.key,
          run,
          closeDatePicker,
          commitCalendarDate,
          moveCalendarCursorByDays,
          moveCalendarCursorByMonths,
          moveCalendarCursorToToday,
        });
        return;
      }
      if (isDetailDialogOpen && openDetailSelectField) {
        handleDetailSelectShortcut({
          key: event.key,
          run,
          closeDetailSelect,
          commitOpenDetailSelect,
          moveOpenDetailSelect,
        });
        return;
      }
      if (isDetailDialogOpen) {
        handleDetailDialogShortcut({
          activeDetailField,
          key: event.key,
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
        });
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
        handleProjectsShortcut({
          key: event.key,
          run,
          createRootInProjects,
          moveRootSelection,
          setActivePane,
        });
        return;
      }

      if (centerView === "calendar") {
        handleCalendarViewShortcut({
          key: event.key,
          run,
          onOpenDetailDialog,
          resetCalendarMonthToToday,
        });
        return;
      }

      if (centerView === "report") {
        handleReportViewShortcut({
          key: event.key,
          run,
          onOpenDetailDialog,
        });
        return;
      }

      handleTreeViewShortcut({
        key: event.key,
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
        onCloseDetailDialog,
        onOpenDetailDialog,
        outdentSelected,
        registerDeleteKey: () => {
          const currentTime = Date.now();
          if (currentTime - lastDRef.current < 650) {
            lastDRef.current = 0;
            return true;
          }
          lastDRef.current = currentTime;
          return false;
        },
      });
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
    cycleTheme,
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
