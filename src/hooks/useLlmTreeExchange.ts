import { useCallback, useEffect, useState } from "react";
import {
  readText,
  writeText,
} from "@tauri-apps/plugin-clipboard-manager";
import {
  buildLlmReviewText,
  buildLlmTreeDocument,
  type LlmTreeDocument,
} from "@/domain/nodes/llmTree";
import type { YarukotoNode } from "@/domain/nodes/types";

type ExchangeNotice = {
  kind: "error" | "success";
  text: string;
};

export function useLlmTreeExchange({
  activeRootId,
  importTree,
  nodes,
}: {
  activeRootId: string | null;
  importTree: (document: LlmTreeDocument) => Promise<YarukotoNode | null>;
  nodes: YarukotoNode[];
}) {
  const [clipboardError, setClipboardError] = useState<string | null>(null);
  const [importText, setImportText] = useState("");
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [notice, setNotice] = useState<ExchangeNotice | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timeoutId = window.setTimeout(() => setNotice(null), 4_000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const copyReview = useCallback(async () => {
    if (!activeRootId) {
      setNotice({ kind: "error", text: "コピー対象のプロジェクトがありません。" });
      return;
    }
    try {
      const document = buildLlmTreeDocument(nodes, activeRootId);
      await writeText(buildLlmReviewText(document));
      setNotice({
        kind: "success",
        text: "レビュー依頼をコピーしました。AIチャットに貼り付けてください。",
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: `コピーに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  }, [activeRootId, nodes]);

  const openImport = useCallback(async () => {
    setClipboardError(null);
    setImportText("");
    setIsImportOpen(true);
    try {
      setImportText(await readText());
    } catch (error) {
      setClipboardError(
        `クリップボードの読み込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }, []);

  const updateImportText = useCallback((value: string) => {
    setClipboardError(null);
    setImportText(value);
  }, []);

  const submitImport = useCallback(
    async (document: LlmTreeDocument) => {
      const root = await importTree(document);
      if (!root) {
        return null;
      }
      setIsImportOpen(false);
      setNotice({
        kind: "success",
        text: `「${root.title || "（無題）"}」を新規プロジェクトとして取り込みました。`,
      });
      return root;
    },
    [importTree],
  );

  return {
    clipboardError,
    copyReview,
    importText,
    isImportOpen,
    notice,
    openImport,
    setIsImportOpen,
    submitImport,
    updateImportText,
  };
}
