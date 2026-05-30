import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActivePane } from "@/app/types";

const COMMON_SHORTCUTS: Array<[string, string]> = [
  ["Tab / Shift+Tab", "ペイン移動"],
  ["Ctrl+h / Ctrl+l", "左右ペイン移動"],
  ["R", "ルート追加"],
  ["f", "表示中の操作対象を選んでフォーカス"],
  ["?", "このヘルプを開く/閉じる"],
  ["Esc", "閉じる / フォーカス解除"],
];

const PANE_SHORTCUTS: Record<ActivePane, Array<[string, string]>> = {
  projects: [
    ["j / k", "プロジェクト選択"],
    ["a / o / R", "ルート追加"],
    ["l / Enter", "中央ペインへ"],
  ],
  center: [
    ["j / k", "ノード選択"],
    ["h / l", "折りたたみ / 展開"],
    ["a", "子追加してタイトル編集"],
    ["o", "下に追加してタイトル編集"],
    ["Enter / i", "編集ウィンドウを開く"],
    ["dd", "削除"],
    ["J / K", "上下移動"],
    ["> / <", "階層変更"],
  ],
};

const DIALOG_SHORTCUTS: Array<[string, string]> = [
  ["j / k", "編集項目選択 / 一覧中は候補移動 / カレンダーは週移動"],
  ["h / l", "type / status を変更 / カレンダーは日移動"],
  ["i", "通常項目にフォーカス / 日付は直接入力"],
  ["Enter", "通常項目にフォーカス / type,status は一覧 / 日付はカレンダー / 一覧中は確定"],
  ["H / L / t", "カレンダーで前月 / 翌月 / 今日"],
  ["x", "日付をクリア"],
  ["Enter (入力中)", "入力確定してフォーカス解除"],
  ["Esc", "一覧・カレンダーを閉じる / 編集ウィンドウを閉じる"],
];

export function ShortcutHelp({
  activePane,
  isDetailDialogOpen = false,
  onClose,
}: {
  activePane: ActivePane;
  isDetailDialogOpen?: boolean;
  onClose: () => void;
}) {
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
            items={isDetailDialogOpen ? DIALOG_SHORTCUTS : PANE_SHORTCUTS[activePane]}
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
