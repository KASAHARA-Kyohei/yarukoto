import { getDescendantIds } from "./tree";
import type { FlatTreeNode, YarukotoNode } from "./types";

export function getDeleteSelectionFallback({
  deletedNodeId,
  nodes,
  oldParentId,
  visibleNodes,
}: {
  deletedNodeId: string;
  nodes: YarukotoNode[];
  oldParentId: string | null;
  visibleNodes: FlatTreeNode[];
}) {
  const deletedIds = new Set([
    deletedNodeId,
    ...getDescendantIds(nodes, deletedNodeId),
  ]);
  const remaining = nodes.filter((node) => !deletedIds.has(node.id));

  return (
    visibleNodes.find(({ node }) => !deletedIds.has(node.id))?.node.id ??
    (oldParentId && !deletedIds.has(oldParentId) ? oldParentId : null) ??
    remaining[0]?.id ??
    null
  );
}
