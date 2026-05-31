import { describe, expect, it } from "vitest";
import { buildReportModel } from "./report";
import type { YarukotoNode } from "./types";

function node(
  id: string,
  overrides: Partial<YarukotoNode> = {},
): YarukotoNode {
  return {
    id,
    parentId: null,
    title: id,
    type: "Task",
    status: "Inbox",
    memo: "",
    startDate: null,
    dueDate: null,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const TODAY = "2026-05-31";

describe("buildReportModel", () => {
  it("taskCount は Task のみを数える", () => {
    const nodes = [
      node("t1", { type: "Task" }),
      node("n1", { type: "Note" }),
      node("g1", { type: "Group" }),
    ];
    const m = buildReportModel(nodes, TODAY);
    expect(m.taskCount).toBe(1);
    expect(m.totalCount).toBe(3);
  });

  it("doneRate が正しく計算される", () => {
    const nodes = [
      node("t1", { type: "Task", status: "Done" }),
      node("t2", { type: "Task", status: "Inbox" }),
      node("t3", { type: "Task", status: "Done" }),
      node("t4", { type: "Task", status: "Next" }),
    ];
    const m = buildReportModel(nodes, TODAY);
    expect(m.doneRate).toBe(50);
  });

  it("doneRate は Task が0件なら 0", () => {
    const m = buildReportModel([], TODAY);
    expect(m.doneRate).toBe(0);
  });

  it("averageTaskProgress が buildTaskProgressMap ベースになる", () => {
    const nodes = [
      node("t1", { type: "Task", status: "Done" }),   // progress = 100
      node("t2", { type: "Task", status: "Doing" }), // progress = 50
      node("t3", { type: "Task", status: "Inbox" }), // progress = 0
    ];
    const m = buildReportModel(nodes, TODAY);
    // (100 + 50 + 0) / 3 = 50
    expect(m.averageTaskProgress).toBe(50);
  });

  it("Task が0件なら averageTaskProgress === null", () => {
    const nodes = [node("n1", { type: "Note" })];
    const m = buildReportModel(nodes, TODAY);
    expect(m.averageTaskProgress).toBeNull();
  });

  it("overdueTasks が正しく分類される", () => {
    const nodes = [
      node("overdue", { type: "Task", status: "Inbox", dueDate: "2026-05-30" }),
      node("today", { type: "Task", status: "Inbox", dueDate: TODAY }),
      node("future", { type: "Task", status: "Inbox", dueDate: "2026-06-10" }),
      node("done-overdue", { type: "Task", status: "Done", dueDate: "2026-05-01" }),
    ];
    const m = buildReportModel(nodes, TODAY);
    expect(m.overdueTasks.map((n) => n.id)).toEqual(["overdue"]);
  });

  it("upcomingTasks が正しく分類される", () => {
    const nodes = [
      node("overdue", { type: "Task", status: "Inbox", dueDate: "2026-05-30" }),
      node("today", { type: "Task", status: "Inbox", dueDate: TODAY }),
      node("in7days", { type: "Task", status: "Inbox", dueDate: "2026-06-07" }),
      node("out", { type: "Task", status: "Inbox", dueDate: "2026-06-08" }),
      node("done", { type: "Task", status: "Done", dueDate: TODAY }),
    ];
    const m = buildReportModel(nodes, TODAY);
    expect(m.upcomingTasks.map((n) => n.id)).toEqual(["today", "in7days"]);
  });

  it("doingTasks が正しく分類される", () => {
    const nodes = [
      node("d1", { type: "Task", status: "Doing" }),
      node("d2", { type: "Task", status: "Done" }),
      node("d3", { type: "Task", status: "Inbox" }),
    ];
    const m = buildReportModel(nodes, TODAY);
    expect(m.doingTasks.map((n) => n.id)).toEqual(["d1"]);
  });

  it("nearDeadlineNotStartedTasks が正しく分類される", () => {
    const nodes = [
      node("inbox-soon", { type: "Task", status: "Inbox", dueDate: TODAY }),
      node("next-soon", { type: "Task", status: "Next", dueDate: TODAY }),
      node("doing-soon", { type: "Task", status: "Doing", dueDate: TODAY }),
      node("done-soon", { type: "Task", status: "Done", dueDate: TODAY }),
      node("inbox-far", { type: "Task", status: "Inbox", dueDate: "2026-06-30" }),
    ];
    const m = buildReportModel(nodes, TODAY);
    const ids = m.nearDeadlineNotStartedTasks.map((n) => n.id);
    expect(ids).toContain("inbox-soon");
    expect(ids).toContain("next-soon");
    expect(ids).not.toContain("doing-soon");
    expect(ids).not.toContain("done-soon");
    expect(ids).not.toContain("inbox-far");
  });

  it("noDateTasks が正しく分類される", () => {
    const nodes = [
      node("nodate", { type: "Task", status: "Inbox", startDate: null, dueDate: null }),
      node("hasdue", { type: "Task", status: "Inbox", dueDate: TODAY }),
      node("hasstart", { type: "Task", status: "Inbox", startDate: "2026-05-01" }),
      node("done-nodate", { type: "Task", status: "Done", startDate: null, dueDate: null }),
    ];
    const m = buildReportModel(nodes, TODAY);
    expect(m.noDateTasks.map((n) => n.id)).toEqual(["nodate"]);
  });

  it("recentlyDoneTasks が updatedAt 降順で最大5件になる", () => {
    const nodes = Array.from({ length: 7 }, (_, i) =>
      node(`t${i}`, {
        type: "Task",
        status: "Done",
        updatedAt: `2026-0${i + 1}-01T00:00:00.000Z`,
      }),
    );
    const m = buildReportModel(nodes, TODAY);
    expect(m.recentlyDoneTasks).toHaveLength(5);
    // 降順なので最新が先頭
    expect(m.recentlyDoneTasks[0].id).toBe("t6");
  });

  it("statusBreakdown が NODE_STATUSES 順になる", () => {
    const nodes = [
      node("a", { status: "Done" }),
      node("b", { status: "Inbox" }),
    ];
    const m = buildReportModel(nodes, TODAY);
    expect(m.statusBreakdown.map((s) => s.label)).toEqual([
      "Inbox",
      "Next",
      "Doing",
      "Done",
    ]);
    expect(m.statusBreakdown.find((s) => s.label === "Inbox")?.value).toBe(1);
    expect(m.statusBreakdown.find((s) => s.label === "Done")?.value).toBe(1);
  });

  it("typeBreakdown が NODE_TYPES 順になる", () => {
    const nodes = [
      node("a", { type: "Task" }),
      node("b", { type: "Note" }),
    ];
    const m = buildReportModel(nodes, TODAY);
    expect(m.typeBreakdown.map((t) => t.label)).toEqual([
      "Group",
      "Idea",
      "Note",
      "Decision",
      "Task",
    ]);
    expect(m.typeBreakdown.find((t) => t.label === "Task")?.value).toBe(1);
    expect(m.typeBreakdown.find((t) => t.label === "Note")?.value).toBe(1);
  });
});
