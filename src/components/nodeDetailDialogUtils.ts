import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { SaveStatus } from "@/app/types";

export function saveStatusVariant(saveStatus: SaveStatus) {
  if (saveStatus === "error") {
    return "destructive";
  }
  if (saveStatus === "saved") {
    return "secondary";
  }
  return "outline";
}

export function blurEditableOnEscape(event: Event) {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) {
    return;
  }
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName) ||
    activeElement.closest("[data-keyboard-editing='true']")
  ) {
    event.preventDefault();
    activeElement.blur();
  }
}

export function blurEditableOnEnter(
  event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) {
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  event.currentTarget.blur();
}

export function shouldBlurTitleOnEnter(isAwaitingSecondEnter: boolean) {
  return isAwaitingSecondEnter;
}
