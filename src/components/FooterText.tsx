import type { ActivePane, CenterView } from "@/app/types";

export function FooterText({
  activePane,
  view,
}: {
  activePane: ActivePane;
  view: CenterView;
}) {
  if (activePane === "projects") {
    return <>Projects: j/k 選択 ・ a/o/R ルート追加 ・ f フォーカスヒント ・ l/Enter 中央へ ・ ? ヘルプ</>;
  }
  if (view === "tree") {
    return (
      <>
        Tree: Enter/i 編集 ・ a 子追加 ・ o 下追加 ・ R ルート追加 ・ Ctrl+Tab タブ切替 ・ Tab ペイン移動 ・ ? ヘルプ
      </>
    );
  }
  if (view === "calendar") {
    return <>Calendar: Ctrl+Tab タブ切替 ・ Ctrl+h/l 前月/翌月 ・ t 今月 ・ 期間バーと単日カードを月表示します。</>;
  }
  return <>Report: Ctrl+Tab タブ切替 ・ Tab ペイン移動 ・ 集計結果から選択ノードを開けます。</>;
}
