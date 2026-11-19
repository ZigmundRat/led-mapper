import type { Led, ParsedInput } from "./types";

/**
 * Parses a tab-delimited grid (as copied from a spreadsheet), with an LED index
 * in each occupied cell. Column and row become x and y.
 */
export function parseLayoutText(text: string): ParsedInput {
  const rows = text.split(/\r?\n/).map((line) => line.split("\t").map((cell) => Number.parseInt(cell)));

  const leds: Led[] = [];
  const seen = new Set<number>();
  const duplicates = new Set<number>();

  rows.forEach((row, y) => {
    row.forEach((index, x) => {
      if (Number.isNaN(index)) return;
      if (seen.has(index)) duplicates.add(index);
      seen.add(index);
      leds.push({ index, x, y });
    });
  });

  const errors: string[] = [];

  if (leds.length > 0) {
    const indices = [...seen].sort((a, b) => a - b);
    const minIndex = indices[0] ?? 0;
    const maxIndex = indices.at(-1) ?? 0;

    if (minIndex !== 0) errors.push(`Layout should start at 0 instead of ${minIndex}.`);
    if (leds.length !== maxIndex + 1) {
      errors.push(`Layout has ${leds.length} LEDs but the highest LED index is ${maxIndex}.`);
    }
    if (duplicates.size > 0) errors.push(`Duplicate indices found: ${[...duplicates].join(", ")}.`);

    const missing: number[] = [];
    for (let i = minIndex; i < maxIndex; i++) if (!seen.has(i)) missing.push(i);
    if (missing.length > 0) errors.push(`Missing indices: ${summarize(missing)}.`);
  }

  return { leds, rows, errors };
}

function summarize(values: number[], max = 20) {
  const shown = values.slice(0, max).join(", ");
  return values.length > max ? `${shown}, … (${values.length - max} more)` : shown;
}

export const defaultLayout = `	0	1	2	3	4	5	6		7	8	9	10	11	12	13
30	29	28	27	26	25	24	23	22	21	20	19	18	17	16	15	14
31	32	33	34	35	36	37	38	39	40	41	42	43	44	45	46	47
64	63	62	61	60	59	58	57	56	55	54	53	52	51	50	49	48
65	66	67	68	69	70	71	72	73	74	75	76	77	78	79	80	81
97	96	95	94	93	92	91	90		89	88	87	86	85	84	83	82
	98	99	100	101	102	103				104	105	106	107	108	109`;
