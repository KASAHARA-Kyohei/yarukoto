import { describe, expect, it } from "vitest";
import {
  createProjectExportFileName,
  ensureJsonFilePath,
} from "./treeFile";

describe("tree file helpers", () => {
  it("builds a json file name from the project title", () => {
    expect(createProjectExportFileName("Project Alpha")).toBe(
      "yarukoto-Project Alpha.json",
    );
  });

  it("replaces invalid file-name characters and falls back for blank titles", () => {
    expect(createProjectExportFileName('Roadmap: Q3/Q4*')).toBe(
      "yarukoto-Roadmap- Q3-Q4-.json",
    );
    expect(createProjectExportFileName("   ")).toBe("yarukoto-project.json");
  });

  it("adds a json extension only when missing", () => {
    expect(ensureJsonFilePath("/tmp/project")).toBe("/tmp/project.json");
    expect(ensureJsonFilePath("/tmp/project.JSON")).toBe("/tmp/project.JSON");
  });
});
