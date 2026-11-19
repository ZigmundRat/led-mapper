import { mapNumber, wrap8 } from "./math";
import type { Bounds, Led, MappedLed, Point } from "./types";

// --- FastLED map generation -------------------------------------------------

export interface FastLedMap {
  leds: MappedLed[];
  coordsX: number[];
  coordsY: number[];
  angles: number[];
  radii: number[];
  code: string;
  stats: string;
}

/**
 * Adds polar coordinates around `center`, scales everything to 0-255, and
 * writes the FastLED arrays. `leds` should already be sorted by index.
 */
export function generateFastLedMap(leds: readonly Led[], bounds: Bounds, center: Point): FastLedMap {
  const { minX, maxX, minY, maxY } = bounds;

  const polar = leds.map((led) => {
    const radius = Math.hypot(led.x - center.x, led.y - center.y);
    let angle = Math.atan2(center.y - led.y, center.x - led.x) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    return { ...led, angle, radius };
  });

  const maxRadius = Math.max(0, ...polar.map((led) => led.radius));

  const mapped: MappedLed[] = polar.map((led) => ({
    ...led,
    x256: Math.round(mapNumber(led.x, minX, maxX, 0, 255)),
    y256: Math.round(mapNumber(led.y, minY, maxY, 0, 255)),
    angle256: Math.round(mapNumber(led.angle, 0, 360, 0, 255)),
    radius256: Math.round(mapNumber(led.radius, 0, maxRadius, 0, 255)),
  }));

  const coordsX = mapped.map((led) => led.x256);
  const coordsY = mapped.map((led) => led.y256);
  const angles = mapped.map((led) => led.angle256);
  const radii = mapped.map((led) => led.radius256);

  const array = (name: string, values: number[]) => `byte ${name}[NUM_LEDS] = { ${values.join(", ")} };`;

  const code = [
    `#define NUM_LEDS ${mapped.length}`,
    "",
    array("coordsX", coordsX),
    array("coordsY", coordsY),
    array("angles", angles),
    array("radii", radii),
  ].join("\n");

  const range = (values: number[]) => (values.length ? [Math.min(...values), Math.max(...values)] : [0, 0]);
  const indices = range(mapped.map((led) => led.index));
  const angleRange = range(polar.map((led) => led.angle));
  const radiusRange = range(polar.map((led) => led.radius));

  const stats = [
    `LEDs: ${mapped.length}`,
    `index: ${indices.join(" – ")}`,
    `x: ${minX} – ${maxX}`,
    `y: ${minY} – ${maxY}`,
    `center: ${center.x}, ${center.y}`,
    `angle: ${angleRange.map((v) => v.toFixed(2)).join(" – ")}`,
    `radius: ${radiusRange.map((v) => v.toFixed(2)).join(" – ")}`,
    `coordsX: ${range(coordsX).join(" – ")}`,
    `coordsY: ${range(coordsY).join(" – ")}`,
    `angles: ${range(angles).join(" – ")}`,
    `radii: ${range(radii).join(" – ")}`,
  ].join("\n");

  return { leds: mapped, coordsX, coordsY, angles, radii, code, stats };
}

// --- FastLED functions for preview patterns --------------------------------
// Approximations of the FastLED functions of the same names, close enough to
// preview a pattern in the browser.

export function scale8(i: number, scale: number): number {
  return (i * (1 + scale)) >> 8;
}

export function beat16(beatsPerMinute: number, timebase = 0): number {
  if (beatsPerMinute < 256) beatsPerMinute *= 256;
  const result = ((Date.now() - timebase) * beatsPerMinute * 280) >> 16;
  return mapNumber(result, -32767.5, 32767.5, 0, 65535);
}

export function beat8(beatsPerMinute: number, timebase = 0): number {
  return beat16(beatsPerMinute, timebase) >> 8;
}

export function beatsin8(beatsPerMinute: number, lowest = 0, highest = 255, timebase = 0, phaseOffset = 0): number {
  const beat = beat8(beatsPerMinute, timebase);
  return lowest + scale8(sin8(beat + phaseOffset), highest - lowest);
}

/** sin of a 0-255 angle, as 0-255. */
export function sin8(theta: number): number {
  const t = mapNumber(wrap8(theta), 0, 255, -Math.PI, Math.PI);
  return ((Math.sin(t) + 1) / 2) * 255;
}

/** cos of a 0-255 angle, as 0-255. */
export function cos8(theta: number): number {
  return sin8(theta + 64);
}

/** HSV (each 0-255) to a CSS color. */
export function CHSV(hue: number, saturation = 255, value = 255): string {
  const { r, g, b } = hsvToRgb(wrap8(hue) / 255, wrap8(saturation) / 255, wrap8(value) / 255);
  return `rgb(${r}, ${g}, ${b})`;
}

/** RGB (each 0-255) to a CSS color. */
export function CRGB(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/** h, s and v in 0-1; r, g and b in 0-255. */
export function hsvToRgb(h: number, s: number, v: number) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const sextants: [number, number, number][] = [
    [v, t, p],
    [q, v, p],
    [p, v, t],
    [p, q, v],
    [t, p, v],
    [v, p, q],
  ];
  const [r, g, b] = sextants[i % 6] ?? [v, t, p];
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
