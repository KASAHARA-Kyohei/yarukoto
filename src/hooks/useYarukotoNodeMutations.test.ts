import { describe, expect, it } from "vitest";
import { buildSiblingNodeInput } from "./useYarukotoNodeMutations";
import type { YarukotoNode } from "@/domain/nodes/types";

function node(
  id: string,
  parentId: string | null,
  sortOrder: number,
): YarukotoNode {
  return {
    id,
    parentId,
    title: id,
    type: "Task",
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

describe("useYarukotoNodeMutations helpers", () => {
  it("builds sibling-above input with the selected sortOrder", () => {
    const selectedNode = node("task-1", "group-1", 3);

    expect(buildSiblingNodeInput(selectedNode, selectedNode.sortOrder)).toMatchObject({
      parentId: "group-1",
      sortOrder: 3,
      status: "Inbox",
      title: "",
      type: "Task",
    });
  });

  it("creates Group under root and Task under child hierarchies", () => {
    expect(buildSiblingNodeInput(node("root-1", null, 0), 0).type).toBe("Group");
    expect(buildSiblingNodeInput(node("task-1", "root-1", 1), 1).type).toBe("Task");
  });
});
