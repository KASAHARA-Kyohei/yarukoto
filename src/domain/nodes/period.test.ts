import { describe, expect, it } from "vitest";
import {
  getNodePeriodDates,
  getPeriodBarStyle,
  getPeriodBounds,
  getTimelineBounds,
  getTimelineBoundsFromRanges,
  getTimelineMarkers,
  getTimelineModeFromRanges,
  getTimelinePeriodColumnMinWidth,
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
      endMarkerLeft: "44.44444444444444%",
      left: "0%",
      truncatedLeft: false,
      truncatedRight: false,
      width: "max(6px, 44.44444444444444%)",
    });
  });

  it("returns null style when no dates exist", () => {
    expect(getPeriodBounds([{ startDate: null, dueDate: null }])).toBeNull();
    expect(getPeriodBarStyle({ startDate: null, dueDate: null }, null)).toBeNull();
  });

  it("selects timeline modes from visible span", () => {
    expect(
      getTimelineModeFromRanges([{ start: "2026-06-01", end: "2026-06-15" }]),
    ).toBe("short");
    expect(
      getTimelineModeFromRanges([{ start: "2026-06-01", end: "2026-08-15" }]),
    ).toBe("medium");
    expect(
      getTimelineModeFromRanges([{ start: "2026-01-01", end: "2026-10-01" }]),
    ).toBe("long");
    expect(
      getTimelineModeFromRanges([{ start: "2026-01-01", end: "2027-06-01" }]),
    ).toBe("xlong");
  });

  it("widens the period column for longer modes", () => {
    expect(getTimelinePeriodColumnMinWidth("short")).toBe(320);
    expect(getTimelinePeriodColumnMinWidth("medium")).toBe(520);
    expect(getTimelinePeriodColumnMinWidth("long")).toBe(720);
    expect(getTimelinePeriodColumnMinWidth("xlong")).toBe(720);
  });

  it("aligns short bounds to weeks and medium bounds to months", () => {
    expect(
      getTimelineBounds(
        [{ startDate: "2026-06-03", dueDate: "2026-06-10" }],
        "2026-06-10",
      ),
    ).toEqual({
      end: "2026-06-14",
      start: "2026-06-01",
    });

    expect(
      getTimelineBoundsFromRanges(
        [{ start: "2026-06-03", end: "2026-08-10" }],
        "2026-06-10",
      ),
    ).toEqual({
      end: "2026-08-31",
      start: "2026-06-01",
    });
  });

  it("uses a 12-month focus window for xlong ranges", () => {
    expect(
      getTimelineBoundsFromRanges(
        [{ start: "2025-01-01", end: "2027-06-01" }],
        "2026-05-31",
      ),
    ).toEqual({
      end: "2027-04-30",
      start: "2026-05-01",
    });
  });

  it("returns markers and today line for each mode", () => {
    const shortBounds = getTimelineBoundsFromRanges([
      { start: "2026-06-01", end: "2026-06-14" },
    ]);
    expect(getTimelineMarkers(shortBounds, "short")).toEqual([
      { dateKey: "2026-06-08", kind: "week", label: null, left: "53.84615384615385%" },
    ]);
    expect(getTodayLineStyle(shortBounds, "2026-06-10")).toEqual({
      left: "69.23076923076923%",
    });

    const longBounds = getTimelineBoundsFromRanges(
      [{ start: "2026-01-01", end: "2026-10-01" }],
      "2026-06-10",
    );
    expect(getTimelineMarkers(longBounds, "long")).toEqual(
      expect.arrayContaining([
        {
          dateKey: "2026-04-01",
          kind: "quarter",
          label: "2026 Q2",
          left: expect.any(String),
        },
        {
          dateKey: "2026-05-01",
          kind: "month",
          label: null,
          left: expect.any(String),
        },
      ]),
    );
  });

  it("clips bars at the focus window edges for xlong", () => {
    const bounds = getTimelineBoundsFromRanges(
      [{ start: "2025-01-01", end: "2027-06-01" }],
      "2026-05-31",
    );

    const leftClipped = getPeriodBarStyle(
      { startDate: "2026-01-01", dueDate: "2026-06-15" },
      bounds,
    );
    expect(leftClipped).toMatchObject({
      left: "0%",
      truncatedLeft: true,
      truncatedRight: false,
    });
    expect(leftClipped?.endMarkerLeft).toBe("12.362637362637363%");
    expect(leftClipped?.width).toBe("max(6px, 12.362637362637363%)");

    expect(
      getPeriodBarStyle({ startDate: "2027-12-01", dueDate: "2028-01-01" }, bounds),
    ).toEqual({
      endMarkerLeft: "100%",
      left: "calc(100% - 10px)",
      truncatedLeft: false,
      truncatedRight: true,
      width: "10px",
    });
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
