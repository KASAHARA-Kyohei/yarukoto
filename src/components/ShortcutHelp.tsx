import { useLanguage } from "@/app/LanguageProvider";
import { SHORTCUT_KEYS } from "@/app/shortcutKeys";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivePane, CenterView } from "@/app/types";

export function ShortcutHelp({
  activePane,
  centerView,
  isDetailDialogOpen = false,
  onClose,
}: {
  activePane: ActivePane;
  centerView: CenterView;
  isDetailDialogOpen?: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const commonShortcuts: Array<[string, string]> = [
    ["Tab / Shift+Tab", t.shortcutPaneNavigation],
    ["Ctrl+h / Ctrl+l", t.shortcutSwitchPanes],
    [SHORTCUT_KEYS.changeTab, t.shortcutSwitchTabs],
    [SHORTCUT_KEYS.changeTheme, t.shortcutCycleTheme],
    [SHORTCUT_KEYS.undo, t.shortcutUndoDelete],
    ["f", t.shortcutFocusHint],
    ["?", t.shortcutToggleHelp],
    [SHORTCUT_KEYS.close, t.shortcutDismiss],
  ];

  const projectShortcuts: Array<[string, string]> = [
    [SHORTCUT_KEYS.selectRow, t.shortcutSelectProject],
    [`${SHORTCUT_KEYS.moveDown} / ${SHORTCUT_KEYS.moveUp}`, t.shortcutReorderProjects],
    [SHORTCUT_KEYS.addProject, t.shortcutAddProjectInPane],
    ["l / Enter / →", t.shortcutOpenWorkspace],
  ];

  const treeShortcuts: Array<[string, string]> = [
    [SHORTCUT_KEYS.selectRow, t.shortcutSelectNode],
    ["h / l / ← / →", t.shortcutExpandNode],
    [SHORTCUT_KEYS.collapseTree, t.shortcutCollapseTree],
    [SHORTCUT_KEYS.addChild, t.shortcutAddChildAndEdit],
    [SHORTCUT_KEYS.addAbove, t.shortcutAddAboveAndEdit],
    [SHORTCUT_KEYS.addBelow, t.shortcutAddBelowAndEdit],
    ["R", t.shortcutAddRootAndEdit],
    [SHORTCUT_KEYS.copyReview, t.shortcutCopyReview],
    [SHORTCUT_KEYS.importReview, t.shortcutImportReview],
    [SHORTCUT_KEYS.exportJson, t.shortcutExportProject],
    [SHORTCUT_KEYS.importJson, t.shortcutImportProject],
    [SHORTCUT_KEYS.edit, t.shortcutOpenEditor],
    [SHORTCUT_KEYS.delete, t.shortcutDeleteNode],
    [`${SHORTCUT_KEYS.moveDown} / ${SHORTCUT_KEYS.moveUp}`, t.shortcutMoveNode],
    [`${SHORTCUT_KEYS.indent} / ${SHORTCUT_KEYS.outdent}`, t.shortcutChangeNesting],
  ];

  const calendarShortcuts: Array<[string, string]> = [
    [`${SHORTCUT_KEYS.previousMonth} / ${SHORTCUT_KEYS.nextMonth}`, t.shortcutChangeMonth],
    [SHORTCUT_KEYS.resetMonth, t.shortcutGoToThisMonth],
    [SHORTCUT_KEYS.edit, t.shortcutEditSelectedNode],
  ];

  const kanbanShortcuts: Array<[string, string]> = [
    [SHORTCUT_KEYS.selectRow, t.shortcutSelectCard],
    ["h / l / ← / →", t.shortcutSelectColumn],
    ["H / L", t.shortcutMoveCard],
    [SHORTCUT_KEYS.edit, t.shortcutEditSelectedTask],
    [t.drag, t.shortcutDropCard],
    ["f", t.shortcutFocusCard],
  ];

  const reportShortcuts: Array<[string, string]> = [
    [SHORTCUT_KEYS.edit, t.shortcutEditSelectedNode],
  ];

  const dialogShortcuts: Array<[string, string]> = [
    [SHORTCUT_KEYS.selectRow, t.shortcutSelectField],
    ["h / l / ← / →", t.shortcutChangeField],
    ["i", t.shortcutFocusField],
    [SHORTCUT_KEYS.openField, t.shortcutOpenField],
    ["H / L / t", t.shortcutNavigateDatePicker],
    [SHORTCUT_KEYS.clearDate, t.shortcutClearDate],
    [t.titleEnter, t.shortcutConfirmTitle],
    [t.memoEnter, t.shortcutConfirmMemo],
    [SHORTCUT_KEYS.close, t.shortcutCloseEditor],
  ];

  const currentPaneShortcuts =
    activePane === "projects"
      ? projectShortcuts
      : centerView === "kanban"
        ? kanbanShortcuts
      : centerView === "calendar"
        ? calendarShortcuts
        : centerView === "report"
          ? reportShortcuts
          : treeShortcuts;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/12 p-4">
      <Card className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-base">{t.shortcuts}</CardTitle>
          <Button
            aria-label={t.close}
            shortcut={`${SHORTCUT_KEYS.close} / ?`}
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 pt-0">
          <ShortcutGroup
            title={isDetailDialogOpen ? t.editDialog : t.currentPane}
            items={isDetailDialogOpen ? dialogShortcuts : currentPaneShortcuts}
          />
          <ShortcutGroup title={t.commonShortcuts} items={commonShortcuts} />
        </CardContent>
      </Card>
    </div>
  );
}

function ShortcutGroup({
  items,
  title,
}: {
  items: Array<[string, string]>;
  title: string;
}) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-1.5">
        {items.map(([key, label]) => (
          <div
            className="grid grid-cols-[120px_1fr] items-center gap-3 text-sm"
            key={key}
          >
            <kbd className="rounded border border-border bg-muted px-2 py-1 text-center text-xs font-semibold">
              {key}
            </kbd>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
