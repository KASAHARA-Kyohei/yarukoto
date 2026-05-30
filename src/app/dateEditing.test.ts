import { describe, expect, it } from "vitest";
import {
  addDaysToDateKey,
  addMonthsToDateKey,
  getInitialDateKey,
  parseDateInput,
} from "./dateEditing";

describe("parseDateInput", () => {
  it("accepts YYYY-MM-DD", () => {
    expect(parseDateInput("2026-05-30")).toEqual({
      error: null,
      value: "2026-05-30",
    });
  });

  it("treats empty input as clear", () => {
    expect(parseDateInput("   ")).toEqual({
      error: null,
      value: null,
    });
  });

  it("rejects invalid formats", () => {
    expect(parseDateInput("2026/05/30")).toEqual({
      error: "YYYY-MM-DD 形式で入力してください。",
      value: null,
    });
  });

  it("rejects impossible dates", () => {
    expect(parseDateInput("2026-02-30")).toEqual({
      error: "存在する日付を入力してください。",
      value: null,
    });
  });
});

describe("date cursor helpers", () => {
  it("initializes from existing date or today fallback", () => {
    expect(getInitialDateKey("2026-05-30")).toBe("2026-05-30");
    expect(getInitialDateKey(null, new Date(2026, 4, 30))).toBe("2026-05-30");
  });

  it("moves by days", () => {
    expect(addDaysToDateKey("2026-05-30", 1)).toBe("2026-05-31");
    expect(addDaysToDateKey("2026-05-30", -7)).toBe("2026-05-23");
  });

  it("moves by months", () => {
    expect(addMonthsToDateKey("2026-05-30", 1)).toBe("2026-06-30");
    expect(addMonthsToDateKey("2026-05-30", -1)).toBe("2026-04-30");
  });
});
