# yarukoto

[日本語版](./README.ja.md)

yarukoto is a desktop app for managing projects at the speed of thought, built with Tauri v2. Organize ideas, notes, decisions, tasks, and schedules in a tree, then use that same tree to manage your project.

## Features

- Create, edit, and delete projects and nodes. Add child nodes or siblings above or below the selection, and undo recent deletions.
- Reorder projects and nodes, indent or outdent nodes, and collapse or expand branches. The tree highlights the selected node and shows guides for the hierarchy.
- Set start and due dates. The Tree view shows a compact timeline with date ranges, descendant ranges, a today marker, and due dates. Its scale adapts to the visible date range.
- Track progress on Task nodes. The app calculates progress from the task's status or averages the progress of its direct child tasks.
- Use **Kanban** to view tasks by status and move them with the keyboard or by dragging. **Calendar** displays scheduled nodes by month, and **Report** summarizes progress, deadlines, and completed tasks.
- Export the current project to JSON and import JSON files as new projects.
- Copy a project to the clipboard for AI review and import the result as a new project.
- Use Vim-style shortcuts, toolbar buttons, and focus hints (`f`).
- Choose from the Light, Tokyo Night, and Soft Light themes.

The app stores its data in SQLite and accesses it through a repository layer. The two-pane layout shows **Projects** on the left and the **Workspace** in the center. Nodes open in an editor dialog.

## Display language

Select the globe button at the bottom of the **Projects** pane and choose **English** or **日本語**. The app starts in Japanese and remembers your selection for future launches. Project titles and notes display in the language in which they were entered.

## Tech stack

- Tauri v2
- React 19
- TypeScript
- Tailwind CSS v4 and shadcn/ui
- SQLite via `@tauri-apps/plugin-sql`

## Setup

```bash
npm install
```

Start the desktop app in development mode.

```bash
npm run tauri dev
```

To start the frontend development server on its own, run:

```bash
npm run dev
```

## Tests and builds

```bash
npm test
npm run build
```

To create a distributable Tauri bundle, run:

```bash
npm run tauri build
```

If macOS Gatekeeper blocks an unsigned build you made yourself, you can remove the quarantine attribute for local testing.

```bash
xattr -dr com.apple.quarantine "/Applications/yarukoto.app"
```

If the app is still in the build directory, use the actual path to the `.app` bundle.

```bash
xattr -dr com.apple.quarantine "src-tauri/target/release/bundle/macos/yarukoto.app"
```

For distribution, sign and notarize the app.

To check the Rust code, run:

```bash
cd src-tauri
cargo check
```

To update the app icon, edit `public/yarukoto-icon.svg`, which also serves as the browser favicon, then regenerate the bundled icons.

```bash
npm run tauri icon -- public/yarukoto-icon.svg --ios-color '#142F37' --output src-tauri/icons
```

## Keyboard shortcuts

### Global

- `Tab` / `Shift+Tab` or `Ctrl+h` / `Ctrl+l` — switch between Projects and Workspace.
- `Ctrl+Tab` / `Ctrl+Shift+Tab` — switch Workspace tabs.
- `Ctrl+t` — cycle the theme.
- `u` — undo a recent deletion.
- `f` — show focus hints for visible controls.
- `?` — toggle shortcut help.
- `Esc` — close the current overlay or clear focus.

### Projects

- `j` / `k` / `↑` / `↓` — select a project.
- `J` / `K` — move the selected project down or up.
- `o` — add a project and stay in the Projects pane.
- `l` / `Enter` / `→` — switch to the Workspace.

### Tree

- `j` / `k` / `↑` / `↓` — select a node.
- `h` / `l` / `←` / `→` — collapse or expand a branch, or move to its parent or first child.
- `za` — collapse the current tree.
- `a` — add a child node.
- `O` / `o` — add a sibling above or below the selected node.
- `R` — add a project.
- `y` / `p` — copy an AI review request or import a review result.
- `Y` / `P` — export or import a JSON file.
- `Enter` / `i` — open the editor.
- `dd` — delete the selected node and its descendants.
- `J` / `K` — move the selected node down or up.
- `>` / `<` — indent or outdent the selected node.

### Kanban

- `j` / `k` / `↑` / `↓` — select a card in the same column.
- `h` / `l` / `←` / `→` — select a card in the previous or next non-empty column.
- `H` / `L` — move the selected card to the previous or next status.
- `Enter` / `i` — open the selected task in the editor.
- Drag a card to change its status to match the destination column.
- `f` — select a card using focus hints.

### Calendar

- `H` / `L` — go to the previous or next month.
- `t` — go to the current month.
- `Enter` / `i` — open the selected node in the editor.

### Report

- `Enter` / `i` — open the selected node in the editor.

### Node editor

- `j` / `k` / `↑` / `↓` — select a field or move through options.
- `h` / `l` / `←` / `→` — change the type, status, or priority.
- `i` — focus the current field or type a date.
- `Enter` — focus the current field, open its options or calendar, or confirm an option.
- In the date picker, press `h` / `l` or `←` / `→` to move by day. Press `j` / `k` or `↓` / `↑` to move by week.
- In the date picker, press `H` / `L` to change the month or `t` to go to today.
- `x` — clear the active date field.
- `Esc` — dismiss open options or the calendar, clear focus, or close the editor.

## Data model

The SQLite `nodes` table stores `id`, `parent_id`, `title`, `type`, `status`, `priority`, `memo`, `start_date`, `due_date`, `sort_order`, `created_at`, and `updated_at`.

Node types are `Group`, `Idea`, `Note`, `Decision`, and `Task`. Statuses are `Inbox`, `Next`, `Doing`, and `Done`.

## AI review workflow

1. In Tree, choose **AI Review > Copy review request** or press `y`. The clipboard receives review instructions and the current project in `yarukoto-tree` JSON format (version 2).
2. Paste the request into an AI chat and copy the response.
3. Choose **AI Review > Import review result** or press `p`. The app accepts raw JSON or a fenced JSON code block, validates it, and creates a separate project.

yarukoto passes AI review content through the clipboard. You choose where to share it.

## Source layout

- `src/components` — UI components
- `src/hooks` — state management and keyboard shortcuts
- `src/repositories` — SQLite repository layer
- `src/domain/nodes/tree.ts` — tree structure and ordering
- `src/domain/nodes/period.ts` — timeline logic
- `src/domain/nodes/progress.ts` — task progress calculations
- `src/app` — shared app types, themes, translations, and input helpers
- `src-tauri` — Tauri and Rust code

## Development notes

- The app creates its SQLite tables on first launch and applies migrations to existing databases.
- The app seeds sample data when the database is empty.
- See the [manual test checklist](./MANUAL_TEST.md) for manual verification steps.
- GitHub Actions can build Tauri bundles for macOS and Windows.
- Use Node.js 20.19+ or 22.12+ for Vite 7.

## License

Apache License 2.0. See [LICENSE](./LICENSE).
