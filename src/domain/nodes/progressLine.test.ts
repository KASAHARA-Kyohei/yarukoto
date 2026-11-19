import { describe, expect, it } from "vitest";
import { buildProgressLinePoints, buildProgressLineVertices } from "./progressLine";
import { buildTaskProgressMap } from "./progress";
import type { YarukotoNode } from "./types";

const bounds = { start: "2026-11-01", end: "2026-11-21" };
const today = "2026-11-11";

function task(id: string, overrides: Partial<YarukotoNode> = {}): YarukotoNode {
  return {
    id,
    parentId: null,
    title: id,
    type: "Task",
    status: "Doing",
    priority: "none",
    memo: "",
    startDate: "2026-11-01",
    dueDate: "2026-11-21",
    sortOrder: 0,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: "2026-11-01T00:00:00Z",
    ...overrides,
  };
}

function points(nodes: YarukotoNode[], allNodes = nodes) {
  return buildProgressLinePoints(
    nodes.map((node) => ({ node })), buildTaskProgressMap(allNodes), bounds, today,
  );
}

describe("progress line", () => {
  it("positions unfinished tasks behind, on, and ahead of today", () => {
    expect(points([
      task("behind", { dueDate: "2026-11-11" }),
      task("on-time"),
      task("ahead", { startDate: "2026-11-11" }),
    ]).map(({ position }) => position)).toEqual([25, 50, 75]);
  });

  it("removes a completed task and restores its point when reopened", () => {
    const nodes = [task("first"), task("middle", { status: "Done" }), task("last")];
    expect(points(nodes).map(({ nodeId, rowIndex }) => [nodeId, rowIndex]))
      .toEqual([["first", 0], ["last", 2]]);
    nodes[1].status = "Doing";
    expect(points(nodes).map(({ nodeId }) => nodeId)).toEqual(["first", "middle", "last"]);
  });

  it("keeps the line on today through completed rows before, between, and after tracked rows", () => {
    const nodes = [
      task("completed-before", { status: "Done" }),
      task("behind", { dueDate: today }),
      task("completed-between", { status: "Done" }),
      task("ahead", { startDate: today }),
      task("completed-after", { status: "Done" }),
    ];

    expect(buildProgressLineVertices(points(nodes), nodes.length, 50, 48, 29)).toBe(
      "50,0 50,48 25,77 50,96 50,144 75,173 50,192 50,240",
    );
  });

  it("connects consecutive tracked rows directly", () => {
    const nodes = [task("behind", { dueDate: today }), task("ahead", { startDate: today })];

    expect(buildProgressLineVertices(points(nodes), nodes.length, 50, 48, 29)).toBe(
      "50,0 25,29 75,77 50,96",
    );
  });

  it("excludes a parent at 100% even if its own status is Doing", () => {
    const parent = task("parent");
    const child = task("child", { parentId: parent.id, status: "Done" });
    expect(points([parent, child])).toEqual([]);
  });

  it("uses child average progress even when the children are collapsed", () => {
    const parent = task("parent");
    const children = [
      task("child1", { parentId: parent.id, status: "Done" }),
      task("child2", { parentId: parent.id, status: "Inbox" }),
    ];
    expect(points([parent], [parent, ...children])).toEqual([
      { nodeId: "parent", rowIndex: 0, position: 50, progress: 50 },
    ]);
  });

  it("keeps unstarted future tasks on today rather than showing them as ahead", () => {
    expect(points([task("future", { startDate: "2026-11-15", status: "Next" })])[0].position)
      .toBe(50);
  });

  it("tracks an overdue unfinished task to the left of today", () => {
    expect(points([task("overdue", { dueDate: "2026-11-05" })])[0].position).toBe(10);
  });

  it("skips non-tasks, missing dates, and reversed dates", () => {
    expect(points([
      task("note", { type: "Note" }),
      task("no-start", { startDate: null }),
      task("no-end", { dueDate: null }),
      task("reversed", { startDate: "2026-11-21", dueDate: "2026-11-01" }),
    ])).toEqual([]);
  });

  it("handles same-day tasks and clips progress outside the visible window", () => {
    expect(points([
      task("milestone", { startDate: today, dueDate: today }),
      task("past", { startDate: "2026-10-01", dueDate: "2026-10-21" }),
      task("future", { startDate: "2026-12-01", dueDate: "2026-12-21" }),
    ]).map(({ position }) => position)).toEqual([50, 0, 100]);
  });

  it("does not draw a line without bounds, progress, or unfinished tasks", () => {
    const node = task("task");
    expect(buildProgressLinePoints([{ node }], buildTaskProgressMap([node]), null, today)).toEqual([]);
    expect(buildProgressLinePoints([{ node }], new Map(), bounds, today)).toEqual([]);
    expect(points([task("done", { status: "Done" })])).toEqual([]);
  });
});
