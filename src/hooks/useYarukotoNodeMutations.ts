import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PendingUndoDelete, SaveStatus } from "@/app/types";
import { getDeleteSelectionFallback } from "@/domain/nodes/nodeSelection";
import { createDeleteUndoSnapshot } from "@/domain/nodes/undo";
import type { LlmTreeDocument } from "@/domain/nodes/llmTree";
import { nodeRepository } from "../repositories/nodeRepository";
import { changeNodeStatusOptimistically } from "./nodeStatusMutation";
import type {
  FlatTreeNode,
  NodeStatus,
  UpdateNodeInput,
  YarukotoNode,
} from "@/domain/nodes/types";

const DELETE_UNDO_MS = 8_000;

type RunNodeAction = <T>(action: () => Promise<T>) => Promise<T | null>;

export function buildSiblingNodeInput(
  selectedNode: YarukotoNode,
  sortOrder: number,
) {
  return {
    parentId: selectedNode.parentId,
    title: "",
    type: selectedNode.parentId === null ? "Group" : "Task",
    status: "Inbox" as const,
    sortOrder,
  };
}

export function useYarukotoNodeMutations({
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
}: {
  loadNodes: (preferredSelectedId?: string | null) => Promise<void>;
  nodes: YarukotoNode[];
  pendingUndoDelete: PendingUndoDelete | null;
  runAction: RunNodeAction;
  selectedNode: YarukotoNode | null;
  setExpandedIds: Dispatch<SetStateAction<Set<string>>>;
  setNodes: Dispatch<SetStateAction<YarukotoNode[]>>;
  setPendingUndoDelete: Dispatch<SetStateAction<PendingUndoDelete | null>>;
  setSaveError: Dispatch<SetStateAction<string | null>>;
  setSaveStatus: Dispatch<SetStateAction<SaveStatus>>;
  visibleNodes: FlatTreeNode[];
}) {
  const createRoot = useCallback(async () => {
    return await runAction(async () => {
      const node = await nodeRepository.createNode({
        parentId: null,
        title: "",
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
        title: "",
        type: "Task",
        status: "Inbox",
      });
      setExpandedIds((current) => new Set(current).add(selectedNode.id));
      await loadNodes(child.id);
      return child;
    });
  }, [loadNodes, runAction, selectedNode, setExpandedIds]);

  const createSiblingBelow = useCallback(async () => {
    if (!selectedNode) {
      return null;
    }
    return await runAction(async () => {
      const sibling = await nodeRepository.createNode(
        buildSiblingNodeInput(selectedNode, selectedNode.sortOrder + 1),
      );
      await loadNodes(sibling.id);
      return sibling;
    });
  }, [loadNodes, runAction, selectedNode]);

  const createSiblingAbove = useCallback(async () => {
    if (!selectedNode) {
      return null;
    }
    return await runAction(async () => {
      const sibling = await nodeRepository.createNode(
        buildSiblingNodeInput(selectedNode, selectedNode.sortOrder),
      );
      await loadNodes(sibling.id);
      return sibling;
    });
  }, [loadNodes, runAction, selectedNode]);

  const importTree = useCallback(
    async (document: LlmTreeDocument) => {
      return await runAction(async () => {
        const root = await nodeRepository.importTree(document);
        await loadNodes(root.id);
        return root;
      });
    },
    [loadNodes, runAction],
  );

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
  }, [loadNodes, nodes, runAction, selectedNode, setPendingUndoDelete, visibleNodes]);

  const clearPendingUndoDelete = useCallback(() => {
    setPendingUndoDelete(null);
  }, [setPendingUndoDelete]);

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
  }, [loadNodes, pendingUndoDelete, runAction, setPendingUndoDelete]);

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
    [nodes, selectedNode, setNodes, setSaveError, setSaveStatus],
  );

  const changeNodeStatus = useCallback(
    async (nodeId: string, status: NodeStatus) => {
      return await runAction(async () => {
        return await changeNodeStatusOptimistically({
          applyNodes: setNodes,
          nodeId,
          nodes,
          persist: () => nodeRepository.updateNode(nodeId, { status }),
          status,
          updatedAt: new Date().toISOString(),
        });
      });
    },
    [nodes, runAction, setNodes],
  );

  return {
    changeNodeStatus,
    clearPendingUndoDelete,
    createChild,
    createRoot,
    createSiblingAbove,
    createSiblingBelow,
    deleteSelected,
    indentSelected,
    importTree,
    moveSelectedDown,
    moveSelectedUp,
    outdentSelected,
    restorePendingDelete,
    updateSelected,
  };
}
