import { useLanguage } from "@/app/LanguageProvider";
import { SHORTCUT_KEYS } from "@/app/shortcutKeys";
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
import { ShortcutTooltip } from "@/components/ui/shortcut-tooltip";
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
  const { t } = useLanguage();
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
      <Button
        disabled={disabled}
        onClick={onEdit}
        shortcut={SHORTCUT_KEYS.edit}
        size="sm"
        type="button"
      >
        <Pencil className="h-3.5 w-3.5" />
        {t.edit}
      </Button>
      <Button
        disabled={disabled}
        onClick={onAddChild}
        shortcut={SHORTCUT_KEYS.addChild}
        size="sm"
        type="button"
        variant="outline"
      >
        <AddIcon className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {t.addChild}
      </Button>
      <Button
        disabled={disabled}
        onClick={onAddSibling}
        shortcut={SHORTCUT_KEYS.addBelow}
        size="sm"
        type="button"
        variant="outline"
      >
        <SiblingIcon className={isLoading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        {t.addBelow}
      </Button>
      <Popover open={isArrangeOpen} onOpenChange={setIsArrangeOpen}>
        <PopoverTrigger asChild>
          <Button disabled={disabled} size="sm" type="button" variant="outline">
            <MoreHorizontal className="h-3.5 w-3.5" />
            {t.organize}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-44 p-1">
          <ToolbarMenuItem
            icon={ArrowUp}
            label={t.moveUp}
            shortcut={SHORTCUT_KEYS.moveUp}
            onClick={() => runArrangeAction(onMoveUp)}
          />
          <ToolbarMenuItem
            icon={ArrowDown}
            label={t.moveDown}
            shortcut={SHORTCUT_KEYS.moveDown}
            onClick={() => runArrangeAction(onMoveDown)}
          />
          <ToolbarMenuItem
            icon={ArrowRight}
            label={t.indent}
            shortcut={SHORTCUT_KEYS.indent}
            onClick={() => runArrangeAction(onIndent)}
          />
          <ToolbarMenuItem
            icon={ArrowLeft}
            label={t.outdent}
            shortcut={SHORTCUT_KEYS.outdent}
            onClick={() => runArrangeAction(onOutdent)}
          />
          <div className="my-1 border-t border-border" />
          <ToolbarMenuItem
            destructive
            icon={Trash2}
            label={t.delete}
            shortcut={SHORTCUT_KEYS.delete}
            onClick={() => runArrangeAction(onDelete)}
          />
        </PopoverContent>
      </Popover>
      <div className="ml-auto flex items-center gap-2">
        <Popover open={isFileOpen} onOpenChange={setIsFileOpen}>
          <PopoverTrigger asChild>
            <Button disabled={isLoading} size="sm" type="button" variant="outline">
              <FileJson className="h-3.5 w-3.5" />
              {t.file}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <p className="px-2 pb-2 text-xs leading-relaxed text-muted-foreground">
              {t.fileDescription}
            </p>
            <ReviewMenuItem
              disabled={!canFileExport}
              icon={Download}
              label={t.exportJson}
              shortcut={SHORTCUT_KEYS.exportJson}
              description={t.exportJsonDescription}
              onClick={() => runFileAction(onExportToFile)}
            />
            <ReviewMenuItem
              icon={FolderOpen}
              label={t.importJson}
              shortcut={SHORTCUT_KEYS.importJson}
              description={t.importJsonDescription}
              onClick={() => runFileAction(onImportFromFile)}
            />
          </PopoverContent>
        </Popover>
        <Popover open={isReviewOpen} onOpenChange={setIsReviewOpen}>
          <PopoverTrigger asChild>
            <Button disabled={isLoading} size="sm" type="button" variant="outline">
              <Bot className="h-3.5 w-3.5" />
              {t.aiReview}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <p className="px-2 pb-2 text-xs leading-relaxed text-muted-foreground">
              {t.aiReviewDescription}
            </p>
            <ReviewMenuItem
              disabled={!canExport}
              icon={Copy}
              label={t.copyReview}
              shortcut={SHORTCUT_KEYS.copyReview}
              description={t.copyReviewDescription}
              onClick={() => runReviewAction(onExport)}
            />
            <ReviewMenuItem
              icon={ClipboardPaste}
              label={t.importReview}
              shortcut={SHORTCUT_KEYS.importReview}
              description={t.importReviewDescription}
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
  shortcut,
}: {
  destructive?: boolean;
  icon: typeof ArrowUp;
  label: string;
  onClick: () => void;
  shortcut: string;
}) {
  return (
    <Button
      className={destructive ? "w-full justify-start text-destructive" : "w-full justify-start"}
      shortcut={shortcut}
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
    <ShortcutTooltip keys={shortcut}>
      <button
        className="flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors enabled:hover:bg-accent disabled:opacity-50"
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
    </ShortcutTooltip>
  );
}
