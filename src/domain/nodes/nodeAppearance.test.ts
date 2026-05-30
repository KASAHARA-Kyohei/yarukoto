import { describe, expect, it } from "vitest";
import { statusBadgeClass, typeBadgeClass } from "./nodeAppearance";

describe("node appearance helpers", () => {
  it("returns distinct classes for each type", () => {
    expect(typeBadgeClass("Group")).not.toBe(typeBadgeClass("Task"));
    expect(typeBadgeClass("Idea")).toContain("yellow");
  });

  it("returns distinct classes for each status", () => {
    expect(statusBadgeClass("Inbox")).not.toBe(statusBadgeClass("Done"));
    expect(statusBadgeClass("Doing")).toContain("amber");
  });
});
