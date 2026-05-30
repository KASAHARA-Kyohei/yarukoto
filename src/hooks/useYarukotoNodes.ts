import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nodeRepository } from "../repositories/nodeRepository";
import { getDeleteSelectionFallback } from "../nodeSelection";
import {
  findRootId,
  getAncestorIds,
  getRootNodes,
  getScopedNodes,
  getVisibleTree,
} from "../tree";
import { createDeleteUndoSnapshot } from "../undo";
import type {
  PendingUndoDelete,
  SaveStatus,
  UpdateNodeInput,
  YarukotoNode,
} from "../types";

const DELETE_UNDO_MS = 8_000;

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
    () => scopedNodes.filter((node) => node.dueDate),
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
    const nextRoots = getRootNodes(nextNodes);
    const preferredExists =
      preferredSelectedId &&
      nextNodes.some((node) => node.id === preferredSelectedId);
    const currentSelectedId = selectedIdRef.current;
    const currentActiveRootId = activeRootIdRef.current;
    const currentExists =
      currentSelectedId &&
      nextNodes.some((node) => node.id === currentSelectedId);
    const candidateSelectedId =
      (preferredExists ? preferredSelectedId : null) ??
      (currentExists ? currentSelectedId : null);
    const candidateRootId =
      findRootId(nextNodes, candidateSelectedId) ??
      (currentActiveRootId &&
      nextRoots.some((node) => node.id === currentActiveRootId)
        ? currentActiveRootId
        : nextRoots[0]?.id ?? null);
    const nextSelectedId =
      candidateSelectedId ?? candidateRootId ?? nextNodes[0]?.id ?? null;

    setNodes(nextNodes);
    setActiveRootId(candidateRootId);
    setSelectedId(nextSelectedId);
    setExpandedIds((current) => {
      const next =
        current.size === 0
          ? new Set(nextNodes.map((node) => node.id))
          : new Set(current);
      for (const root of nextRoots) {
        next.add(root.id);
      }
      if (candidateRootId) {
        next.add(candidateRootId);
      }
      return next;
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
        setExpandedIds((current) => {
          const next = new Set(current);
          next.add(rootId);
          for (const ancestorId of getAncestorIds(nodes, nodeId)) {
            next.add(ancestorId);
          }
          return next;
        });
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

  useEffect(() => {
    if (!pendingUndoDelete) {
      return;
    }
    const remaining = Math.max(0, pendingUndoDelete.expiresAt - Date.now());
    const timeoutId = window.setTimeout(() => {
      setPendingUndoDelete((current) =>
        current?.deletedAt === pendingUndoDelete.deletedAt ? null : current,
      );
    }, remaining);
    return () => window.clearTimeout(timeoutId);
  }, [pendingUndoDelete]);

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

  const createRoot = useCallback(async () => {
    return await runAction(async () => {
      const node = await nodeRepository.createNode({
        parentId: null,
        title: "新しいプロジェクト",
        type: "Group",
        status: "Inbox",
      });
      await loadNodes(node.id);
      return node;
    });
  }, [loadNodes, runAction]);

  const createChild = useCallback(async () => {
    if (!selectedNode) {
      return null;
    }
    return await runAction(async () => {
      const child = await nodeRepository.createNode({
        parentId: selectedNode.id,
        title: "新しいタスク",
        type: "Task",
        status: "Inbox",
      });
      setExpandedIds((current) => new Set(current).add(selectedNode.id));
      await loadNodes(child.id);
      return child;
    });
  }, [loadNodes, runAction, selectedNode]);

  const createSiblingBelow = useCallback(async () => {
    if (!selectedNode) {
      return null;
    }
    return await runAction(async () => {
      const sibling = await nodeRepository.createNode({
        parentId: selectedNode.parentId,
        title: "新しいノード",
        type: selectedNode.parentId === null ? "Group" : "Task",
        status: "Inbox",
        sortOrder: selectedNode.sortOrder + 1,
      });
      await loadNodes(sibling.id);
      return sibling;
    });
  }, [loadNodes, runAction, selectedNode]);

  const deleteSelected = useCallback(async () => {
    if (!selectedNode) {
      return null;
    }
    return await runAction(async () => {
      const oldParentId = await nodeRepository.deleteNodeCascade(selectedNode.id);
      const fallback = getDeleteSelectionFallback({
        deletedNodeId: selectedNode.id,
        nodes,
        oldParentId,
        visibleNodes,
      });
      await loadNodes(fallback);
      const snapshot = createDeleteUndoSnapshot({
        deletedAt: Date.now(),
        fallbackId: fallback,
        node: selectedNode,
        nodes,
        ttlMs: DELETE_UNDO_MS,
      });
      setPendingUndoDelete(snapshot);
      return snapshot.nodes;
    });
  }, [loadNodes, nodes, runAction, selectedNode, visibleNodes]);

  const clearPendingUndoDelete = useCallback(() => {
    setPendingUndoDelete(null);
  }, []);

  const restorePendingDelete = useCallback(async () => {
    if (!pendingUndoDelete) {
      return null;
    }
    const snapshot = pendingUndoDelete;
    return await runAction(async () => {
      await nodeRepository.restoreNodes(snapshot.nodes);
      setPendingUndoDelete(null);
      await loadNodes(snapshot.nodes[0]?.id ?? snapshot.fallbackId);
      return snapshot.nodes;
    });
  }, [loadNodes, pendingUndoDelete, runAction]);

  const moveSelectedUp = useCallback(async () => {
    if (!selectedNode) {
      return;
    }
    await runAction(async () => {
      await nodeRepository.moveUp(selectedNode.id);
      await loadNodes(selectedNode.id);
    });
  }, [loadNodes, runAction, selectedNode]);

  const moveSelectedDown = useCallback(async () => {
    if (!selectedNode) {
      return;
    }
    await runAction(async () => {
      await nodeRepository.moveDown(selectedNode.id);
      await loadNodes(selectedNode.id);
    });
  }, [loadNodes, runAction, selectedNode]);

  const indentSelected = useCallback(async () => {
    if (!selectedNode) {
      return;
    }
    await runAction(async () => {
      await nodeRepository.indent(selectedNode.id);
      await loadNodes(selectedNode.id);
    });
  }, [loadNodes, runAction, selectedNode]);

  const outdentSelected = useCallback(async () => {
    if (!selectedNode) {
      return;
    }
    await runAction(async () => {
      await nodeRepository.outdent(selectedNode.id);
      await loadNodes(selectedNode.id);
    });
  }, [loadNodes, runAction, selectedNode]);

  const updateSelected = useCallback(
    async (patch: UpdateNodeInput) => {
      if (!selectedNode) {
        return;
      }
      const updatedAt = new Date().toISOString();
      const previousNodes = nodes;
      setSaveStatus("saving");
      setSaveError(null);
      setNodes((current) =>
        current.map((node) =>
          node.id === selectedNode.id ? { ...node, ...patch, updatedAt } : node,
        ),
      );
      try {
        await nodeRepository.updateNode(selectedNode.id, patch);
        setSaveStatus("saved");
      } catch (caught) {
        setNodes(previousNodes);
        setSaveStatus("error");
        setSaveError(caught instanceof Error ? caught.message : String(caught));
      }
    },
    [nodes, selectedNode],
  );

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
