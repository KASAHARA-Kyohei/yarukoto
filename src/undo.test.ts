import { describe, expect, it } from "vitest";
import { createDeleteUndoSnapshot } from "./undo";
import type { YarukotoNode } from "./types";

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
    memo: `memo-${id}`,
    startDate: id === "target" ? "2026-05-30" : null,
    dueDate: id === "target" ? "2026-06-01" : null,
    sortOrder,
    createdAt: `2026-01-01T00:00:0${sortOrder}.000Z`,
    updatedAt: `2026-01-01T00:00:0${sortOrder}.000Z`,
  };
}

describe("createDeleteUndoSnapshot", () => {
  it("keeps the deleted node and descendants with restore fields", () => {
    const nodes = [
      node("root", null, 0),
      node("target", "root", 0),
      node("child", "target", 0),
      node("sibling", "root", 1),
    ];

    const snapshot = createDeleteUndoSnapshot({
      deletedAt: 100,
      fallbackId: "root",
      node: nodes[1],
      nodes,
      ttlMs: 8_000,
    });

    expect(snapshot.expiresAt).toBe(8_100);
    expect(snapshot.title).toBe("target");
    expect(snapshot.nodes.map((item) => item.id)).toEqual(["target", "child"]);
    expect(snapshot.nodes[0]).toMatchObject({
      dueDate: "2026-06-01",
      memo: "memo-target",
      parentId: "root",
      sortOrder: 0,
      startDate: "2026-05-30",
    });
  });
});
