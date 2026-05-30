import type { FlatTreeNode, YarukotoNode } from "./types";
import { getNodePeriodDates, mergePeriodRanges } from "./period";
import type { PeriodRange } from "./period";

export function sortNodes(nodes: YarukotoNode[]) {
  return [...nodes].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function getRootNodes(nodes: YarukotoNode[]) {
  return sortNodes(nodes.filter((node) => node.parentId === null));
}

export function findRootId(nodes: YarukotoNode[], nodeId: string | null) {
  let current = nodes.find((node) => node.id === nodeId);
  while (current?.parentId) {
    current = nodes.find((node) => node.id === current?.parentId);
  }
  return current?.id ?? null;
}

export function getAncestorIds(nodes: YarukotoNode[], nodeId: string) {
  const result: string[] = [];
  let current = nodes.find((node) => node.id === nodeId);
  while (current?.parentId) {
    result.push(current.parentId);
    current = nodes.find((node) => node.id === current?.parentId);
  }
  return result;
}

export function getScopedNodes(nodes: YarukotoNode[], rootId: string | null) {
  if (!rootId) {
    return nodes;
  }
  return nodes.filter((node) => findRootId(nodes, node.id) === rootId);
}

export function getChildren(nodes: YarukotoNode[], parentId: string) {
  return sortNodes(nodes.filter((node) => node.parentId === parentId));
}

export function getVisibleTree(
  nodes: YarukotoNode[],
  rootId: string | null,
  expandedIds: Set<string>,
) {
  const roots =
    rootId === null
      ? getRootNodes(nodes)
      : nodes.filter((node) => node.id === rootId);
  const result: FlatTreeNode[] = [];
  const descendantPeriodsById = new Map<string, { start: string; end: string } | null>();

  const collectSubtreeRange = (node: YarukotoNode): PeriodRange | null => {
    const children = getChildren(nodes, node.id);
    const childSubtreeRanges: Array<PeriodRange | null> = children.map(collectSubtreeRange);
    descendantPeriodsById.set(node.id, mergePeriodRanges(childSubtreeRanges));
    return mergePeriodRanges([getNodePeriodDates(node), ...childSubtreeRanges]);
  };

  roots.forEach((root) => {
    collectSubtreeRange(root);
  });

  const visit = (
    node: YarukotoNode,
    depth: number,
    guideColumns: boolean[],
    isLastSibling: boolean,
  ) => {
    const children = getChildren(nodes, node.id);
    result.push({
      childCount: children.length,
      descendantPeriod: descendantPeriodsById.get(node.id) ?? null,
      guideColumns,
      isLastSibling,
      node,
      depth,
      hasChildren: children.length > 0,
    });
    if (!expandedIds.has(node.id)) {
      return;
    }
    children.forEach((child, index) => {
      visit(
        child,
        depth + 1,
        [...guideColumns, index < children.length - 1],
        index === children.length - 1,
      );
    });
  };

  const sortedRoots = sortNodes(roots);
  sortedRoots.forEach((root, index) => {
    visit(root, 0, [], index === sortedRoots.length - 1);
  });

  return result;
}

export function getDescendantIds(nodes: YarukotoNode[], nodeId: string) {
  const result: string[] = [];
  const collect = (parentId: string) => {
    for (const child of getChildren(nodes, parentId)) {
      result.push(child.id);
      collect(child.id);
    }
  };

  collect(nodeId);
  return result;
}
