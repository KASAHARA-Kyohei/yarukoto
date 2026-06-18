import type { YarukotoNode } from "@/domain/nodes/types";

export type CenterView = "tree" | "kanban" | "calendar" | "report";
export type SaveStatus = "idle" | "saving" | "saved" | "error";
export type ActivePane = "projects" | "center";
export type DetailField =
  | "title"
  | "type"
  | "status"
  | "priority"
  | "startDate"
  | "dueDate"
  | "memo";
export type DetailSelectField = Extract<DetailField, "type" | "status" | "priority">;
export type DateField = Extract<DetailField, "startDate" | "dueDate">;
export type DateEditMode = "calendar" | "text";

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
  "priority",
  "startDate",
  "dueDate",
  "memo",
];

export function isDateField(field: DetailField): field is DateField {
  return field === "startDate" || field === "dueDate";
}

export function isDetailSelectField(
  field: DetailField,
): field is DetailSelectField {
  return field === "type" || field === "status" || field === "priority";
}
