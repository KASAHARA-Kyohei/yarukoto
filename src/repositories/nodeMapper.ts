import {
  isNodePriority,
  isNodeStatus,
  isNodeType,
  type YarukotoNode,
} from "../domain/nodes/types";

export type DbNode = {
  id: string;
  parent_id: string | null;
  title: string;
  type: string;
  status: string;
  priority: string;
  memo: string;
  start_date: string | null;
  due_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export function toNode(row: DbNode): YarukotoNode {
  return {
    id: row.id,
    parentId: row.parent_id,
    title: row.title,
    type: isNodeType(row.type) ? row.type : "Note",
    status: isNodeStatus(row.status) ? row.status : "Inbox",
    priority: isNodePriority(row.priority) ? row.priority : "none",
    memo: row.memo,
    startDate: row.start_date,
    dueDate: row.due_date,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function nodeInsertParams(node: YarukotoNode) {
  return [
    node.id,
    node.parentId,
    node.title,
    node.type,
    node.status,
    node.priority,
    node.memo,
    node.startDate,
    node.dueDate,
    node.sortOrder,
    node.createdAt,
    node.updatedAt,
  ];
}
