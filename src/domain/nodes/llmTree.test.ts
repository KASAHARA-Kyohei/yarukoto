import { describe, expect, it } from "vitest";
import {
  buildLlmReviewText,
  buildLlmTreeDocument,
  countLlmTreeNodes,
  flattenLlmTreeDocument,
  parseLlmTreeDocument,
  type LlmTreeDocument,
} from "./llmTree";
import type { YarukotoNode } from "./types";

function node(
  id: string,
  parentId: string | null,
  sortOrder: number,
  overrides: Partial<YarukotoNode> = {},
): YarukotoNode {
  return {
    id,
    parentId,
    title: id,
    type: "Task",
    status: "Inbox",
    priority: "none",
    memo: "",
    startDate: null,
    dueDate: null,
    sortOrder,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const document: LlmTreeDocument = {
  format: "yarukoto-tree",
  version: 2,
  root: {
    title: "Project",
    type: "Group",
    status: "Doing",
    priority: "medium",
    memo: "root memo",
    startDate: "2026-06-01",
    dueDate: "2026-06-30",
    children: [
      {
        title: "Task",
        type: "Task",
        status: "Next",
        priority: "high",
        memo: "child memo",
        startDate: null,
        dueDate: "2026-06-10",
        children: [],
      },
    ],
  },
};

describe("LLM tree exchange", () => {
  it("exports the complete sorted tree without internal fields", () => {
    const result = buildLlmTreeDocument(
      [
        node("root", null, 0, {
          title: "Project",
          type: "Group",
          status: "Doing",
          memo: "root memo",
          startDate: "2026-06-01",
          dueDate: "2026-06-30",
        }),
        node("later", "root", 1),
        node("first", "root", 0),
        node("grandchild", "first", 0),
      ],
      "root",
    );

    expect(result.root.children.map((child) => child.title)).toEqual([
      "first",
      "later",
    ]);
    expect(result.root.children[0]?.children[0]?.title).toBe("grandchild");
    expect(JSON.stringify(result)).not.toContain("parentId");
    expect(JSON.stringify(result)).not.toContain("createdAt");
  });

  it("wraps the document in an LLM review instruction", () => {
    const text = buildLlmReviewText(document);
    expect(text).toContain("```json");
    expect(text).toContain('"format": "yarukoto-tree"');
    expect(text).toContain("説明文を含めず");
  });

  it("parses raw JSON and the first JSON code block", () => {
    const json = JSON.stringify(document);
    expect(parseLlmTreeDocument(json)).toEqual(document);
    expect(
      parseLlmTreeDocument(`review\n\`\`\`json\n${json}\n\`\`\`\nignored`),
    ).toEqual(document);
  });

  it.each([
    ["missing field", { ...document, root: { ...document.root, memo: undefined } }],
    ["invalid type", { ...document, root: { ...document.root, type: "Unknown" } }],
    ["invalid status", { ...document, root: { ...document.root, status: "Later" } }],
    ["invalid priority", { ...document, root: { ...document.root, priority: "urgent" } }],
    ["invalid date", { ...document, root: { ...document.root, dueDate: "2026-02-30" } }],
    ["invalid version", { ...document, version: 3 }],
  ])("rejects %s", (_label, invalid) => {
    expect(() => parseLlmTreeDocument(JSON.stringify(invalid))).toThrow();
  });

  it("imports v1 json by defaulting priority to none", () => {
    const legacy = {
      ...document,
      version: 1,
      root: {
        ...document.root,
        priority: undefined,
        children: document.root.children.map((child) => ({
          ...child,
          priority: undefined,
        })),
      },
    };

    expect(parseLlmTreeDocument(JSON.stringify(legacy))).toEqual({
      ...document,
      root: {
        ...document.root,
        priority: "none",
        children: document.root.children.map((child) => ({
          ...child,
          priority: "none",
        })),
      },
    });
  });

  it("flattens imported nodes with generated ids and sibling order", () => {
    const ids = ["root-id", "child-id"];
    const nodes = flattenLlmTreeDocument(
      document,
      () => ids.shift() ?? "unexpected",
      () => "2026-06-07T00:00:00.000Z",
    );

    expect(nodes).toEqual([
      expect.objectContaining({
        id: "root-id",
        parentId: null,
        sortOrder: 0,
        title: "Project",
      }),
      expect.objectContaining({
        id: "child-id",
        parentId: "root-id",
        sortOrder: 0,
        title: "Task",
      }),
    ]);
    expect(nodes.every((item) => item.createdAt === "2026-06-07T00:00:00.000Z")).toBe(true);
    expect(countLlmTreeNodes(document.root)).toBe(2);
  });
});
