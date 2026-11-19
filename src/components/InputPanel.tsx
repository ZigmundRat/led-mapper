import { LinkOutlined } from "@ant-design/icons";
import { Alert, Button, Flex, Input, Tabs, Typography } from "antd";
import type { ReactNode } from "react";
import { createShareLink } from "../lib/links";
import type { InputSource, Led, Point } from "../lib/types";
import { CopyButton, codeTextAreaStyle, ExternalLink, useCopy } from "./common";
import { ImageInput } from "./ImageInput";

export type InputTab = InputSource | "image";

const SHEETS = <ExternalLink href="https://sheets.google.com">Google Sheets</ExternalLink>;

const descriptions: Record<InputSource, ReactNode> = {
  layout: (
    <>
      Paste an LED layout copied from {SHEETS} or another spreadsheet, in tab-delimited text, with a unique LED index in each cell. LED
      indices should start at zero. Cells without an LED should be empty.
    </>
  ),
  coordinates: (
    <>
      Paste coordinates copied from {SHEETS} or another spreadsheet, in tab-delimited text (or CSV). It should have three columns: index,
      x, and y, with or without column headers.
    </>
  ),
  pixelblaze: (
    <>
      Paste the map from your <ExternalLink href="https://www.bhencke.com/mapping-in-pixelblaze">Pixelblaze</ExternalLink> Mapper tab or{" "}
      <ExternalLink href="http://app.bhencke.com/pixelmap.html">image mapper</ExternalLink>, in JSON: one <code>[x, y]</code> array per
      LED, all in an array: <code>[[x1, y1], [x2, y2], …]</code>. Whitespace doesn&apos;t matter.
    </>
  ),
};

const labels: Record<InputTab, string> = { layout: "Layout", coordinates: "Coordinates", pixelblaze: "Pixelblaze Map", image: "Image" };

interface Props {
  tab: InputTab;
  onTabChange: (tab: InputTab) => void;
  texts: Record<InputSource, string>;
  onTextChange: (source: InputSource, text: string) => void;
  /** Problems with the selected input. */
  errors: readonly string[];
  image: {
    points: readonly Led[];
    fontSize: number;
    onLoad: () => void;
    onAddPoint: (point: Point) => void;
    onUndo: () => void;
    onClear: () => void;
  };
}

export function InputPanel({ tab, onTabChange, texts, onTextChange, errors, image }: Props) {
  const copy = useCopy();

  const textInput = (source: InputSource) => (
    <Flex vertical gap={8}>
      <Typography.Text type="secondary">{descriptions[source]}</Typography.Text>
      <Input.TextArea
        aria-label={labels[source]}
        value={texts[source]}
        onChange={(e) => onTextChange(source, e.target.value)}
        rows={source === "pixelblaze" ? 6 : 9}
        wrap="off"
        spellCheck={false}
        style={codeTextAreaStyle}
      />
      <Flex gap={8} wrap>
        <CopyButton text={texts[source]} />
        <Button icon={<LinkOutlined />} onClick={() => copy(createShareLink(source, texts[source]), `${labels[source]} link copied`)}>
          Copy link
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <Flex vertical gap={12}>
      <Typography.Text type="secondary">Choose an input method and follow its instructions. The selected tab is the map&apos;s input.</Typography.Text>
      <Tabs
        type="card"
        activeKey={tab}
        onChange={(key) => onTabChange(key as InputTab)}
        items={[
          { key: "layout", label: labels.layout, children: textInput("layout") },
          { key: "coordinates", label: labels.coordinates, children: textInput("coordinates") },
          { key: "pixelblaze", label: labels.pixelblaze, children: textInput("pixelblaze") },
          { key: "image", label: labels.image, children: <ImageInput {...image} /> },
        ]}
      />
      {errors.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={errors.length === 1 ? errors[0] : `${errors.length} problems with the ${labels[tab].toLowerCase()}`}
          description={errors.length > 1 && <ul style={{ margin: 0, paddingInlineStart: 20 }}>{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        />
      )}
    </Flex>
  );
}
