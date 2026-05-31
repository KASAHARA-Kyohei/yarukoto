import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { DatePicker } from "./DatePicker";
import { TaskProgressDetail } from "./TaskProgress";
import {
  type DateEditMode,
  type DateField,
  type DetailSelectField,
  type DetailField,
  type SaveStatus,
} from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isInvalidDateRange } from "@/domain/nodes/period";
import type { TaskProgressInfo } from "@/domain/nodes/progress";
import {
  NODE_STATUSES,
  NODE_TYPES,
} from "@/domain/nodes/types";
import type {
  NodeStatus,
  NodeType,
  UpdateNodeInput,
  YarukotoNode,
} from "@/domain/nodes/types";
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

function blurEditableOnEnter(
  event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
) {
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  event.currentTarget.blur();
}

export function NodeDetailDialog({
  activeDateField,
  activeField,
  calendarCursorDate,
  dateEditMode,
  dateInputError,
  dateTextDraft,
  detailFieldRefs,
  node,
  onCancelDateTextEdit,
  onClearDateField,
  onCommitDateTextEdit,
  onCloseDetailSelect,
  onCommitOpenDetailSelect,
  onDateDraftValueChange,
  onDateOpenChange,
  onDateSelect,
  onActivateField,
  onMoveOpenDetailSelect,
  onOpenChange,
  onStatusOpenChange,
  onStatusValueChange,
  onTypeOpenChange,
  onTypeValueChange,
  onUpdateNode,
  openDetailSelectField,
  open,
  saveError,
  saveStatus,
  statusValue,
  taskProgress,
  titleInputRef,
  typeValue,
}: {
  activeDateField: DateField | null;
  activeField: DetailField;
  calendarCursorDate: string | null;
  dateEditMode: DateEditMode | null;
  dateInputError: string | null;
  dateTextDraft: string;
  detailFieldRefs: {
    dueDate: RefObject<HTMLButtonElement | null>;
    memo: RefObject<HTMLTextAreaElement | null>;
    startDate: RefObject<HTMLButtonElement | null>;
    status: RefObject<HTMLButtonElement | null>;
    type: RefObject<HTMLButtonElement | null>;
  };
  node: YarukotoNode | null;
  onCancelDateTextEdit: () => void;
  onClearDateField: (field: DateField) => void;
  onCommitDateTextEdit: () => void;
  onCloseDetailSelect: () => void;
  onCommitOpenDetailSelect: () => void;
  onDateDraftValueChange: (value: string) => void;
  onDateOpenChange: (field: DateField, open: boolean) => void;
  onDateSelect: (field: DateField, dateKey: string) => void;
  onActivateField: (field: DetailField) => void;
  onMoveOpenDetailSelect: (direction: 1 | -1) => void;
  onOpenChange: (open: boolean) => void;
  onStatusOpenChange: (open: boolean) => void;
  onStatusValueChange: (value: NodeStatus) => void;
  onTypeOpenChange: (open: boolean) => void;
  onTypeValueChange: (value: NodeType) => void;
  onUpdateNode: (patch: UpdateNodeInput) => void;
  openDetailSelectField: DetailSelectField | null;
  open: boolean;
  saveError: string | null;
  saveStatus: SaveStatus;
  statusValue: NodeStatus;
  taskProgress: TaskProgressInfo | null;
  titleInputRef: RefObject<HTMLInputElement | null>;
  typeValue: NodeType;
}) {
  const fieldClass = (field: DetailField) =>
    cn(
      "rounded-md p-1 -m-1 transition-colors",
      activeField === field && "bg-accent/60 ring-1 ring-primary/30",
    );

  const handleSelectContentKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    switch (event.key) {
      case "j":
        event.preventDefault();
        event.stopPropagation();
        onMoveOpenDetailSelect(1);
        break;
      case "k":
        event.preventDefault();
        event.stopPropagation();
        onMoveOpenDetailSelect(-1);
        break;
      case "Enter":
        event.preventDefault();
        event.stopPropagation();
        onCommitOpenDetailSelect();
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        onCloseDetailSelect();
        break;
    }
  };

  return (
    <Dialog open={open && Boolean(node)} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[min(500px,calc(100vw-32px))]"
        onEscapeKeyDown={blurEditableOnEscape}
      >
        <DialogHeader>
          <DialogTitle>ノード編集</DialogTitle>
          <DialogDescription>
            {node ? node.title : "編集するノードを選択してください。"}
          </DialogDescription>
        </DialogHeader>
        {node ? (
          <form
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <label
              className={cn("grid gap-1.5 text-sm font-medium", fieldClass("title"))}
              onMouseDown={() => onActivateField("title")}
            >
              title
              <Input
                onChange={(event) =>
                  onUpdateNode({ title: event.currentTarget.value })
                }
                onKeyDown={blurEditableOnEnter}
                ref={titleInputRef}
                value={node.title}
              />
            </label>
            <div className="grid gap-3">
              <label
                className={cn(
                  "grid gap-1.5 text-sm font-medium",
                  fieldClass("type"),
                )}
                onMouseDown={() => onActivateField("type")}
              >
                type
                <Select
                  open={openDetailSelectField === "type"}
                  value={typeValue}
                  onOpenChange={onTypeOpenChange}
                  onValueChange={(value) => onTypeValueChange(value as NodeType)}
                >
                  <SelectTrigger ref={detailFieldRefs.type}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent onKeyDownCapture={handleSelectContentKeyDown}>
                    {NODE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <TaskProgressDetail progress={taskProgress} />
              <label
                className={cn(
                  "grid gap-1.5 text-sm font-medium",
                  fieldClass("status"),
                )}
                onMouseDown={() => onActivateField("status")}
              >
                status
                <Select
                  open={openDetailSelectField === "status"}
                  value={statusValue}
                  onOpenChange={onStatusOpenChange}
                  onValueChange={(value) =>
                    onStatusValueChange(value as NodeStatus)
                  }
                >
                  <SelectTrigger ref={detailFieldRefs.status}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent onKeyDownCapture={handleSelectContentKeyDown}>
                    {NODE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label
                className={cn(
                  "grid gap-1.5 text-sm font-medium",
                  fieldClass("startDate"),
                )}
                onMouseDown={() => onActivateField("startDate")}
              >
                開始日
                <DatePicker
                  calendarCursorDate={
                    activeDateField === "startDate" ? calendarCursorDate : null
                  }
                  clearLabel="開始日を削除"
                  error={activeDateField === "startDate" ? dateInputError : null}
                  mode={activeDateField === "startDate" ? dateEditMode : null}
                  onCancelTextEdit={onCancelDateTextEdit}
                  onClear={() => onClearDateField("startDate")}
                  onCommitTextEdit={onCommitDateTextEdit}
                  onDraftValueChange={onDateDraftValueChange}
                  onOpenChange={(open) => onDateOpenChange("startDate", open)}
                  onSelectDate={(dateKey) => onDateSelect("startDate", dateKey)}
                  placeholder="開始日なし"
                  textInputValue={
                    activeDateField === "startDate"
                      ? dateTextDraft
                      : node.startDate ?? ""
                  }
                  triggerRef={detailFieldRefs.startDate}
                  value={node.startDate}
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
                  calendarCursorDate={
                    activeDateField === "dueDate" ? calendarCursorDate : null
                  }
                  clearLabel="終了日を削除"
                  error={activeDateField === "dueDate" ? dateInputError : null}
                  mode={activeDateField === "dueDate" ? dateEditMode : null}
                  onCancelTextEdit={onCancelDateTextEdit}
                  onClear={() => onClearDateField("dueDate")}
                  onCommitTextEdit={onCommitDateTextEdit}
                  onDraftValueChange={onDateDraftValueChange}
                  onOpenChange={(open) => onDateOpenChange("dueDate", open)}
                  onSelectDate={(dateKey) => onDateSelect("dueDate", dateKey)}
                  placeholder="終了日なし"
                  textInputValue={
                    activeDateField === "dueDate" ? dateTextDraft : node.dueDate ?? ""
                  }
                  triggerRef={detailFieldRefs.dueDate}
                  value={node.dueDate}
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
                onKeyDown={blurEditableOnEnter}
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
