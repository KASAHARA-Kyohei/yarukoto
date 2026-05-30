import { describe, expect, it } from "vitest";
import { getDeleteSelectionFallback } from "./nodeSelection";
import type { FlatTreeNode, YarukotoNode } from "./types";

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
    memo: "",
    startDate: null,
    dueDate: null,
    sortOrder,
    createdAt: `2026-01-01T00:00:0${sortOrder}.000Z`,
    updatedAt: `2026-01-01T00:00:0${sortOrder}.000Z`,
  };
}

function visible(nodes: YarukotoNode[]): FlatTreeNode[] {
  return nodes.map((item) => ({
    childCount: 0,
    descendantPeriod: null,
    depth: item.parentId ? 1 : 0,
    guideColumns: item.parentId ? [false] : [],
    hasChildren: false,
    isLastSibling: true,
    node: item,
  }));
}

describe("getDeleteSelectionFallback", () => {
  it("skips deleted descendants when choosing the next visible node", () => {
    const nodes = [
      node("root", null, 0),
      node("target", "root", 0),
      node("child", "target", 0),
      node("sibling", "root", 1),
    ];

    expect(
      getDeleteSelectionFallback({
        deletedNodeId: "target",
        nodes,
        oldParentId: "root",
        visibleNodes: visible(nodes),
      }),
    ).toBe("root");
  });

  it("falls back to the remaining first node when parent is also deleted", () => {
    const nodes = [node("target", null, 0), node("child", "target", 0), node("other", null, 1)];

    expect(
      getDeleteSelectionFallback({
        deletedNodeId: "target",
        nodes,
        oldParentId: null,
        visibleNodes: visible(nodes),
      }),
    ).toBe("other");
  });

  it("returns null when nothing remains", () => {
    const nodes = [node("target", null, 0)];

    expect(
      getDeleteSelectionFallback({
        deletedNodeId: "target",
        nodes,
        oldParentId: null,
        visibleNodes: visible(nodes),
      }),
    ).toBeNull();
  });
});
