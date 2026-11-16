import { useLanguage } from "@/app/LanguageProvider";
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
    ["Ctrl+Tab / Ctrl+Shift+Tab", t.shortcutSwitchTabs],
    ["Ctrl+t", t.shortcutCycleTheme],
    ["u", t.shortcutUndoDelete],
    ["f", t.shortcutFocusHint],
    ["?", t.shortcutToggleHelp],
    ["Esc", t.shortcutDismiss],
  ];

  const projectShortcuts: Array<[string, string]> = [
    ["j / k / ↑ / ↓", t.shortcutSelectProject],
    ["J / K", t.shortcutReorderProjects],
    ["o", t.shortcutAddProjectInPane],
    ["l / Enter / →", t.shortcutOpenWorkspace],
  ];

  const treeShortcuts: Array<[string, string]> = [
    ["j / k / ↑ / ↓", t.shortcutSelectNode],
    ["h / l / ← / →", t.shortcutExpandNode],
    ["za", t.shortcutCollapseTree],
    ["a", t.shortcutAddChildAndEdit],
    ["O", t.shortcutAddAboveAndEdit],
    ["o", t.shortcutAddBelowAndEdit],
    ["R", t.shortcutAddRootAndEdit],
    ["y", t.shortcutCopyReview],
    ["p", t.shortcutImportReview],
    ["Y", t.shortcutExportProject],
    ["P", t.shortcutImportProject],
    ["Enter / i", t.shortcutOpenEditor],
    ["dd", t.shortcutDeleteNode],
    ["J / K", t.shortcutMoveNode],
    ["> / <", t.shortcutChangeNesting],
  ];

  const calendarShortcuts: Array<[string, string]> = [
    ["H / L", t.shortcutChangeMonth],
    ["t", t.shortcutGoToThisMonth],
    ["Enter / i", t.shortcutEditSelectedNode],
  ];

  const kanbanShortcuts: Array<[string, string]> = [
    ["j / k / ↑ / ↓", t.shortcutSelectCard],
    ["h / l / ← / →", t.shortcutSelectColumn],
    ["H / L", t.shortcutMoveCard],
    ["Enter / i", t.shortcutEditSelectedTask],
    [t.drag, t.shortcutDropCard],
    ["f", t.shortcutFocusCard],
  ];

  const reportShortcuts: Array<[string, string]> = [
    ["Enter / i", t.shortcutEditSelectedNode],
  ];

  const dialogShortcuts: Array<[string, string]> = [
    ["j / k / ↑ / ↓", t.shortcutSelectField],
    ["h / l / ← / →", t.shortcutChangeField],
    ["i", t.shortcutFocusField],
    ["Enter", t.shortcutOpenField],
    ["H / L / t", t.shortcutNavigateDatePicker],
    ["x", t.shortcutClearDate],
    [t.titleEnter, t.shortcutConfirmTitle],
    [t.memoEnter, t.shortcutConfirmMemo],
    ["Esc", t.shortcutCloseEditor],
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
          <Button aria-label={t.close} size="icon" variant="ghost" onClick={onClose}>
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
