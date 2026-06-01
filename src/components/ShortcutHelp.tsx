import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivePane, CenterView } from "@/app/types";

const COMMON_SHORTCUTS: Array<[string, string]> = [
  ["Tab / Shift+Tab", "ペイン移動"],
  ["Ctrl+Tab / Ctrl+Shift+Tab", "中央タブ切替"],
  ["Ctrl+t", "テーマ切替"],
  ["u", "削除直後なら元に戻す"],
  ["f", "表示中の操作対象を選んでフォーカス"],
  ["?", "このヘルプを開く/閉じる"],
  ["Esc", "閉じる / フォーカス解除"],
];

const PROJECT_SHORTCUTS: Array<[string, string]> = [
  ["j / k", "プロジェクト選択"],
  ["o", "ルート追加してProjectsに留まる"],
  ["l / Enter", "中央ペインへ"],
];

const TREE_SHORTCUTS: Array<[string, string]> = [
  ["j / k", "ノード選択"],
  ["h / l", "折りたたみ / 展開"],
  ["a", "子追加して編集ウィンドウを開く"],
  ["o", "下に追加して編集ウィンドウを開く"],
  ["R", "ルート追加して編集ウィンドウを開く"],
  ["Enter / i", "編集ウィンドウを開く"],
  ["dd", "削除"],
  ["J / K", "上下移動"],
  ["> / <", "階層変更"],
];

const CALENDAR_SHORTCUTS: Array<[string, string]> = [
  ["Ctrl+h / Ctrl+l", "前月 / 翌月"],
  ["t", "今月へ戻る"],
  ["Enter / i", "選択中ノードの編集を開く"],
];

const REPORT_SHORTCUTS: Array<[string, string]> = [
  ["Enter / i", "選択中ノードの編集を開く"],
];

const DIALOG_SHORTCUTS: Array<[string, string]> = [
  ["j / k", "編集項目選択 / 一覧中は候補移動 / カレンダーは週移動"],
  ["h / l", "type / status を変更 / カレンダーは日移動"],
  ["i", "通常項目にフォーカス / 日付は直接入力"],
  ["Enter", "通常項目にフォーカス / type,status は一覧 / 日付はカレンダー / 一覧中は確定"],
  ["H / L / t", "カレンダーで前月 / 翌月 / 今日"],
  ["x", "日付をクリア"],
  ["Enter (title入力中)", "1回目はそのまま / 2回目でフォーカス解除"],
  ["Enter (memo入力中)", "入力確定してフォーカス解除"],
  ["Esc", "一覧・カレンダーを閉じる / 編集ウィンドウを閉じる"],
];

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
  const currentPaneShortcuts =
    activePane === "projects"
      ? PROJECT_SHORTCUTS
      : centerView === "calendar"
        ? CALENDAR_SHORTCUTS
        : centerView === "report"
          ? REPORT_SHORTCUTS
          : TREE_SHORTCUTS;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/12 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
          <CardTitle className="text-base">ショートカット</CardTitle>
          <Button aria-label="閉じる" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 pt-0">
          <ShortcutGroup
            title={isDetailDialogOpen ? "編集ウィンドウ" : "現在のペイン"}
            items={isDetailDialogOpen ? DIALOG_SHORTCUTS : currentPaneShortcuts}
          />
          <ShortcutGroup title="共通" items={COMMON_SHORTCUTS} />
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
