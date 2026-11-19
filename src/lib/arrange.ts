import { getBounds } from "./math";
import type { Bounds, Led, Point } from "./types";

export interface Arrangement {
  flipX: boolean;
  flipY: boolean;
  /**
   * One offset per copy of the input LEDs. The first is the input itself;
   * each further one adds a clone, numbered after the previous copy.
   */
  sets: Point[];
}

export const defaultArrangement: Arrangement = { flipX: false, flipY: false, sets: [{ x: 0, y: 0 }] };

/** Places each copy of the input LEDs, then mirrors the whole thing. Sorted by index. */
export function arrangeLeds(input: readonly Led[], { flipX, flipY, sets }: Arrangement): Led[] {
  const base = [...input].sort((a, b) => a.index - b.index);

  const placed = sets.flatMap((offset, set) =>
    base.map((led, i) => ({
      index: set === 0 ? led.index : set * base.length + i,
      x: led.x + offset.x,
      y: led.y + offset.y,
    }))
  );

  if (!flipX && !flipY) return placed;

  const { minX, maxX, minY, maxY } = getBounds(placed);
  return placed.map((led) => ({
    index: led.index,
    x: flipX ? maxX + minX - led.x : led.x,
    y: flipY ? maxY + minY - led.y : led.y,
  }));
}

/** Where a new clone goes: just to the right of the last copy. */
export function nextSetOffset(sets: readonly Point[], inputBounds: Bounds): Point {
  const last = sets.at(-1) ?? { x: 0, y: 0 };
  return { x: last.x + inputBounds.width, y: last.y };
}

/** The default center for angles and radii: the middle of the map. */
export function defaultCenter({ minX, maxX, minY, maxY }: Bounds): Point {
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
}
