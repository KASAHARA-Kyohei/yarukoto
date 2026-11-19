import { daysBetween, parseDateKey } from "@/utils/date";
import type { PeriodBounds } from "./period";
import type { TaskProgressInfo } from "./progress";
import type { YarukotoNode } from "./types";

export type ProgressLinePoint = {
  nodeId: string;
  position: number;
  progress: number;
  rowIndex: number;
};

export function buildProgressLineVertices(
  points: ProgressLinePoint[],
  rowCount: number,
  todayPosition: number,
  rowPitch: number,
  barCenter: number,
): string {
  const vertices = [`${todayPosition},0`];
  let nextRow = 0;

  for (const { position, rowIndex } of points) {
    if (rowIndex > nextRow) {
      // Return to today before the gap and stay there through untracked rows.
      if (nextRow > 0) vertices.push(`${todayPosition},${nextRow * rowPitch}`);
      vertices.push(`${todayPosition},${rowIndex * rowPitch}`);
    }
    vertices.push(`${position},${rowIndex * rowPitch + barCenter}`);
    nextRow = rowIndex + 1;
  }

  if (nextRow > 0 && nextRow < rowCount) {
    vertices.push(`${todayPosition},${nextRow * rowPitch}`);
  }
  vertices.push(`${todayPosition},${rowCount * rowPitch}`);
  return vertices.join(" ");
}

export function hasProgressLinePeriod(node: YarukotoNode, progress?: TaskProgressInfo) {
  return node.type === "Task" && node.status !== "Done" &&
    progress !== undefined && progress.value < 100 &&
    node.startDate !== null && node.dueDate !== null &&
    node.startDate <= node.dueDate;
}

export function buildProgressLinePoints(
  rows: { node: YarukotoNode }[],
  progressById: Map<string, TaskProgressInfo>,
  bounds: PeriodBounds | null,
  todayKey: string,
): ProgressLinePoint[] {
  if (!bounds) return [];

  const start = parseDateKey(bounds.start);
  const totalDays = Math.max(1, daysBetween(start, parseDateKey(bounds.end)));
  const todayOffset = daysBetween(start, parseDateKey(todayKey));

  return rows.flatMap(({ node }, rowIndex) => {
    const progress = progressById.get(node.id);
    if (!hasProgressLinePeriod(node, progress) || !progress ||
      !node.startDate || !node.dueDate) return [];

    const startOffset = daysBetween(start, parseDateKey(node.startDate));
    const duration = daysBetween(parseDateKey(node.startDate), parseDateKey(node.dueDate));
    const progressOffset = progress.value <= 0 && todayKey < node.startDate
      ? todayOffset
      : startOffset + duration * Math.max(0, progress.value) / 100;

    return [{
      nodeId: node.id,
      position: Math.max(0, Math.min(100, progressOffset / totalDays * 100)),
      progress: progress.value,
      rowIndex,
    }];
  });
}
