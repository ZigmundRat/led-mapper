import {
  CaretRightOutlined,
  ExpandOutlined,
  PauseOutlined,
  QuestionCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";
import Panzoom, { type PanzoomObject } from "@panzoom/panzoom";
import { Alert, Button, Checkbox, Flex, Input, InputNumber, Popover, Segmented, Select, Space, Tooltip, Typography } from "antd";
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useElementWidth } from "../hooks/useElementWidth";
import type { FastLedMap } from "../lib/fastled";
import { buildPaletteTable, paletteNames, type PaletteName, toCssGradient } from "../lib/palettes";
import { compilePattern, CUSTOM_PATTERN, patterns, type RenderFunction } from "../lib/patterns";
import type { Bounds, MappedLed } from "../lib/types";
import { colors, monoFont } from "../theme";
import { ExternalLink } from "./common";

export const numberSources = [
  { value: "index", label: "Index" },
  { value: "x256", label: "X" },
  { value: "y256", label: "Y" },
  { value: "angle256", label: "Angle" },
  { value: "radius256", label: "Radius" },
] as const satisfies readonly { value: keyof MappedLed; label: string }[];

export type NumberSource = (typeof numberSources)[number]["value"];

export interface PreviewSettings {
  patternCode: string;
  palette: PaletteName;
  showLeds: boolean;
  showNumbers: boolean;
  numberSource: NumberSource;
  fontSize: number;
  speed: number;
  /** Draw at the 0-255 FastLED coordinates instead of the input's. */
  scale256: boolean;
}

export const defaultPreviewSettings: PreviewSettings = {
  patternCode: patterns[0].code,
  palette: "rainbow",
  showLeds: true,
  showNumbers: false,
  numberSource: "index",
  fontSize: 20,
  speed: 1,
  scale256: false,
};

/** Settings saved by an earlier visit, with anything missing or unknown reset to the default. */
export function parsePreviewSettings(raw: string): PreviewSettings {
  const saved = JSON.parse(raw) as Partial<PreviewSettings>;
  const merged = { ...defaultPreviewSettings, ...saved };
  if (!paletteNames.includes(merged.palette)) merged.palette = defaultPreviewSettings.palette;
  if (!numberSources.some((s) => s.value === merged.numberSource)) merged.numberSource = "index";
  return merged;
}

interface Props {
  map: FastLedMap;
  bounds: Bounds;
  settings: PreviewSettings;
  onChange: (changes: Partial<PreviewSettings>) => void;
}

const cycle = <T,>(values: readonly T[], current: T, step: number) =>
  values[(values.indexOf(current) + step + values.length) % values.length] ?? current;

export function Preview({ map, bounds, settings, onChange }: Props) {
  const [running, setRunning] = useState(true);
  const [runtimeError, setRuntimeError] = useState<{ code: string; message: string }>();

  const palette = useMemo(() => buildPaletteTable(settings.palette), [settings.palette]);
  const compiled = useMemo((): { render?: RenderFunction; error?: string } => {
    try {
      return { render: compilePattern(settings.patternCode) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [settings.patternCode]);

  const error = compiled.error ?? (runtimeError?.code === settings.patternCode ? runtimeError.message : undefined);
  const render = error ? undefined : compiled.render;

  const patternName = patterns.find((p) => p.code === settings.patternCode)?.name ?? CUSTOM_PATTERN;
  const patternNames = [...patterns.map((p) => p.name), CUSTOM_PATTERN];
  const setPattern = (name: string) => {
    const pattern = patterns.find((p) => p.name === name);
    if (pattern) onChange({ patternCode: pattern.code });
  };

  // --- canvas ---------------------------------------------------------------

  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const panzoomRef = useRef<PanzoomObject>(null);
  const offsetRef = useRef(0);
  const drawRef = useRef<() => void>(() => undefined);
  const cssWidth = useElementWidth(containerRef);

  const cols = settings.scale256 ? 256 : Math.max(1, bounds.width);
  const rows = settings.scale256 ? 256 : Math.max(1, bounds.height);
  const maxHeight = Math.max(240, window.innerHeight * 0.7);
  // Room for numbers on the edge LEDs, which can be much wider than an LED.
  const margin = settings.showNumbers ? settings.fontSize : 0;
  const cell = Math.max(0, Math.min((cssWidth - margin * 2) / cols, (maxHeight - margin * 2) / rows));
  const cssHeight = Math.ceil(cell * rows + margin * 2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
  }, [cssWidth, cssHeight]);

  const settingsRef = useRef(settings);

  // Keep the draw function current; when paused, redraw on every change.
  useEffect(() => {
    settingsRef.current = settings;
    // A pattern that throws is reported once, then its LEDs are drawn unlit.
    let activeRender = render;
    drawRef.current = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context || cssWidth === 0) return;

      const dpr = canvas.width / cssWidth;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "black";
      context.fillRect(0, 0, cssWidth, cssHeight);
      context.globalCompositeOperation = "lighter";
      context.font = `${settings.fontSize}px ${monoFont}`;
      context.textAlign = "center";
      context.textBaseline = "middle";

      const left = (cssWidth - cell * cols) / 2;
      const radius = cell / 2;
      const { coordsX, coordsY, angles, radii } = map;
      const offset = offsetRef.current;

      map.leds.forEach((led, i) => {
        let color: string = colors.axis;
        if (activeRender) {
          try {
            const result = activeRender({ i, offset, speed: settings.speed, coordsX, coordsY, angles, radii, currentPalette: palette });
            if (typeof result === "string") color = result;
          } catch (e) {
            setRuntimeError({ code: settings.patternCode, message: `${e instanceof Error ? e.message : String(e)} (LED ${led.index})` });
            activeRender = undefined;
          }
        }

        const x = left + (settings.scale256 ? led.x256 : led.x - bounds.minX) * cell + radius;
        const y = margin + (settings.scale256 ? led.y256 : led.y - bounds.minY) * cell + radius;

        if (settings.showLeds) {
          context.fillStyle = color;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
        }
        if (settings.showNumbers) {
          context.fillStyle = settings.showLeds ? "white" : color;
          context.fillText(led[settings.numberSource].toFixed(0), x, y);
        }
      });
    };
    if (!running) drawRef.current();
  });

  useEffect(() => {
    if (!running) return;
    let id = requestAnimationFrame(function tick() {
      offsetRef.current = (offsetRef.current + settingsRef.current.speed) % 256;
      drawRef.current();
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [running]);

  useEffect(() => {
    const element = zoomRef.current;
    const parent = element?.parentElement;
    if (!element || !parent) return;
    const panzoom = Panzoom(element, { canvas: true, maxScale: 5 });
    panzoomRef.current = panzoom;
    parent.addEventListener("wheel", panzoom.zoomWithWheel);
    return () => {
      parent.removeEventListener("wheel", panzoom.zoomWithWheel);
      panzoom.destroy();
      panzoomRef.current = null;
    };
  }, []);

  // --- controls -------------------------------------------------------------

  const help = (
    <div style={{ maxWidth: 420 }}>
      <p style={{ marginTop: 0 }}>
        The body of a function that returns each LED&apos;s color. Inputs: <code>i</code> (LED index), <code>offset</code> (0-255, advancing
        each frame by <code>speed</code>), and the map arrays <code>coordsX</code>, <code>coordsY</code>, <code>angles</code>, <code>radii</code>.
      </p>
      <p style={{ marginBottom: 0 }}>
        Return <code>CHSV(hue, sat, val)</code>, <code>CRGB(r, g, b)</code>, <code>ColorFromPalette(currentPalette, index, brightness)</code>,
        or any <ExternalLink href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value">CSS color</ExternalLink>. Also available:{" "}
        <code>beat8</code>, <code>beatsin8</code>, <code>sin8</code>, <code>cos8</code>.
      </p>
    </div>
  );

  return (
    <Flex vertical gap={12}>
      <Flex gap={8} wrap align="center">
        <Space.Compact>
          <Select
            aria-label="Pattern"
            value={patternName}
            onChange={setPattern}
            options={patternNames.map((name) => ({ value: name, label: name, disabled: name === CUSTOM_PATTERN }))}
            style={{ width: 210 }}
            prefix="Pattern"
          />
          <IconButton title="Previous pattern" icon={<StepBackwardOutlined />} onClick={() => setPattern(cycle(patternNames.slice(0, -1), patternName, -1))} />
          <IconButton title="Next pattern" icon={<StepForwardOutlined />} onClick={() => setPattern(cycle(patternNames.slice(0, -1), patternName, 1))} />
        </Space.Compact>
        <IconButton title={running ? "Pause" : "Play"} icon={running ? <PauseOutlined /> : <CaretRightOutlined />} onClick={() => setRunning(!running)} />
        <Tooltip title="Pattern speed">
          <InputNumber
            prefix="Speed"
            min={0.1}
            max={8}
            step={0.1}
            value={settings.speed}
            onChange={(speed) => speed !== null && onChange({ speed })}
            style={{ width: 120 }}
          />
        </Tooltip>
      </Flex>

      <Flex gap={8} wrap align="center">
        <Space.Compact>
          <Select
            aria-label="Palette"
            value={settings.palette}
            onChange={(palette) => onChange({ palette })}
            options={paletteNames.map((name) => ({ value: name, label: name }))}
            style={{ width: 210 }}
            prefix="Palette"
          />
          <IconButton title="Previous palette" icon={<StepBackwardOutlined />} onClick={() => onChange({ palette: cycle(paletteNames, settings.palette, -1) })} />
          <IconButton title="Next palette" icon={<StepForwardOutlined />} onClick={() => onChange({ palette: cycle(paletteNames, settings.palette, 1) })} />
        </Space.Compact>
        <div
          title={`${settings.palette} palette`}
          style={{ flex: "1 1 120px", maxWidth: 256, height: 32, borderRadius: 6, background: toCssGradient(settings.palette) }}
        />
      </Flex>

      <Flex gap={8} wrap align="center">
        <Checkbox checked={settings.showLeds} onChange={(e) => onChange({ showLeds: e.target.checked })}>
          LEDs
        </Checkbox>
        <Checkbox checked={settings.showNumbers} onChange={(e) => onChange({ showNumbers: e.target.checked })}>
          Numbers
        </Checkbox>
        <Space.Compact>
          <Select
            aria-label="Number text"
            prefix="Text"
            value={settings.numberSource}
            onChange={(numberSource) => onChange({ numberSource })}
            options={[...numberSources]}
            disabled={!settings.showNumbers}
            style={{ width: 130 }}
          />
          <InputNumber
            aria-label="Number font size"
            prefix="Size"
            min={4}
            max={200}
            step={1}
            value={settings.fontSize}
            onChange={(fontSize) => fontSize !== null && onChange({ fontSize })}
            disabled={!settings.showNumbers}
            style={{ width: 100 }}
          />
        </Space.Compact>
        <Tooltip title="Draw at the input's coordinates, or the 0-255 FastLED coordinates">
          <Segmented
            value={settings.scale256 ? "256" : "input"}
            onChange={(value) => onChange({ scale256: value === "256" })}
            options={[
              { value: "input", label: `Scale: ${Math.max(bounds.width, bounds.height)}` },
              { value: "256", label: "Scale: 256" },
            ]}
          />
        </Tooltip>
        <Button icon={<ExpandOutlined />} onClick={() => panzoomRef.current?.reset()}>
          Reset view
        </Button>
      </Flex>

      <Flex gap={8} align="start">
        <Input.TextArea
          aria-label="Pattern code"
          value={settings.patternCode}
          onChange={(e) => onChange({ patternCode: e.target.value })}
          autoSize={{ minRows: 1, maxRows: 8 }}
          spellCheck={false}
          style={{ fontFamily: monoFont, fontSize: 12 }}
        />
        <Popover content={help} title="Pattern code" trigger="click" placement="bottomRight">
          <Button icon={<QuestionCircleOutlined />} aria-label="Pattern code help" />
        </Popover>
      </Flex>
      {error && <Alert type="error" showIcon title={error} />}

      <div ref={containerRef}>
        <div style={{ background: "black", borderRadius: 6, overflow: "hidden", touchAction: "none" }}>
          <div ref={zoomRef}>
            <canvas ref={canvasRef} style={{ display: "block", width: cssWidth, height: cssHeight }} />
          </div>
        </div>
      </div>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Drag to pan, scroll to zoom.
      </Typography.Text>
    </Flex>
  );
}

function IconButton({ title, icon, onClick }: { title: string; icon: ReactNode; onClick: () => void }) {
  return (
    <Tooltip title={title}>
      <Button icon={icon} onClick={onClick} aria-label={title} />
    </Tooltip>
  );
}
