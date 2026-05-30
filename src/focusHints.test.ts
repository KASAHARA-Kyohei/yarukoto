import { describe, expect, it } from "vitest";
import {
  createFocusHintLabel,
  createFocusHintLabels,
  getFocusHintLabelLength,
} from "./focusHints";

describe("focus hint labels", () => {
  it("creates single-key labels first", () => {
    expect(createFocusHintLabels(4)).toEqual(["a", "s", "d", "f"]);
  });

  it("uses fixed-width labels when the candidate count needs two keys", () => {
    const labels = createFocusHintLabels(27);

    expect(getFocusHintLabelLength(27)).toBe(2);
    expect(labels[0]).toBe("aa");
    expect(labels[1]).toBe("as");
    expect(labels[26]).toBe("sa");
    expect(labels).not.toContain("a");
  });

  it("creates a label for a specific fixed width", () => {
    expect(createFocusHintLabel(0, 2)).toBe("aa");
    expect(createFocusHintLabel(1, 2)).toBe("as");
  });
});
