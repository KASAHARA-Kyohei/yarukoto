import type { ActivePane, CenterView } from "../types";

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
        Tree: Enter/i 編集 ・ a 子追加 ・ o 下追加 ・ R ルート追加 ・ f フォーカスヒント ・ dd 削除 ・ ? ヘルプ
      </>
    );
  }
  if (view === "calendar") {
    return <>期限日があるノードを月表示します。予定をクリックすると詳細を開きます。</>;
  }
  return <>現在のプロジェクト配下を集計します。件数や期限状況からノードへ移動できます。</>;
}
