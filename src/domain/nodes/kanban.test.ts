import { describe, expect, it } from "vitest";
import {
  buildKanbanModel,
  getAdjacentKanbanStatus,
  getNextKanbanCardId,
} from "./kanban";
import type {
  NodeStatus,
  NodeType,
  YarukotoNode,
} from "./types";

function node(
  id: string,
  parentId: string | null,
  sortOrder: number,
  {
    status = "Inbox",
    title = id,
    type = "Task",
    priority = "none",
  }: {
    priority?: YarukotoNode["priority"];
    status?: NodeStatus;
    title?: string;
    type?: NodeType;
  } = {},
): YarukotoNode {
  return {
    id,
    parentId,
    title,
    type,
    status,
    priority,
    memo: "",
    startDate: null,
    dueDate: null,
    sortOrder,
    createdAt: `2026-01-01T00:00:0${sortOrder}.000Z`,
    updatedAt: `2026-01-01T00:00:0${sortOrder}.000Z`,
  };
}

describe("buildKanbanModel", () => {
  it("keeps fixed columns and places only tasks in tree order", () => {
    const model = buildKanbanModel([
      node("later", "root", 1, { status: "Next" }),
      node("root", null, 0, { type: "Group" }),
      node("note", "root", 0, { type: "Note" }),
      node("first", "root", 0),
      node("nested", "first", 0, { status: "Doing" }),
      node("done", "root", 2, { status: "Done" }),
    ]);

    expect(model.columns.map((column) => column.status)).toEqual([
      "Inbox",
      "Next",
      "Doing",
      "Done",
    ]);
    expect(model.columns.map((column) => column.cards.map((card) => card.node.id))).toEqual([
      ["first"],
      ["later"],
      ["nested"],
      ["done"],
    ]);
    expect(model.firstCardId).toBe("first");
  });

  it("builds parent paths and uses the existing untitled label", () => {
    const model = buildKanbanModel([
      node("root", null, 0, { title: "Project", type: "Group" }),
      node("parent", "root", 0, { title: "", type: "Group" }),
      node("task", "parent", 0),
    ]);

    expect(model.columns[0].cards[0].parentPath).toEqual(["Project", "無題"]);
  });

  it("returns empty fixed columns for empty input", () => {
    const model = buildKanbanModel([]);

    expect(model.columns).toHaveLength(4);
    expect(model.columns.every((column) => column.cards.length === 0)).toBe(true);
    expect(model.firstCardId).toBeNull();
  });
});

describe("kanban navigation", () => {
  const model = buildKanbanModel([
    node("inbox-1", null, 0),
    node("inbox-2", null, 1),
    node("doing-1", null, 2, { status: "Doing" }),
  ]);

  it("moves vertically within a column and clamps at its edges", () => {
    expect(getNextKanbanCardId(model, "inbox-1", "down")).toBe("inbox-2");
    expect(getNextKanbanCardId(model, "inbox-1", "up")).toBe("inbox-1");
  });

  it("skips empty columns and preserves the nearest row", () => {
    expect(getNextKanbanCardId(model, "inbox-2", "right")).toBe("doing-1");
    expect(getNextKanbanCardId(model, "doing-1", "left")).toBe("inbox-1");
  });

  it("falls back to the first card when selection is outside the board", () => {
    expect(getNextKanbanCardId(model, "missing", "down")).toBe("inbox-1");
  });

  it("returns adjacent statuses without crossing board edges", () => {
    expect(getAdjacentKanbanStatus("Next", -1)).toBe("Inbox");
    expect(getAdjacentKanbanStatus("Doing", 1)).toBe("Done");
    expect(getAdjacentKanbanStatus("Inbox", -1)).toBeNull();
    expect(getAdjacentKanbanStatus("Done", 1)).toBeNull();
  });
});
