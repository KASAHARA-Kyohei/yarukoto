import Database from "@tauri-apps/plugin-sql";

const DB_PATH = "sqlite:yarukoto.db";

let dbPromise: Promise<Database> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

export function getNodeDb() {
  dbPromise ??= Database.load(DB_PATH);
  return dbPromise;
}

const NODE_SCHEMA_VERSION = 3;

async function getUserVersion(db: Database) {
  const rows = await db.select<Array<{ user_version: number }>>(
    "PRAGMA user_version",
  );
  return rows[0]?.user_version ?? 0;
}

async function hasColumn(db: Database, tableName: string, columnName: string) {
  const rows = await db.select<Array<{ name: string }>>(
    `PRAGMA table_info(${tableName})`,
  );
  return rows.some((row) => row.name === columnName);
}

export async function migrateNodeSchema() {
  const db = await getNodeDb();
  const version = await getUserVersion(db);
  if (version < 1) {
    await withWriteQueue(async () => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS nodes (
          id TEXT PRIMARY KEY,
          parent_id TEXT NULL,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          status TEXT NOT NULL,
          priority TEXT NOT NULL DEFAULT 'none',
          memo TEXT NOT NULL DEFAULT '',
          due_date TEXT NULL,
          sort_order INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);
    });
  }
  if (version < 2) {
    await withWriteQueue(async () => {
      if (!(await hasColumn(db, "nodes", "start_date"))) {
        await db.execute("ALTER TABLE nodes ADD COLUMN start_date TEXT NULL");
      }
    });
  }
  if (version < 3) {
    await withWriteQueue(async () => {
      if (!(await hasColumn(db, "nodes", "priority"))) {
        await db.execute(
          "ALTER TABLE nodes ADD COLUMN priority TEXT NOT NULL DEFAULT 'none'",
        );
      }
    });
  }
  if (version < NODE_SCHEMA_VERSION) {
    await withWriteQueue(async () => {
      await db.execute(`PRAGMA user_version = ${NODE_SCHEMA_VERSION}`);
    });
  }
}

export async function withWriteQueue(action: () => Promise<void>) {
  const result = writeQueue.then(action, action);
  writeQueue = result.catch(() => undefined);
  return result;
}
