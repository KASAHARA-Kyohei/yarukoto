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

export function isImeCompositionEnter({
  isComposing,
  keyCode,
}: {
  isComposing?: boolean;
  keyCode?: number;
}) {
  return Boolean(isComposing) || keyCode === 229;
}

export function resolveTitleEnterKey({
  isAwaitingSecondEnter,
  isImeEnter,
}: {
  isAwaitingSecondEnter: boolean;
  isImeEnter: boolean;
}) {
  if (isImeEnter) {
    return {
      isAwaitingSecondEnter: true,
      shouldBlur: false,
      shouldPreserveOnNextChange: true,
    };
  }
  if (shouldBlurTitleOnEnter(isAwaitingSecondEnter)) {
    return {
      isAwaitingSecondEnter: false,
      shouldBlur: true,
      shouldPreserveOnNextChange: false,
    };
  }
  return {
    isAwaitingSecondEnter: true,
    shouldBlur: false,
    shouldPreserveOnNextChange: false,
  };
}
