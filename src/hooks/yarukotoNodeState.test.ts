import { describe, expect, it } from "vitest";
import {
  getExpandedIdsForLoadedTree,
  getExpandedIdsForSelection,
  resolveCollapsedTreeState,
  resolveLoadedTreeState,
} from "./yarukotoNodeState";
import type { YarukotoNode } from "@/domain/nodes/types";

function node(id: string, parentId: string | null): YarukotoNode {
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
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("yarukotoNodeState helpers", () => {
  const nodes = [
    node("root", null),
    node("child", "root"),
    node("grandchild", "child"),
    node("other", null),
  ];

  it("keeps the preferred selected node when it still exists", () => {
    expect(
      resolveLoadedTreeState({
        currentActiveRootId: "other",
        currentSelectedId: "other",
        nextNodes: nodes,
        preferredSelectedId: "grandchild",
      }),
    ).toEqual({
      activeRootId: "root",
      nextRoots: [nodes[0], nodes[3]],
      selectedId: "grandchild",
    });
  });

  it("falls back to the first root when nothing is selected", () => {
    expect(
      resolveLoadedTreeState({
        currentActiveRootId: null,
        currentSelectedId: null,
        nextNodes: nodes,
      }),
    ).toEqual({
      activeRootId: "root",
      nextRoots: [nodes[0], nodes[3]],
      selectedId: "root",
    });
  });

  it("expands all nodes on first load and keeps roots open", () => {
    const expanded = getExpandedIdsForLoadedTree({
      activeRootId: "root",
      currentExpandedIds: new Set(),
      nextNodes: nodes,
      nextRoots: [nodes[0], nodes[3]],
    });

    expect([...expanded]).toEqual(["root", "child", "grandchild", "other"]);
  });

  it("expands root and ancestors when selecting a nested node", () => {
    const expanded = getExpandedIdsForSelection(new Set(["other"]), nodes, "grandchild");
    expect([...expanded]).toEqual(["other", "root", "child"]);
  });

  it("collapses the current tree and keeps only roots expanded", () => {
    expect(
      resolveCollapsedTreeState({
        activeRootId: "root",
        nextRoots: [nodes[0], nodes[3]],
      }),
    ).toEqual({
      expandedIds: new Set(["root", "other"]),
      selectedId: "root",
    });
  });
});
