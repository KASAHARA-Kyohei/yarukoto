const HINT_KEYS = "asdfghjklqwertyuiopzxcvbnm";

export function getFocusHintLabelLength(count: number) {
  let length = 1;
  let capacity = HINT_KEYS.length;
  while (count > capacity) {
    length += 1;
    capacity *= HINT_KEYS.length;
  }
  return length;
}

export function createFocusHintLabel(index: number, length = 1) {
  const chars = Array.from({ length }, () => HINT_KEYS[0]);
  let value = index;
  for (let position = length - 1; position >= 0; position -= 1) {
    chars[position] = HINT_KEYS[value % HINT_KEYS.length];
    value = Math.floor(value / HINT_KEYS.length);
  }
  return chars.join("");
}

export function createFocusHintLabels(count: number) {
  const length = getFocusHintLabelLength(count);
  return Array.from({ length: count }, (_, index) =>
    createFocusHintLabel(index, length),
  );
}
