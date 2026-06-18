import { useCallback, useEffect, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import {
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import {
  readText,
  writeText,
} from "@tauri-apps/plugin-clipboard-manager";
import {
  createProjectExportFileName,
  ensureJsonFilePath,
} from "@/app/treeFile";
import {
  buildLlmReviewText,
  buildLlmTreeDocument,
  parseLlmTreeDocument,
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

  const exportToFile = useCallback(async () => {
    if (!activeRootId) {
      setNotice({
        kind: "error",
        text: "書き出し対象のプロジェクトがありません。",
      });
      return;
    }

    try {
      const document = buildLlmTreeDocument(nodes, activeRootId);
      const selectedPath = await save({
        defaultPath: createProjectExportFileName(document.root.title),
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!selectedPath) {
        return;
      }

      await writeTextFile(
        ensureJsonFilePath(selectedPath),
        JSON.stringify(document, null, 2),
      );
      setNotice({
        kind: "success",
        text: `「${document.root.title || "（無題）"}」をJSONファイルに書き出しました。`,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: `ファイル書き出しに失敗しました: ${
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

  const importFromFile = useCallback(async () => {
    try {
      const selectedPath = await open({
        directory: false,
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (!selectedPath || Array.isArray(selectedPath)) {
        return null;
      }

      const document = parseLlmTreeDocument(await readTextFile(selectedPath));
      const root = await importTree(document);
      if (!root) {
        return null;
      }
      setNotice({
        kind: "success",
        text: `「${root.title || "（無題）"}」をJSONファイルから取り込みました。`,
      });
      return root;
    } catch (error) {
      setNotice({
        kind: "error",
        text: `ファイル取り込みに失敗しました: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
      return null;
    }
  }, [importTree]);

  return {
    clipboardError,
    copyReview,
    exportToFile,
    importFromFile,
    importText,
    isImportOpen,
    notice,
    openImport,
    setIsImportOpen,
    submitImport,
    updateImportText,
  };
}
