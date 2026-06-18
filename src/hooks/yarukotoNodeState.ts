import { findRootId, getAncestorIds, getRootNodes } from "@/domain/nodes/tree";
import type { YarukotoNode } from "@/domain/nodes/types";

export function resolveLoadedTreeState({
  currentActiveRootId,
  currentSelectedId,
  nextNodes,
  preferredSelectedId,
}: {
  currentActiveRootId: string | null;
  currentSelectedId: string | null;
  nextNodes: YarukotoNode[];
  preferredSelectedId?: string | null;
}) {
  const nextRoots = getRootNodes(nextNodes);
  const preferredExists =
    preferredSelectedId &&
    nextNodes.some((node) => node.id === preferredSelectedId);
  const currentExists =
    currentSelectedId &&
    nextNodes.some((node) => node.id === currentSelectedId);
  const candidateSelectedId =
    (preferredExists ? preferredSelectedId : null) ??
    (currentExists ? currentSelectedId : null);
  const activeRootId =
    findRootId(nextNodes, candidateSelectedId) ??
    (currentActiveRootId &&
    nextRoots.some((node) => node.id === currentActiveRootId)
      ? currentActiveRootId
      : nextRoots[0]?.id ?? null);
  const selectedId =
    candidateSelectedId ?? activeRootId ?? nextNodes[0]?.id ?? null;

  return {
    activeRootId,
    nextRoots,
    selectedId,
  };
}

export function getExpandedIdsForLoadedTree({
  activeRootId,
  currentExpandedIds,
  nextNodes,
  nextRoots,
}: {
  activeRootId: string | null;
  currentExpandedIds: Set<string>;
  nextNodes: YarukotoNode[];
  nextRoots: YarukotoNode[];
}) {
  const next =
    currentExpandedIds.size === 0
      ? new Set(nextNodes.map((node) => node.id))
      : new Set(currentExpandedIds);

  for (const root of nextRoots) {
    next.add(root.id);
  }
  if (activeRootId) {
    next.add(activeRootId);
  }

  return next;
}

export function getExpandedIdsForSelection(
  currentExpandedIds: Set<string>,
  nodes: YarukotoNode[],
  nodeId: string,
) {
  const next = new Set(currentExpandedIds);
  const rootId = findRootId(nodes, nodeId);
  if (rootId) {
    next.add(rootId);
  }
  for (const ancestorId of getAncestorIds(nodes, nodeId)) {
    next.add(ancestorId);
  }
  return next;
}

export function resolveCollapsedTreeState({
  activeRootId,
  nextRoots,
}: {
  activeRootId: string | null;
  nextRoots: YarukotoNode[];
}) {
  const expandedIds = new Set(nextRoots.map((node) => node.id));
  if (activeRootId) {
    expandedIds.add(activeRootId);
  }

  return {
    expandedIds,
    selectedId: activeRootId ?? nextRoots[0]?.id ?? null,
  };
}
