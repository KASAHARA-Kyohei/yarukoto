import { describe, expect, it } from "vitest";
import { buildTaskProgressMap, getLeafTaskProgress } from "./progress";
import type { NodeType, YarukotoNode } from "./types";

function node(
  id: string,
  parentId: string | null,
  type: NodeType = "Task",
  status: YarukotoNode["status"] = "Inbox",
): YarukotoNode {
  return {
    id,
    parentId,
    title: id,
    type,
    status,
    memo: "",
    startDate: null,
    dueDate: null,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("progress helpers", () => {
  it("maps leaf task progress from status", () => {
    expect(getLeafTaskProgress("Inbox")).toBe(0);
    expect(getLeafTaskProgress("Next")).toBe(0);
    expect(getLeafTaskProgress("Doing")).toBe(50);
    expect(getLeafTaskProgress("Done")).toBe(100);
  });

  it("averages direct child tasks for parent tasks", () => {
    const progressMap = buildTaskProgressMap([
      node("parent", null, "Task", "Inbox"),
      node("child-a", "parent", "Task", "Doing"),
      node("child-b", "parent", "Task", "Done"),
    ]);

    expect(progressMap.get("parent")).toEqual({
      childTaskCount: 2,
      source: "children-average",
      value: 75,
    });
  });

  it("ignores direct non-task children when aggregating", () => {
    const progressMap = buildTaskProgressMap([
      node("parent", null, "Task", "Inbox"),
      node("child-task", "parent", "Task", "Inbox"),
      node("child-note", "parent", "Note", "Done"),
      node("grandchild-task", "child-note", "Task", "Done"),
    ]);

    expect(progressMap.get("parent")).toEqual({
      childTaskCount: 1,
      source: "children-average",
      value: 0,
    });
  });

  it("treats task nodes with no direct task children as leaf tasks", () => {
    const progressMap = buildTaskProgressMap([
      node("parent", null, "Task", "Doing"),
      node("child-note", "parent", "Note", "Done"),
    ]);

    expect(progressMap.get("parent")).toEqual({
      childTaskCount: 0,
      source: "leaf-status",
      value: 50,
    });
  });

  it("omits non-task nodes from the progress map", () => {
    const progressMap = buildTaskProgressMap([
      node("group", null, "Group", "Doing"),
      node("note", "group", "Note", "Done"),
    ]);

    expect(progressMap.has("group")).toBe(false);
    expect(progressMap.has("note")).toBe(false);
  });
});
