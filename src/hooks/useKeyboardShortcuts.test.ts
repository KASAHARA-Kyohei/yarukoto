import { describe, expect, it, vi } from "vitest";
import type { YarukotoNode } from "@/domain/nodes/types";
import {
  getNextCenterView,
  getNextDetailField,
  getNextRootId,
  getNextPane,
  isEditableTagName,
} from "./useKeyboardShortcuts";
import {
  handleCalendarViewShortcut,
  handleDatePickerShortcut,
  handleDetailDialogShortcut,
  handleDetailSelectShortcut,
  handleKanbanViewShortcut,
  handleProjectsShortcut,
  handleTreeViewShortcut,
} from "./keyboardShortcutHandlers";

function rootNode(id: string, sortOrder = 0): YarukotoNode {
  return {
    id,
    parentId: null,
    title: id,
    type: "Group",
    status: "Inbox",
    priority: "none",
    memo: "",
    startDate: null,
    dueDate: null,
    sortOrder,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("isEditableTagName", () => {
  it("treats form fields as editable targets", () => {
    expect(isEditableTagName("INPUT")).toBe(true);
    expect(isEditableTagName("TEXTAREA")).toBe(true);
    expect(isEditableTagName("SELECT")).toBe(true);
  });

  it("allows shortcuts on ordinary controls", () => {
    expect(isEditableTagName("BUTTON")).toBe(false);
    expect(isEditableTagName("DIV")).toBe(false);
  });

  it("moves between the remaining two app panes", () => {
    expect(getNextPane("projects", 1)).toBe("center");
    expect(getNextPane("center", 1)).toBe("center");
    expect(getNextPane("center", -1)).toBe("projects");
    expect(getNextPane("projects", -1)).toBe("projects");
  });

  it("moves across center tabs", () => {
    expect(getNextCenterView("tree", 1)).toBe("kanban");
    expect(getNextCenterView("kanban", 1)).toBe("calendar");
    expect(getNextCenterView("calendar", 1)).toBe("report");
    expect(getNextCenterView("report", 1)).toBe("tree");
    expect(getNextCenterView("report", -1)).toBe("calendar");
    expect(getNextCenterView("kanban", -1)).toBe("tree");
  });

  it("moves through detail dialog fields", () => {
    expect(getNextDetailField("title", 1)).toBe("type");
    expect(getNextDetailField("status", 1)).toBe("priority");
    expect(getNextDetailField("dueDate", 1)).toBe("memo");
    expect(getNextDetailField("title", -1)).toBe("title");
    expect(getNextDetailField("memo", 1)).toBe("memo");
  });

  it.each([
    ["ArrowLeft", -1],
    ["ArrowRight", 1],
    ["ArrowDown", 7],
    ["ArrowUp", -7],
  ] as const)("routes date picker %s to day movement", (key, amount) => {
    const run = vi.fn((action: () => void) => action());
    const moveCalendarCursorByDays = vi.fn();

    expect(
      handleDatePickerShortcut({
        key,
        run,
        closeDatePicker: vi.fn(),
        commitCalendarDate: vi.fn(),
        moveCalendarCursorByDays,
        moveCalendarCursorByMonths: vi.fn(),
        moveCalendarCursorToToday: vi.fn(),
      }),
    ).toBe(true);

    expect(run).toHaveBeenCalledTimes(1);
    expect(moveCalendarCursorByDays).toHaveBeenCalledWith(amount);
  });

  it.each([
    ["H", -1],
    ["L", 1],
  ] as const)("routes calendar %s to month movement", (key, direction) => {
    const run = vi.fn((action: () => void) => action());
    const moveCalendarMonth = vi.fn();

    handleCalendarViewShortcut({
      key,
      run,
      moveCalendarMonth,
      onOpenDetailDialog: vi.fn(),
      resetCalendarMonthToToday: vi.fn(),
    });

    expect(moveCalendarMonth).toHaveBeenCalledWith(direction);
  });

  it("routes project pane root creation through o", () => {
    const run = vi.fn((action: () => void) => action());
    const createRootInProjects = vi.fn();

    expect(
      handleProjectsShortcut({
        key: "o",
        run,
        createRootInProjects,
        moveActiveRootDown: vi.fn(),
        moveActiveRootUp: vi.fn(),
        moveRootSelection: vi.fn(),
        setActivePane: vi.fn(),
      }),
    ).toBe(true);

    expect(run).toHaveBeenCalledTimes(1);
    expect(createRootInProjects).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["ArrowDown", 1],
    ["ArrowUp", -1],
  ] as const)(
    "routes project pane %s to root selection",
    (key, direction) => {
      const run = vi.fn((action: () => void) => action());
      const moveRootSelection = vi.fn();

      handleProjectsShortcut({
        key,
        run,
        createRootInProjects: vi.fn(),
        moveActiveRootDown: vi.fn(),
        moveActiveRootUp: vi.fn(),
        moveRootSelection,
        setActivePane: vi.fn(),
      });

      expect(moveRootSelection).toHaveBeenCalledWith(direction);
    },
  );

  it("routes project pane ArrowRight to center pane", () => {
    const run = vi.fn((action: () => void) => action());
    const setActivePane = vi.fn();

    handleProjectsShortcut({
      key: "ArrowRight",
      run,
      createRootInProjects: vi.fn(),
      moveActiveRootDown: vi.fn(),
      moveActiveRootUp: vi.fn(),
      moveRootSelection: vi.fn(),
      setActivePane,
    });

    expect(setActivePane).toHaveBeenCalledWith("center");
  });

  it.each([
    ["J", "down"],
    ["K", "up"],
  ] as const)("routes project pane %s to root reordering", (key, direction) => {
    const run = vi.fn((action: () => void) => action());
    const moveActiveRootDown = vi.fn();
    const moveActiveRootUp = vi.fn();

    handleProjectsShortcut({
      key,
      run,
      createRootInProjects: vi.fn(),
      moveActiveRootDown,
      moveActiveRootUp,
      moveRootSelection: vi.fn(),
      setActivePane: vi.fn(),
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(moveActiveRootDown).toHaveBeenCalledTimes(direction === "down" ? 1 : 0);
    expect(moveActiveRootUp).toHaveBeenCalledTimes(direction === "up" ? 1 : 0);
  });

  it("moves project selection by activeRootId even when selected child differs", () => {
    const roots = [rootNode("root-1"), rootNode("root-2"), rootNode("root-3")];

    expect(getNextRootId(roots, "root-2", 1)).toBe("root-3");
    expect(getNextRootId(roots, "root-2", -1)).toBe("root-1");
  });

  it("keeps project selection within bounds and falls back from missing activeRootId", () => {
    const roots = [rootNode("root-1"), rootNode("root-2")];

    expect(getNextRootId(roots, "root-1", -1)).toBe("root-1");
    expect(getNextRootId(roots, "root-2", 1)).toBe("root-2");
    expect(getNextRootId(roots, "missing", 1)).toBe("root-1");
    expect(getNextRootId(roots, "missing", -1)).toBe("root-2");
    expect(getNextRootId([], "root-1", 1)).toBeNull();
  });

  it.each([
    ["j", "down"],
    ["k", "up"],
    ["h", "left"],
    ["l", "right"],
    ["ArrowDown", "down"],
    ["ArrowUp", "up"],
    ["ArrowLeft", "left"],
    ["ArrowRight", "right"],
  ] as const)("routes kanban %s to %s selection", (key, direction) => {
    const run = vi.fn((action: () => void) => action());
    const moveKanbanSelection = vi.fn();

    handleKanbanViewShortcut({
      key,
      run,
      moveKanbanSelection,
      moveKanbanStatus: vi.fn(),
      onOpenDetailDialog: vi.fn(),
    });

    expect(moveKanbanSelection).toHaveBeenCalledWith(direction);
  });

  it.each([
    ["ArrowDown", 1],
    ["ArrowUp", -1],
  ] as const)("routes detail select %s to candidate movement", (key, direction) => {
    const run = vi.fn((action: () => void) => action());
    const moveOpenDetailSelect = vi.fn();

    handleDetailSelectShortcut({
      key,
      run,
      closeDetailSelect: vi.fn(),
      commitOpenDetailSelect: vi.fn(),
      moveOpenDetailSelect,
    });

    expect(moveOpenDetailSelect).toHaveBeenCalledWith(direction);
  });

  it.each([
    ["ArrowDown", 1],
    ["ArrowUp", -1],
  ] as const)("routes detail dialog %s to field movement", (key, direction) => {
    const run = vi.fn((action: () => void) => action());
    const moveDetailField = vi.fn();

    handleDetailDialogShortcut({
      activeDetailField: "title",
      key,
      run,
      clearActiveDate: vi.fn(),
      cyclePriorityValue: vi.fn(),
      cycleStatusValue: vi.fn(),
      cycleTypeValue: vi.fn(),
      focusActiveDetailField: vi.fn(),
      focusDetailField: vi.fn(),
      moveDetailField,
      onCloseDetailDialog: vi.fn(),
      openDatePicker: vi.fn(),
      openDateTextEdit: vi.fn(),
      openDetailSelect: vi.fn(),
    });

    expect(moveDetailField).toHaveBeenCalledWith(direction);
  });

  it.each([
    ["ArrowLeft", -1],
    ["ArrowRight", 1],
  ] as const)(
    "routes detail dialog %s to status cycling",
    (key, direction) => {
      const run = vi.fn((action: () => void) => action());
      const cycleStatusValue = vi.fn();

      handleDetailDialogShortcut({
        activeDetailField: "status",
        key,
        run,
        clearActiveDate: vi.fn(),
        cyclePriorityValue: vi.fn(),
        cycleStatusValue,
        cycleTypeValue: vi.fn(),
        focusActiveDetailField: vi.fn(),
        focusDetailField: vi.fn(),
        moveDetailField: vi.fn(),
        onCloseDetailDialog: vi.fn(),
        openDatePicker: vi.fn(),
        openDateTextEdit: vi.fn(),
        openDetailSelect: vi.fn(),
      });

      expect(cycleStatusValue).toHaveBeenCalledWith(direction);
    },
  );

  it.each([
    ["ArrowLeft", -1],
    ["ArrowRight", 1],
  ] as const)("routes detail dialog %s to priority cycling", (key, direction) => {
    const run = vi.fn((action: () => void) => action());
    const cyclePriorityValue = vi.fn();

    handleDetailDialogShortcut({
      activeDetailField: "priority",
      key,
      run,
      clearActiveDate: vi.fn(),
      cyclePriorityValue,
      cycleStatusValue: vi.fn(),
      cycleTypeValue: vi.fn(),
      focusActiveDetailField: vi.fn(),
      focusDetailField: vi.fn(),
      moveDetailField: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      openDatePicker: vi.fn(),
      openDateTextEdit: vi.fn(),
      openDetailSelect: vi.fn(),
    });

    expect(cyclePriorityValue).toHaveBeenCalledWith(direction);
  });

  it.each([
    ["H", -1],
    ["L", 1],
  ] as const)("routes kanban %s to status movement", (key, direction) => {
    const run = vi.fn((action: () => void) => action());
    const moveKanbanStatus = vi.fn();

    handleKanbanViewShortcut({
      key,
      run,
      moveKanbanSelection: vi.fn(),
      moveKanbanStatus,
      onOpenDetailDialog: vi.fn(),
    });

    expect(moveKanbanStatus).toHaveBeenCalledWith(direction);
  });

  it("keeps dd as a two-step tree delete shortcut", () => {
    const run = vi.fn((action: () => void) => action());
    const deleteSelected = vi.fn();

    handleTreeViewShortcut({
      key: "d",
      run,
      collapseCurrentTree: vi.fn(),
      createChild: vi.fn(),
      createSiblingAbove: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected,
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onExportToFile: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => false,
      registerDeleteKey: () => false,
      registerCollapseKey: vi.fn(),
    });
    handleTreeViewShortcut({
      key: "d",
      run,
      collapseCurrentTree: vi.fn(),
      createChild: vi.fn(),
      createSiblingAbove: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected,
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onExportToFile: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => false,
      registerDeleteKey: () => true,
      registerCollapseKey: vi.fn(),
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(deleteSelected).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["ArrowDown", 1],
    ["ArrowUp", -1],
  ] as const)("routes tree %s to selection movement", (key, direction) => {
    const run = vi.fn((action: () => void) => action());
    const moveSelection = vi.fn();

    handleTreeViewShortcut({
      key,
      run,
      collapseCurrentTree: vi.fn(),
      createChild: vi.fn(),
      createSiblingAbove: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected: vi.fn(),
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection,
      onCopyLlmReview: vi.fn(),
      onExportToFile: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => false,
      registerDeleteKey: () => false,
      registerCollapseKey: vi.fn(),
    });

    expect(moveSelection).toHaveBeenCalledWith(direction);
  });

  it.each([
    ["ArrowLeft", "handleH"],
    ["ArrowRight", "handleL"],
  ] as const)("routes tree %s to horizontal navigation", (key, handlerName) => {
    const run = vi.fn((action: () => void) => action());
    const handleH = vi.fn();
    const handleL = vi.fn();

    handleTreeViewShortcut({
      key,
      run,
      collapseCurrentTree: vi.fn(),
      createChild: vi.fn(),
      createSiblingAbove: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected: vi.fn(),
      handleH,
      handleL,
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onExportToFile: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => false,
      registerDeleteKey: () => false,
      registerCollapseKey: vi.fn(),
    });

    expect(handlerName === "handleH" ? handleH : handleL).toHaveBeenCalledTimes(1);
  });

  it("registers z as the collapse prefix without executing an action", () => {
    const run = vi.fn((action: () => void) => action());
    const registerCollapseKey = vi.fn();

    handleTreeViewShortcut({
      key: "z",
      run,
      collapseCurrentTree: vi.fn(),
      createChild: vi.fn(),
      createSiblingAbove: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected: vi.fn(),
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onExportToFile: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => false,
      registerDeleteKey: () => false,
      registerCollapseKey,
    });

    expect(run).not.toHaveBeenCalled();
    expect(registerCollapseKey).toHaveBeenCalledTimes(1);
  });

  it("keeps plain a routed to createChild", () => {
    const run = vi.fn((action: () => void) => action());
    const createChild = vi.fn();

    handleTreeViewShortcut({
      key: "a",
      run,
      collapseCurrentTree: vi.fn(),
      createChild,
      createSiblingAbove: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected: vi.fn(),
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onExportToFile: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => false,
      registerDeleteKey: () => false,
      registerCollapseKey: vi.fn(),
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(createChild).toHaveBeenCalledTimes(1);
  });

  it("routes tree za to collapseCurrentTree", () => {
    const run = vi.fn((action: () => void) => action());
    const collapseCurrentTree = vi.fn();

    handleTreeViewShortcut({
      key: "a",
      run,
      collapseCurrentTree,
      createChild: vi.fn(),
      createSiblingAbove: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected: vi.fn(),
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onExportToFile: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => true,
      registerDeleteKey: () => false,
      registerCollapseKey: vi.fn(),
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(collapseCurrentTree).toHaveBeenCalledTimes(1);
  });

  it("routes tree O to createSiblingAbove", () => {
    const run = vi.fn((action: () => void) => action());
    const createSiblingAbove = vi.fn();

    handleTreeViewShortcut({
      key: "O",
      run,
      collapseCurrentTree: vi.fn(),
      createChild: vi.fn(),
      createSiblingAbove,
      createSiblingBelow: vi.fn(),
      deleteSelected: vi.fn(),
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onExportToFile: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => false,
      registerDeleteKey: () => false,
      registerCollapseKey: vi.fn(),
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(createSiblingAbove).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["y", "copy"],
    ["p", "import"],
    ["Y", "file-export"],
    ["P", "file-import"],
  ])("routes %s to the exchange action", (key) => {
    const run = vi.fn((action: () => void) => action());
    const createSiblingAbove = vi.fn();
    const onCopyLlmReview = vi.fn();
    const onExportToFile = vi.fn();
    const onImportFromFile = vi.fn();
    const onOpenLlmImport = vi.fn();

    handleTreeViewShortcut({
      key,
      run,
      collapseCurrentTree: vi.fn(),
      createChild: vi.fn(),
      createSiblingAbove,
      createSiblingBelow: vi.fn(),
      deleteSelected: vi.fn(),
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview,
      onExportToFile,
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onImportFromFile,
      onOpenLlmImport,
      outdentSelected: vi.fn(),
      consumeCollapseKey: () => false,
      registerDeleteKey: () => false,
      registerCollapseKey: vi.fn(),
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(onCopyLlmReview).toHaveBeenCalledTimes(key === "y" ? 1 : 0);
    expect(onExportToFile).toHaveBeenCalledTimes(key === "Y" ? 1 : 0);
    expect(onImportFromFile).toHaveBeenCalledTimes(key === "P" ? 1 : 0);
    expect(onOpenLlmImport).toHaveBeenCalledTimes(key === "p" ? 1 : 0);
    expect(createSiblingAbove).not.toHaveBeenCalled();
  });
});
