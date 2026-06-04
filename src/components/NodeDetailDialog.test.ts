import { describe, expect, it } from "vitest";
import {
  isImeCompositionEnter,
  resolveTitleEnterKey,
  shouldBlurTitleOnEnter,
} from "./nodeDetailDialogUtils";

describe("shouldBlurTitleOnEnter", () => {
  it("keeps title input focused on the first Enter", () => {
    expect(shouldBlurTitleOnEnter(false)).toBe(false);
  });

  it("blurs title input on the second Enter", () => {
    expect(shouldBlurTitleOnEnter(true)).toBe(true);
  });
});

describe("isImeCompositionEnter", () => {
  it("detects native composing Enter", () => {
    expect(isImeCompositionEnter({ isComposing: true })).toBe(true);
  });

  it("detects Windows IME Enter by keyCode 229", () => {
    expect(isImeCompositionEnter({ keyCode: 229 })).toBe(true);
  });

  it("does not treat ordinary Enter as IME composition", () => {
    expect(isImeCompositionEnter({ isComposing: false, keyCode: 13 })).toBe(
      false,
    );
  });
});

describe("resolveTitleEnterKey", () => {
  it("keeps title input focused on the first ordinary Enter", () => {
    expect(
      resolveTitleEnterKey({
        isAwaitingSecondEnter: false,
        isImeEnter: false,
      }),
    ).toEqual({
      isAwaitingSecondEnter: true,
      shouldBlur: false,
      shouldPreserveOnNextChange: false,
    });
  });

  it("blurs title input on the second ordinary Enter", () => {
    expect(
      resolveTitleEnterKey({
        isAwaitingSecondEnter: true,
        isImeEnter: false,
      }),
    ).toEqual({
      isAwaitingSecondEnter: false,
      shouldBlur: true,
      shouldPreserveOnNextChange: false,
    });
  });

  it("treats IME confirmation Enter as the first title Enter", () => {
    expect(
      resolveTitleEnterKey({
        isAwaitingSecondEnter: false,
        isImeEnter: true,
      }),
    ).toEqual({
      isAwaitingSecondEnter: true,
      shouldBlur: false,
      shouldPreserveOnNextChange: true,
    });
  });

  it("blurs on the ordinary Enter after an IME confirmation Enter", () => {
    const imeEnter = resolveTitleEnterKey({
      isAwaitingSecondEnter: false,
      isImeEnter: true,
    });

    expect(
      resolveTitleEnterKey({
        isAwaitingSecondEnter: imeEnter.isAwaitingSecondEnter,
        isImeEnter: false,
      }).shouldBlur,
    ).toBe(true);
  });
});
