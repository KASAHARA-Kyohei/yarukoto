export const THEME_STORAGE_KEY = "yarukoto.theme";

export const THEMES = [
  { id: "light", label: "Light" },
  { id: "tokyo-night", label: "Tokyo Night" },
  { id: "soft-light", label: "Soft Light" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function isThemeId(value: string): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function getNextThemeId(currentThemeId: ThemeId): ThemeId {
  const index = THEMES.findIndex((theme) => theme.id === currentThemeId);
  return THEMES[(index + 1) % THEMES.length].id;
}

export function parseStoredTheme(value: string | null): ThemeId {
  return value && isThemeId(value) ? value : "light";
}

export function readStoredTheme(storage: Storage = localStorage): ThemeId {
  return parseStoredTheme(storage.getItem(THEME_STORAGE_KEY));
}

export function writeStoredTheme(
  themeId: ThemeId,
  storage: Storage = localStorage,
) {
  storage.setItem(THEME_STORAGE_KEY, themeId);
}
