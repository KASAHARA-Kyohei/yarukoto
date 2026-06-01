import { describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  getNextThemeId,
  parseStoredTheme,
  readStoredTheme,
  writeStoredTheme,
} from "./theme";

describe("theme helpers", () => {
  it("cycles through the available themes", () => {
    expect(getNextThemeId("light")).toBe("tokyo-night");
    expect(getNextThemeId("tokyo-night")).toBe("soft-light");
    expect(getNextThemeId("soft-light")).toBe("light");
  });

  it("falls back to light for invalid stored values", () => {
    expect(parseStoredTheme(null)).toBe("light");
    expect(parseStoredTheme("unknown")).toBe("light");
  });

  it("reads and writes the theme from storage", () => {
    const storage = new Map<string, string>();
    const testStorage = {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      key: (index: number) => Array.from(storage.keys())[index] ?? null,
      get length() {
        return storage.size;
      },
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    } as Storage;

    expect(readStoredTheme(testStorage)).toBe("light");
    writeStoredTheme("tokyo-night", testStorage);
    expect(storage.get(THEME_STORAGE_KEY)).toBe("tokyo-night");
    expect(readStoredTheme(testStorage)).toBe("tokyo-night");
  });
});
