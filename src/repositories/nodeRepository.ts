import {
  type CreateNodeInput,
  type UpdateNodeInput,
  type YarukotoNode,
} from "../domain/nodes/types";
import {
  flattenLlmTreeDocument,
  type LlmTreeDocument,
} from "../domain/nodes/llmTree";
import { getDescendantIds, sortNodes } from "../domain/nodes/tree";
import { getNodeDb, migrateNodeSchema, withWriteQueue } from "./nodeDb";
import { type DbNode, nodeInsertParams, toNode } from "./nodeMapper";
import { seedNodesIfEmpty } from "./nodeSeed";

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

export class NodeRepository {
  private initPromise: Promise<void> | null = null;

  async init() {
    this.initPromise ??= (async () => {
      await migrateNodeSchema();
      await seedNodesIfEmpty(await getNodeDb(), createId);
    })();
    return this.initPromise;
  }

  async listNodes() {
    const db = await getNodeDb();
    const rows = await db.select<DbNode[]>(
      "SELECT * FROM nodes ORDER BY parent_id IS NOT NULL, parent_id, sort_order, created_at",
    );
    return rows.map(toNode);
  }

  async createNode(input: CreateNodeInput) {
    const db = await getNodeDb();
    const createdAt = nowIso();
    const node: YarukotoNode = {
      id: createId(),
      parentId: input.parentId,
      title: input.title ?? "新しいノード",
      type: input.type ?? "Task",
      status: input.status ?? "Inbox",
      memo: input.memo ?? "",
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
      sortOrder:
        input.sortOrder ?? (await this.getSiblingCount(input.parentId)),
      createdAt,
      updatedAt: createdAt,
    };

    await withWriteQueue(async () => {
      await this.shiftSiblings(node.parentId, node.sortOrder, 1);
      await db.execute(
        `INSERT INTO nodes (
          id, parent_id, title, type, status, memo, start_date, due_date, sort_order, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          ...nodeInsertParams(node),
        ],
      );
      await this.normalizeSortOrder(node.parentId);
    });
    return node;
  }

  async importTree(document: LlmTreeDocument) {
    const nodes = flattenLlmTreeDocument(document);
    const db = await getNodeDb();
    const valuesPerNode = 11;
    const placeholders = nodes
      .map((_, nodeIndex) => {
        const offset = nodeIndex * valuesPerNode;
        return `(${Array.from(
          { length: valuesPerNode },
          (__, valueIndex) => `$${offset + valueIndex + 1}`,
        ).join(", ")})`;
      })
      .join(", ");

    await withWriteQueue(async () => {
      await db.execute(
        `INSERT INTO nodes (
          id, parent_id, title, type, status, memo, start_date, due_date, sort_order, created_at, updated_at
        ) VALUES ${placeholders}`,
        nodes.flatMap(nodeInsertParams),
      );
    });
    return nodes[0];
  }

  async updateNode(id: string, input: UpdateNodeInput) {
    const current = (await this.listNodes()).find((node) => node.id === id);
    if (!current) {
      return;
    }

    const next = { ...current, ...input, updatedAt: nowIso() };
    await withWriteQueue(async () => {
      const db = await getNodeDb();
      await db.execute(
        `UPDATE nodes
         SET title = $1, type = $2, status = $3, memo = $4, start_date = $5, due_date = $6, updated_at = $7
         WHERE id = $8`,
        [
          next.title,
          next.type,
          next.status,
          next.memo,
          next.startDate,
          next.dueDate,
          next.updatedAt,
          id,
        ],
      );
    });
  }

  async deleteNodeCascade(id: string) {
    const nodes = await this.listNodes();
    const target = nodes.find((node) => node.id === id);
    if (!target) {
      return null;
    }

    const ids = [id, ...getDescendantIds(nodes, id)];
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(", ");
    const db = await getNodeDb();
    await withWriteQueue(async () => {
      await db.execute(`DELETE FROM nodes WHERE id IN (${placeholders})`, ids);
      await this.normalizeSortOrder(target.parentId);
    });
    return target.parentId;
  }

  async restoreNodes(nodes: YarukotoNode[]) {
    if (nodes.length === 0) {
      return;
    }
    const restoreIds = new Set(nodes.map((node) => node.id));
    const externalParentGroups = new Map<string, YarukotoNode[]>();

    for (const node of nodes) {
      if (node.parentId && restoreIds.has(node.parentId)) {
        continue;
      }
      const key = node.parentId ?? "__root__";
      const group = externalParentGroups.get(key) ?? [];
      group.push(node);
      externalParentGroups.set(key, group);
    }

    const db = await getNodeDb();
    await withWriteQueue(async () => {
      for (const group of externalParentGroups.values()) {
        const parentId = group[0]?.parentId ?? null;
        const minSortOrder = Math.min(...group.map((node) => node.sortOrder));
        await this.shiftSiblings(parentId, minSortOrder, group.length);
      }

      for (const node of sortNodes(nodes)) {
        await db.execute(
          `INSERT OR REPLACE INTO nodes (
            id, parent_id, title, type, status, memo, start_date, due_date, sort_order, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [...nodeInsertParams(node)],
        );
      }

      for (const group of externalParentGroups.values()) {
        await this.normalizeSortOrder(group[0]?.parentId ?? null);
      }
    });
  }

  async moveUp(id: string) {
    const nodes = await this.listNodes();
    const node = nodes.find((item) => item.id === id);
    if (!node) {
      return;
    }
    const siblings = this.getSiblings(nodes, node.parentId);
    const index = siblings.findIndex((item) => item.id === id);
    if (index <= 0) {
      return;
    }
    await withWriteQueue(async () => {
      await this.swapSortOrder(node, siblings[index - 1]);
    });
  }

  async moveDown(id: string) {
    const nodes = await this.listNodes();
    const node = nodes.find((item) => item.id === id);
    if (!node) {
      return;
    }
    const siblings = this.getSiblings(nodes, node.parentId);
    const index = siblings.findIndex((item) => item.id === id);
    if (index < 0 || index >= siblings.length - 1) {
      return;
    }
    await withWriteQueue(async () => {
      await this.swapSortOrder(node, siblings[index + 1]);
    });
  }

  async indent(id: string) {
    const nodes = await this.listNodes();
    const node = nodes.find((item) => item.id === id);
    if (!node) {
      return;
    }
    const siblings = this.getSiblings(nodes, node.parentId);
    const index = siblings.findIndex((item) => item.id === id);
    if (index <= 0) {
      return;
    }

    const oldParentId = node.parentId;
    const newParent = siblings[index - 1];
    const newSortOrder = this.getSiblings(nodes, newParent.id).length;
    await withWriteQueue(async () => {
      await this.setParentAndOrder(node.id, newParent.id, newSortOrder);
      await this.normalizeSortOrder(oldParentId);
      await this.normalizeSortOrder(newParent.id);
    });
  }

  async outdent(id: string) {
    const nodes = await this.listNodes();
    const node = nodes.find((item) => item.id === id);
    if (!node?.parentId) {
      return;
    }
    const parent = nodes.find((item) => item.id === node.parentId);
    if (!parent) {
      return;
    }

    const oldParentId = node.parentId;
    const newParentId = parent.parentId;
    const newSortOrder = parent.sortOrder + 1;
    await withWriteQueue(async () => {
      await this.shiftSiblings(newParentId, newSortOrder, 1);
      await this.setParentAndOrder(node.id, newParentId, newSortOrder);
      await this.normalizeSortOrder(oldParentId);
      await this.normalizeSortOrder(newParentId);
    });
  }

  async normalizeSortOrder(parentId: string | null) {
    const nodes = await this.listNodes();
    const siblings = this.getSiblings(nodes, parentId);
    const db = await getNodeDb();
    for (let index = 0; index < siblings.length; index += 1) {
      if (siblings[index].sortOrder !== index) {
        await db.execute("UPDATE nodes SET sort_order = $1 WHERE id = $2", [
          index,
          siblings[index].id,
        ]);
      }
    }
  }

  private getSiblings(nodes: YarukotoNode[], parentId: string | null) {
    return sortNodes(nodes.filter((node) => node.parentId === parentId));
  }

  private async getSiblingCount(parentId: string | null) {
    const nodes = await this.listNodes();
    return this.getSiblings(nodes, parentId).length;
  }

  private async shiftSiblings(
    parentId: string | null,
    fromSortOrder: number,
    amount: number,
  ) {
    const db = await getNodeDb();
    if (parentId === null) {
      await db.execute(
        `UPDATE nodes
         SET sort_order = sort_order + $1
         WHERE parent_id IS NULL AND sort_order >= $2`,
        [amount, fromSortOrder],
      );
      return;
    }

    await db.execute(
      `UPDATE nodes
       SET sort_order = sort_order + $1
       WHERE parent_id = $2 AND sort_order >= $3`,
      [amount, parentId, fromSortOrder],
    );
  }

  private async setParentAndOrder(
    id: string,
    parentId: string | null,
    sortOrder: number,
  ) {
    const db = await getNodeDb();
    await db.execute(
      "UPDATE nodes SET parent_id = $1, sort_order = $2, updated_at = $3 WHERE id = $4",
      [parentId, sortOrder, nowIso(), id],
    );
  }

  private async swapSortOrder(first: YarukotoNode, second: YarukotoNode) {
    const db = await getNodeDb();
    const updatedAt = nowIso();
    await db.execute(
      "UPDATE nodes SET sort_order = $1, updated_at = $2 WHERE id = $3",
      [second.sortOrder, updatedAt, first.id],
    );
    await db.execute(
      "UPDATE nodes SET sort_order = $1, updated_at = $2 WHERE id = $3",
      [first.sortOrder, updatedAt, second.id],
    );
  }
}

export const nodeRepository = new NodeRepository();
