import { describe, expect, it } from "vitest";
import { findRootId, getAncestorIds, getScopedNodes, getVisibleTree } from "./tree";
import type { YarukotoNode } from "./types";

function node(id: string, parentId: string | null): YarukotoNode {
  return {
    id,
    parentId,
    title: id,
    type: "Task",
    status: "Inbox",
    memo: "",
    startDate: null,
    dueDate: null,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("tree helpers", () => {
  const nodes = [
    node("root", null),
    node("child", "root"),
    node("grandchild", "child"),
    node("other", null),
  ];

  it("finds the root for nested nodes", () => {
    expect(findRootId(nodes, "grandchild")).toBe("root");
  });

  it("returns ancestors from parent upward", () => {
    expect(getAncestorIds(nodes, "grandchild")).toEqual(["child", "root"]);
  });

  it("scopes nodes to a selected root", () => {
    expect(getScopedNodes(nodes, "root").map((item) => item.id)).toEqual([
      "root",
      "child",
      "grandchild",
    ]);
  });

  it("includes direct child counts in visible tree rows", () => {
    const visible = getVisibleTree(nodes, "root", new Set(["root"]));
    expect(
      visible.map(({ childCount, descendantPeriod, node }) => [
        node.id,
        childCount,
        descendantPeriod,
      ]),
    ).toEqual([
      ["root", 1, null],
      ["child", 1, null],
    ]);
  });

  it("tracks which guide columns continue to the next visible rows", () => {
    const branchingNodes = [
      node("root", null),
      node("child-a", "root"),
      node("grandchild-a", "child-a"),
      node("child-b", "root"),
    ];
    const visible = getVisibleTree(
      branchingNodes,
      "root",
      new Set(["root", "child-a"]),
    );

    expect(
      visible.map(({ guideColumns, isLastSibling, node }) => ({
        guideColumns,
        id: node.id,
        isLastSibling,
      })),
    ).toEqual([
      { id: "root", guideColumns: [], isLastSibling: true },
      { id: "child-a", guideColumns: [true], isLastSibling: false },
      { id: "grandchild-a", guideColumns: [true, false], isLastSibling: true },
      { id: "child-b", guideColumns: [false], isLastSibling: true },
    ]);
  });

  it("calculates descendant aggregate periods for parents", () => {
    const datedNodes = [
      node("root", null),
      {
        ...node("child-a", "root"),
        dueDate: "2026-06-08",
        startDate: "2026-06-04",
      },
      {
        ...node("child-b", "root"),
        dueDate: "2026-06-05",
        startDate: "2026-06-01",
      },
    ];

    const visible = getVisibleTree(datedNodes, "root", new Set(["root"]));

    expect(visible[0]?.descendantPeriod).toEqual({
      end: "2026-06-08",
      start: "2026-06-01",
    });
  });
});
