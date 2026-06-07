import { useMemo } from "react";
import { FileJson, Loader2 } from "lucide-react";
import {
  countLlmTreeNodes,
  parseLlmTreeDocument,
  type LlmTreeDocument,
} from "@/domain/nodes/llmTree";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type ParsedImport =
  | { document: LlmTreeDocument; error: null; nodeCount: number }
  | { document: null; error: string; nodeCount: null };

function parseImportText(value: string): ParsedImport {
  try {
    const document = parseLlmTreeDocument(value);
    return {
      document,
      error: null,
      nodeCount: countLlmTreeNodes(document.root),
    };
  } catch (error) {
    return {
      document: null,
      error: error instanceof Error ? error.message : String(error),
      nodeCount: null,
    };
  }
}

export function LlmTreeImportDialog({
  clipboardError,
  isImporting,
  onImport,
  onOpenChange,
  onTextChange,
  open,
  text,
}: {
  clipboardError: string | null;
  isImporting: boolean;
  onImport: (document: LlmTreeDocument) => void;
  onOpenChange: (open: boolean) => void;
  onTextChange: (value: string) => void;
  open: boolean;
  text: string;
}) {
  const parsed = useMemo(() => parseImportText(text), [text]);
  const validationError = clipboardError ?? parsed.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(780px,calc(100vw-32px))]">
        <DialogHeader>
          <DialogTitle>LLMレビュー結果を取り込む</DialogTitle>
          <DialogDescription>
            LLMが返したJSONを確認し、新しいプロジェクトとして作成します。
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 gap-3 p-4">
          <Textarea
            autoFocus
            className="min-h-80 resize-y font-mono text-xs"
            data-keyboard-editing="true"
            placeholder="yarukoto-tree形式のJSONを貼り付けてください"
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
          />
          {parsed.document ? (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
              <FileJson className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{parsed.document.root.title || "（無題）"}</span>
              <span className="text-muted-foreground">
                {parsed.nodeCount}ノード
              </span>
            </div>
          ) : (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              disabled={isImporting}
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              disabled={!parsed.document || isImporting}
              type="button"
              onClick={() => {
                if (parsed.document) {
                  onImport(parsed.document);
                }
              }}
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              新規プロジェクトとして取り込む
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
