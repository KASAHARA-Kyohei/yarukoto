import { useLanguage } from "@/app/LanguageProvider";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { getSelectionScrollTop } from "@/app/selectionScroll";
import { SHORTCUT_KEYS } from "@/app/shortcutKeys";
import { TreePeriodCell, TreePeriodHeader } from "./TreePeriod";
import { TreeProgressLine } from "./TreeProgressLine";
import { TaskProgressInline } from "./TaskProgress";
import { NodeEditButton } from "./NodeEditButton";
import {
  getNodeDisplayTitle,
  nodeTitleClass,
  priorityBadgeClass,
  priorityLabel,
  statusBadgeClass,
  typeBadgeClass,
} from "@/domain/nodes/nodeAppearance";
import type { TaskProgressInfo } from "@/domain/nodes/progress";
import { buildProgressLinePoints, hasProgressLinePeriod } from "@/domain/nodes/progressLine";
import { toDateKey } from "@/utils/date";
import {
  getTimelineMarkers,
  getNodePeriodDates,
  getTimelineBoundsFromRanges,
  getTimelineModeFromRanges,
  getTimelinePeriodColumnMinWidth,
  getTodayLineStyle,
  isInvalidDateRange,
} from "@/domain/nodes/period";
import type { FlatTreeNode } from "@/domain/nodes/types";
import { Badge } from "@/components/ui/badge";
import { ShortcutTooltip } from "@/components/ui/shortcut-tooltip";
import { cn } from "@/lib/utils";

const INDENT_STEP = 22;
const TOGGLE_CENTER = 22; // 8px title padding + half of the 28px toggle.
const TREE_ROW_GAP = 6; // 4px between rows plus the two 1px borders.
const GUIDE_COLOR = "bg-muted-foreground/45";

function getTreeColumns(periodColumnMinWidth: number) {
  return `minmax(320px, 520px) 68px 74px 82px 92px minmax(${periodColumnMinWidth}px, 1fr)`;
}

function IndentGuides({
  depth,
  guideColumns,
  hasExpandedChildren,
  isLastSibling,
}: {
  depth: number;
  guideColumns: boolean[];
  hasExpandedChildren: boolean;
  isLastSibling: boolean;
}) {
  const nodeLeft = TOGGLE_CENTER + depth * INDENT_STEP;
  const branchLeft = nodeLeft - INDENT_STEP;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0" data-tree-guides>
      {guideColumns.slice(0, -1).map((shouldContinue, index) =>
        shouldContinue ? (
          <span
            className={cn("absolute bottom-0 w-px", GUIDE_COLOR)}
            key={index}
            style={{
              left: TOGGLE_CENTER + index * INDENT_STEP,
              top: -TREE_ROW_GAP,
            }}
          />
        ) : null,
      )}
      {depth > 0 ? (
        <>
          <span
            className={cn("absolute w-px", GUIDE_COLOR, isLastSibling ? "bottom-1/2" : "bottom-0")}
            style={{ left: branchLeft, top: -TREE_ROW_GAP }}
          />
          <span
            className={cn("absolute top-1/2 h-px -translate-y-1/2", GUIDE_COLOR)}
            style={{ left: branchLeft, width: INDENT_STEP }}
          />
        </>
      ) : null}
      {hasExpandedChildren ? (
        <span
          className={cn("absolute bottom-0 w-px", GUIDE_COLOR)}
          style={{ left: nodeLeft, top: "calc(50% + 14px)" }}
        />
      ) : null}
    </div>
  );
}

export function TreeView({
  editDisabled,
  expandedIds,
  onEditNode,
  onSelectNode,
  onToggleExpanded,
  selectedId,
  taskProgressById,
  visibleNodes,
}: {
  editDisabled: boolean;
  expandedIds: Set<string>;
  onEditNode: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onToggleExpanded: (nodeId: string) => void;
  selectedId: string | null;
  taskProgressById: Map<string, TaskProgressInfo>;
  visibleNodes: FlatTreeNode[];
}) {
  const { language, t } = useLanguage();
  const todayKey = toDateKey(new Date());
  const periodRanges = useMemo(
    () => [
      ...visibleNodes.map(({ node }) => getNodePeriodDates(node)),
      ...visibleNodes.map(({ descendantPeriod }) => descendantPeriod),
      ...(visibleNodes.some(({ node }) => hasProgressLinePeriod(node, taskProgressById.get(node.id)))
        ? [{ start: todayKey, end: todayKey }]
        : []),
    ],
    [taskProgressById, todayKey, visibleNodes],
  );
  const timelineMode = useMemo(
    () => getTimelineModeFromRanges(periodRanges),
    [periodRanges],
  );
  const timelineBounds = useMemo(
    () => getTimelineBoundsFromRanges(periodRanges, todayKey),
    [periodRanges, todayKey],
  );
  const markers = useMemo(
    () => getTimelineMarkers(timelineBounds, timelineMode, language),
    [language, timelineBounds, timelineMode],
  );
  const todayLineStyle = useMemo(
    () => getTodayLineStyle(timelineBounds, todayKey),
    [timelineBounds, todayKey],
  );
  const progressLinePoints = useMemo(
    () => buildProgressLinePoints(visibleNodes, taskProgressById, timelineBounds, todayKey),
    [taskProgressById, timelineBounds, todayKey, visibleNodes],
  );
  const periodColumnMinWidth = useMemo(
    () => getTimelinePeriodColumnMinWidth(timelineMode),
    [timelineMode],
  );
  const treeColumns = useMemo(
    () => getTreeColumns(periodColumnMinWidth),
    [periodColumnMinWidth],
  );
  const treeMinWidth = useMemo(
    () => 320 + 68 + 74 + 82 + 92 + periodColumnMinWidth + 40,
    [periodColumnMinWidth],
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const rowElementsRef = useRef(new Map<string, HTMLDivElement>());

  const registerRowElement = useCallback(
    (nodeId: string, element: HTMLDivElement | null) => {
      if (element) {
        rowElementsRef.current.set(nodeId, element);
      } else {
        rowElementsRef.current.delete(nodeId);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const container = scrollContainerRef.current;
    const selectedRow = rowElementsRef.current.get(selectedId);
    if (!container || !selectedRow) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const rowRect = selectedRow.getBoundingClientRect();
    const nextScrollTop = getSelectionScrollTop({
      containerHeight: container.clientHeight,
      containerTop: containerRect.top,
      itemBottom: rowRect.bottom,
      itemHeight: rowRect.height,
      itemTop: rowRect.top,
      scrollTop: container.scrollTop,
    });

    if (nextScrollTop !== null) {
      container.scrollTo({ top: nextScrollTop, behavior: "auto" });
    }
  }, [selectedId, visibleNodes]);

  return (
    <div className="flex-1 overflow-auto px-2 py-3" ref={scrollContainerRef}>
      {visibleNodes.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          {t.treeEmpty}
        </div>
      ) : (
        <div style={{ minWidth: `${treeMinWidth}px` }}>
          <div
            className="mb-2 grid items-end gap-y-1 text-[11px] font-medium uppercase text-muted-foreground/90"
            style={{ gridTemplateColumns: treeColumns }}
          >
            <div className="pl-4">Title</div>
            <div>Type</div>
            <div>Status</div>
            <div>Priority</div>
            <div>Progress</div>
            <TreePeriodHeader
              markers={markers}
              timelineBounds={timelineBounds}
              timelineMode={timelineMode}
              todayLineStyle={todayLineStyle}
            />
          </div>
          <div className="relative flow-root">
            {visibleNodes.map(
              ({
                childCount,
                descendantPeriod,
                guideColumns,
                isLastSibling,
                node,
                depth,
                hasChildren,
              }) => {
                const isSelected = node.id === selectedId;
                const isExpanded = expandedIds.has(node.id);
                const isInvalidRange = isInvalidDateRange(node);
                const taskProgress = taskProgressById.get(node.id) ?? null;
                return (
                  <div
                    className={cn(
                      "group mb-1 grid h-11 items-center rounded-md border text-sm transition-colors",
                      isInvalidRange && "border-amber-300/70",
                      isSelected
                        ? "border-primary/70 bg-background"
                        : "border-transparent hover:bg-muted",
                    )}
                    key={node.id}
                    onClick={() => onSelectNode(node.id)}
                    ref={(element) => registerRowElement(node.id, element)}
                    style={{ gridTemplateColumns: treeColumns }}
                  >
                    <div className="relative flex min-w-0 items-center gap-1 self-stretch pr-1 pl-2">
                      <IndentGuides
                        depth={depth}
                        guideColumns={guideColumns}
                        hasExpandedChildren={hasChildren && isExpanded}
                        isLastSibling={isLastSibling}
                      />
                      <div
                        className="relative flex min-w-0 flex-1 items-center"
                        style={{ marginLeft: depth * INDENT_STEP }}
                      >
                        <div className="mr-2 flex size-7 shrink-0 items-center justify-center">
                          {hasChildren ? (
                            <ShortcutTooltip
                              keys={isExpanded ? SHORTCUT_KEYS.collapseNode : SHORTCUT_KEYS.expandNode}
                              label={isExpanded ? t.collapse : t.expand}
                            >
                              <button
                                aria-label={isExpanded ? t.collapse : t.expand}
                                className="grid h-7 w-7 place-items-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onToggleExpanded(node.id);
                                }}
                                type="button"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </ShortcutTooltip>
                          ) : depth > 0 ? (
                            <span aria-hidden="true" className={cn("size-1 rounded-full", GUIDE_COLOR)} />
                          ) : null}
                        </div>
                        <button
                          className={cn(
                            "min-w-0 truncate rounded-md px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isSelected && "bg-accent",
                          )}
                          data-node-focus-id={node.id}
                          type="button"
                        >
                          <span
                            className={cn(
                              hasChildren ? "font-semibold" : "font-medium",
                              nodeTitleClass(node.status),
                            )}
                          >
                            {getNodeDisplayTitle(node, language)}
                          </span>
                          {hasChildren ? (
                            <span className="ml-2 rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {childCount}
                            </span>
                          ) : null}
                        </button>
                      </div>
                      <NodeEditButton
                        disabled={editDisabled}
                        node={node}
                        onEditNode={onEditNode}
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "justify-self-start px-1.5 py-0 text-[11px]",
                        typeBadgeClass(node.type),
                      )}
                    >
                      {node.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "justify-self-start px-1.5 py-0 text-[11px]",
                        statusBadgeClass(node.status),
                      )}
                    >
                      {node.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "justify-self-start px-1.5 py-0 text-[11px]",
                        priorityBadgeClass(node.priority),
                      )}
                    >
                      {priorityLabel(node.priority)}
                    </Badge>
                    <div className="min-w-0 pr-2">
                      <TaskProgressInline progress={taskProgress} />
                    </div>
                    <TreePeriodCell
                      descendantPeriod={descendantPeriod}
                      markers={markers}
                      node={node}
                      timelineBounds={timelineBounds}
                      todayLineStyle={todayLineStyle}
                    />
                  </div>
                );
              },
            )}
            <TreeProgressLine
              points={progressLinePoints}
              rowCount={visibleNodes.length}
              todayLineStyle={todayLineStyle}
              treeColumns={treeColumns}
            />
          </div>
        </div>
      )}
    </div>
  );
}
