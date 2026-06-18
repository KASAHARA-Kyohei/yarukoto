import type {
  NodePriority,
  NodeStatus,
  NodeType,
  YarukotoNode,
} from "./types";

export function getNodeDisplayTitle(node: Pick<YarukotoNode, "title">) {
  return node.title.trim() === "" ? "無題" : node.title;
}

export function typeBadgeClass(type: NodeType) {
  switch (type) {
    case "Group":
      return "border-sky-300 bg-sky-50 text-sky-900";
    case "Idea":
      return "border-yellow-300 bg-yellow-50 text-yellow-900";
    case "Note":
      return "border-slate-300 bg-slate-100 text-slate-800";
    case "Decision":
      return "border-violet-300 bg-violet-50 text-violet-900";
    case "Task":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
}

export function statusBadgeClass(status: NodeStatus) {
  switch (status) {
    case "Inbox":
      return "border-zinc-300 bg-zinc-100 text-zinc-800";
    case "Next":
      return "border-sky-300 bg-sky-50 text-sky-900";
    case "Doing":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "Done":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
}

export function priorityBadgeClass(priority: NodePriority) {
  switch (priority) {
    case "none":
      return "border-zinc-300 bg-zinc-100 text-zinc-700";
    case "low":
      return "border-slate-300 bg-slate-100 text-slate-800";
    case "medium":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "high":
      return "border-rose-300 bg-rose-50 text-rose-900";
  }
}

export function priorityLabel(priority: NodePriority) {
  switch (priority) {
    case "none":
      return "None";
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
  }
}
