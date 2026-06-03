import type {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
} from "react";
import { DatePicker } from "./DatePicker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type DateEditMode,
  type DateField,
  type DetailField,
  type DetailSelectField,
  type SaveStatus,
} from "@/app/types";
import {
  NODE_STATUSES,
  NODE_TYPES,
  type NodeStatus,
  type NodeType,
  type YarukotoNode,
} from "@/domain/nodes/types";
import { cn } from "@/lib/utils";
import { saveStatusVariant } from "./nodeDetailDialogUtils";

export function DetailFieldShell({
  activeField,
  children,
  field,
  label,
  onActivateField,
}: {
  activeField: DetailField;
  children: ReactNode;
  field: DetailField;
  label: string;
  onActivateField: (field: DetailField) => void;
}) {
  return (
    <label
      className={cn(
        "grid gap-1.5 text-sm font-medium",
        "rounded-md p-1 -m-1 transition-colors",
        activeField === field && "bg-accent/60 ring-1 ring-primary/30",
      )}
      onMouseDown={() => onActivateField(field)}
    >
      {label}
      {children}
    </label>
  );
}

export function NodeTypeSelectField({
  activeField,
  openDetailSelectField,
  typeValue,
  triggerRef,
  onActivateField,
  onContentKeyDown,
  onOpenChange,
  onValueChange,
}: {
  activeField: DetailField;
  openDetailSelectField: DetailSelectField | null;
  typeValue: NodeType;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onActivateField: (field: DetailField) => void;
  onContentKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: NodeType) => void;
}) {
  return (
    <DetailFieldShell
      activeField={activeField}
      field="type"
      label="type"
      onActivateField={onActivateField}
    >
      <Select
        open={openDetailSelectField === "type"}
        value={typeValue}
        onOpenChange={onOpenChange}
        onValueChange={(value) => onValueChange(value as NodeType)}
      >
        <SelectTrigger ref={triggerRef}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent onKeyDownCapture={onContentKeyDown}>
          {NODE_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </DetailFieldShell>
  );
}

export function NodeStatusSelectField({
  activeField,
  openDetailSelectField,
  statusValue,
  triggerRef,
  onActivateField,
  onContentKeyDown,
  onOpenChange,
  onValueChange,
}: {
  activeField: DetailField;
  openDetailSelectField: DetailSelectField | null;
  statusValue: NodeStatus;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onActivateField: (field: DetailField) => void;
  onContentKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: NodeStatus) => void;
}) {
  return (
    <DetailFieldShell
      activeField={activeField}
      field="status"
      label="status"
      onActivateField={onActivateField}
    >
      <Select
        open={openDetailSelectField === "status"}
        value={statusValue}
        onOpenChange={onOpenChange}
        onValueChange={(value) => onValueChange(value as NodeStatus)}
      >
        <SelectTrigger ref={triggerRef}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent onKeyDownCapture={onContentKeyDown}>
          {NODE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </DetailFieldShell>
  );
}

export function NodeDateField({
  activeDateField,
  activeField,
  calendarCursorDate,
  clearLabel,
  dateEditMode,
  dateInputError,
  dateTextDraft,
  field,
  label,
  node,
  placeholder,
  triggerRef,
  onActivateField,
  onCancelDateTextEdit,
  onClearDateField,
  onCommitDateTextEdit,
  onDateDraftValueChange,
  onDateOpenChange,
  onDateSelect,
}: {
  activeDateField: DateField | null;
  activeField: DetailField;
  calendarCursorDate: string | null;
  clearLabel: string;
  dateEditMode: DateEditMode | null;
  dateInputError: string | null;
  dateTextDraft: string;
  field: DateField;
  label: string;
  node: YarukotoNode;
  placeholder: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onActivateField: (field: DetailField) => void;
  onCancelDateTextEdit: () => void;
  onClearDateField: (field: DateField) => void;
  onCommitDateTextEdit: () => void;
  onDateDraftValueChange: (value: string) => void;
  onDateOpenChange: (field: DateField, open: boolean) => void;
  onDateSelect: (field: DateField, dateKey: string) => void;
}) {
  const isActiveDateField = activeDateField === field;
  const value = field === "startDate" ? node.startDate : node.dueDate;

  return (
    <DetailFieldShell
      activeField={activeField}
      field={field}
      label={label}
      onActivateField={onActivateField}
    >
      <DatePicker
        calendarCursorDate={isActiveDateField ? calendarCursorDate : null}
        clearLabel={clearLabel}
        error={isActiveDateField ? dateInputError : null}
        mode={isActiveDateField ? dateEditMode : null}
        onCancelTextEdit={onCancelDateTextEdit}
        onClear={() => onClearDateField(field)}
        onCommitTextEdit={onCommitDateTextEdit}
        onDraftValueChange={onDateDraftValueChange}
        onOpenChange={(open) => onDateOpenChange(field, open)}
        onSelectDate={(dateKey) => onDateSelect(field, dateKey)}
        placeholder={placeholder}
        textInputValue={isActiveDateField ? dateTextDraft : value ?? ""}
        triggerRef={triggerRef}
        value={value}
      />
    </DetailFieldShell>
  );
}

export function SaveStatusCard({
  saveError,
  saveStatus,
}: {
  saveError: string | null;
  saveStatus: SaveStatus;
}) {
  return (
    <Card className="bg-card/80">
      <CardContent className="space-y-1 p-3 text-xs leading-5 text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>save</span>
          <Badge variant={saveStatusVariant(saveStatus)}>{saveStatus}</Badge>
        </div>
        {saveError ? <div className="text-destructive">{saveError}</div> : null}
      </CardContent>
    </Card>
  );
}
