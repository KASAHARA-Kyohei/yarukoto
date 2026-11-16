import { describe, expect, it } from "vitest";
import { LANGUAGE_STORAGE_KEY, readStoredLanguage, writeStoredLanguage } from "./language";

describe("the display language preference", () => {
  it.each([null, "unknown"])("defaults to Japanese for a stored value of %s", (value) => {
    expect(readStoredLanguage({ getItem: () => value })).toBe("ja");
  });

  it("restores the selected language from storage", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => void data.set(key, value),
    };

    writeStoredLanguage("en", storage);
    expect(data.get(LANGUAGE_STORAGE_KEY)).toBe("en");
    expect(readStoredLanguage(storage)).toBe("en");

    writeStoredLanguage("ja", storage);
    expect(readStoredLanguage(storage)).toBe("ja");
  });
});
