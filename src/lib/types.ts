/** One LED: its wiring index and position, in input units. */
export interface Led {
  index: number;
  x: number;
  y: number;
}

/** An LED with its polar coordinates and everything scaled to 0-255. */
export interface MappedLed extends Led {
  angle: number;
  radius: number;
  x256: number;
  y256: number;
  angle256: number;
  radius256: number;
}

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  /** Span + 1, so a 0-based grid of 16 columns has a width of 16. */
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** The result of parsing one of the input formats. */
export interface ParsedInput {
  leds: Led[];
  /** The raw parsed rows, shown in the debug panel. */
  rows: unknown;
  /** Problems worth fixing; the LEDs that could be read are still returned. */
  errors: string[];
}

export type InputSource = "layout" | "coordinates" | "pixelblaze";
