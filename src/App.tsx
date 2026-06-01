import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { CalendarView } from "./components/CalendarView";
import { CenterHeader } from "./components/CenterHeader";
import { FocusHintOverlay } from "./components/FocusHintOverlay";
import { FooterText } from "./components/FooterText";
import { NodeDetailDialog } from "./components/NodeDetailDialog";
import { PaneHeader } from "./components/PaneHeader";
import { ReportView } from "./components/ReportView";
import { ShortcutHelp } from "./components/ShortcutHelp";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { buildTaskProgressMap } from "./domain/nodes/progress";
import { Toolbar } from "./components/Toolbar";
import { TreeView } from "./components/TreeView";
import { getCycledValue } from "@/app/cycleValue";
import {
  addDaysToDateKey,
  addMonthsToDateKey,
  getInitialDateKey,
  parseDateInput,
} from "@/app/dateEditing";
import type {
  ActivePane,
  CenterView,
  DateEditMode,
  DateField,
  DetailField,
  DetailSelectField,
} from "@/app/types";
import { isDateField } from "@/app/types";
import { Button } from "@/components/ui/button";
import { statusBadgeClass } from "@/domain/nodes/nodeAppearance";
import {
  NODE_STATUSES,
  NODE_TYPES,
  type NodeStatus,
  type NodeType,
  type YarukotoNode,
} from "@/domain/nodes/types";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { getNextCenterView } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { useYarukotoNodes } from "./hooks/useYarukotoNodes";
import { cn } from "./lib/utils";

function App() {
  const { cycleTheme, setThemeId, themeId } = useTheme();
  const [activePane, setActivePane] = useState<ActivePane>("center");
  const [centerView, setCenterView] = useState<CenterView>("tree");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFocusHintOpen, setIsFocusHintOpen] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [activeDetailField, setActiveDetailField] =
    useState<DetailField>("title");
  const [activeDateField, setActiveDateField] = useState<DateField | null>(
    null,
  );
  const [dateEditMode, setDateEditMode] = useState<DateEditMode | null>(null);
  const [dateDraftValue, setDateDraftValue] = useState("");
  const [dateInputError, setDateInputError] = useState<string | null>(null);
  const [calendarCursorDate, setCalendarCursorDate] = useState<string | null>(
    null,
  );
  const [openDetailSelectField, setOpenDetailSelectField] =
    useState<DetailSelectField | null>(null);
  const [statusSelectDraft, setStatusSelectDraft] = useState<NodeStatus | null>(
    null,
  );
  const [typeSelectDraft, setTypeSelectDraft] = useState<NodeType | null>(null);
  const dueDateButtonRef = useRef<HTMLButtonElement | null>(null);
  const memoTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const startDateButtonRef = useRef<HTMLButtonElement | null>(null);
  const statusTriggerRef = useRef<HTMLButtonElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const typeTriggerRef = useRef<HTMLButtonElement | null>(null);
  const detailFieldRefs = useMemo(
    () => ({
      dueDate: dueDateButtonRef,
      memo: memoTextareaRef,
      startDate: startDateButtonRef,
      status: statusTriggerRef,
      title: titleInputRef,
      type: typeTriggerRef,
    }),
    [],
  );
  const {
    activeRootId,
    actionError,
    calendarNodes,
    clearPendingUndoDelete,
    createChild,
    createRoot,
    createSiblingBelow,
    deleteSelected,
    error,
    expandedIds,
    indentSelected,
    isLoading,
    isMutating,
    moveSelectedDown,
    moveSelectedUp,
    nodes,
    outdentSelected,
    pendingUndoDelete,
    restorePendingDelete,
    roots,
    saveError,
    saveStatus,
    scopedNodes,
    selectNode,
    selectedId,
    selectedNode,
    toggleExpanded,
    updateSelected,
    visibleNodes,
  } = useYarukotoNodes();
  const taskProgressById = useMemo(
    () => buildTaskProgressMap(scopedNodes),
    [scopedNodes],
  );
  const selectedTaskProgress = useMemo(
    () =>
      selectedNode ? (taskProgressById.get(selectedNode.id) ?? null) : null,
    [selectedNode, taskProgressById],
  );

  const openDetailEditor = useCallback((node: YarukotoNode | null) => {
    if (!node) {
      return;
    }
    setActivePane("center");
    setIsDetailDialogOpen(true);
    setActiveDetailField("title");
  }, []);

  const handleCreateRoot = useCallback(async () => {
    openDetailEditor(await createRoot());
  }, [createRoot, openDetailEditor]);

  const handleCreateRootInProjects = useCallback(async () => {
    await createRoot();
    setActivePane("projects");
  }, [createRoot]);

  const handleCreateChild = useCallback(async () => {
    openDetailEditor(await createChild());
  }, [createChild, openDetailEditor]);

  const handleCreateSiblingBelow = useCallback(async () => {
    openDetailEditor(await createSiblingBelow());
  }, [createSiblingBelow, openDetailEditor]);

  const getDateFieldValue = useCallback(
    (field: DateField) => {
      if (!selectedNode) {
        return null;
      }
      return field === "startDate"
        ? selectedNode.startDate
        : selectedNode.dueDate;
    },
    [selectedNode],
  );

  const updateDateField = useCallback(
    (field: DateField, value: string | null) => {
      void updateSelected(
        field === "startDate" ? { startDate: value } : { dueDate: value },
      );
    },
    [updateSelected],
  );

  const resetDetailSelectState = useCallback(() => {
    setOpenDetailSelectField(null);
    setStatusSelectDraft(null);
    setTypeSelectDraft(null);
  }, []);

  const openDetailSelect = useCallback(
    (field: DetailSelectField) => {
      if (!selectedNode) {
        return;
      }
      if (field === "type") {
        setTypeSelectDraft(selectedNode.type);
        setStatusSelectDraft(null);
      } else {
        setStatusSelectDraft(selectedNode.status);
        setTypeSelectDraft(null);
      }
      setOpenDetailSelectField(field);
    },
    [selectedNode],
  );

  const closeDetailSelect = useCallback(() => {
    resetDetailSelectState();
  }, [resetDetailSelectState]);

  const resetDateInteraction = useCallback(() => {
    setActiveDateField(null);
    setDateEditMode(null);
    setDateDraftValue("");
    setDateInputError(null);
    setCalendarCursorDate(null);
  }, []);

  const openDatePicker = useCallback(
    (field: DateField) => {
      const currentValue = getDateFieldValue(field);
      setActiveDateField(field);
      setDateEditMode("calendar");
      setDateDraftValue(currentValue ?? "");
      setDateInputError(null);
      setCalendarCursorDate(getInitialDateKey(currentValue));
    },
    [getDateFieldValue],
  );

  const closeDatePicker = useCallback(() => {
    if (dateEditMode === "calendar") {
      resetDateInteraction();
    }
  }, [dateEditMode, resetDateInteraction]);

  const openDateTextEdit = useCallback(
    (field: DateField) => {
      const currentValue = getDateFieldValue(field);
      setActiveDateField(field);
      setDateEditMode("text");
      setDateDraftValue(currentValue ?? "");
      setDateInputError(null);
      setCalendarCursorDate(null);
    },
    [getDateFieldValue],
  );

  const cancelDateTextEdit = useCallback(() => {
    if (dateEditMode === "text") {
      resetDateInteraction();
    }
  }, [dateEditMode, resetDateInteraction]);

  const moveCalendarCursorByDays = useCallback((amount: number) => {
    setCalendarCursorDate((currentValue) =>
      addDaysToDateKey(getInitialDateKey(currentValue), amount),
    );
  }, []);

  const moveCalendarCursorByMonths = useCallback((amount: number) => {
    setCalendarCursorDate((currentValue) =>
      addMonthsToDateKey(getInitialDateKey(currentValue), amount),
    );
  }, []);

  const moveCalendarCursorToToday = useCallback(() => {
    setCalendarCursorDate(getInitialDateKey(null));
  }, []);

  const commitCalendarDate = useCallback(() => {
    if (!activeDateField) {
      return;
    }
    updateDateField(activeDateField, getInitialDateKey(calendarCursorDate));
    resetDateInteraction();
  }, [
    activeDateField,
    calendarCursorDate,
    resetDateInteraction,
    updateDateField,
  ]);

  const commitDateTextEdit = useCallback(() => {
    if (!activeDateField) {
      return;
    }
    const result = parseDateInput(dateDraftValue);
    if (result.error) {
      setDateInputError(result.error);
      return;
    }
    updateDateField(activeDateField, result.value);
    resetDateInteraction();
  }, [activeDateField, dateDraftValue, resetDateInteraction, updateDateField]);

  const clearDateField = useCallback(
    (field: DateField) => {
      updateDateField(field, null);
      if (activeDateField === field) {
        resetDateInteraction();
      }
    },
    [activeDateField, resetDateInteraction, updateDateField],
  );

  const clearActiveDate = useCallback(() => {
    if (!isDateField(activeDetailField)) {
      return;
    }
    clearDateField(activeDetailField);
  }, [activeDetailField, clearDateField]);

  const handleDateOpenChange = useCallback(
    (field: DateField, open: boolean) => {
      if (open) {
        openDatePicker(field);
        return;
      }
      if (activeDateField === field && dateEditMode === "calendar") {
        resetDateInteraction();
      }
    },
    [activeDateField, dateEditMode, openDatePicker, resetDateInteraction],
  );

  const handleDateSelect = useCallback(
    (field: DateField, dateKey: string) => {
      updateDateField(field, dateKey);
      resetDateInteraction();
    },
    [resetDateInteraction, updateDateField],
  );

  const moveOpenDetailSelect = useCallback(
    (direction: 1 | -1) => {
      if (!selectedNode || !openDetailSelectField) {
        return;
      }
      if (openDetailSelectField === "type") {
        setTypeSelectDraft((currentValue) =>
          getCycledValue(
            NODE_TYPES,
            currentValue ?? selectedNode.type,
            direction,
          ),
        );
      } else {
        setStatusSelectDraft((currentValue) =>
          getCycledValue(
            NODE_STATUSES,
            currentValue ?? selectedNode.status,
            direction,
          ),
        );
      }
    },
    [openDetailSelectField, selectedNode],
  );

  const commitOpenDetailSelect = useCallback(() => {
    if (!selectedNode || !openDetailSelectField) {
      return;
    }
    if (openDetailSelectField === "type") {
      const nextType = typeSelectDraft ?? selectedNode.type;
      resetDetailSelectState();
      if (nextType !== selectedNode.type) {
        void updateSelected({ type: nextType });
      }
      return;
    }
    const nextStatus = statusSelectDraft ?? selectedNode.status;
    resetDetailSelectState();
    if (nextStatus !== selectedNode.status) {
      void updateSelected({ status: nextStatus });
    }
  }, [
    openDetailSelectField,
    resetDetailSelectState,
    selectedNode,
    statusSelectDraft,
    typeSelectDraft,
    updateSelected,
  ]);

  const cycleTypeValue = useCallback(
    (direction: 1 | -1) => {
      if (!selectedNode) {
        return;
      }
      updateSelected({
        type: getCycledValue(NODE_TYPES, selectedNode.type, direction),
      });
    },
    [selectedNode, updateSelected],
  );

  useEffect(() => {
    if (!isDetailDialogOpen || !selectedNode) {
      resetDetailSelectState();
      resetDateInteraction();
    }
  }, [
    isDetailDialogOpen,
    resetDateInteraction,
    resetDetailSelectState,
    selectedNode?.id,
  ]);

  const cycleStatusValue = useCallback(
    (direction: 1 | -1) => {
      if (!selectedNode) {
        return;
      }
      updateSelected({
        status: getCycledValue(NODE_STATUSES, selectedNode.status, direction),
      });
    },
    [selectedNode, updateSelected],
  );

  const moveCenterView = useCallback((direction: 1 | -1) => {
    setCenterView((current) => getNextCenterView(current, direction));
  }, []);

  const moveCalendarMonth = useCallback((direction: 1 | -1) => {
    setCalendarMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  }, []);

  const resetCalendarMonthToToday = useCallback(() => {
    setCalendarMonth(new Date());
  }, []);

  const handleFocusHintFocused = useCallback((element: HTMLElement) => {
    const pane = element.closest<HTMLElement>("[data-app-pane]")?.dataset
      .appPane as ActivePane | undefined;
    if (pane) {
      setActivePane(pane);
    }
    if (element === titleInputRef.current) {
      setActiveDetailField("title");
    } else if (element === typeTriggerRef.current) {
      setActiveDetailField("type");
    } else if (element === statusTriggerRef.current) {
      setActiveDetailField("status");
    } else if (element === startDateButtonRef.current) {
      setActiveDetailField("startDate");
    } else if (element === dueDateButtonRef.current) {
      setActiveDetailField("dueDate");
    } else if (element === memoTextareaRef.current) {
      setActiveDetailField("memo");
    }
  }, []);

  useEffect(() => {
    if (!selectedNode) {
      return;
    }
    document.title = `${selectedNode.title} - yarukoto`;
  }, [selectedNode]);

  useKeyboardShortcuts({
    activeDateField,
    activeDetailField,
    activePane,
    centerView,
    cancelDateTextEdit,
    clearActiveDate,
    closeDatePicker,
    closeDetailSelect,
    commitCalendarDate,
    commitDateTextEdit,
    commitOpenDetailSelect,
    cycleTheme,
    cycleStatusValue,
    cycleTypeValue,
    createChild: handleCreateChild,
    createRootAndEdit: handleCreateRoot,
    createRootInProjects: handleCreateRootInProjects,
    createSiblingBelow: handleCreateSiblingBelow,
    deleteSelected,
    detailFieldRefs,
    expandedIds,
    indentSelected,
    isDetailDialogOpen,
    isDatePickerOpen: dateEditMode === "calendar",
    isDateTextEditing: dateEditMode === "text",
    isFocusHintOpen,
    isMutating,
    isShortcutHelpOpen,
    moveCalendarCursorByDays,
    moveCalendarCursorByMonths,
    moveCalendarCursorToToday,
    moveCalendarMonth,
    moveCenterView,
    moveOpenDetailSelect,
    moveSelectedDown,
    moveSelectedUp,
    nodes,
    openDatePicker,
    openDateTextEdit,
    openDetailSelect,
    openDetailSelectField,
    onCloseDetailDialog: () => setIsDetailDialogOpen(false),
    onCloseShortcutHelp: () => setIsShortcutHelpOpen(false),
    onOpenDetailDialog: () => openDetailEditor(selectedNode),
    onOpenFocusHint: () => setIsFocusHintOpen(true),
    onOpenShortcutHelp: () => setIsShortcutHelpOpen(true),
    pendingUndoDelete,
    outdentSelected,
    roots,
    resetCalendarMonthToToday,
    restorePendingDelete,
    selectNode,
    setActiveDetailField,
    setActivePane,
    selectedId,
    selectedNode,
    toggleExpanded,
    visibleNodes,
  });

  if (isLoading) {
    return (
      <main className="grid h-full place-items-center bg-background text-sm text-muted-foreground">
        yarukoto を起動中...
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid h-full place-items-center bg-background p-8">
        <section className="max-w-xl rounded-md border border-destructive/30 bg-card p-5 text-sm text-destructive shadow-sm">
          <h1 className="mb-2 text-base font-semibold">起動に失敗しました</h1>
          <p className="whitespace-pre-wrap">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex h-full min-h-0 bg-background text-foreground">
      <aside
        className={cn(
          "relative flex w-64 shrink-0 flex-col border-r border-border bg-muted/80 ring-inset transition-[box-shadow,background-color]",
          activePane === "projects"
            ? "bg-secondary"
            : "after:pointer-events-none after:absolute after:inset-0 after:bg-foreground/7 after:content-['']",
        )}
        data-app-pane="projects"
        onMouseDown={() => setActivePane("projects")}
      >
        <PaneHeader title="Projects" />
        <div className="flex-1 overflow-y-auto p-2">
          {roots.map((root) => (
            <button
              className={cn(
                "mb-1 block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                activeRootId === root.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-card",
                activePane === "projects" &&
                  activeRootId === root.id &&
                  "ring-2 ring-primary/30 ring-offset-1 ring-offset-muted",
              )}
              data-project-focus-id={root.id}
              key={root.id}
              onClick={() => selectNode(root.id)}
              type="button"
            >
              <span className="block truncate font-medium">{root.title}</span>
              <span
                className={cn(
                  "inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                  activeRootId === root.id
                    ? "border-primary-foreground/20 bg-primary-foreground/12 text-primary-foreground"
                    : statusBadgeClass(root.status),
                )}
              >
                {root.status}
              </span>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-2">
          <div className="flex gap-2">
            <Button
              className="min-w-0 flex-1"
              disabled={isMutating}
              variant="outline"
              onClick={() => void handleCreateRoot()}
              type="button"
            >
              {isMutating ? "追加中..." : "ルート追加"}
            </Button>
            <ThemeSwitcher themeId={themeId} onChangeTheme={setThemeId} />
          </div>
        </div>
      </aside>

      <section
        className={cn(
          "relative flex min-w-0 flex-1 flex-col bg-card/60 ring-inset transition-[box-shadow,background-color]",
          activePane === "center"
            ? "bg-card"
            : "after:pointer-events-none after:absolute after:inset-0 after:bg-foreground/7 after:content-['']",
        )}
        data-app-pane="center"
        onMouseDown={() => setActivePane("center")}
      >
        <CenterHeader
          view={centerView}
          onChangeView={(view) => {
            setActivePane("center");
            setCenterView(view);
          }}
        />
        {centerView === "tree" ? (
          <>
            <Toolbar
              disabled={!selectedNode || isMutating}
              isLoading={isMutating}
              onEdit={() => openDetailEditor(selectedNode)}
              onAddChild={() => void handleCreateChild()}
              onAddSibling={() => void handleCreateSiblingBelow()}
              onDelete={() => void deleteSelected()}
              onIndent={() => void indentSelected()}
              onMoveDown={() => void moveSelectedDown()}
              onMoveUp={() => void moveSelectedUp()}
              onOutdent={() => void outdentSelected()}
            />
            <TreeView
              expandedIds={expandedIds}
              selectedId={selectedId}
              taskProgressById={taskProgressById}
              visibleNodes={visibleNodes}
              onSelectNode={selectNode}
              onToggleExpanded={toggleExpanded}
            />
          </>
        ) : (
          <>
            {centerView === "calendar" ? (
              <CalendarView
                month={calendarMonth}
                nodes={calendarNodes}
                selectedId={selectedId}
                onChangeMonth={setCalendarMonth}
                onSelectNode={selectNode}
              />
            ) : null}
            {centerView === "report" ? (
              <ReportView
                nodes={scopedNodes}
                selectedId={selectedId}
                onSelectNode={selectNode}
              />
            ) : null}
          </>
        )}
        <footer className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          {actionError ? (
            <span className="text-destructive">
              操作に失敗しました: {actionError}
            </span>
          ) : pendingUndoDelete ? (
            <span className="inline-flex items-center gap-2">
              <span>「{pendingUndoDelete.title}」を削除しました</span>
              <Button
                className="h-6 px-2 text-xs"
                size="sm"
                type="button"
                variant="outline"
                onClick={() => void restorePendingDelete()}
              >
                元に戻す
              </Button>
              <Button
                className="h-6 px-2 text-xs"
                size="sm"
                type="button"
                variant="ghost"
                onClick={clearPendingUndoDelete}
              >
                閉じる
              </Button>
            </span>
          ) : isMutating ? (
            <span>保存中...</span>
          ) : (
            <FooterText activePane={activePane} view={centerView} />
          )}
        </footer>
      </section>
      <NodeDetailDialog
        activeField={activeDetailField}
        activeDateField={activeDateField}
        calendarCursorDate={calendarCursorDate}
        dateEditMode={dateEditMode}
        dateInputError={dateInputError}
        dateTextDraft={dateDraftValue}
        detailFieldRefs={{
          dueDate: dueDateButtonRef,
          memo: memoTextareaRef,
          startDate: startDateButtonRef,
          status: statusTriggerRef,
          type: typeTriggerRef,
        }}
        node={selectedNode}
        onCancelDateTextEdit={cancelDateTextEdit}
        onClearDateField={clearDateField}
        onCommitDateTextEdit={commitDateTextEdit}
        onCloseDetailSelect={closeDetailSelect}
        onCommitOpenDetailSelect={commitOpenDetailSelect}
        onDateDraftValueChange={setDateDraftValue}
        onDateOpenChange={handleDateOpenChange}
        onDateSelect={handleDateSelect}
        openDetailSelectField={openDetailSelectField}
        open={isDetailDialogOpen}
        onMoveOpenDetailSelect={moveOpenDetailSelect}
        saveError={saveError}
        saveStatus={saveStatus}
        statusValue={
          openDetailSelectField === "status"
            ? (statusSelectDraft ?? selectedNode?.status ?? NODE_STATUSES[0])
            : (selectedNode?.status ?? NODE_STATUSES[0])
        }
        taskProgress={selectedTaskProgress}
        titleInputRef={titleInputRef}
        typeValue={
          openDetailSelectField === "type"
            ? (typeSelectDraft ?? selectedNode?.type ?? NODE_TYPES[0])
            : (selectedNode?.type ?? NODE_TYPES[0])
        }
        onActivateField={setActiveDetailField}
        onOpenChange={setIsDetailDialogOpen}
        onStatusOpenChange={(open) => {
          if (open) {
            openDetailSelect("status");
          } else if (openDetailSelectField === "status") {
            closeDetailSelect();
          }
        }}
        onStatusValueChange={(value) => {
          void updateSelected({ status: value });
          resetDetailSelectState();
        }}
        onTypeOpenChange={(open) => {
          if (open) {
            openDetailSelect("type");
          } else if (openDetailSelectField === "type") {
            closeDetailSelect();
          }
        }}
        onTypeValueChange={(value) => {
          void updateSelected({ type: value });
          resetDetailSelectState();
        }}
        onUpdateNode={(patch) => void updateSelected(patch)}
      />
      {isShortcutHelpOpen ? (
        <ShortcutHelp
          activePane={activePane}
          centerView={centerView}
          isDetailDialogOpen={isDetailDialogOpen}
          onClose={() => setIsShortcutHelpOpen(false)}
        />
      ) : null}
      {isFocusHintOpen ? (
        <FocusHintOverlay
          onClose={() => setIsFocusHintOpen(false)}
          onFocused={handleFocusHintFocused}
        />
      ) : null}
    </main>
  );
}

export default App;
