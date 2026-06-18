import { describe, expect, it } from "vitest";
import {
  buildCalendarMonthModel,
  MAX_VISIBLE_DAY_ITEMS,
} from "./calendar";
import type { NodeType, YarukotoNode } from "./types";

function node(
  id: string,
  {
    dueDate = null,
    parentId = null,
    startDate = null,
    status = "Inbox",
    type = "Task",
  }: Partial<
    Pick<YarukotoNode, "dueDate" | "parentId" | "startDate" | "status" | "type">
  > = {},
): YarukotoNode {
  return {
    id,
    parentId,
    title: id,
    type: type as NodeType,
    status,
    priority: "none",
    memo: "",
    startDate,
    dueDate,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("buildCalendarMonthModel", () => {
  it("builds a six-week month grid", () => {
    const model = buildCalendarMonthModel([], new Date(2026, 5, 1), "2026-06-10");

    expect(model.days).toHaveLength(42);
    expect(model.weeks).toHaveLength(6);
    expect(model.weeks[0]?.start).toBe("2026-05-31");
    expect(model.weeks[5]?.end).toBe("2026-07-11");
  });

  it("splits ranged tasks across weeks and labels only the first visible segment", () => {
    const model = buildCalendarMonthModel(
      [node("range", { startDate: "2026-06-04", dueDate: "2026-06-10" })],
      new Date(2026, 5, 1),
      "2026-06-10",
    );

    expect(model.rangeSegmentsByWeek.get(0)).toEqual([
      expect.objectContaining({
        colSpan: 3,
        colStart: 4,
        continuesLeft: false,
        continuesRight: true,
        showsTitle: true,
      }),
    ]);
    expect(model.rangeSegmentsByWeek.get(1)).toEqual([
      expect.objectContaining({
        colSpan: 4,
        colStart: 0,
        continuesLeft: true,
        continuesRight: false,
        showsTitle: false,
      }),
    ]);
  });

  it("classifies due-only, start-only, and invalid ranges into day items", () => {
    const model = buildCalendarMonthModel(
      [
        node("due-only", { dueDate: "2026-06-05" }),
        node("start-only", { startDate: "2026-06-05" }),
        node("invalid", { startDate: "2026-06-08", dueDate: "2026-06-05" }),
      ],
      new Date(2026, 5, 1),
      "2026-06-10",
    );

    expect(
      (model.singleDayItemsByDate.get("2026-06-05") ?? []).map((item) => [
        item.node.id,
        item.kind,
      ]),
    ).toEqual([
      ["invalid", "invalid"],
      ["due-only", "due"],
      ["start-only", "start"],
    ]);
  });

  it("tracks overflow counts for single-day items", () => {
    const nodes = Array.from({ length: MAX_VISIBLE_DAY_ITEMS + 2 }, (_, index) =>
      node(`n-${index}`, { dueDate: "2026-06-12" }),
    );
    const model = buildCalendarMonthModel(nodes, new Date(2026, 5, 1), "2026-06-10");

    expect(model.singleDayOverflowByDate.get("2026-06-12")).toBe(2);
  });
});
