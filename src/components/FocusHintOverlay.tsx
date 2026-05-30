import { useEffect, useState } from "react";
import { createFocusHintLabels } from "@/app/focusHints";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']",
  "[role='tab']",
].join(",");

type FocusHint = {
  element: HTMLElement;
  label: string;
  left: number;
  top: number;
};

function isVisibleElement(element: HTMLElement) {
  if (element.closest("[data-focus-hint-ignore='true']")) {
    return false;
  }
  if (element.getAttribute("aria-hidden") === "true") {
    return false;
  }
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }
  if (
    rect.bottom < 0 ||
    rect.right < 0 ||
    rect.top > window.innerHeight ||
    rect.left > window.innerWidth
  ) {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none";
}

function collectHints() {
  const scope =
    document.querySelector<HTMLElement>("[data-slot='dialog-content']") ??
    document;
  const elements = Array.from(
    scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(isVisibleElement);
  const labels = createFocusHintLabels(elements.length);
  return elements.map((element, index) => {
    const rect = element.getBoundingClientRect();
    return {
      element,
      label: labels[index],
      left: Math.max(4, rect.left + window.scrollX),
      top: Math.max(4, rect.top + window.scrollY),
    };
  });
}

export function FocusHintOverlay({
  onClose,
  onFocused,
}: {
  onClose: () => void;
  onFocused: (element: HTMLElement) => void;
}) {
  const [hints, setHints] = useState<FocusHint[]>([]);
  const [typedKeys, setTypedKeys] = useState("");

  useEffect(() => {
    const updateHints = () => setHints(collectHints());
    updateHints();
    window.addEventListener("resize", updateHints);
    window.addEventListener("scroll", updateHints, true);
    return () => {
      window.removeEventListener("resize", updateHints);
      window.removeEventListener("scroll", updateHints, true);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        event.stopPropagation();
        setTypedKeys((current) => current.slice(0, -1));
        return;
      }
      if (!/^[a-z]$/i.test(event.key)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const nextKeys = `${typedKeys}${event.key.toLowerCase()}`;
      const exactHint = hints.find((hint) => hint.label === nextKeys);
      if (exactHint) {
        exactHint.element.focus();
        exactHint.element.scrollIntoView({ block: "nearest", inline: "nearest" });
        exactHint.element.dataset.focusHintTarget = "true";
        window.setTimeout(() => {
          delete exactHint.element.dataset.focusHintTarget;
        }, 1_200);
        onFocused(exactHint.element);
        onClose();
        return;
      }

      const hasMatch = hints.some((hint) => hint.label.startsWith(nextKeys));
      setTypedKeys(hasMatch ? nextKeys : event.key.toLowerCase());
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [hints, onClose, onFocused, typedKeys]);

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none"
      data-focus-hint-ignore="true"
    >
      <div className="absolute right-3 bottom-3 rounded-md border border-border bg-popover px-3 py-2 text-xs text-muted-foreground shadow-md">
        {typedKeys ? `${typedKeys}...` : "focus hint"}
      </div>
      {hints.map((hint) => (
        <div
          className="absolute rounded border border-primary/50 bg-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-primary-foreground shadow"
          key={hint.label}
          style={{ left: hint.left, top: hint.top }}
        >
          {hint.label}
        </div>
      ))}
    </div>
  );
}
