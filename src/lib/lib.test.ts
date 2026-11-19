import { compressToEncodedURIComponent } from "lz-string";
import { describe, expect, it } from "vitest";
import readme from "../../README.md?raw";
import { arrangeLeds, defaultArrangement, defaultCenter } from "./arrange";
import { defaultCoordinates, parseCoordinatesText } from "./coordinates";
import { generateFastLedMap } from "./fastled";
import { defaultLayout, parseLayoutText } from "./layout";
import { getBounds, mapNumber } from "./math";
import { compilePattern } from "./patterns";
import { defaultPixelblazeMap, parsePixelblazeText, toPixelblazeMap } from "./pixelblaze";
import { readShareLink } from "./links";

/** The code blocks in the README, in order. */
const readmeBlocks = [...readme.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1] ?? "");

function mapText(parsed: ReturnType<typeof parseLayoutText>) {
  const leds = arrangeLeds(parsed.leds, defaultArrangement);
  const bounds = getBounds(leds);
  return { leds, bounds, fastLed: generateFastLedMap(leds, bounds, defaultCenter(bounds)) };
}

describe("README example", () => {
  const [layout = "", fastLed = "", pixelblaze = ""] = readmeBlocks;
  const { leds, fastLed: result } = mapText(parseLayoutText(layout.replace(/\n$/, "")));

  it("parses the layout", () => {
    expect(leds).toHaveLength(76);
  });

  it("generates the documented FastLED maps", () => {
    // The README puts a blank line between the arrays.
    expect(result.code.split("\n").filter(Boolean)).toEqual(fastLed.split("\n").filter(Boolean));
  });

  it("generates the documented Pixelblaze map", () => {
    expect(toPixelblazeMap(leds)).toBe(pixelblaze.trim());
  });
});

describe("inputs", () => {
  it("default layout, coordinates and Pixelblaze map describe the same LEDs", () => {
    const layout = mapText(parseLayoutText(defaultLayout));
    const coordinates = mapText(parseCoordinatesText(defaultCoordinates));
    const pixelblaze = mapText(parsePixelblazeText(defaultPixelblazeMap));
    expect(layout.leds).toHaveLength(110);
    expect(coordinates.fastLed.code).toBe(layout.fastLed.code);
    expect(pixelblaze.fastLed.code).toBe(layout.fastLed.code);
  });

  it("reports layout problems", () => {
    const { errors } = parseLayoutText("1\t2\t2\n\t5");
    expect(errors).toEqual([
      "Layout should start at 0 instead of 1.",
      "Layout has 4 LEDs but the highest LED index is 5.",
      "Duplicate indices found: 2.",
      "Missing indices: 3, 4.",
    ]);
  });

  it("accepts comma-separated coordinates with Windows line endings", () => {
    expect(parseCoordinatesText("i,x,y\r\n0,1.5,2\r\n1,-3,4").leds).toEqual([
      { index: 0, x: 1.5, y: 2 },
      { index: 1, x: -3, y: 4 },
    ]);
  });

  it("reports invalid Pixelblaze JSON instead of throwing", () => {
    expect(parsePixelblazeText("[[1,2],").errors[0]).toMatch(/^Invalid JSON/);
    expect(parsePixelblazeText('[[1,2],"x"]')).toMatchObject({ leds: [{ index: 0, x: 1, y: 2 }], errors: [expect.any(String)] });
  });
});

describe("math", () => {
  it("bounds handle all-negative coordinates", () => {
    expect(getBounds([{ index: 0, x: -5, y: -2 }, { index: 1, x: -1, y: -8 }])).toEqual({
      minX: -5, maxX: -1, minY: -8, maxY: -2, width: 5, height: 7,
    });
  });

  it("mapNumber maps a zero-width range to outMin instead of NaN", () => {
    expect(mapNumber(3, 3, 3, 0, 255)).toBe(0);
    expect(mapNumber(1, 2, 1, 1, 2)).toBe(2);
  });

  it("a single LED maps without NaN", () => {
    const { code } = mapText(parseLayoutText("0")).fastLed;
    expect(code).not.toMatch(/NaN|Infinity/);
  });
});

describe("arrangement", () => {
  const input = [
    { index: 1, x: 1, y: 0 },
    { index: 0, x: 0, y: 0 },
  ];

  it("clones the input after the original, renumbered", () => {
    expect(arrangeLeds(input, { flipX: false, flipY: false, sets: [{ x: 0, y: 0 }, { x: 2, y: 1 }] })).toEqual([
      { index: 0, x: 0, y: 0 },
      { index: 1, x: 1, y: 0 },
      { index: 2, x: 2, y: 1 },
      { index: 3, x: 3, y: 1 },
    ]);
  });

  it("flips within the bounds of every copy", () => {
    const flipped = arrangeLeds(input, { flipX: true, flipY: false, sets: [{ x: 0, y: 0 }, { x: 2, y: 0 }] });
    expect(flipped.map((led) => led.x)).toEqual([3, 2, 1, 0]);
  });
});

describe("share links", () => {
  it("opens links made by the original page", () => {
    expect(readShareLink(`?l=${compressToEncodedURIComponent("0\t1")}`)).toEqual({ source: "layout", text: "0\t1" });
    expect(readShareLink("?p=garbage")).toBeUndefined();
    expect(readShareLink("")).toBeUndefined();
  });
});

describe("patterns", () => {
  it("compiles pattern code with FastLED helpers and inputs", () => {
    const render = compilePattern("return CRGB(i, coordsX[i], offset)");
    const inputs = { i: 1, offset: 7, speed: 1, coordsX: [0, 9], coordsY: [], angles: [], radii: [], currentPalette: new Uint8ClampedArray(1024) };
    expect(render(inputs)).toBe("rgb(1, 9, 7)");
  });
});
