import type { NodeStatus, YarukotoNode } from "@/domain/nodes/types";

export async function changeNodeStatusOptimistically({
  applyNodes,
  nodeId,
  nodes,
  persist,
  status,
  updatedAt,
}: {
  applyNodes: (nodes: YarukotoNode[]) => void;
  nodeId: string;
  nodes: YarukotoNode[];
  persist: () => Promise<void>;
  status: NodeStatus;
  updatedAt: string;
}) {
  const target = nodes.find((node) => node.id === nodeId);
  if (!target || target.status === status) {
    return false;
  }

  applyNodes(
    nodes.map((node) =>
      node.id === nodeId ? { ...node, status, updatedAt } : node,
    ),
  );

  try {
    await persist();
    return true;
  } catch (error) {
    applyNodes(nodes);
    throw error;
  }
}
