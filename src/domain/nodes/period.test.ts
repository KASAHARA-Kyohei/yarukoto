import { describe, expect, it } from "vitest";
import {
  getNodePeriodDates,
  getPeriodBarStyle,
  getPeriodBounds,
  getTimelineBounds,
  getTimelineBoundsFromRanges,
  getTimelineWeekMarkers,
  getTodayLineStyle,
  isInvalidDateRange,
  mergePeriodRanges,
} from "./period";

describe("period helpers", () => {
  it("detects invalid date ranges", () => {
    expect(isInvalidDateRange({ startDate: "2026-06-02", dueDate: "2026-06-01" })).toBe(true);
    expect(isInvalidDateRange({ startDate: "2026-06-01", dueDate: "2026-06-02" })).toBe(false);
  });

  it("uses dueDate-only nodes as one-day periods", () => {
    expect(getNodePeriodDates({ startDate: null, dueDate: "2026-06-01" })).toEqual({
      end: "2026-06-01",
      start: "2026-06-01",
    });
  });

  it("calculates bounds and bar style for ranged nodes", () => {
    const bounds = getPeriodBounds([
      { startDate: "2026-06-01", dueDate: "2026-06-05" },
      { startDate: null, dueDate: "2026-06-10" },
    ]);

    expect(bounds).toEqual({ start: "2026-06-01", end: "2026-06-10" });
    expect(getPeriodBarStyle({ startDate: "2026-06-01", dueDate: "2026-06-05" }, bounds)).toEqual({
      left: "0%",
      width: "44.44444444444444%",
    });
  });

  it("returns null style when no dates exist", () => {
    expect(getPeriodBounds([{ startDate: null, dueDate: null }])).toBeNull();
    expect(getPeriodBarStyle({ startDate: null, dueDate: null }, null)).toBeNull();
  });

  it("aligns timeline bounds to work weeks", () => {
    expect(
      getTimelineBounds([
        { startDate: "2026-06-03", dueDate: "2026-06-10" },
      ]),
    ).toEqual({
      end: "2026-06-14",
      start: "2026-06-01",
    });
  });

  it("returns markers and today line within timeline bounds", () => {
    const bounds = getTimelineBoundsFromRanges([
      { start: "2026-06-01", end: "2026-06-14" },
    ]);

    expect(getTimelineWeekMarkers(bounds)).toEqual([
      { dateKey: "2026-06-08", left: "53.84615384615385%" },
    ]);
    expect(getTodayLineStyle(bounds, "2026-06-10")).toEqual({
      left: "69.23076923076923%",
    });
    expect(getTodayLineStyle(bounds, "2026-07-01")).toBeNull();
  });

  it("merges aggregate child ranges", () => {
    expect(
      mergePeriodRanges([
        { start: "2026-06-04", end: "2026-06-08" },
        { start: "2026-06-01", end: "2026-06-05" },
      ]),
    ).toEqual({
      end: "2026-06-08",
      start: "2026-06-01",
    });
  });
});
