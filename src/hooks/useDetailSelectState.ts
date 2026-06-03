import { useCallback, useState } from "react";
import { getCycledValue } from "@/app/cycleValue";
import type { DetailSelectField } from "@/app/types";
import {
  NODE_STATUSES,
  NODE_TYPES,
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
  const [typeSelectDraft, setTypeSelectDraft] = useState<NodeType | null>(null);

  const resetDetailSelectState = useCallback(() => {
    setOpenDetailSelectField(null);
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
        setStatusSelectDraft(null);
      } else {
        setStatusSelectDraft(selectedNode.status);
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
    const nextStatus = statusSelectDraft ?? selectedNode.status;
    resetDetailSelectState();
    if (nextStatus !== selectedNode.status) {
      void updateSelected({ status: nextStatus });
    }
  }, [
    openDetailSelectField,
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

  const typeValue =
    openDetailSelectField === "type"
      ? (typeSelectDraft ?? selectedNode?.type ?? NODE_TYPES[0])
      : (selectedNode?.type ?? NODE_TYPES[0]);

  return {
    closeDetailSelect,
    commitOpenDetailSelect,
    cycleStatusValue,
    cycleTypeValue,
    handleStatusOpenChange,
    handleStatusValueChange,
    handleTypeOpenChange,
    handleTypeValueChange,
    moveOpenDetailSelect,
    openDetailSelect,
    openDetailSelectField,
    resetDetailSelectState,
    statusValue,
    typeValue,
  };
}
