import { type RefObject } from "react";
import { DatePicker } from "./DatePicker";
import {
  NODE_STATUSES,
  NODE_TYPES,
  type DetailField,
  type NodeStatus,
  type NodeType,
  type SaveStatus,
  type UpdateNodeInput,
  type YarukotoNode,
} from "../types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { isInvalidDateRange } from "@/period";

function saveStatusVariant(saveStatus: SaveStatus) {
  if (saveStatus === "error") {
    return "destructive";
  }
  if (saveStatus === "saved") {
    return "secondary";
  }
  return "outline";
}

function blurEditableOnEscape(event: Event) {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) {
    return;
  }
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(activeElement.tagName) ||
    activeElement.closest("[data-keyboard-editing='true']")
  ) {
    event.preventDefault();
    activeElement.blur();
  }
}

export function NodeDetailDialog({
  activeField,
  detailFieldRefs,
  node,
  onActivateField,
  onOpenChange,
  onUpdateNode,
  open,
  saveError,
  saveStatus,
  titleInputRef,
}: {
  activeField: DetailField;
  detailFieldRefs: {
    dueDate: RefObject<HTMLButtonElement | null>;
    memo: RefObject<HTMLTextAreaElement | null>;
    startDate: RefObject<HTMLButtonElement | null>;
    status: RefObject<HTMLButtonElement | null>;
    type: RefObject<HTMLButtonElement | null>;
  };
  node: YarukotoNode | null;
  onActivateField: (field: DetailField) => void;
  onOpenChange: (open: boolean) => void;
  onUpdateNode: (patch: UpdateNodeInput) => void;
  open: boolean;
  saveError: string | null;
  saveStatus: SaveStatus;
  titleInputRef: RefObject<HTMLInputElement | null>;
}) {
  const fieldClass = (field: DetailField) =>
    cn(
      "rounded-md p-1 -m-1 transition-colors",
      activeField === field && "bg-accent/60 ring-1 ring-primary/30",
    );

  return (
    <Dialog open={open && Boolean(node)} onOpenChange={onOpenChange}>
      <DialogContent onEscapeKeyDown={blurEditableOnEscape}>
        <DialogHeader>
          <DialogTitle>ノード編集</DialogTitle>
          <DialogDescription>
            {node ? node.title : "編集するノードを選択してください。"}
          </DialogDescription>
        </DialogHeader>
        {node ? (
          <form className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
            <label
              className={cn("grid gap-1.5 text-sm font-medium", fieldClass("title"))}
              onMouseDown={() => onActivateField("title")}
            >
              title
              <Input
                onChange={(event) =>
                  onUpdateNode({ title: event.currentTarget.value })
                }
                ref={titleInputRef}
                value={node.title}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={cn(
                  "grid gap-1.5 text-sm font-medium",
                  fieldClass("type"),
                )}
                onMouseDown={() => onActivateField("type")}
              >
                type
                <Select
                  value={node.type}
                  onValueChange={(value) =>
                    onUpdateNode({ type: value as NodeType })
                  }
                >
                  <SelectTrigger ref={detailFieldRefs.type}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NODE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label
                className={cn(
                  "grid gap-1.5 text-sm font-medium",
                  fieldClass("status"),
                )}
                onMouseDown={() => onActivateField("status")}
              >
                status
                <Select
                  value={node.status}
                  onValueChange={(value) =>
                    onUpdateNode({ status: value as NodeStatus })
                  }
                >
                  <SelectTrigger ref={detailFieldRefs.status}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NODE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={cn(
                  "grid gap-1.5 text-sm font-medium",
                  fieldClass("startDate"),
                )}
                onMouseDown={() => onActivateField("startDate")}
              >
                開始日
                <DatePicker
                  clearLabel="開始日を削除"
                  placeholder="開始日なし"
                  triggerRef={detailFieldRefs.startDate}
                  value={node.startDate}
                  onChange={(startDate) => onUpdateNode({ startDate })}
                />
              </label>
              <label
                className={cn(
                  "grid gap-1.5 text-sm font-medium",
                  fieldClass("dueDate"),
                )}
                onMouseDown={() => onActivateField("dueDate")}
              >
                終了日
                <DatePicker
                  clearLabel="終了日を削除"
                  placeholder="終了日なし"
                  triggerRef={detailFieldRefs.dueDate}
                  value={node.dueDate}
                  onChange={(dueDate) => onUpdateNode({ dueDate })}
                />
              </label>
            </div>
            {isInvalidDateRange(node) ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                開始日が終了日より後になっています。保存はできますが、期間表示は警告色になります。
              </div>
            ) : null}
            <label
              className={cn(
                "grid gap-1.5 text-sm font-medium",
                fieldClass("memo"),
              )}
              onMouseDown={() => onActivateField("memo")}
            >
              memo
              <Textarea
                className="min-h-48 resize-y leading-6"
                onChange={(event) =>
                  onUpdateNode({ memo: event.currentTarget.value })
                }
                ref={detailFieldRefs.memo}
                value={node.memo}
              />
            </label>
            <Card className="bg-card/80">
              <CardContent className="space-y-1 p-3 text-xs leading-5 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>save</span>
                  <Badge variant={saveStatusVariant(saveStatus)}>{saveStatus}</Badge>
                </div>
                {saveError ? (
                  <div className="text-destructive">{saveError}</div>
                ) : null}
                <div>ID: {node.id}</div>
                <div>created: {node.createdAt}</div>
                <div>updated: {node.updatedAt}</div>
              </CardContent>
            </Card>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
