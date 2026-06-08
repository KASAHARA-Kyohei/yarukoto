import { getNodeDisplayTitle } from "./nodeAppearance";
import { NODE_STATUSES, type NodeStatus, type YarukotoNode } from "./types";
import { sortNodes } from "./tree";

export type KanbanCard = {
  node: YarukotoNode;
  parentPath: string[];
};

export type KanbanColumn = {
  cards: KanbanCard[];
  status: NodeStatus;
};

export type KanbanModel = {
  columns: KanbanColumn[];
  firstCardId: string | null;
};

export type KanbanSelectionDirection = "down" | "left" | "right" | "up";

export function buildKanbanModel(nodes: YarukotoNode[]): KanbanModel {
  const columns = NODE_STATUSES.map((status) => ({
    cards: [] as KanbanCard[],
    status,
  }));
  const columnsByStatus = new Map(columns.map((column) => [column.status, column]));
  const childrenByParent = new Map<string | null, YarukotoNode[]>();

  for (const node of nodes) {
    const siblings = childrenByParent.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParent.set(node.parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  const visited = new Set<string>();
  const visit = (node: YarukotoNode, parentPath: string[]) => {
    if (visited.has(node.id)) {
      return;
    }
    visited.add(node.id);

    if (node.type === "Task") {
      columnsByStatus.get(node.status)?.cards.push({ node, parentPath });
    }

    const nextParentPath = [...parentPath, getNodeDisplayTitle(node)];
    for (const child of childrenByParent.get(node.id) ?? []) {
      visit(child, nextParentPath);
    }
  };

  for (const root of sortNodes(childrenByParent.get(null) ?? [])) {
    visit(root, []);
  }

  // Broken parent references should not hide otherwise valid tasks.
  for (const node of sortNodes(nodes)) {
    if (!visited.has(node.id)) {
      visit(node, []);
    }
  }

  return {
    columns,
    firstCardId:
      columns.flatMap((column) => column.cards)[0]?.node.id ?? null,
  };
}

export function findKanbanCard(model: KanbanModel, nodeId: string | null) {
  if (!nodeId) {
    return null;
  }
  for (const [columnIndex, column] of model.columns.entries()) {
    const cardIndex = column.cards.findIndex((card) => card.node.id === nodeId);
    if (cardIndex >= 0) {
      return { card: column.cards[cardIndex], cardIndex, columnIndex };
    }
  }
  return null;
}

export function getNextKanbanCardId(
  model: KanbanModel,
  selectedId: string | null,
  direction: KanbanSelectionDirection,
) {
  const current = findKanbanCard(model, selectedId);
  if (!current) {
    return model.firstCardId;
  }

  if (direction === "up" || direction === "down") {
    const cards = model.columns[current.columnIndex].cards;
    const offset = direction === "up" ? -1 : 1;
    const nextIndex = Math.min(
      cards.length - 1,
      Math.max(0, current.cardIndex + offset),
    );
    return cards[nextIndex]?.node.id ?? selectedId;
  }

  const offset = direction === "left" ? -1 : 1;
  for (
    let columnIndex = current.columnIndex + offset;
    columnIndex >= 0 && columnIndex < model.columns.length;
    columnIndex += offset
  ) {
    const cards = model.columns[columnIndex].cards;
    if (cards.length > 0) {
      return cards[Math.min(current.cardIndex, cards.length - 1)].node.id;
    }
  }

  return selectedId;
}

export function getAdjacentKanbanStatus(
  status: NodeStatus,
  direction: 1 | -1,
) {
  const index = NODE_STATUSES.indexOf(status);
  return NODE_STATUSES[index + direction] ?? null;
}
