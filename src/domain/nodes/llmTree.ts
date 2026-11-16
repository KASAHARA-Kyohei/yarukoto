import { DEFAULT_LANGUAGE, type Language } from "@/app/language";
import { messages, type Messages } from "@/app/messages";
import {
  isNodePriority,
  isNodeStatus,
  isNodeType,
  type NodePriority,
  type NodeStatus,
  type NodeType,
  type YarukotoNode,
} from "./types";
import { getChildren } from "./tree";

export const LLM_TREE_FORMAT = "yarukoto-tree";
export const LLM_TREE_VERSION = 2;

export type LlmTreeNode = {
  title: string;
  type: NodeType;
  status: NodeStatus;
  priority: NodePriority;
  memo: string;
  startDate: string | null;
  dueDate: string | null;
  children: LlmTreeNode[];
};

export type LlmTreeDocument = {
  format: typeof LLM_TREE_FORMAT;
  version: typeof LLM_TREE_VERSION;
  root: LlmTreeNode;
};

function toLlmTreeNode(nodes: YarukotoNode[], node: YarukotoNode): LlmTreeNode {
  return {
    title: node.title,
    type: node.type,
    status: node.status,
    priority: node.priority,
    memo: node.memo,
    startDate: node.startDate,
    dueDate: node.dueDate,
    children: getChildren(nodes, node.id).map((child) =>
      toLlmTreeNode(nodes, child),
    ),
  };
}

export function buildLlmTreeDocument(
  nodes: YarukotoNode[],
  rootId: string,
  language: Language = DEFAULT_LANGUAGE,
): LlmTreeDocument {
  const root = nodes.find((node) => node.id === rootId);
  if (!root || root.parentId !== null) {
    throw new Error(messages[language].projectMissing);
  }
  return {
    format: LLM_TREE_FORMAT,
    version: LLM_TREE_VERSION,
    root: toLlmTreeNode(nodes, root),
  };
}

export function buildLlmReviewText(
  document: LlmTreeDocument,
  language: Language = DEFAULT_LANGUAGE,
) {
  return [
    ...messages[language].reviewInstructions(document.version),
    "",
    "```json",
    JSON.stringify(document, null, 2),
    "```",
  ].join("\n");
}

type ValidationMessages = Messages["treeValidation"];

function extractJsonText(input: string, t: ValidationMessages) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error(t.empty);
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  t: ValidationMessages,
) {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(t.expectedString(`${path}.${key}`));
  }
  return value;
}

function requireNullableDate(
  record: Record<string, unknown>,
  key: string,
  path: string,
  t: ValidationMessages,
) {
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || !isValidDateKey(value)) {
    throw new Error(t.expectedDate(`${path}.${key}`));
  }
  return value;
}

function requirePriority(
  record: Record<string, unknown>,
  path: string,
  version: number,
  t: ValidationMessages,
) {
  const value = record.priority;
  if (value === undefined && version === 1) {
    return "none" as const;
  }
  if (typeof value !== "string" || !isNodePriority(value)) {
    throw new Error(t.invalidValue(`${path}.priority`));
  }
  return value;
}

function isValidDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function parseNode(
  value: unknown,
  path: string,
  version: number,
  t: ValidationMessages,
): LlmTreeNode {
  if (!isRecord(value)) {
    throw new Error(t.expectedObject(path));
  }
  const type = requireString(value, "type", path, t);
  if (!isNodeType(type)) {
    throw new Error(t.invalidValue(`${path}.type`));
  }
  const status = requireString(value, "status", path, t);
  if (!isNodeStatus(status)) {
    throw new Error(t.invalidValue(`${path}.status`));
  }
  const children = value.children;
  if (!Array.isArray(children)) {
    throw new Error(t.expectedArray(`${path}.children`));
  }
  return {
    title: requireString(value, "title", path, t),
    type,
    status,
    priority: requirePriority(value, path, version, t),
    memo: requireString(value, "memo", path, t),
    startDate: requireNullableDate(value, "startDate", path, t),
    dueDate: requireNullableDate(value, "dueDate", path, t),
    children: children.map((child, index) =>
      parseNode(child, `${path}.children[${index}]`, version, t),
    ),
  };
}

export function parseLlmTreeDocument(
  input: string,
  language: Language = DEFAULT_LANGUAGE,
): LlmTreeDocument {
  const t = messages[language].treeValidation;
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonText(input, t));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(t.invalidJson);
    }
    throw error;
  }
  if (!isRecord(parsed)) {
    throw new Error(t.invalidRoot);
  }
  if (parsed.format !== LLM_TREE_FORMAT) {
    throw new Error(t.invalidFormat(LLM_TREE_FORMAT));
  }
  if (parsed.version !== 1 && parsed.version !== LLM_TREE_VERSION) {
    throw new Error(t.invalidVersion(LLM_TREE_VERSION));
  }
  return {
    format: LLM_TREE_FORMAT,
    version: LLM_TREE_VERSION,
    root: parseNode(parsed.root, "root", parsed.version, t),
  };
}

export function countLlmTreeNodes(root: LlmTreeNode): number {
  return 1 + root.children.reduce((count, child) => count + countLlmTreeNodes(child), 0);
}

export function flattenLlmTreeDocument(
  document: LlmTreeDocument,
  createId: () => string = () => crypto.randomUUID(),
  now: () => string = () => new Date().toISOString(),
) {
  const nodes: YarukotoNode[] = [];
  const createdAt = now();
  const visit = (
    input: LlmTreeNode,
    parentId: string | null,
    sortOrder: number,
  ) => {
    const id = createId();
    nodes.push({
      id,
      parentId,
      title: input.title,
      type: input.type,
      status: input.status,
      priority: input.priority,
      memo: input.memo,
      startDate: input.startDate,
      dueDate: input.dueDate,
      sortOrder,
      createdAt,
      updatedAt: createdAt,
    });
    input.children.forEach((child, index) => visit(child, id, index));
  };
  visit(document.root, null, 0);
  return nodes;
}
