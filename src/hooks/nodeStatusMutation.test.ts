import { describe, expect, it, vi } from "vitest";
import { changeNodeStatusOptimistically } from "./nodeStatusMutation";
import type { YarukotoNode } from "@/domain/nodes/types";

const task: YarukotoNode = {
  id: "task",
  parentId: null,
  title: "Task",
  type: "Task",
  status: "Inbox",
  priority: "none",
  memo: "",
  startDate: null,
  dueDate: null,
  sortOrder: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("changeNodeStatusOptimistically", () => {
  it("applies the new status before persisting it", async () => {
    let current = [task];
    const persist = vi.fn(async () => {
      expect(current[0].status).toBe("Doing");
    });

    await expect(
      changeNodeStatusOptimistically({
        applyNodes: (nodes) => {
          current = nodes;
        },
        nodeId: task.id,
        nodes: current,
        persist,
        status: "Doing",
        updatedAt: "2026-01-02T00:00:00.000Z",
      }),
    ).resolves.toBe(true);

    expect(persist).toHaveBeenCalledTimes(1);
    expect(current[0].updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("does not persist an unchanged status", async () => {
    const persist = vi.fn();
    const applyNodes = vi.fn();

    await expect(
      changeNodeStatusOptimistically({
        applyNodes,
        nodeId: task.id,
        nodes: [task],
        persist,
        status: "Inbox",
        updatedAt: "2026-01-02T00:00:00.000Z",
      }),
    ).resolves.toBe(false);

    expect(applyNodes).not.toHaveBeenCalled();
    expect(persist).not.toHaveBeenCalled();
  });

  it("restores the previous nodes when persistence fails", async () => {
    let current = [task];
    const failure = new Error("database unavailable");

    await expect(
      changeNodeStatusOptimistically({
        applyNodes: (nodes) => {
          current = nodes;
        },
        nodeId: task.id,
        nodes: current,
        persist: async () => {
          throw failure;
        },
        status: "Done",
        updatedAt: "2026-01-02T00:00:00.000Z",
      }),
    ).rejects.toBe(failure);

    expect(current).toEqual([task]);
  });
});
