import { describe, expect, it } from "vitest";
import { nodeInsertParams, toNode, type DbNode } from "./nodeMapper";
import type { YarukotoNode } from "../domain/nodes/types";

describe("nodeMapper", () => {
  it("maps start_date to startDate", () => {
    const row: DbNode = {
      id: "node-1",
      parent_id: null,
      title: "期間つきタスク",
      type: "Task",
      status: "Doing",
      memo: "memo",
      start_date: "2026-05-30",
      due_date: "2026-06-02",
      sort_order: 0,
      created_at: "2026-05-30T00:00:00.000Z",
      updated_at: "2026-05-30T00:00:00.000Z",
    };

    expect(toNode(row)).toMatchObject({
      dueDate: "2026-06-02",
      startDate: "2026-05-30",
    });
  });

  it("includes startDate in insert params before dueDate", () => {
    const node: YarukotoNode = {
      id: "node-1",
      parentId: null,
      title: "期間つきタスク",
      type: "Task",
      status: "Doing",
      memo: "memo",
      startDate: "2026-05-30",
      dueDate: "2026-06-02",
      sortOrder: 0,
      createdAt: "2026-05-30T00:00:00.000Z",
      updatedAt: "2026-05-30T00:00:00.000Z",
    };

    expect(nodeInsertParams(node)).toEqual([
      "node-1",
      null,
      "期間つきタスク",
      "Task",
      "Doing",
      "memo",
      "2026-05-30",
      "2026-06-02",
      0,
      "2026-05-30T00:00:00.000Z",
      "2026-05-30T00:00:00.000Z",
    ]);
  });
});
