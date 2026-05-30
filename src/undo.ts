import { getDescendantIds } from "./tree";
import type { PendingUndoDelete, YarukotoNode } from "./types";

export function createDeleteUndoSnapshot({
  deletedAt,
  fallbackId,
  node,
  nodes,
  ttlMs,
}: {
  deletedAt: number;
  fallbackId: string | null;
  node: YarukotoNode;
  nodes: YarukotoNode[];
  ttlMs: number;
}): PendingUndoDelete {
  const deletedIds = new Set([node.id, ...getDescendantIds(nodes, node.id)]);
  return {
    deletedAt,
    expiresAt: deletedAt + ttlMs,
    fallbackId,
    nodes: nodes.filter((item) => deletedIds.has(item.id)),
    title: node.title,
  };
}
