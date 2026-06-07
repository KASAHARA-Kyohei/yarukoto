import type { ActivePane, CenterView } from "@/app/types";

export function FooterText({
  activePane,
  view,
}: {
  activePane: ActivePane;
  view: CenterView;
}) {
  if (activePane === "projects") {
    return <>Projects: j/k 選択 ・ o ルート追加して選択 ・ Ctrl+t テーマ ・ u 削除Undo ・ f フォーカスヒント ・ l/Enter 中央へ ・ ? ヘルプ</>;
  }
  if (view === "tree") {
    return (
      <>
        Tree: Enter/i 編集 ・ a 子追加 ・ o 下追加 ・ y AIレビュー依頼をコピー ・ p レビュー結果取込 ・ R ルート追加 ・ ? ヘルプ
      </>
    );
  }
  if (view === "calendar") {
    return <>Calendar: Ctrl+Tab タブ切替 ・ Ctrl+t テーマ ・ Ctrl+h/l 前月/翌月 ・ t 今月 ・ 期間バーと単日カードを月表示します。</>;
  }
  return <>Report: Ctrl+Tab タブ切替 ・ Ctrl+t テーマ ・ Tab ペイン移動 ・ 集計結果から選択ノードを開けます。</>;
}
