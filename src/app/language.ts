export const LANGUAGES = [
  { id: "ja", label: "日本語" },
  { id: "en", label: "English" },
] as const;

export type Language = (typeof LANGUAGES)[number]["id"];

export const DEFAULT_LANGUAGE: Language = "ja";
export const LANGUAGE_STORAGE_KEY = "yarukoto.language";

export function readStoredLanguage(storage: Pick<Storage, "getItem">) {
  const stored = storage.getItem(LANGUAGE_STORAGE_KEY);
  return LANGUAGES.find(({ id }) => id === stored)?.id ?? DEFAULT_LANGUAGE;
}

export function writeStoredLanguage(
  language: Language,
  storage: Pick<Storage, "setItem">,
) {
  storage.setItem(LANGUAGE_STORAGE_KEY, language);
}
