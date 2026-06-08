import { describe, expect, it, vi } from "vitest";
import {
  getNextCenterView,
  getNextDetailField,
  getNextPane,
  isEditableTagName,
} from "./useKeyboardShortcuts";
import {
  handleDatePickerShortcut,
  handleKanbanViewShortcut,
  handleProjectsShortcut,
  handleTreeViewShortcut,
} from "./keyboardShortcutHandlers";

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
    expect(getNextDetailField("dueDate", 1)).toBe("memo");
    expect(getNextDetailField("title", -1)).toBe("title");
    expect(getNextDetailField("memo", 1)).toBe("memo");
  });

  it("routes date picker movement shortcuts", () => {
    const run = vi.fn((action: () => void) => action());
    const moveCalendarCursorByDays = vi.fn();

    expect(
      handleDatePickerShortcut({
        key: "j",
        run,
        closeDatePicker: vi.fn(),
        commitCalendarDate: vi.fn(),
        moveCalendarCursorByDays,
        moveCalendarCursorByMonths: vi.fn(),
        moveCalendarCursorToToday: vi.fn(),
      }),
    ).toBe(true);

    expect(run).toHaveBeenCalledTimes(1);
    expect(moveCalendarCursorByDays).toHaveBeenCalledWith(7);
  });

  it("routes project pane root creation through o", () => {
    const run = vi.fn((action: () => void) => action());
    const createRootInProjects = vi.fn();

    expect(
      handleProjectsShortcut({
        key: "o",
        run,
        createRootInProjects,
        moveRootSelection: vi.fn(),
        setActivePane: vi.fn(),
      }),
    ).toBe(true);

    expect(run).toHaveBeenCalledTimes(1);
    expect(createRootInProjects).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["j", "down"],
    ["k", "up"],
    ["h", "left"],
    ["l", "right"],
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
      createChild: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected,
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      registerDeleteKey: () => false,
    });
    handleTreeViewShortcut({
      key: "d",
      run,
      createChild: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected,
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview: vi.fn(),
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onOpenLlmImport: vi.fn(),
      outdentSelected: vi.fn(),
      registerDeleteKey: () => true,
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(deleteSelected).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["y", "copy"],
    ["p", "import"],
  ])("routes %s to the LLM %s action", (key) => {
    const run = vi.fn((action: () => void) => action());
    const onCopyLlmReview = vi.fn();
    const onOpenLlmImport = vi.fn();

    handleTreeViewShortcut({
      key,
      run,
      createChild: vi.fn(),
      createSiblingBelow: vi.fn(),
      deleteSelected: vi.fn(),
      handleH: vi.fn(),
      handleL: vi.fn(),
      indentSelected: vi.fn(),
      moveSelectedDown: vi.fn(),
      moveSelectedUp: vi.fn(),
      moveSelection: vi.fn(),
      onCopyLlmReview,
      onCloseDetailDialog: vi.fn(),
      onOpenDetailDialog: vi.fn(),
      onOpenLlmImport,
      outdentSelected: vi.fn(),
      registerDeleteKey: () => false,
    });

    expect(run).toHaveBeenCalledTimes(1);
    expect(onCopyLlmReview).toHaveBeenCalledTimes(key === "y" ? 1 : 0);
    expect(onOpenLlmImport).toHaveBeenCalledTimes(key === "p" ? 1 : 0);
  });
});
