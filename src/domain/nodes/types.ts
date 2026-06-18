export const NODE_TYPES = ["Group", "Idea", "Note", "Decision", "Task"] as const;
export const NODE_STATUSES = ["Inbox", "Next", "Doing", "Done"] as const;
export const NODE_PRIORITIES = ["none", "low", "medium", "high"] as const;

export type NodeType = (typeof NODE_TYPES)[number];
export type NodeStatus = (typeof NODE_STATUSES)[number];
export type NodePriority = (typeof NODE_PRIORITIES)[number];
export type PeriodRange = {
  end: string;
  start: string;
};

export function isNodeType(value: string): value is NodeType {
  return NODE_TYPES.includes(value as NodeType);
}

export function isNodeStatus(value: string): value is NodeStatus {
  return NODE_STATUSES.includes(value as NodeStatus);
}

export function isNodePriority(value: string): value is NodePriority {
  return NODE_PRIORITIES.includes(value as NodePriority);
}

export type YarukotoNode = {
  id: string;
  parentId: string | null;
  title: string;
  type: NodeType;
  status: NodeStatus;
  priority: NodePriority;
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
  priority?: NodePriority;
  memo?: string;
  startDate?: string | null;
  dueDate?: string | null;
  sortOrder?: number;
};

export type UpdateNodeInput = Partial<
  Pick<
    YarukotoNode,
    "title" | "type" | "status" | "priority" | "memo" | "startDate" | "dueDate"
  >
>;

export type FlatTreeNode = {
  childCount: number;
  descendantPeriod: PeriodRange | null;
  guideColumns: boolean[];
  isLastSibling: boolean;
  node: YarukotoNode;
  depth: number;
  hasChildren: boolean;
};
