import { scale8 } from "./fastled";
import { wrap8 } from "./math";

/**
 * Gradient stops, evenly spaced unless a stop ends with an explicit position
 * (`"rgb(…) 12.5%"`).
 */
export const palettes = {
  rainbow: [
    "#ff0000", "#ff4000", "#ff8000", "#ffbf00", "#ffff00", "#bfff00", "#80ff00", "#40ff00", "#00ff00", "#00ff40",
    "#00ff80", "#00ffbf", "#00ffff", "#00bfff", "#0080ff", "#0040ff", "#0000ff", "#4000ff", "#8000ff", "#bf00ff",
    "#ff00ff", "#ff00bf", "#ff0080", "#ff0040", "#ff0000",
  ],
  "rainbow stripe": [
    "#ff0000", "#000000", "#ff4000", "#000000", "#ff8000", "#000000", "#ffbf00", "#000000", "#ffff00", "#000000",
    "#bfff00", "#000000", "#80ff00", "#000000", "#40ff00", "#000000", "#00ff00", "#000000", "#00ff40", "#000000",
    "#00ff80", "#000000", "#00ffbf", "#000000", "#00ffff", "#000000", "#00bfff", "#000000", "#0080ff", "#000000",
    "#0040ff", "#000000", "#0000ff", "#000000", "#4000ff", "#000000", "#8000ff", "#000000", "#bf00ff", "#000000",
    "#ff00ff", "#000000", "#ff00bf", "#000000", "#ff0080", "#000000", "#ff0040", "#000000", "#ff0000",
  ],
  cloud: [
    "Blue", "DarkBlue", "DarkBlue", "DarkBlue", "DarkBlue", "DarkBlue", "DarkBlue", "DarkBlue",
    "Blue", "DarkBlue", "SkyBlue", "SkyBlue", "LightBlue", "White", "LightBlue", "SkyBlue",
  ],
  lava: [
    "Black", "Maroon", "Black", "Maroon", "DarkRed", "Maroon", "DarkRed", "DarkRed",
    "DarkRed", "Red", "Orange", "White", "Orange", "Red", "DarkRed",
  ],
  ocean: [
    "MidnightBlue", "DarkBlue", "MidnightBlue", "Navy", "DarkBlue", "MediumBlue", "SeaGreen", "Teal",
    "CadetBlue", "Blue", "DarkCyan", "CornflowerBlue", "Aquamarine", "SeaGreen", "Aqua", "LightSkyBlue",
  ],
  forest: [
    "DarkGreen", "DarkGreen", "DarkOliveGreen", "DarkGreen", "Green", "ForestGreen", "OliveDrab", "Green",
    "SeaGreen", "MediumAquamarine", "LimeGreen", "YellowGreen", "LightGreen", "LawnGreen", "MediumAquamarine", "ForestGreen",
  ],
  party: [
    "#5500ab", "#84007c", "#b5004b", "#e5001b", "#e81700", "#b84700", "#ab7700", "#abab00",
    "#ab5500", "#dd2200", "#f2000e", "#c2003e", "#8f0071", "#5f00a1", "#2f00d0", "#0007f9",
  ],
  heat: [
    "#000000", "#330000", "#660000", "#990000", "#cc0000", "#ff0000", "#ff3300", "#ff6600",
    "#ff9900", "#ffcc00", "#ffff00", "#ffff33", "#ffff66", "#ffff99", "#ffffcc", "#ffffff",
  ],

  // Gradient "cpt-city/arendal/temperature", originally from
  // http://soliton.vm.bytemark.co.uk/pub/cpt-city/arendal/tn/temperature.png.index.html
  temperature: [
    "rgb( 30, 92,179)   0.000%", "rgb( 30, 92,179)   5.500%",
    "rgb( 23,111,193)   5.500%", "rgb( 23,111,193)  11.170%",
    "rgb( 11,142,216)  11.170%", "rgb( 11,142,216)  16.670%",
    "rgb(  4,161,230)  16.670%", "rgb(  4,161,230)  22.170%",
    "rgb( 25,181,241)  22.170%", "rgb( 25,181,241)  27.830%",
    "rgb( 51,188,207)  27.830%", "rgb( 51,188,207)  33.330%",
    "rgb(102,204,206)  33.330%", "rgb(102,204,206)  38.830%",
    "rgb(153,219,184)  38.830%", "rgb(153,219,184)  44.500%",
    "rgb(192,229,136)  44.500%", "rgb(192,229,136)  50.000%",
    "rgb(204,230, 75)  50.000%", "rgb(204,230, 75)  55.500%",
    "rgb(243,240, 29)  55.500%", "rgb(243,240, 29)  61.170%",
    "rgb(254,222, 39)  61.170%", "rgb(254,222, 39)  66.670%",
    "rgb(252,199,  7)  66.670%", "rgb(252,199,  7)  72.170%",
    "rgb(248,157, 14)  72.170%", "rgb(248,157, 14)  77.830%",
    "rgb(245,114, 21)  77.830%", "rgb(245,114, 21)  83.330%",
    "rgb(241, 71, 28)  83.330%", "rgb(241, 71, 28)  88.830%",
    "rgb(219, 30, 38)  88.830%", "rgb(219, 30, 38)  94.500%",
    "rgb(164, 38, 44)  94.500%", "rgb(164, 38, 44) 100.000%",
  ],

  // Gradient "cpt-city/ing/xmas/ib_jul01", originally from
  // http://soliton.vm.bytemark.co.uk/pub/cpt-city/ing/xmas/tn/ib_jul01.png.index.html
  ib_jul01: ["rgb(230,  6, 17)   0.000%", "rgb( 37, 96, 90)  37.010%", "rgb(144,189,106)  52.000%", "rgb(187,  3, 13) 100.000%"],
} as const satisfies Record<string, readonly string[]>;

export type PaletteName = keyof typeof palettes;

export const paletteNames = Object.keys(palettes) as PaletteName[];

/** Color and position (0-1) of each stop. */
export function getStops(name: PaletteName): { color: string; offset: number }[] {
  const colors = palettes[name];
  return colors.map((stop, i) => {
    const match = /^(.*\))\s*([\d.]+)%$/.exec(stop);
    return match?.[1] && match[2]
      ? { color: match[1], offset: Number.parseFloat(match[2]) / 100 }
      : { color: stop, offset: i / colors.length };
  });
}

export function toCssGradient(name: PaletteName): string {
  const stops = getStops(name).map(({ color, offset }) => `${color} ${(offset * 100).toFixed(3)}%`);
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/** A 256-entry RGBA lookup table: the palette, as FastLED's ColorFromPalette sees it. */
export type PaletteTable = Uint8ClampedArray;

export function buildPaletteTable(name: PaletteName): PaletteTable {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return new Uint8ClampedArray(256 * 4);
  const gradient = context.createLinearGradient(0, 0, 256, 0);
  for (const { color, offset } of getStops(name)) gradient.addColorStop(Math.min(1, Math.max(0, offset)), color);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 1);
  return context.getImageData(0, 0, 256, 1).data;
}

/** FastLED's ColorFromPalette: the color at `index` (wrapping), dimmed by `brightness`. */
export function colorFromPalette(palette: PaletteTable, index: number, brightness = 255): string {
  const i = wrap8(index) * 4;
  let r = palette[i] ?? 0;
  let g = palette[i + 1] ?? 0;
  let b = palette[i + 2] ?? 0;
  const level = wrap8(brightness);
  if (level !== 255) {
    r = scale8(r, level);
    g = scale8(g, level);
    b = scale8(b, level);
  }
  return `rgb(${r}, ${g}, ${b})`;
}
