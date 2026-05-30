import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PendingUndoDelete } from "@/app/types";

export function usePendingUndoDeleteExpiry(
  pendingUndoDelete: PendingUndoDelete | null,
  setPendingUndoDelete: Dispatch<SetStateAction<PendingUndoDelete | null>>,
) {
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
  }, [pendingUndoDelete, setPendingUndoDelete]);
}
