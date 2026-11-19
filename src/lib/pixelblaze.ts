import type { Led, ParsedInput } from "./types";

/** Parses a Pixelblaze map: a JSON array of `[x, y]` (a z, if present, is ignored). */
export function parsePixelblazeText(text: string): ParsedInput {
  if (text.trim() === "") return { leds: [], rows: [], errors: [] };

  let rows: unknown;
  try {
    rows = JSON.parse(text);
  } catch (error) {
    return { leds: [], rows: undefined, errors: [`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`] };
  }

  if (!Array.isArray(rows)) return { leds: [], rows, errors: ["Expected an array of [x, y] arrays."] };

  const leds: Led[] = [];
  const invalid: number[] = [];

  rows.forEach((row: unknown, index) => {
    if (Array.isArray(row) && typeof row[0] === "number" && typeof row[1] === "number") {
      leds.push({ index, x: row[0], y: row[1] });
    } else {
      invalid.push(index);
    }
  });

  const errors = invalid.length > 0 ? [`Not an [x, y] array at position ${invalid.slice(0, 10).join(", ")}.`] : [];

  return { leds, rows, errors };
}

/** Pixelblaze's map format, with coordinates trimmed to 3 decimal places. */
export function toPixelblazeMap(leds: readonly Led[]): string {
  return `[${leds.map(({ x, y }) => `[${+x.toFixed(3)},${+y.toFixed(3)}]`).join(",")}]`;
}

export const defaultPixelblazeMap = `[
  [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0],
  [16, 1], [15, 1], [14, 1], [13, 1], [12, 1], [11, 1], [10, 1], [9, 1], [8, 1], [7, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1],
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2],
  [16, 3], [15, 3], [14, 3], [13, 3], [12, 3], [11, 3], [10, 3], [9, 3], [8, 3], [7, 3], [6, 3], [5, 3], [4, 3], [3, 3], [2, 3], [1, 3], [0, 3],
  [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4],
  [16, 5], [15, 5], [14, 5], [13, 5], [12, 5], [11, 5], [10, 5], [9, 5], [7, 5], [6, 5], [5, 5], [4, 5], [3, 5], [2, 5], [1, 5], [0, 5],
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [15, 6]
]`;
