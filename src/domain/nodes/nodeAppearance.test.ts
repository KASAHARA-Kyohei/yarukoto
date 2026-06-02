import { describe, expect, it } from "vitest";
import {
  getNodeDisplayTitle,
  statusBadgeClass,
  typeBadgeClass,
} from "./nodeAppearance";

describe("node appearance helpers", () => {
  it("returns distinct classes for each type", () => {
    expect(typeBadgeClass("Group")).not.toBe(typeBadgeClass("Task"));
    expect(typeBadgeClass("Idea")).toContain("yellow");
  });

  it("returns distinct classes for each status", () => {
    expect(statusBadgeClass("Inbox")).not.toBe(statusBadgeClass("Done"));
    expect(statusBadgeClass("Doing")).toContain("amber");
  });

  it("returns the title when it has visible text", () => {
    expect(getNodeDisplayTitle({ title: "実装メモ" })).toBe("実装メモ");
  });

  it("returns a fallback for empty titles", () => {
    expect(getNodeDisplayTitle({ title: "" })).toBe("無題");
    expect(getNodeDisplayTitle({ title: "   " })).toBe("無題");
  });
});
