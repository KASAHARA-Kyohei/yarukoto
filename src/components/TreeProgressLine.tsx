import { useLanguage } from "@/app/LanguageProvider";
import type { TimelineLineStyle } from "@/domain/nodes/period";
import type { ProgressLinePoint } from "@/domain/nodes/progressLine";

// TreeView rows are 44px high with a 4px bottom gap. The 8px period bar
// sits 6px into the track, below its 16px label, 2px gap, and 1px row border.
const ROW_PITCH = 48;
const BAR_CENTER = 29;

export function TreeProgressLine({
  points,
  rowCount,
  todayLineStyle,
  treeColumns,
}: {
  points: ProgressLinePoint[];
  rowCount: number;
  todayLineStyle: TimelineLineStyle | null;
  treeColumns: string;
}) {
  const { t } = useLanguage();
  if (points.length === 0 || !todayLineStyle) return null;

  const height = rowCount * ROW_PITCH;
  const todayPosition = Number.parseFloat(todayLineStyle.left);
  const vertices = [
    `${todayPosition},0`,
    ...points.map((point) => `${point.position},${point.rowIndex * ROW_PITCH + BAR_CENTER}`),
    `${todayPosition},${height}`,
  ].join(" ");

  return (
    <div
      className="pointer-events-none absolute inset-y-0 inset-x-px z-10 grid"
      style={{ gridTemplateColumns: treeColumns }}
    >
      <div className="relative col-start-6 mr-2">
        <div className="absolute inset-y-0 inset-x-2">
          <svg
            aria-label={t.progressLineHelp}
            className="absolute inset-0 h-full w-full overflow-visible text-destructive"
            preserveAspectRatio="none"
            role="img"
            viewBox={`0 0 100 ${height}`}
          >
            <polyline
              fill="none"
              points={vertices}
              stroke="currentColor"
              strokeLinejoin="round"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {points.map((point) => (
            <span
              aria-hidden="true"
              className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive ring-1 ring-background"
              data-progress-line-node-id={point.nodeId}
              key={point.nodeId}
              style={{
                left: `${point.position}%`,
                top: point.rowIndex * ROW_PITCH + BAR_CENTER,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
