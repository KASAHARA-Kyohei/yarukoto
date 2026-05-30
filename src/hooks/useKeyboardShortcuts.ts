import { useCallback, useEffect, useRef, type RefObject } from "react";
import { getChildren } from "../tree";
import {
  DETAIL_FIELDS,
  type ActivePane,
  type DetailField,
  type FlatTreeNode,
  type YarukotoNode,
} from "../types";

export function isEditableTagName(tagName: string) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
}

export function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  if (target.closest("[data-keyboard-editing='true']")) {
    return true;
  }
  return isEditableTagName(target.tagName);
}

export function getNextPane(activePane: ActivePane, direction: 1 | -1) {
  const panes: ActivePane[] = ["projects", "center"];
  const index = panes.indexOf(activePane);
  const nextIndex = Math.min(panes.length - 1, Math.max(0, index + direction));
  return panes[nextIndex];
}

export function getNextDetailField(
  activeDetailField: DetailField,
  direction: 1 | -1,
) {
  const index = DETAIL_FIELDS.indexOf(activeDetailField);
  const nextIndex = Math.min(
    DETAIL_FIELDS.length - 1,
    Math.max(0, index + direction),
  );
  return DETAIL_FIELDS[nextIndex];
}

export function useKeyboardShortcuts({
  activeDetailField,
  activePane,
  createChild,
  createRoot,
  createSiblingBelow,
  deleteSelected,
  detailFieldRefs,
  expandedIds,
  indentSelected,
  isDetailDialogOpen,
  isFocusHintOpen,
  isMutating,
  isShortcutHelpOpen,
  moveSelectedDown,
  moveSelectedUp,
  nodes,
  outdentSelected,
  onCloseDetailDialog,
  onCloseShortcutHelp,
  onOpenDetailDialog,
  onOpenFocusHint,
  onOpenShortcutHelp,
  roots,
  selectNode,
  setActiveDetailField,
  setActivePane,
  selectedId,
  selectedNode,
  toggleExpanded,
  visibleNodes,
}: {
  activeDetailField: DetailField;
  activePane: ActivePane;
  createChild: () => Promise<unknown>;
  createRoot: () => Promise<unknown>;
  createSiblingBelow: () => Promise<unknown>;
  deleteSelected: () => Promise<unknown>;
  detailFieldRefs: {
    dueDate: RefObject<HTMLButtonElement | null>;
    memo: RefObject<HTMLTextAreaElement | null>;
    startDate: RefObject<HTMLButtonElement | null>;
    status: RefObject<HTMLButtonElement | null>;
    title: RefObject<HTMLInputElement | null>;
    type: RefObject<HTMLButtonElement | null>;
  };
  expandedIds: Set<string>;
  indentSelected: () => Promise<void>;
  isDetailDialogOpen: boolean;
  isFocusHintOpen: boolean;
  isMutating: boolean;
  isShortcutHelpOpen: boolean;
  moveSelectedDown: () => Promise<void>;
  moveSelectedUp: () => Promise<void>;
  nodes: YarukotoNode[];
  onCloseDetailDialog: () => void;
  onCloseShortcutHelp: () => void;
  onOpenDetailDialog: () => void;
  onOpenFocusHint: () => void;
  onOpenShortcutHelp: () => void;
  outdentSelected: () => Promise<void>;
  roots: YarukotoNode[];
  selectNode: (nodeId: string) => void;
  setActiveDetailField: (field: DetailField) => void;
  setActivePane: (pane: ActivePane) => void;
  selectedId: string | null;
  selectedNode: YarukotoNode | null;
  toggleExpanded: (nodeId: string) => void;
  visibleNodes: FlatTreeNode[];
}) {
  const lastDRef = useRef(0);

  const movePane = useCallback(
    (direction: 1 | -1) => {
      setActivePane(getNextPane(activePane, direction));
    },
    [activePane, setActivePane],
  );

  const moveRootSelection = useCallback(
    (direction: 1 | -1) => {
      if (roots.length === 0) {
        return;
      }
      const currentIndex = roots.findIndex((root) => root.id === selectedId);
      const fallbackIndex = direction > 0 ? 0 : roots.length - 1;
      const nextIndex =
        currentIndex === -1
          ? fallbackIndex
          : Math.min(roots.length - 1, Math.max(0, currentIndex + direction));
      selectNode(roots[nextIndex].id);
    },
    [roots, selectNode, selectedId],
  );

  const moveDetailField = useCallback(
    (direction: 1 | -1) => {
      setActiveDetailField(getNextDetailField(activeDetailField, direction));
    },
    [activeDetailField, setActiveDetailField],
  );

  const focusActiveDetailField = useCallback(() => {
    detailFieldRefs[activeDetailField].current?.focus();
  }, [activeDetailField, detailFieldRefs]);

  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (!selectedId || visibleNodes.length === 0) {
        return;
      }
      const index = visibleNodes.findIndex(({ node }) => node.id === selectedId);
      const nextIndex = Math.min(
        visibleNodes.length - 1,
        Math.max(0, index + direction),
      );
      const nextNode = visibleNodes[nextIndex]?.node;
      if (nextNode) {
        selectNode(nextNode.id);
      }
    },
    [selectNode, selectedId, visibleNodes],
  );

  const handleH = useCallback(() => {
    if (!selectedNode) {
      return;
    }
    const children = getChildren(nodes, selectedNode.id);
    if (children.length > 0 && expandedIds.has(selectedNode.id)) {
      toggleExpanded(selectedNode.id);
      return;
    }
    if (selectedNode.parentId) {
      selectNode(selectedNode.parentId);
    }
  }, [expandedIds, nodes, selectNode, selectedNode, toggleExpanded]);

  const handleL = useCallback(() => {
    if (!selectedNode) {
      return;
    }
    const children = getChildren(nodes, selectedNode.id);
    if (children.length === 0) {
      return;
    }
    if (!expandedIds.has(selectedNode.id)) {
      toggleExpanded(selectedNode.id);
      return;
    }
    selectNode(children[0].id);
  }, [expandedIds, nodes, selectNode, selectedNode, toggleExpanded]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isShortcutHelpOpen) {
        if (event.key === "Escape" || event.key === "?") {
          event.preventDefault();
          onCloseShortcutHelp();
        }
        return;
      }
      if (isFocusHintOpen) {
        return;
      }
      if (isEditableTarget(event.target)) {
        if (event.key === "Escape") {
          (event.target as HTMLElement).blur();
        }
        return;
      }
      if (isMutating) {
        return;
      }

      const run = (action: () => void | Promise<unknown>) => {
        event.preventDefault();
        void action();
      };

      if (event.key === "?") {
        run(onOpenShortcutHelp);
        return;
      }
      if (event.key === "f") {
        run(onOpenFocusHint);
        return;
      }
      if (isDetailDialogOpen) {
        switch (event.key) {
          case "j":
            run(() => moveDetailField(1));
            break;
          case "k":
            run(() => moveDetailField(-1));
            break;
          case "i":
          case "Enter":
            run(focusActiveDetailField);
            break;
          case "Escape":
            run(onCloseDetailDialog);
            break;
        }
        return;
      }
      if (event.ctrlKey && event.key === "h") {
        run(() => movePane(-1));
        return;
      }
      if (event.ctrlKey && event.key === "l") {
        run(() => movePane(1));
        return;
      }
      if (event.key === "Tab") {
        run(() => movePane(event.shiftKey ? -1 : 1));
        return;
      }
      if (event.key === "R") {
        run(createRoot);
        return;
      }

      if (event.key !== "d") {
        lastDRef.current = 0;
      }

      if (activePane === "projects") {
        switch (event.key) {
          case "j":
            run(() => moveRootSelection(1));
            break;
          case "k":
            run(() => moveRootSelection(-1));
            break;
          case "l":
          case "Enter":
            run(() => setActivePane("center"));
            break;
          case "o":
          case "a":
            run(createRoot);
            break;
          case "Escape":
            run(() => setActivePane("center"));
            break;
        }
        return;
      }

      switch (event.key) {
        case "j":
          run(() => moveSelection(1));
          break;
        case "k":
          run(() => moveSelection(-1));
          break;
        case "h":
          run(handleH);
          break;
        case "l":
          run(handleL);
          break;
        case "i":
          run(onOpenDetailDialog);
          break;
        case "Enter":
          run(onOpenDetailDialog);
          break;
        case "a":
          run(createChild);
          break;
        case "o":
          run(createSiblingBelow);
          break;
        case "d": {
          const currentTime = Date.now();
          if (currentTime - lastDRef.current < 650) {
            run(deleteSelected);
            lastDRef.current = 0;
          } else {
            lastDRef.current = currentTime;
          }
          break;
        }
        case "J":
          run(moveSelectedDown);
          break;
        case "K":
          run(moveSelectedUp);
          break;
        case ">":
          run(indentSelected);
          break;
        case "<":
          run(outdentSelected);
          break;
        case "Escape":
          run(onCloseDetailDialog);
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activePane,
    createChild,
    createRoot,
    createSiblingBelow,
    deleteSelected,
    focusActiveDetailField,
    handleH,
    handleL,
    indentSelected,
    isDetailDialogOpen,
    isFocusHintOpen,
    isMutating,
    isShortcutHelpOpen,
    moveDetailField,
    moveSelectedDown,
    moveSelectedUp,
    movePane,
    moveRootSelection,
    moveSelection,
    onCloseDetailDialog,
    onCloseShortcutHelp,
    onOpenDetailDialog,
    onOpenFocusHint,
    onOpenShortcutHelp,
    outdentSelected,
    setActivePane,
  ]);
}
