import { CHSV, CRGB, beat8, beatsin8, cos8, sin8 } from "./fastled";
import { colorFromPalette, type PaletteTable } from "./palettes";

export const patterns = [
  { name: "beatsin8", code: "return ColorFromPalette(currentPalette, coordsX[i], beatsin8(speed*40, 0, 255, 0, coordsX[i] + coordsY[i]));" },
  { name: "physical order", code: "return ColorFromPalette(currentPalette, i - offset);" },
  { name: "clockwise palette", code: "return ColorFromPalette(currentPalette, angles[i] - offset);" },
  { name: "counter-clockwise palette", code: "return ColorFromPalette(currentPalette, angles[i] + offset);" },
  { name: "outward palette", code: "return ColorFromPalette(currentPalette, radii[i] - offset);" },
  { name: "inward palette", code: "return ColorFromPalette(currentPalette, radii[i] + offset);" },
  { name: "north palette", code: "return ColorFromPalette(currentPalette, coordsY[i] + offset);" },
  { name: "northeast palette", code: "return ColorFromPalette(currentPalette, coordsX[i] - coordsY[i] - offset);" },
  { name: "east palette", code: "return ColorFromPalette(currentPalette, coordsX[i] - offset);" },
  { name: "southeast palette", code: "return ColorFromPalette(currentPalette, coordsX[i] + coordsY[i] - offset);" },
  { name: "south palette", code: "return ColorFromPalette(currentPalette, coordsY[i] - offset);" },
  { name: "southwest palette", code: "return ColorFromPalette(currentPalette, coordsX[i] - coordsY[i] + offset);" },
  { name: "west palette", code: "return ColorFromPalette(currentPalette, coordsX[i] + offset);" },
  { name: "northwest palette", code: "return ColorFromPalette(currentPalette, coordsX[i] + coordsY[i] + offset);" },
  { name: "red", code: "return CRGB(255, 0, 0)" },
  { name: "green", code: "return CRGB(0, 255, 0)" },
  { name: "blue", code: "return CRGB(0, 0, 255)" },
  { name: "white", code: "return CRGB(255, 255, 255)" },
] as const;

export const CUSTOM_PATTERN = "custom";

/** What a pattern's code can see. */
export interface PatternInputs {
  i: number;
  offset: number;
  speed: number;
  coordsX: readonly number[];
  coordsY: readonly number[];
  angles: readonly number[];
  radii: readonly number[];
  currentPalette: PaletteTable;
}

export type RenderFunction = (inputs: PatternInputs) => unknown;

const helpers = { beat8, beatsin8, CHSV, ColorFromPalette: colorFromPalette, cos8, CRGB, sin8 };
const inputNames: (keyof PatternInputs)[] = ["i", "offset", "speed", "coordsX", "coordsY", "angles", "radii", "currentPalette"];

/**
 * Compiles the body of a pattern function, written by the user in the preview
 * controls. It runs in this page only, like code typed into the dev tools.
 */
export function compilePattern(code: string): RenderFunction {
  const names = [...Object.keys(helpers), ...inputNames];
  const fn = new Function(...names, code) as (...args: unknown[]) => unknown;
  const helperValues = Object.values(helpers);
  return (inputs) => fn(...helperValues, ...inputNames.map((name) => inputs[name]));
}
