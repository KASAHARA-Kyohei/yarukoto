import { useCallback, useEffect, useState } from "react";
import {
  type ThemeId,
  getNextThemeId,
  readStoredTheme,
  writeStoredTheme,
} from "@/app/theme";

export function useTheme() {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => readStoredTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = themeId;
    writeStoredTheme(themeId);
  }, [themeId]);

  const setThemeId = useCallback((nextThemeId: ThemeId) => {
    setThemeIdState(nextThemeId);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeIdState((currentThemeId) => getNextThemeId(currentThemeId));
  }, []);

  return { cycleTheme, setThemeId, themeId };
}
