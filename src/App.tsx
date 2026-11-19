import { Card, Collapse, Flex, Tabs, Typography } from "antd";
import { useCallback, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { CodeBlock, ExternalLink } from "./components/common";
import { ConfigPanel } from "./components/ConfigPanel";
import { type InputTab, InputPanel } from "./components/InputPanel";
import { OutputPanel } from "./components/OutputPanel";
import { defaultPreviewSettings, parsePreviewSettings, Preview, type PreviewSettings } from "./components/Preview";
import { SupportLinks } from "./components/SupportLinks";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useStoredState } from "./hooks/useStoredState";
import { type Arrangement, arrangeLeds, defaultArrangement, defaultCenter, nextSetOffset } from "./lib/arrange";
import { defaultCoordinates, parseCoordinatesText } from "./lib/coordinates";
import { generateFastLedMap } from "./lib/fastled";
import { defaultLayout, parseLayoutText } from "./lib/layout";
import { readShareLink } from "./lib/links";
import { REPO_URL } from "./lib/support";
import { getBounds } from "./lib/math";
import { defaultPixelblazeMap, parsePixelblazeText, toPixelblazeMap } from "./lib/pixelblaze";
import type { InputSource, ParsedInput, Point } from "./lib/types";

const parsers: Record<InputSource, (text: string) => ParsedInput> = {
  layout: parseLayoutText,
  coordinates: parseCoordinatesText,
  pixelblaze: parsePixelblazeText,
};

const defaultTexts: Record<InputSource, string> = { layout: defaultLayout, coordinates: defaultCoordinates, pixelblaze: defaultPixelblazeMap };

/** The input in the page's link (?l=, ?c= or ?p=), or the defaults. */
function initialInput(): { tab: InputTab; texts: Record<InputSource, string> } {
  const shared = readShareLink(window.location.search);
  return shared ? { tab: shared.source, texts: { ...defaultTexts, [shared.source]: shared.text } } : { tab: "layout", texts: defaultTexts };
}

const pointsToText = (points: readonly Point[]) => JSON.stringify(points.map(({ x, y }) => [x, y]));

export function LedMapperPage() {
  const wide = useMediaQuery("(min-width: 1200px)");
  const [initial] = useState(initialInput);
  const [tab, setTab] = useState<InputTab>(initial.tab);
  const [texts, setTexts] = useState(initial.texts);
  const [arrangement, setArrangement] = useState<Arrangement>(defaultArrangement);
  const [customCenter, setCustomCenter] = useState<Point>();
  const [preview, setPreview] = useStoredState<PreviewSettings>("led-mapper.preview", defaultPreviewSettings, parsePreviewSettings);

  // The image tab marks LEDs into the Pixelblaze map.
  const source: InputSource = tab === "image" ? "pixelblaze" : tab;
  const sourceText = texts[source];
  const parsed = useMemo(() => parsers[source](sourceText), [source, sourceText]);
  const leds = useMemo(() => arrangeLeds(parsed.leds, arrangement), [parsed, arrangement]);
  const bounds = useMemo(() => getBounds(leds), [leds]);
  const center = customCenter ?? defaultCenter(bounds);
  const map = useMemo(() => generateFastLedMap(leds, bounds, center), [leds, bounds, center.x, center.y]); // eslint-disable-line react-hooks/exhaustive-deps
  const pixelblazeMap = useMemo(() => toPixelblazeMap(leds), [leds]);
  const imagePoints = useMemo(() => parsePixelblazeText(texts.pixelblaze).leds, [texts.pixelblaze]);

  const updatePreview = useCallback((changes: Partial<PreviewSettings>) => setPreview({ ...preview, ...changes }), [preview, setPreview]);

  // A hand-set center belongs to the map it was set for.
  const changeTab = (next: InputTab) => {
    setTab(next);
    setCustomCenter(undefined);
  };
  const changeText = (changed: InputSource, text: string) => {
    setTexts((current) => ({ ...current, [changed]: text }));
    setCustomCenter(undefined);
  };
  const setImagePoints = (update: (points: Point[]) => Point[]) =>
    setTexts((current) => ({ ...current, pixelblaze: pointsToText(update(parsePixelblazeText(current.pixelblaze).leds)) }));

  const image = {
    points: imagePoints,
    fontSize: preview.fontSize,
    onLoad: () => changeText("pixelblaze", "[]"),
    onAddPoint: (point: Point) => {
      setImagePoints((points) => [...points, point]);
      // Image coordinates are pixels: LEDs would be specks, so show their numbers instead.
      if (preview.showLeds || !preview.showNumbers || preview.scale256) updatePreview({ showLeds: false, showNumbers: true, scale256: false });
    },
    onUndo: () => setImagePoints((points) => points.slice(0, -1)),
    onClear: () => setImagePoints(() => []),
  };

  const steps = (
    <Card styles={{ body: { paddingTop: 8 } }}>
      <Tabs
        size="large"
        items={[
          {
            key: "input",
            label: "1. Input",
            children: <InputPanel tab={tab} onTabChange={changeTab} texts={texts} onTextChange={changeText} errors={parsed.errors} image={image} />,
          },
          {
            key: "config",
            label: "2. Map Config",
            children: (
              <ConfigPanel
                ledCount={leds.length}
                bounds={bounds}
                center={center}
                centerIsCustom={customCenter !== undefined}
                onCenterChange={setCustomCenter}
                arrangement={arrangement}
                onArrangementChange={setArrangement}
                onAddClone={() => setArrangement({ ...arrangement, sets: [...arrangement.sets, nextSetOffset(arrangement.sets, getBounds(parsed.leds))] })}
              />
            ),
          },
          { key: "output", label: "3. Output", children: <OutputPanel fastLedCode={map.code} pixelblazeMap={pixelblazeMap} /> },
        ]}
      />
    </Card>
  );

  const previewCard = (
    <Card title="4. Preview" style={wide ? { position: "sticky", top: 80 } : undefined}>
      <Preview map={map} bounds={bounds} settings={preview} onChange={updatePreview} />
    </Card>
  );

  return (
    <AppShell>
      <Flex vertical gap={16}>
        <Typography.Text type="secondary">
          Generate and visualize maps for irregular or gapped LED layouts, for FastLED, Pixelblaze and other libraries. Instructions, examples, and
          more: <ExternalLink href={`${REPO_URL}/blob/main/README.md`}>README</ExternalLink>.
        </Typography.Text>

        <div style={{ display: "grid", gridTemplateColumns: wide ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
          {steps}
          {previewCard}
        </div>

        <Collapse
          items={[
            {
              key: "debug",
              label: "Stats & debug info",
              children: (
                <Flex vertical gap={12}>
                  <div>
                    <Typography.Text type="secondary">Stats</Typography.Text>
                    <CodeBlock>{map.stats}</CodeBlock>
                  </div>
                  <div>
                    <Typography.Text type="secondary">Parsed {source}</Typography.Text>
                    <CodeBlock maxHeight={240}>{JSON.stringify(parsed.rows)}</CodeBlock>
                  </div>
                </Flex>
              ),
            },
          ]}
        />

        <Flex justify="center" style={{ marginTop: 8, textAlign: "center" }}>
          <SupportLinks />
        </Flex>
      </Flex>
    </AppShell>
  );
}
