import type { NodeStatus, YarukotoNode } from "./types";

export type TaskProgressSource = "children-average" | "leaf-status";

export type TaskProgressInfo = {
  childTaskCount: number;
  source: TaskProgressSource;
  value: number;
};

export function getLeafTaskProgress(status: NodeStatus) {
  switch (status) {
    case "Done":
      return 100;
    case "Doing":
      return 50;
    case "Inbox":
    case "Next":
    default:
      return 0;
  }
}

export function buildTaskProgressMap(nodes: YarukotoNode[]) {
  const childrenByParentId = new Map<string | null, YarukotoNode[]>();
  for (const node of nodes) {
    const siblings = childrenByParentId.get(node.parentId) ?? [];
    siblings.push(node);
    childrenByParentId.set(node.parentId, siblings);
  }

  const progressById = new Map<string, TaskProgressInfo>();
  const visiting = new Set<string>();

  const computeTaskProgress = (node: YarukotoNode): TaskProgressInfo | null => {
    if (node.type !== "Task") {
      return null;
    }

    const cached = progressById.get(node.id);
    if (cached) {
      return cached;
    }

    if (visiting.has(node.id)) {
      return {
        childTaskCount: 0,
        source: "leaf-status",
        value: getLeafTaskProgress(node.status),
      };
    }

    visiting.add(node.id);
    const directTaskChildren = (childrenByParentId.get(node.id) ?? []).filter(
      (child) => child.type === "Task",
    );

    let next: TaskProgressInfo;
    if (directTaskChildren.length === 0) {
      next = {
        childTaskCount: 0,
        source: "leaf-status",
        value: getLeafTaskProgress(node.status),
      };
    } else {
      const total = directTaskChildren.reduce((sum, child) => {
        return sum + (computeTaskProgress(child)?.value ?? getLeafTaskProgress(child.status));
      }, 0);
      next = {
        childTaskCount: directTaskChildren.length,
        source: "children-average",
        value: Math.round(total / directTaskChildren.length),
      };
    }

    visiting.delete(node.id);
    progressById.set(node.id, next);
    return next;
  };

  for (const node of nodes) {
    computeTaskProgress(node);
  }

  return progressById;
}
