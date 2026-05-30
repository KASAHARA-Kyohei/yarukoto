import type Database from "@tauri-apps/plugin-sql";
import type { YarukotoNode } from "../domain/nodes/types";
import { nodeInsertParams } from "./nodeMapper";

function createSeedNode(params: Omit<YarukotoNode, "createdAt" | "updatedAt">, now: string) {
  return {
    ...params,
    createdAt: now,
    updatedAt: now,
  };
}

export async function seedNodesIfEmpty(db: Database, createId: () => string) {
  const rows = await db.select<Array<{ count: number }>>(
    "SELECT COUNT(*) as count FROM nodes",
  );
  if ((rows[0]?.count ?? 0) > 0) {
    return;
  }

  const createdAt = new Date().toISOString();
  const rootId = createId();
  const ideaId = createId();
  const decisionId = createId();
  const taskId = createId();
  const rowsToInsert: YarukotoNode[] = [
    createSeedNode(
      {
        id: rootId,
        parentId: null,
        title: "yarukotoを作る",
        type: "Group",
        status: "Doing",
        memo: "思考整理ツリーを中心にした軽量プロジェクト管理アプリ。",
        startDate: null,
        dueDate: null,
        sortOrder: 0,
      },
      createdAt,
    ),
    createSeedNode(
      {
        id: ideaId,
        parentId: rootId,
        title: "思いつきをすぐツリーに入れる",
        type: "Idea",
        status: "Inbox",
        memo: "Jiraクローンではなく、アウトライナーとして使いやすくする。",
        startDate: null,
        dueDate: null,
        sortOrder: 0,
      },
      createdAt,
    ),
    createSeedNode(
      {
        id: decisionId,
        parentId: rootId,
        title: "保存は最初からSQLiteにする",
        type: "Decision",
        status: "Done",
        memo: "UIはRepository層だけを呼ぶ。",
        startDate: null,
        dueDate: null,
        sortOrder: 1,
      },
      createdAt,
    ),
    createSeedNode(
      {
        id: taskId,
        parentId: rootId,
        title: "Vimライク操作を確認する",
        type: "Task",
        status: "Next",
        memo: "j/k, a, o, dd, J/K, >, < を試す。",
        startDate: null,
        dueDate: null,
        sortOrder: 2,
      },
      createdAt,
    ),
  ];

  for (const node of rowsToInsert) {
    await db.execute(
      `INSERT INTO nodes (
        id, parent_id, title, type, status, memo, start_date, due_date, sort_order, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      nodeInsertParams(node),
    );
  }
}
