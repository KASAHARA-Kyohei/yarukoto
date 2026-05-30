import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Loader2,
  ListPlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Toolbar({
  disabled,
  isLoading,
  onAddChild,
  onAddSibling,
  onDelete,
  onEdit,
  onIndent,
  onMoveDown,
  onMoveUp,
  onOutdent,
}: {
  disabled: boolean;
  isLoading: boolean;
  onAddChild: () => void;
  onAddSibling: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onIndent: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onOutdent: () => void;
}) {
  const AddIcon = isLoading ? Loader2 : Plus;
  const SiblingIcon = isLoading ? Loader2 : ListPlus;

  return (
    <div className="flex shrink-0 flex-wrap gap-2 border-b border-border bg-muted/70 p-2">
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
      <Button disabled={disabled} onClick={onMoveUp} size="sm" type="button" variant="outline">
        <ArrowUp className="h-3.5 w-3.5" />
        上へ
      </Button>
      <Button disabled={disabled} onClick={onMoveDown} size="sm" type="button" variant="outline">
        <ArrowDown className="h-3.5 w-3.5" />
        下へ
      </Button>
      <Button disabled={disabled} onClick={onIndent} size="sm" type="button" variant="outline">
        <ArrowRight className="h-3.5 w-3.5" />
        子階層へ
      </Button>
      <Button disabled={disabled} onClick={onOutdent} size="sm" type="button" variant="outline">
        <ArrowLeft className="h-3.5 w-3.5" />
        親階層へ
      </Button>
      <Button
        disabled={disabled}
        onClick={onDelete}
        size="sm"
        type="button"
        variant="destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        削除
      </Button>
    </div>
  );
}
