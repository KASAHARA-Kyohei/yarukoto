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
  - `today` 線と週区切り表示
- 補助ビュー
  - `Calendar`: 終了日ベースの月表示
  - `Report`: ステータスや期限の集計表示
- 操作性
  - Vim ライク操作
  - ボタン操作
  - Focus hint (`f`)
  - 削除 Undo

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

Rust 側の確認:

```bash
cd src-tauri
cargo check
```

## キーボード操作

共通:

- `Tab` / `Shift+Tab`: ペイン移動
- `Ctrl+h` / `Ctrl+l`: 左右ペイン移動
- `R`: ルート追加
- `f`: 表示中の操作対象へフォーカス
- `?`: ショートカット一覧
- `Esc`: 閉じる / フォーカス解除

Projects:

- `j` / `k`: プロジェクト選択
- `l` / `Enter`: 中央ペインへ

Tree:

- `j` / `k`: ノード選択
- `h` / `l`: 折りたたみ / 展開
- `a`: 子追加
- `o`: 同階層の下に追加
- `Enter` / `i`: 編集モーダルを開く
- `dd`: 削除
- `J` / `K`: 上下移動
- `>` / `<`: 階層変更

編集モーダル:

- `j` / `k`: 編集項目選択
- `i` / `Enter`: 項目編集
- `Esc`: モーダルを閉じる

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

## プロジェクト構成

- `src/components`: UI
- `src/hooks`: 状態管理とショートカット
- `src/repositories`: SQLite Repository 層
- `src/tree.ts`: ツリー整形
- `src/period.ts`: 期間表示ロジック
- `src-tauri`: Tauri / Rust 側

## 補足

- 初回起動時に SQLite 初期化とテーブル作成を行います
- 既存 DB には migration を適用します
- サンプルデータは空 DB のときだけ投入します
- 手動確認項目は [MANUAL_TEST.md](./MANUAL_TEST.md) を参照してください
- Node.js `22.11.0` では Vite の警告が出ます。`22.12+` への更新を推奨します

## License

Apache License 2.0. See [LICENSE](./LICENSE).
