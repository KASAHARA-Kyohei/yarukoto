import type { YarukotoNode } from "@/domain/nodes/types";

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
