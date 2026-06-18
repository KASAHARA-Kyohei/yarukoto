const INVALID_FILE_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
const TRAILING_DOTS_OR_SPACES = /[.\s]+$/g;

export function createProjectExportFileName(title: string) {
  const normalizedTitle = title
    .trim()
    .replace(INVALID_FILE_NAME_CHARS, "-")
    .replace(/\s+/g, " ")
    .replace(TRAILING_DOTS_OR_SPACES, "");

  return `yarukoto-${normalizedTitle || "project"}.json`;
}

export function ensureJsonFilePath(path: string) {
  return path.toLowerCase().endsWith(".json") ? path : `${path}.json`;
}
