import type { Bounds, Led } from "./types";

/** Arduino's map(), for floats. A zero-width input range maps to outMin. */
export function mapNumber(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/** Wraps any number into 0-255, like a uint8_t would. */
export function wrap8(value: number): number {
  return ((Math.floor(value) % 256) + 256) % 256;
}

export function getBounds(leds: readonly Led[]): Bounds {
  if (leds.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const { x, y } of leds) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 };
}
