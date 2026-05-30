export function getCycledValue<T>(
  values: readonly T[],
  currentValue: T,
  direction: 1 | -1,
) {
  if (values.length === 0) {
    throw new Error("values must not be empty");
  }

  const currentIndex = values.indexOf(currentValue);
  const safeIndex = currentIndex === -1 ? 0 : currentIndex;
  const nextIndex = (safeIndex + direction + values.length) % values.length;
  return values[nextIndex];
}
