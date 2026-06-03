import { describe, expect, it } from "vitest";
import { shouldBlurTitleOnEnter } from "./nodeDetailDialogUtils";

describe("shouldBlurTitleOnEnter", () => {
  it("keeps title input focused on the first Enter", () => {
    expect(shouldBlurTitleOnEnter(false)).toBe(false);
  });

  it("blurs title input on the second Enter", () => {
    expect(shouldBlurTitleOnEnter(true)).toBe(true);
  });
});
