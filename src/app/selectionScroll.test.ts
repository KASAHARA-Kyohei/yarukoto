import { describe, expect, it } from "vitest";
import { getSelectionScrollTop } from "./selectionScroll";

describe("getSelectionScrollTop", () => {
  it("does not scroll when the selection stays within the safe viewport", () => {
    expect(
      getSelectionScrollTop({
        containerHeight: 320,
        containerTop: 100,
        itemBottom: 240,
        itemHeight: 44,
        itemTop: 196,
        scrollTop: 240,
      }),
    ).toBeNull();
  });

  it("scrolls upward when the selection crosses the top padding", () => {
    expect(
      getSelectionScrollTop({
        containerHeight: 320,
        containerTop: 100,
        itemBottom: 170,
        itemHeight: 44,
        itemTop: 126,
        scrollTop: 240,
      }),
    ).toBe(178);
  });

  it("scrolls downward when the selection crosses the bottom padding", () => {
    expect(
      getSelectionScrollTop({
        containerHeight: 320,
        containerTop: 100,
        itemBottom: 382,
        itemHeight: 44,
        itemTop: 338,
        scrollTop: 240,
      }),
    ).toBe(290);
  });
});
