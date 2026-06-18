import type { ActivePane, CenterView } from "@/app/types";

export function FooterText({
  activePane,
  view,
}: {
  activePane: ActivePane;
  view: CenterView;
}) {
  if (activePane === "projects") {
    return <>Projects: j/k/↑/↓ 選択 ・ l/→/Ctrl+l/Tab で中央へ ・ o ルート追加して選択 ・ Ctrl+t テーマ ・ u 削除Undo ・ f フォーカスヒント ・ ? ヘルプ</>;
  }
  if (view === "tree") {
    return (
      <>
        Tree: Enter/i 編集 ・ a 子追加 ・ o 下追加 ・ y AIレビュー依頼コピー ・ p AIレビュー結果取込 ・ Y JSON書き出し ・ P JSON取込 ・ R ルート追加 ・ ? ヘルプ
      </>
    );
  }
  if (view === "kanban") {
    return <>Kanban: j/k/↑/↓ 列内選択 ・ h/l/←/→ 列移動 ・ H/L 状態変更 ・ Enter/i 編集 ・ ドラッグで列移動 ・ f カード選択</>;
  }
  if (view === "calendar") {
    return <>Calendar: Ctrl+h/l ペイン切替 ・ H/L 前月/翌月 ・ Ctrl+Tab タブ切替 ・ t 今月 ・ 期間バーと単日カードを月表示します。</>;
  }
  return <>Report: Ctrl+h/l・Tab でペイン切替 ・ Ctrl+Tab タブ切替 ・ Ctrl+t テーマ ・ 集計結果から選択ノードを開けます。</>;
}
