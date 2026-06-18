import { useCallback, useState } from "react";
import { getCycledValue } from "@/app/cycleValue";
import type { DetailSelectField } from "@/app/types";
import {
  NODE_PRIORITIES,
  NODE_STATUSES,
  NODE_TYPES,
  type NodePriority,
  type NodeStatus,
  type NodeType,
  type UpdateNodeInput,
  type YarukotoNode,
} from "@/domain/nodes/types";

export function useDetailSelectState({
  selectedNode,
  updateSelected,
}: {
  selectedNode: YarukotoNode | null;
  updateSelected: (patch: UpdateNodeInput) => void | Promise<void>;
}) {
  const [openDetailSelectField, setOpenDetailSelectField] =
    useState<DetailSelectField | null>(null);
  const [statusSelectDraft, setStatusSelectDraft] = useState<NodeStatus | null>(
    null,
  );
  const [prioritySelectDraft, setPrioritySelectDraft] =
    useState<NodePriority | null>(null);
  const [typeSelectDraft, setTypeSelectDraft] = useState<NodeType | null>(null);

  const resetDetailSelectState = useCallback(() => {
    setOpenDetailSelectField(null);
    setPrioritySelectDraft(null);
    setStatusSelectDraft(null);
    setTypeSelectDraft(null);
  }, []);

  const openDetailSelect = useCallback(
    (field: DetailSelectField) => {
      if (!selectedNode) {
        return;
      }
      if (field === "type") {
        setTypeSelectDraft(selectedNode.type);
        setPrioritySelectDraft(null);
        setStatusSelectDraft(null);
      } else if (field === "priority") {
        setPrioritySelectDraft(selectedNode.priority);
        setStatusSelectDraft(null);
        setTypeSelectDraft(null);
      } else {
        setStatusSelectDraft(selectedNode.status);
        setPrioritySelectDraft(null);
        setTypeSelectDraft(null);
      }
      setOpenDetailSelectField(field);
    },
    [selectedNode],
  );

  const closeDetailSelect = useCallback(() => {
    resetDetailSelectState();
  }, [resetDetailSelectState]);

  const moveOpenDetailSelect = useCallback(
    (direction: 1 | -1) => {
      if (!selectedNode || !openDetailSelectField) {
        return;
      }
      if (openDetailSelectField === "type") {
        setTypeSelectDraft((currentValue) =>
          getCycledValue(
            NODE_TYPES,
            currentValue ?? selectedNode.type,
            direction,
          ),
        );
      } else if (openDetailSelectField === "priority") {
        setPrioritySelectDraft((currentValue) =>
          getCycledValue(
            NODE_PRIORITIES,
            currentValue ?? selectedNode.priority,
            direction,
          ),
        );
      } else {
        setStatusSelectDraft((currentValue) =>
          getCycledValue(
            NODE_STATUSES,
            currentValue ?? selectedNode.status,
            direction,
          ),
        );
      }
    },
    [openDetailSelectField, selectedNode],
  );

  const commitOpenDetailSelect = useCallback(() => {
    if (!selectedNode || !openDetailSelectField) {
      return;
    }
    if (openDetailSelectField === "type") {
      const nextType = typeSelectDraft ?? selectedNode.type;
      resetDetailSelectState();
      if (nextType !== selectedNode.type) {
        void updateSelected({ type: nextType });
      }
      return;
    }
    if (openDetailSelectField === "priority") {
      const nextPriority = prioritySelectDraft ?? selectedNode.priority;
      resetDetailSelectState();
      if (nextPriority !== selectedNode.priority) {
        void updateSelected({ priority: nextPriority });
      }
      return;
    }
    const nextStatus = statusSelectDraft ?? selectedNode.status;
    resetDetailSelectState();
    if (nextStatus !== selectedNode.status) {
      void updateSelected({ status: nextStatus });
    }
  }, [
    openDetailSelectField,
    prioritySelectDraft,
    resetDetailSelectState,
    selectedNode,
    statusSelectDraft,
    typeSelectDraft,
    updateSelected,
  ]);

  const cycleTypeValue = useCallback(
    (direction: 1 | -1) => {
      if (!selectedNode) {
        return;
      }
      void updateSelected({
        type: getCycledValue(NODE_TYPES, selectedNode.type, direction),
      });
    },
    [selectedNode, updateSelected],
  );

  const cyclePriorityValue = useCallback(
    (direction: 1 | -1) => {
      if (!selectedNode) {
        return;
      }
      void updateSelected({
        priority: getCycledValue(
          NODE_PRIORITIES,
          selectedNode.priority,
          direction,
        ),
      });
    },
    [selectedNode, updateSelected],
  );

  const cycleStatusValue = useCallback(
    (direction: 1 | -1) => {
      if (!selectedNode) {
        return;
      }
      void updateSelected({
        status: getCycledValue(NODE_STATUSES, selectedNode.status, direction),
      });
    },
    [selectedNode, updateSelected],
  );

  const handleStatusOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        openDetailSelect("status");
      } else if (openDetailSelectField === "status") {
        closeDetailSelect();
      }
    },
    [closeDetailSelect, openDetailSelect, openDetailSelectField],
  );

  const handleStatusValueChange = useCallback(
    (value: NodeStatus) => {
      void updateSelected({ status: value });
      resetDetailSelectState();
    },
    [resetDetailSelectState, updateSelected],
  );

  const handlePriorityOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        openDetailSelect("priority");
      } else if (openDetailSelectField === "priority") {
        closeDetailSelect();
      }
    },
    [closeDetailSelect, openDetailSelect, openDetailSelectField],
  );

  const handlePriorityValueChange = useCallback(
    (value: NodePriority) => {
      void updateSelected({ priority: value });
      resetDetailSelectState();
    },
    [resetDetailSelectState, updateSelected],
  );

  const handleTypeOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        openDetailSelect("type");
      } else if (openDetailSelectField === "type") {
        closeDetailSelect();
      }
    },
    [closeDetailSelect, openDetailSelect, openDetailSelectField],
  );

  const handleTypeValueChange = useCallback(
    (value: NodeType) => {
      void updateSelected({ type: value });
      resetDetailSelectState();
    },
    [resetDetailSelectState, updateSelected],
  );

  const statusValue =
    openDetailSelectField === "status"
      ? (statusSelectDraft ?? selectedNode?.status ?? NODE_STATUSES[0])
      : (selectedNode?.status ?? NODE_STATUSES[0]);

  const priorityValue =
    openDetailSelectField === "priority"
      ? (prioritySelectDraft ?? selectedNode?.priority ?? NODE_PRIORITIES[0])
      : (selectedNode?.priority ?? NODE_PRIORITIES[0]);

  const typeValue =
    openDetailSelectField === "type"
      ? (typeSelectDraft ?? selectedNode?.type ?? NODE_TYPES[0])
      : (selectedNode?.type ?? NODE_TYPES[0]);

  return {
    closeDetailSelect,
    commitOpenDetailSelect,
    cyclePriorityValue,
    cycleStatusValue,
    cycleTypeValue,
    handlePriorityOpenChange,
    handlePriorityValueChange,
    handleStatusOpenChange,
    handleStatusValueChange,
    handleTypeOpenChange,
    handleTypeValueChange,
    moveOpenDetailSelect,
    openDetailSelect,
    openDetailSelectField,
    priorityValue,
    resetDetailSelectState,
    statusValue,
    typeValue,
  };
}
