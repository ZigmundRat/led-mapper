import type { Led, ParsedInput } from "./types";

/**
 * Parses rows of `index, x, y`, tab- or comma-delimited (as copied from a
 * spreadsheet or a CSV). Rows that aren't three numbers, like headers, are skipped.
 */
export function parseCoordinatesText(text: string): ParsedInput {
  const rows = text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .map((line) => line.split(/[\t,]/).map((cell) => Number.parseFloat(cell)));

  const leds: Led[] = [];

  for (const [index, x, y] of rows) {
    if (index === undefined || x === undefined || y === undefined) continue;
    if (Number.isNaN(index) || Number.isNaN(x) || Number.isNaN(y)) continue;
    leds.push({ index: Math.trunc(index), x, y });
  }

  const errors = rows.length > 0 && leds.length === 0 ? ["No rows of index, x and y found."] : [];

  return { leds, rows, errors };
}

export const defaultCoordinates = `i	x	y
0	1	0
1	2	0
2	3	0
3	4	0
4	5	0
5	6	0
6	7	0
7	9	0
8	10	0
9	11	0
10	12	0
11	13	0
12	14	0
13	15	0
14	16	1
15	15	1
16	14	1
17	13	1
18	12	1
19	11	1
20	10	1
21	9	1
22	8	1
23	7	1
24	6	1
25	5	1
26	4	1
27	3	1
28	2	1
29	1	1
30	0	1
31	0	2
32	1	2
33	2	2
34	3	2
35	4	2
36	5	2
37	6	2
38	7	2
39	8	2
40	9	2
41	10	2
42	11	2
43	12	2
44	13	2
45	14	2
46	15	2
47	16	2
48	16	3
49	15	3
50	14	3
51	13	3
52	12	3
53	11	3
54	10	3
55	9	3
56	8	3
57	7	3
58	6	3
59	5	3
60	4	3
61	3	3
62	2	3
63	1	3
64	0	3
65	0	4
66	1	4
67	2	4
68	3	4
69	4	4
70	5	4
71	6	4
72	7	4
73	8	4
74	9	4
75	10	4
76	11	4
77	12	4
78	13	4
79	14	4
80	15	4
81	16	4
82	16	5
83	15	5
84	14	5
85	13	5
86	12	5
87	11	5
88	10	5
89	9	5
90	7	5
91	6	5
92	5	5
93	4	5
94	3	5
95	2	5
96	1	5
97	0	5
98	1	6
99	2	6
100	3	6
101	4	6
102	5	6
103	6	6
104	10	6
105	11	6
106	12	6
107	13	6
108	14	6
109	15	6`;
