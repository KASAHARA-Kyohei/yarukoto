import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import {
  DetailFieldShell,
  NodeDateField,
  NodeStatusSelectField,
  NodeTypeSelectField,
  SaveStatusCard,
} from "./NodeDetailDialogFields";
import { TaskProgressDetail } from "./TaskProgress";
import {
  type DateEditMode,
  type DateField,
  type DetailSelectField,
  type DetailField,
  type SaveStatus,
} from "@/app/types";
import { getNodeDisplayTitle } from "@/domain/nodes/nodeAppearance";
import { isInvalidDateRange } from "@/domain/nodes/period";
import type { TaskProgressInfo } from "@/domain/nodes/progress";
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
import { Textarea } from "@/components/ui/textarea";
import {
  blurEditableOnEnter,
  blurEditableOnEscape,
  isImeCompositionEnter,
  resolveTitleEnterKey,
} from "./nodeDetailDialogUtils";

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
  const [isAwaitingSecondTitleEnter, setIsAwaitingSecondTitleEnter] =
    useState(false);
  const isTitleComposingRef = useRef(false);
  const pendingTitleCompositionEnterRef = useRef(false);
  const preserveTitleEnterOnNextChangeRef = useRef(false);

  const resetTitleEnterState = () => {
    pendingTitleCompositionEnterRef.current = false;
    preserveTitleEnterOnNextChangeRef.current = false;
    setIsAwaitingSecondTitleEnter(false);
  };

  useEffect(() => {
    isTitleComposingRef.current = false;
    resetTitleEnterState();
  }, [node?.id, open]);

  const handleTitleEnter = (
    event: ReactKeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    const isImeEnter =
      isTitleComposingRef.current || isImeCompositionEnter(event.nativeEvent);
    const next = resolveTitleEnterKey({
      isAwaitingSecondEnter: isAwaitingSecondTitleEnter,
      isImeEnter,
    });
    pendingTitleCompositionEnterRef.current = isImeEnter;
    preserveTitleEnterOnNextChangeRef.current =
      next.shouldPreserveOnNextChange;
    setIsAwaitingSecondTitleEnter(next.isAwaitingSecondEnter);
    if (next.shouldBlur) {
      event.currentTarget.blur();
    }
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (preserveTitleEnterOnNextChangeRef.current) {
      preserveTitleEnterOnNextChangeRef.current = false;
      setIsAwaitingSecondTitleEnter(true);
    } else {
      setIsAwaitingSecondTitleEnter(false);
    }
    onUpdateNode({ title: event.currentTarget.value });
  };

  const handleTitleCompositionEnd = () => {
    isTitleComposingRef.current = false;
    if (!pendingTitleCompositionEnterRef.current) {
      return;
    }
    pendingTitleCompositionEnterRef.current = false;
    preserveTitleEnterOnNextChangeRef.current = true;
    setIsAwaitingSecondTitleEnter(true);
  };

  const handleSelectContentKeyDown = (
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) => {
    switch (event.key) {
      case "j":
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        onMoveOpenDetailSelect(1);
        break;
      case "k":
      case "ArrowUp":
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
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={blurEditableOnEscape}
      >
        <DialogHeader>
          <DialogTitle>ノード編集</DialogTitle>
          <DialogDescription>
            {node ? getNodeDisplayTitle(node) : "編集するノードを選択してください。"}
          </DialogDescription>
        </DialogHeader>
        {node ? (
          <form
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
            onSubmit={(event) => event.preventDefault()}
          >
            <DetailFieldShell
              activeField={activeField}
              field="title"
              label="title"
              onActivateField={onActivateField}
            >
              <Input
                onChange={handleTitleChange}
                onBlur={resetTitleEnterState}
                onCompositionEnd={handleTitleCompositionEnd}
                onCompositionStart={() => {
                  isTitleComposingRef.current = true;
                  resetTitleEnterState();
                }}
                onFocus={resetTitleEnterState}
                onKeyDown={handleTitleEnter}
                placeholder="タイトルを入力"
                ref={titleInputRef}
                value={node.title}
              />
            </DetailFieldShell>
            <div className="grid gap-3">
              <NodeTypeSelectField
                activeField={activeField}
                openDetailSelectField={openDetailSelectField}
                triggerRef={detailFieldRefs.type}
                typeValue={typeValue}
                onActivateField={onActivateField}
                onContentKeyDown={handleSelectContentKeyDown}
                onOpenChange={onTypeOpenChange}
                onValueChange={onTypeValueChange}
              />
              <TaskProgressDetail progress={taskProgress} />
              <NodeStatusSelectField
                activeField={activeField}
                openDetailSelectField={openDetailSelectField}
                statusValue={statusValue}
                triggerRef={detailFieldRefs.status}
                onActivateField={onActivateField}
                onContentKeyDown={handleSelectContentKeyDown}
                onOpenChange={onStatusOpenChange}
                onValueChange={onStatusValueChange}
              />
              <NodeDateField
                activeDateField={activeDateField}
                activeField={activeField}
                calendarCursorDate={calendarCursorDate}
                clearLabel="開始日を削除"
                dateEditMode={dateEditMode}
                dateInputError={dateInputError}
                dateTextDraft={dateTextDraft}
                field="startDate"
                label="開始日"
                node={node}
                placeholder="開始日なし"
                triggerRef={detailFieldRefs.startDate}
                onActivateField={onActivateField}
                onCancelDateTextEdit={onCancelDateTextEdit}
                onClearDateField={onClearDateField}
                onCommitDateTextEdit={onCommitDateTextEdit}
                onDateDraftValueChange={onDateDraftValueChange}
                onDateOpenChange={onDateOpenChange}
                onDateSelect={onDateSelect}
              />
              <NodeDateField
                activeDateField={activeDateField}
                activeField={activeField}
                calendarCursorDate={calendarCursorDate}
                clearLabel="終了日を削除"
                dateEditMode={dateEditMode}
                dateInputError={dateInputError}
                dateTextDraft={dateTextDraft}
                field="dueDate"
                label="終了日"
                node={node}
                placeholder="終了日なし"
                triggerRef={detailFieldRefs.dueDate}
                onActivateField={onActivateField}
                onCancelDateTextEdit={onCancelDateTextEdit}
                onClearDateField={onClearDateField}
                onCommitDateTextEdit={onCommitDateTextEdit}
                onDateDraftValueChange={onDateDraftValueChange}
                onDateOpenChange={onDateOpenChange}
                onDateSelect={onDateSelect}
              />
            </div>
            {isInvalidDateRange(node) ? (
              <div className="rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                開始日が終了日より後になっています。保存はできますが、期間表示は警告色になります。
              </div>
            ) : null}
            <DetailFieldShell
              activeField={activeField}
              field="memo"
              label="memo"
              onActivateField={onActivateField}
            >
              <Textarea
                className="min-h-48 resize-y leading-6"
                onChange={(event) =>
                  onUpdateNode({ memo: event.currentTarget.value })
                }
                onKeyDown={blurEditableOnEnter}
                ref={detailFieldRefs.memo}
                value={node.memo}
              />
            </DetailFieldShell>
            <SaveStatusCard saveError={saveError} saveStatus={saveStatus} />
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
