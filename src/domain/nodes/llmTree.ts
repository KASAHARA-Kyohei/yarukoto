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
): LlmTreeDocument {
  const root = nodes.find((node) => node.id === rootId);
  if (!root || root.parentId !== null) {
    throw new Error("コピー対象のプロジェクトが見つかりません。");
  }
  return {
    format: LLM_TREE_FORMAT,
    version: LLM_TREE_VERSION,
    root: toLlmTreeNode(nodes, root),
  };
}

export function buildLlmReviewText(document: LlmTreeDocument) {
  return [
    "以下はタスク管理アプリ yarukoto のプロジェクトツリーです。",
    "内容をレビューし、必要に応じてノードの追加・削除・並べ替え・階層変更・各項目の修正を行ってください。",
    "返答は説明文を含めず、同じ yarukoto-tree バージョン2形式のJSONコードブロックだけにしてください。",
    "format、version、および各ノードの title/type/status/priority/memo/startDate/dueDate/children は必ず残してください。",
    "",
    "```json",
    JSON.stringify(document, null, 2),
    "```",
  ].join("\n");
}

function extractJsonText(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("取り込むJSONを入力してください。");
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
) {
  const value = record[key];
  if (typeof value !== "string") {
    throw new Error(`${path}.${key} は文字列で指定してください。`);
  }
  return value;
}

function requireNullableDate(
  record: Record<string, unknown>,
  key: string,
  path: string,
) {
  const value = record[key];
  if (value === null) {
    return null;
  }
  if (typeof value !== "string" || !isValidDateKey(value)) {
    throw new Error(`${path}.${key} は YYYY-MM-DD または null で指定してください。`);
  }
  return value;
}

function requirePriority(
  record: Record<string, unknown>,
  path: string,
  version: number,
) {
  const value = record.priority;
  if (value === undefined && version === 1) {
    return "none" as const;
  }
  if (typeof value !== "string" || !isNodePriority(value)) {
    throw new Error(`${path}.priority の値が不正です。`);
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

function parseNode(value: unknown, path: string, version: number): LlmTreeNode {
  if (!isRecord(value)) {
    throw new Error(`${path} はオブジェクトで指定してください。`);
  }
  const type = requireString(value, "type", path);
  if (!isNodeType(type)) {
    throw new Error(`${path}.type の値が不正です。`);
  }
  const status = requireString(value, "status", path);
  if (!isNodeStatus(status)) {
    throw new Error(`${path}.status の値が不正です。`);
  }
  const children = value.children;
  if (!Array.isArray(children)) {
    throw new Error(`${path}.children は配列で指定してください。`);
  }
  return {
    title: requireString(value, "title", path),
    type,
    status,
    priority: requirePriority(value, path, version),
    memo: requireString(value, "memo", path),
    startDate: requireNullableDate(value, "startDate", path),
    dueDate: requireNullableDate(value, "dueDate", path),
    children: children.map((child, index) =>
      parseNode(child, `${path}.children[${index}]`, version),
    ),
  };
}

export function parseLlmTreeDocument(input: string): LlmTreeDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJsonText(input));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("JSONの形式が正しくありません。");
    }
    throw error;
  }
  if (!isRecord(parsed)) {
    throw new Error("ルートはオブジェクトで指定してください。");
  }
  if (parsed.format !== LLM_TREE_FORMAT) {
    throw new Error(`format は "${LLM_TREE_FORMAT}" で指定してください。`);
  }
  if (parsed.version !== 1 && parsed.version !== LLM_TREE_VERSION) {
    throw new Error(`version は 1 または ${LLM_TREE_VERSION} で指定してください。`);
  }
  return {
    format: LLM_TREE_FORMAT,
    version: LLM_TREE_VERSION,
    root: parseNode(parsed.root, "root", parsed.version),
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
