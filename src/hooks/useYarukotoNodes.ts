import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nodeRepository } from "../repositories/nodeRepository";
import type { PendingUndoDelete, SaveStatus } from "@/app/types";
import {
  findRootId,
  getRootNodes,
  getScopedNodes,
  getVisibleTree,
} from "@/domain/nodes/tree";
import type { YarukotoNode } from "@/domain/nodes/types";
import {
  getExpandedIdsForLoadedTree,
  getExpandedIdsForSelection,
  resolveLoadedTreeState,
} from "./yarukotoNodeState";
import { usePendingUndoDeleteExpiry } from "./usePendingUndoDeleteExpiry";
import { useYarukotoNodeMutations } from "./useYarukotoNodeMutations";

export function useYarukotoNodes() {
  const [nodes, setNodes] = useState<YarukotoNode[]>([]);
  const [activeRootId, setActiveRootId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [pendingUndoDelete, setPendingUndoDelete] =
    useState<PendingUndoDelete | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const activeRootIdRef = useRef<string | null>(null);

  const roots = useMemo(() => getRootNodes(nodes), [nodes]);
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? null,
    [nodes, selectedId],
  );
  const visibleNodes = useMemo(
    () => getVisibleTree(nodes, activeRootId, expandedIds),
    [activeRootId, expandedIds, nodes],
  );
  const scopedNodes = useMemo(
    () => getScopedNodes(nodes, activeRootId),
    [activeRootId, nodes],
  );
  const calendarNodes = useMemo(
    () => scopedNodes.filter((node) => node.startDate || node.dueDate),
    [scopedNodes],
  );

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    activeRootIdRef.current = activeRootId;
  }, [activeRootId]);

  const loadNodes = useCallback(async (preferredSelectedId?: string | null) => {
    const nextNodes = await nodeRepository.listNodes();
    const { activeRootId, nextRoots, selectedId } = resolveLoadedTreeState({
      currentActiveRootId: activeRootIdRef.current,
      currentSelectedId: selectedIdRef.current,
      nextNodes,
      preferredSelectedId,
    });

    setNodes(nextNodes);
    setActiveRootId(activeRootId);
    setSelectedId(selectedId);
    setExpandedIds((current) => {
      return getExpandedIdsForLoadedTree({
        activeRootId,
        currentExpandedIds: current,
        nextNodes,
        nextRoots,
      });
    });
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        setIsLoading(true);
        await nodeRepository.init();
        await loadNodes();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught));
      } finally {
        setIsLoading(false);
      }
    };

    void boot();
  }, [loadNodes]);

  const selectNode = useCallback(
    (nodeId: string) => {
      setSelectedId(nodeId);
      const rootId = findRootId(nodes, nodeId);
      if (rootId) {
        setActiveRootId(rootId);
        setExpandedIds((current) =>
          getExpandedIdsForSelection(current, nodes, nodeId),
        );
      }
    },
    [nodes],
  );

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  usePendingUndoDeleteExpiry(pendingUndoDelete, setPendingUndoDelete);

  const runAction = useCallback(async <T,>(action: () => Promise<T>) => {
    setActionError(null);
    setIsMutating(true);
    try {
      return await action();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : String(caught));
      return null;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const {
    clearPendingUndoDelete,
    createChild,
    createRoot,
    createSiblingBelow,
    deleteSelected,
    indentSelected,
    importTree,
    moveSelectedDown,
    moveSelectedUp,
    outdentSelected,
    restorePendingDelete,
    updateSelected,
  } = useYarukotoNodeMutations({
    loadNodes,
    nodes,
    pendingUndoDelete,
    runAction,
    selectedNode,
    setExpandedIds,
    setNodes,
    setPendingUndoDelete,
    setSaveError,
    setSaveStatus,
    visibleNodes,
  });

  return {
    activeRootId,
    actionError,
    calendarNodes,
    clearPendingUndoDelete,
    createChild,
    createRoot,
    createSiblingBelow,
    deleteSelected,
    error,
    expandedIds,
    indentSelected,
    importTree,
    isLoading,
    isMutating,
    moveSelectedDown,
    moveSelectedUp,
    nodes,
    outdentSelected,
    pendingUndoDelete,
    restorePendingDelete,
    roots,
    saveError,
    saveStatus,
    scopedNodes,
    selectNode,
    selectedId,
    selectedNode,
    toggleExpanded,
    updateSelected,
    visibleNodes,
  };
}
