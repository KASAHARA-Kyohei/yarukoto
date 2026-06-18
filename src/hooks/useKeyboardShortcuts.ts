import { useCallback, useEffect, useRef, type RefObject } from "react";
import {
  DETAIL_FIELDS,
  type ActivePane,
  type CenterView,
  type DateField,
  type DetailField,
  type DetailSelectField,
} from "@/app/types";
import {
  getAdjacentKanbanStatus,
  getNextKanbanCardId,
  type KanbanModel,
  type KanbanSelectionDirection,
} from "@/domain/nodes/kanban";
import { getChildren } from "@/domain/nodes/tree";
import {
  type FlatTreeNode,
  type NodeStatus,
  type YarukotoNode,
} from "@/domain/nodes/types";
import {
  handleCalendarViewShortcut,
  handleDatePickerShortcut,
  handleDateTextShortcut,
  handleDetailDialogShortcut,
  handleDetailSelectShortcut,
  handleKanbanViewShortcut,
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
  const views: CenterView[] = ["tree", "kanban", "calendar", "report"];
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

export function getNextRootId(
  roots: YarukotoNode[],
  activeRootId: string | null,
  direction: 1 | -1,
) {
  if (roots.length === 0) {
    return null;
  }
  const currentIndex = roots.findIndex((root) => root.id === activeRootId);
  const fallbackIndex = direction > 0 ? 0 : roots.length - 1;
  const nextIndex =
    currentIndex === -1
      ? fallbackIndex
      : Math.min(roots.length - 1, Math.max(0, currentIndex + direction));
  return roots[nextIndex]?.id ?? null;
}

export function useKeyboardShortcuts({
  activeRootId,
  activeDateField,
  activeDetailField,
  activePane,
  centerView,
  changeNodeStatus,
  cancelDateTextEdit,
  clearActiveDate,
  closeDatePicker,
  closeDetailSelect,
  commitCalendarDate,
  commitDateTextEdit,
  commitOpenDetailSelect,
  cycleTheme,
  cyclePriorityValue,
  cycleStatusValue,
  cycleTypeValue,
  collapseCurrentTree,
  createChild,
  createRootAndEdit,
  createRootInProjects,
  createSiblingAbove,
  createSiblingBelow,
  deleteSelected,
  detailFieldRefs,
  expandedIds,
  indentSelected,
  isDetailDialogOpen,
  isDatePickerOpen,
  isDateTextEditing,
  isFocusHintOpen,
  isLlmImportOpen,
  isMutating,
  isShortcutHelpOpen,
  kanbanModel,
  moveCalendarCursorByDays,
  moveCalendarCursorByMonths,
  moveCalendarCursorToToday,
  moveCalendarMonth,
  moveCenterView,
  moveActiveRootDown,
  moveActiveRootUp,
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
  onCopyLlmReview,
  onExportToFile,
  onOpenFocusHint,
  onImportFromFile,
  onOpenLlmImport,
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
  activeRootId: string | null;
  activeDateField: DateField | null;
  activeDetailField: DetailField;
  activePane: ActivePane;
  centerView: CenterView;
  changeNodeStatus: (nodeId: string, status: NodeStatus) => Promise<unknown>;
  cancelDateTextEdit: () => void;
  clearActiveDate: () => void;
  closeDatePicker: () => void;
  closeDetailSelect: () => void;
  commitCalendarDate: () => void;
  commitDateTextEdit: () => void;
  commitOpenDetailSelect: () => void;
  cycleTheme: () => void;
  cyclePriorityValue: (direction: 1 | -1) => void;
  cycleStatusValue: (direction: 1 | -1) => void;
  cycleTypeValue: (direction: 1 | -1) => void;
  collapseCurrentTree: () => void;
  createChild: () => Promise<unknown>;
  createRootAndEdit: () => Promise<unknown>;
  createRootInProjects: () => Promise<unknown>;
  createSiblingAbove: () => Promise<unknown>;
  createSiblingBelow: () => Promise<unknown>;
  deleteSelected: () => Promise<unknown>;
  detailFieldRefs: {
    dueDate: RefObject<HTMLButtonElement | null>;
    memo: RefObject<HTMLTextAreaElement | null>;
    priority: RefObject<HTMLButtonElement | null>;
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
  isLlmImportOpen: boolean;
  isMutating: boolean;
  isShortcutHelpOpen: boolean;
  kanbanModel: KanbanModel;
  moveCalendarCursorByDays: (amount: number) => void;
  moveCalendarCursorByMonths: (amount: number) => void;
  moveCalendarCursorToToday: () => void;
  moveCalendarMonth: (direction: 1 | -1) => void;
  moveCenterView: (direction: 1 | -1) => void;
  moveActiveRootDown: () => Promise<void>;
  moveActiveRootUp: () => Promise<void>;
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
  onCopyLlmReview: () => Promise<void>;
  onExportToFile: () => Promise<void>;
  onOpenFocusHint: () => void;
  onImportFromFile: () => Promise<unknown>;
  onOpenLlmImport: () => Promise<void>;
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
  const lastZRef = useRef(0);

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
      const nextRootId = getNextRootId(roots, activeRootId, direction);
      if (nextRootId) {
        selectNode(nextRootId);
      }
    },
    [activeRootId, roots, selectNode],
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

  const moveKanbanSelection = useCallback(
    (direction: KanbanSelectionDirection) => {
      const nextId = getNextKanbanCardId(kanbanModel, selectedId, direction);
      if (nextId) {
        selectNode(nextId);
      }
    },
    [kanbanModel, selectNode, selectedId],
  );

  const moveKanbanStatus = useCallback(
    async (direction: 1 | -1) => {
      if (!selectedNode || selectedNode.type !== "Task") {
        return;
      }
      const status = getAdjacentKanbanStatus(selectedNode.status, direction);
      if (status) {
        await changeNodeStatus(selectedNode.id, status);
      }
    },
    [changeNodeStatus, selectedNode],
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
      if (isLlmImportOpen) {
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
          cyclePriorityValue,
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
        run(() => movePane(-1));
        return;
      }
      if (event.ctrlKey && event.key === "l") {
        run(() => movePane(1));
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
      if (event.key !== "z" && event.key !== "a") {
        lastZRef.current = 0;
      }

      if (activePane === "projects") {
        handleProjectsShortcut({
          key: event.key,
          run,
          createRootInProjects,
          moveActiveRootDown,
          moveActiveRootUp,
          moveRootSelection,
          setActivePane,
        });
        return;
      }

      if (centerView === "calendar") {
        handleCalendarViewShortcut({
          key: event.key,
          run,
          moveCalendarMonth,
          onOpenDetailDialog,
          resetCalendarMonthToToday,
        });
        return;
      }

      if (centerView === "kanban") {
        handleKanbanViewShortcut({
          key: event.key,
          run,
          moveKanbanSelection,
          moveKanbanStatus,
          onOpenDetailDialog,
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
        collapseCurrentTree,
        createChild,
        createSiblingAbove,
        createSiblingBelow,
        deleteSelected,
        handleH,
        handleL,
        indentSelected,
        moveSelectedDown,
        moveSelectedUp,
        moveSelection,
        onCopyLlmReview,
        onExportToFile,
        onCloseDetailDialog,
        onOpenDetailDialog,
        onImportFromFile,
        onOpenLlmImport,
        outdentSelected,
        consumeCollapseKey: () => {
          const currentTime = Date.now();
          const isCollapseKey = currentTime - lastZRef.current < 650;
          lastZRef.current = 0;
          return isCollapseKey;
        },
        registerDeleteKey: () => {
          const currentTime = Date.now();
          if (currentTime - lastDRef.current < 650) {
            lastDRef.current = 0;
            return true;
          }
          lastDRef.current = currentTime;
          return false;
        },
        registerCollapseKey: () => {
          lastZRef.current = Date.now();
        },
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeRootId,
    activeDateField,
    activeDetailField,
    activePane,
    centerView,
    changeNodeStatus,
    cancelDateTextEdit,
    clearActiveDate,
    blurActiveDialogElement,
    closeDatePicker,
    closeDetailSelect,
    commitCalendarDate,
    commitDateTextEdit,
    commitOpenDetailSelect,
    cycleTheme,
    cyclePriorityValue,
    cycleStatusValue,
    cycleTypeValue,
    collapseCurrentTree,
    createChild,
    createRootAndEdit,
    createRootInProjects,
    createSiblingAbove,
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
    isLlmImportOpen,
    isMutating,
    isShortcutHelpOpen,
    moveCalendarCursorByDays,
    moveCalendarCursorByMonths,
    moveCalendarCursorToToday,
    moveCalendarMonth,
    moveCenterView,
    moveActiveRootDown,
    moveActiveRootUp,
    moveKanbanSelection,
    moveKanbanStatus,
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
    onCopyLlmReview,
    onExportToFile,
    onOpenFocusHint,
    onImportFromFile,
    onOpenLlmImport,
    onOpenShortcutHelp,
    pendingUndoDelete,
    outdentSelected,
    resetCalendarMonthToToday,
    restorePendingDelete,
    setActivePane,
  ]);
}
