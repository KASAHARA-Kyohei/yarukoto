# yarukoto

思考の速度でプロジェクト管理するための、Tauri v2 製デスクトップアプリです。  
アイデア、メモ、決定事項、タスク、予定をツリーで整理し、そのままプロジェクト管理につなげます。

## 現在の実装状態

- 保存先は `SQLite` のみ
- UI から直接 SQL は呼ばず、`Repository` 層を経由
- 左 `Projects` / 中央 `Workspace` の 2 ペイン構成
- ノード編集は常時サイドバーではなくモーダルで実施
- 中央ビューは `Tree / Calendar / Report`
- Tree の右端 `period` 列は、軽量ミニガント表示
- テーマは `Light / Tokyo Night / Soft Light` を切り替え可能

## 主な機能

- ノード CRUD
  - ルート追加
  - 子ノード追加
  - 同階層の下追加
  - 編集
  - 子孫込み削除
- ツリー操作
  - 折りたたみ / 展開
  - 上下移動
  - インデント / アウトデント
  - 選択中ノードのハイライト
  - 親子の階層ガイド線
- 日付管理
  - `startDate` / `dueDate` を設定可能
  - Tree 上で期間バー表示
  - 親ノードでは子孫期間の集約バー表示
  - 表示期間に応じて日 / 月 / 四半期の目盛りを切り替え
  - `today` 線と期限マーカー表示
- タスク進捗
  - `Task` ノードのみ進捗率を表示
  - 葉 `Task` は `status` から自動計算
  - 子 `Task` を持つ `Task` は直下の子 `Task` から自動集計
- 補助ビュー
  - `Calendar`: 開始日 / 終了日を月表示
  - `Report`: ステータス、期限、完了状況の集計表示
- LLM レビュー連携
  - 現在のプロジェクトを指示文付きJSONとしてクリップボードへコピー
  - LLMが返した `yarukoto-tree` JSONを検証
  - 元のプロジェクトを保持したまま、新規プロジェクトとして取り込み
- 操作性
  - Vim ライク操作
  - ボタン操作
  - Focus hint (`f`)
  - 削除 Undo
  - テーマ切替

## 技術スタック

- Tauri v2
- React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- SQLite
- `@tauri-apps/plugin-sql`

## セットアップ

```bash
npm install
```

## 起動

```bash
npm run tauri dev
```

Web 側だけ確認する場合:

```bash
npm run dev
```

## テスト / ビルド

```bash
npm test
npm run build
```

Tauri アプリを配布用にビルドする場合:

```bash
npm run tauri build
```

macOS で自分でビルドした未署名アプリが Gatekeeper に止められる場合は、手元確認用に quarantine 属性を外すと開けることがあります。

```bash
xattr -dr com.apple.quarantine "/Applications/yarukoto.app"
```

`Applications` に移していない場合は、実際の `.app` のパスを指定します。

```bash
xattr -dr com.apple.quarantine "src-tauri/target/release/bundle/macos/yarukoto.app"
```

これは自分でビルドしたアプリをローカルで確認するための回避策です。配布する場合は、本来は署名と notarization を整える必要があります。

Rust 側の確認:

```bash
cd src-tauri
cargo check
```

## キーボード操作

共通:

- `Tab` / `Shift+Tab`: ペイン移動
- `Ctrl+Tab` / `Ctrl+Shift+Tab`: 中央タブ切替
- `Ctrl+t`: テーマ切替
- `u`: 削除直後なら元に戻す
- `f`: 表示中の操作対象へフォーカス
- `?`: ショートカット一覧
- `Esc`: 閉じる / フォーカス解除

Projects:

- `j` / `k`: プロジェクト選択
- `o`: ルート追加して Projects に留まる
- `l` / `Enter`: 中央ペインへ

Tree:

- `j` / `k`: ノード選択
- `h` / `l`: 折りたたみ / 展開
- `a`: 子追加
- `o`: 同階層の下に追加
- `R`: ルート追加
- `y`: 現在のプロジェクトをLLMレビュー用にコピー
- `p`: LLMレビュー結果を新規プロジェクトとして取り込む
- `Enter` / `i`: 編集モーダルを開く
- `dd`: 削除
- `J` / `K`: 上下移動
- `>` / `<`: 階層変更

Calendar:

- `Ctrl+h` / `Ctrl+l`: 前月 / 翌月
- `t`: 今月へ戻る
- `Enter` / `i`: 選択中ノードの編集モーダルを開く

Report:

- `Enter` / `i`: 選択中ノードの編集モーダルを開く

編集モーダル:

- `j` / `k`: 編集項目選択
- `h` / `l`: `type` / `status` を変更
- `i`: 通常項目にフォーカス、日付は直接入力
- `Enter`: 通常項目にフォーカス、`type` / `status` は一覧、日付はカレンダー
- 日付カレンダー中の `h` / `l`: 前日 / 翌日
- 日付カレンダー中の `j` / `k`: 翌週 / 前週
- 日付カレンダー中の `H` / `L` / `t`: 前月 / 翌月 / 今日
- 日付項目の `x`: 日付クリア
- `Esc`: 一覧・カレンダーを閉じる / モーダルを閉じる

## データ設計

`nodes` テーブルを使用します。

主要カラム:

- `id`
- `parent_id`
- `title`
- `type`
- `status`
- `memo`
- `start_date`
- `due_date`
- `sort_order`
- `created_at`
- `updated_at`

ノード種別:

- `Group`
- `Idea`
- `Note`
- `Decision`
- `Task`

ステータス:

- `Inbox`
- `Next`
- `Doing`
- `Done`

## LLMレビュー連携

Treeビューの `LLM用コピー` または `y` で、現在開いているプロジェクト全体をクリップボードへコピーします。コピー内容にはレビュー指示と `yarukoto-tree` バージョン1形式のJSONが含まれます。

LLMの返答をクリップボードへコピーした後、`LLM結果取込` または `p` を実行してください。生JSONとJSONコードブロックのどちらも読み込めます。内容を検証してから、元データとは別の新規プロジェクトとして作成します。

外部APIへの送信は行わず、クリップボード経由でのみ受け渡します。

## プロジェクト構成

- `src/components`: UI
- `src/hooks`: 状態管理とショートカット
- `src/repositories`: SQLite Repository 層
- `src/domain/nodes/tree.ts`: ツリー整形
- `src/domain/nodes/period.ts`: 期間表示ロジック
- `src/domain/nodes/progress.ts`: タスク進捗の派生計算
- `src/app`: アプリ共通の型、テーマ、入力補助ロジック
- `src-tauri`: Tauri / Rust 側

## 補足

- 初回起動時に SQLite 初期化とテーブル作成を行います
- 既存 DB には migration を適用します
- サンプルデータは空 DB のときだけ投入します
- 手動確認項目は [MANUAL_TEST.md](./MANUAL_TEST.md) を参照してください
- GitHub Actions で macOS / Windows の Tauri bundle を作成できます
- Node.js `22.11.0` では Vite の警告が出ます。`22.12+` への更新を推奨します

## License

Apache License 2.0. See [LICENSE](./LICENSE).
