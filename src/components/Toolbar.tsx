import { useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  Download,
  FileJson,
  FolderOpen,
  Loader2,
  ListPlus,
  MoreHorizontal,
  Pencil,
  ClipboardPaste,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function Toolbar({
  canFileExport,
  disabled,
  canExport,
  isLoading,
  onAddChild,
  onAddSibling,
  onDelete,
  onEdit,
  onExportToFile,
  onIndent,
  onImportFromFile,
  onImport,
  onMoveDown,
  onMoveUp,
  onOutdent,
  onExport,
}: {
  canFileExport: boolean;
  canExport: boolean;
  disabled: boolean;
  isLoading: boolean;
  onAddChild: () => void;
  onAddSibling: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onExportToFile: () => void;
  onIndent: () => void;
  onImportFromFile: () => void;
  onImport: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onOutdent: () => void;
  onExport: () => void;
}) {
  const AddIcon = isLoading ? Loader2 : Plus;
  const SiblingIcon = isLoading ? Loader2 : ListPlus;
  const [isArrangeOpen, setIsArrangeOpen] = useState(false);
  const [isFileOpen, setIsFileOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const runArrangeAction = (action: () => void) => {
    setIsArrangeOpen(false);
    action();
  };

  const runReviewAction = (action: () => void) => {
    setIsReviewOpen(false);
    action();
  };

  const runFileAction = (action: () => void) => {
    setIsFileOpen(false);
    action();
  };

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border bg-muted/70 px-3 py-2">
      <Button disabled={disabled} onClick={onEdit} size="sm" type="button" variant="default">
        <Pencil className="h-3.5 w-3.5" />
        編集
      </Button>
      <Button disabled={disabled} onClick={onAddChild} size="sm" type="button" variant="outline">
        <AddIcon className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        子追加
      </Button>
      <Button disabled={disabled} onClick={onAddSibling} size="sm" type="button" variant="outline">
        <SiblingIcon className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        下追加
      </Button>
      <Popover open={isArrangeOpen} onOpenChange={setIsArrangeOpen}>
        <PopoverTrigger asChild>
          <Button disabled={disabled} size="sm" type="button" variant="outline">
            <MoreHorizontal className="h-3.5 w-3.5" />
            整理
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1">
          <ToolbarMenuItem
            icon={ArrowUp}
            label="上へ移動"
            onClick={() => runArrangeAction(onMoveUp)}
          />
          <ToolbarMenuItem
            icon={ArrowDown}
            label="下へ移動"
            onClick={() => runArrangeAction(onMoveDown)}
          />
          <ToolbarMenuItem
            icon={ArrowRight}
            label="子階層へ"
            onClick={() => runArrangeAction(onIndent)}
          />
          <ToolbarMenuItem
            icon={ArrowLeft}
            label="親階層へ"
            onClick={() => runArrangeAction(onOutdent)}
          />
          <div className="my-1 border-t border-border" />
          <ToolbarMenuItem
            destructive
            icon={Trash2}
            label="削除"
            onClick={() => runArrangeAction(onDelete)}
          />
        </PopoverContent>
      </Popover>
      <div className="ml-auto flex items-center gap-2">
        <Popover open={isFileOpen} onOpenChange={setIsFileOpen}>
          <PopoverTrigger asChild>
            <Button disabled={isLoading} size="sm" type="button" variant="outline">
              <FileJson className="h-3.5 w-3.5" />
              ファイル
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <p className="px-2 pb-2 text-xs leading-relaxed text-muted-foreground">
              現在のプロジェクトを `yarukoto-tree` JSON として保存し、別環境へ受け渡しできます。
            </p>
            <ReviewMenuItem
              disabled={!canFileExport}
              icon={Download}
              label="JSONを書き出し"
              shortcut="Y"
              description="現在のプロジェクトをバックアップ用JSONとして保存"
              onClick={() => runFileAction(onExportToFile)}
            />
            <ReviewMenuItem
              icon={FolderOpen}
              label="JSONを取り込む"
              shortcut="P"
              description="JSONファイルから新規プロジェクトを作成"
              onClick={() => runFileAction(onImportFromFile)}
            />
          </PopoverContent>
        </Popover>
        <Popover open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <PopoverTrigger asChild>
            <Button disabled={isLoading} size="sm" type="button" variant="outline">
              <Bot className="h-3.5 w-3.5" />
              AIレビュー
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <p className="px-2 pb-2 text-xs leading-relaxed text-muted-foreground">
              プロジェクトをAIチャットで見直し、整理された結果を別プロジェクトとして戻せます。
            </p>
            <ReviewMenuItem
              disabled={!canExport}
              icon={Copy}
              label="レビュー依頼をコピー"
              shortcut="y"
              description="現在のプロジェクトとAI向けの指示をコピー"
              onClick={() => runReviewAction(onExport)}
            />
            <ReviewMenuItem
              icon={ClipboardPaste}
              label="レビュー結果を取り込む"
              shortcut="p"
              description="AIの返答を新しいプロジェクトとして作成"
              onClick={() => runReviewAction(onImport)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function ToolbarMenuItem({
  destructive = false,
  icon: Icon,
  label,
  onClick,
}: {
  destructive?: boolean;
  icon: typeof ArrowUp;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      className={destructive ? "w-full justify-start text-destructive" : "w-full justify-start"}
      size="sm"
      type="button"
      variant="ghost"
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

function ReviewMenuItem({
  description,
  disabled = false,
  icon: Icon,
  label,
  onClick,
  shortcut,
}: {
  description: string;
  disabled?: boolean;
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  shortcut: string;
}) {
  return (
    <button
      className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border bg-background">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2 text-sm font-medium">
          {label}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {shortcut}
          </kbd>
        </span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}
