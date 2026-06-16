type SelectionScrollParams = {
  containerHeight: number;
  containerTop: number;
  itemBottom: number;
  itemHeight: number;
  itemTop: number;
  scrollTop: number;
};

export function getSelectionScrollTop({
  containerHeight,
  containerTop,
  itemBottom,
  itemHeight,
  itemTop,
  scrollTop,
}: SelectionScrollParams) {
  if (containerHeight <= 0 || itemHeight <= 0) {
    return null;
  }

  const padding = Math.min(
    Math.max(itemHeight * 2, 24),
    Math.max(containerHeight / 2 - 1, 0),
  );
  const visibleTop = containerTop + padding;
  const visibleBottom = containerTop + containerHeight - padding;

  if (itemTop < visibleTop) {
    return Math.max(0, scrollTop - (visibleTop - itemTop));
  }

  if (itemBottom > visibleBottom) {
    return scrollTop + (itemBottom - visibleBottom);
  }

  return null;
}
