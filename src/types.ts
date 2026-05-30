export const NODE_TYPES = ["Group", "Idea", "Note", "Decision", "Task"] as const;
export const NODE_STATUSES = ["Inbox", "Next", "Doing", "Done"] as const;

export type NodeType = (typeof NODE_TYPES)[number];
export type NodeStatus = (typeof NODE_STATUSES)[number];
export type CenterView = "tree" | "calendar" | "report";
export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type ActivePane = "projects" | "center";
export type DetailField =
  | "title"
  | "type"
  | "status"
  | "startDate"
  | "dueDate"
  | "memo";
export type PendingUndoDelete = {
  deletedAt: number;
  expiresAt: number;
  fallbackId: string | null;
  nodes: YarukotoNode[];
  title: string;
};

export const DETAIL_FIELDS: DetailField[] = [
  "title",
  "type",
  "status",
  "startDate",
  "dueDate",
  "memo",
];

export function isNodeType(value: string): value is NodeType {
  return NODE_TYPES.includes(value as NodeType);
}

export function isNodeStatus(value: string): value is NodeStatus {
  return NODE_STATUSES.includes(value as NodeStatus);
}

export type YarukotoNode = {
  id: string;
  parentId: string | null;
  title: string;
  type: NodeType;
  status: NodeStatus;
  memo: string;
  startDate: string | null;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateNodeInput = {
  parentId: string | null;
  title?: string;
  type?: NodeType;
  status?: NodeStatus;
  memo?: string;
  startDate?: string | null;
  dueDate?: string | null;
  sortOrder?: number;
};

export type UpdateNodeInput = Partial<
  Pick<YarukotoNode, "title" | "type" | "status" | "memo" | "startDate" | "dueDate">
>;

export type FlatTreeNode = {
  childCount: number;
  descendantPeriod: { start: string; end: string } | null;
  guideColumns: boolean[];
  isLastSibling: boolean;
  node: YarukotoNode;
  depth: number;
  hasChildren: boolean;
};
