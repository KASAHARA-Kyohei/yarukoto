import { useLanguage } from "@/app/LanguageProvider";
import { getNodeDisplayTitle } from "@/domain/nodes/nodeAppearance";
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
  const { language, t } = useLanguage();
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
      setNotice({ kind: "error", text: t.noProjectToCopy });
      return;
    }
    try {
      const document = buildLlmTreeDocument(nodes, activeRootId, language);
      await writeText(buildLlmReviewText(document, language));
      setNotice({
        kind: "success",
        text: t.reviewCopied,
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: t.copyFailed(
          error instanceof Error ? error.message : String(error)
        ),
      });
    }
  }, [activeRootId, language, nodes, t]);

  const exportToFile = useCallback(async () => {
    if (!activeRootId) {
      setNotice({
        kind: "error",
        text: t.noProjectToExport,
      });
      return;
    }

    try {
      const document = buildLlmTreeDocument(nodes, activeRootId, language);
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
        text: t.projectExported(getNodeDisplayTitle(document.root, language)),
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: t.exportFailed(
          error instanceof Error ? error.message : String(error)
        ),
      });
    }
  }, [activeRootId, language, nodes, t]);

  const openImport = useCallback(async () => {
    setClipboardError(null);
    setImportText("");
    setIsImportOpen(true);
    try {
      setImportText(await readText());
    } catch (error) {
      setClipboardError(
        t.clipboardReadFailed(
          error instanceof Error ? error.message : String(error)
        ),
      );
    }
  }, [t]);

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
        text: t.reviewImported(getNodeDisplayTitle(root, language)),
      });
      return root;
    },
    [importTree, language, t],
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

      const document = parseLlmTreeDocument(await readTextFile(selectedPath), language);
      const root = await importTree(document);
      if (!root) {
        return null;
      }
      setNotice({
        kind: "success",
        text: t.projectImported(getNodeDisplayTitle(root, language)),
      });
      return root;
    } catch (error) {
      setNotice({
        kind: "error",
        text: t.importFailed(
          error instanceof Error ? error.message : String(error)
        ),
      });
      return null;
    }
  }, [importTree, language, t]);

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
