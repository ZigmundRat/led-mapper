import { ClearOutlined, PictureOutlined, UndoOutlined } from "@ant-design/icons";
import { App, Button, Flex, Tooltip, Typography, Upload } from "antd";
import { type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from "react";
import { useElementWidth } from "../hooks/useElementWidth";
import type { Led, Point } from "../lib/types";
import { colors } from "../theme";

interface LoadedImage {
  element: HTMLImageElement;
  url: string;
  name: string;
}

interface Props {
  /** The marked LEDs, in image pixels. */
  points: readonly Led[];
  fontSize: number;
  onLoad: () => void;
  onAddPoint: (point: Point) => void;
  onUndo: () => void;
  onClear: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** Click on a photo of your LEDs, in wiring order, to build a Pixelblaze map. */
export function ImageInput({ points, fontSize, onLoad, onAddPoint, onUndo, onClear }: Props) {
  const { message } = App.useApp();
  const [image, setImage] = useState<LoadedImage>();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const width = useElementWidth(containerRef);

  useEffect(() => (image ? () => URL.revokeObjectURL(image.url) : undefined), [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !image || width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const { naturalWidth, naturalHeight } = image.element;
    // Canvas pixels per image pixel.
    const scale = (width * dpr) / naturalWidth;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(naturalHeight * scale);

    context.imageSmoothingEnabled = naturalWidth > 255 || naturalHeight > 255;
    context.globalCompositeOperation = "source-over";
    context.drawImage(image.element, 0, 0, canvas.width, canvas.height);

    const size = fontSize * dpr;
    context.font = `${size}px monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = size / 36;

    points.forEach((point, i) => {
      const x = point.x * scale + scale / 2;
      const y = point.y * scale + scale / 2;
      context.globalCompositeOperation = "difference";
      context.fillText(String(i), x, y);
      if (size >= 18) {
        context.globalCompositeOperation = "source-over";
        context.strokeText(String(i), x, y);
      }
    });
  }, [image, width, points, fontSize]);

  const load = (file: File) => {
    if (!file.type.startsWith("image/")) {
      void message.error(`${file.name} isn't an image.`);
      return;
    }
    const url = URL.createObjectURL(file);
    const element = new Image();
    element.onload = () => {
      setImage({ element, url, name: file.name });
      onLoad();
    };
    element.onerror = () => {
      URL.revokeObjectURL(url);
      void message.error(`Couldn't open ${file.name}.`);
    };
    element.src = url;
  };

  const onClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    onAddPoint({
      x: Math.floor(((event.clientX - bounds.left) / bounds.width) * image.element.naturalWidth),
      y: Math.floor(((event.clientY - bounds.top) / bounds.height) * image.element.naturalHeight),
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === "Backspace" || event.key === "Delete" || (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey))) {
      event.preventDefault();
      onUndo();
    }
  };

  const undoKey = isMac ? "⌘Z" : "Ctrl+Z";

  return (
    <Flex vertical gap={8}>
      <Typography.Text type="secondary">
        Choose an image or photo of your LEDs, then click each LED in the order it&apos;s wired. The Pixelblaze Map tab is updated as you
        go. Undo with Backspace or {undoKey}.
      </Typography.Text>
      <Flex gap={8} wrap align="center">
        <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => (load(file), false)}>
          <Button icon={<PictureOutlined />}>{image ? "Change image" : "Choose image"}</Button>
        </Upload>
        <Tooltip title={`Undo (Backspace or ${undoKey})`}>
          <Button icon={<UndoOutlined />} onClick={onUndo} disabled={!image || points.length === 0} aria-label="Undo" />
        </Tooltip>
        <Tooltip title="Remove all marked LEDs">
          <Button icon={<ClearOutlined />} onClick={onClear} disabled={!image || points.length === 0} aria-label="Clear" />
        </Tooltip>
        {image && (
          <Typography.Text type="secondary" ellipsis style={{ minWidth: 0, flex: 1 }}>
            {image.name} · {image.element.naturalWidth}×{image.element.naturalHeight} · {points.length} LEDs marked
          </Typography.Text>
        )}
      </Flex>
      <div ref={containerRef} style={{ width: "100%" }}>
        {image ? (
          <canvas
            ref={canvasRef}
            tabIndex={0}
            onClick={onClick}
            onKeyDown={onKeyDown}
            aria-label="Image: click each LED in wiring order"
            style={{ display: "block", width: "100%", cursor: "crosshair", borderRadius: 6, outlineColor: colors.accent }}
          />
        ) : (
          <Upload.Dragger accept="image/*" showUploadList={false} beforeUpload={(file) => (load(file), false)}>
            <p className="ant-upload-drag-icon">
              <PictureOutlined />
            </p>
            <p className="ant-upload-text">Click or drag an image here</p>
            <p className="ant-upload-hint">It stays in your browser; nothing is uploaded.</p>
          </Upload.Dragger>
        )}
      </div>
    </Flex>
  );
}
