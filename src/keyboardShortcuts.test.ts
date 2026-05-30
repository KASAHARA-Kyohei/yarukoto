import { describe, expect, it } from "vitest";
import {
  getNextDetailField,
  getNextPane,
  isEditableTagName,
} from "./hooks/useKeyboardShortcuts";

describe("isEditableTagName", () => {
  it("treats form fields as editable targets", () => {
    expect(isEditableTagName("INPUT")).toBe(true);
    expect(isEditableTagName("TEXTAREA")).toBe(true);
    expect(isEditableTagName("SELECT")).toBe(true);
  });

  it("allows shortcuts on ordinary controls", () => {
    expect(isEditableTagName("BUTTON")).toBe(false);
    expect(isEditableTagName("DIV")).toBe(false);
  });

  it("moves between the remaining two app panes", () => {
    expect(getNextPane("projects", 1)).toBe("center");
    expect(getNextPane("center", 1)).toBe("center");
    expect(getNextPane("center", -1)).toBe("projects");
    expect(getNextPane("projects", -1)).toBe("projects");
  });

  it("moves through detail dialog fields", () => {
    expect(getNextDetailField("title", 1)).toBe("type");
    expect(getNextDetailField("dueDate", 1)).toBe("memo");
    expect(getNextDetailField("title", -1)).toBe("title");
    expect(getNextDetailField("memo", 1)).toBe("memo");
  });
});
