import { describe, expect, it } from "vitest";
import { getCycledValue } from "./cycleValue";

describe("getCycledValue", () => {
  it("moves to the previous or next value", () => {
    expect(getCycledValue(["a", "b", "c"], "b", -1)).toBe("a");
    expect(getCycledValue(["a", "b", "c"], "b", 1)).toBe("c");
  });

  it("wraps from the first value to the last", () => {
    expect(getCycledValue(["a", "b", "c"], "a", -1)).toBe("c");
  });

  it("wraps from the last value to the first", () => {
    expect(getCycledValue(["a", "b", "c"], "c", 1)).toBe("a");
  });
});
