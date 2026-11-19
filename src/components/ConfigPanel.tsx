import { DeleteOutlined, PlusOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Checkbox, Flex, InputNumber, Statistic, Tooltip, Typography } from "antd";
import type { Arrangement } from "../lib/arrange";
import type { Bounds, Point } from "../lib/types";
import { colors } from "../theme";

interface Props {
  ledCount: number;
  bounds: Bounds;
  center: Point;
  /** Whether the center was set by hand (otherwise it follows the map's size). */
  centerIsCustom: boolean;
  onCenterChange: (center: Point | undefined) => void;
  arrangement: Arrangement;
  onArrangementChange: (arrangement: Arrangement) => void;
  onAddClone: () => void;
}

const round = (n: number) => +n.toFixed(3);

export function ConfigPanel({ ledCount, bounds, center, centerIsCustom, onCenterChange, arrangement, onArrangementChange, onAddClone }: Props) {
  const { sets } = arrangement;

  const setOffset = (index: number, change: Partial<Point>) =>
    onArrangementChange({ ...arrangement, sets: sets.map((offset, i) => (i === index ? { ...offset, ...change } : offset)) });

  return (
    <Flex vertical gap={20}>
      <Flex gap={32} wrap>
        <Statistic title="LEDs" value={ledCount} />
        <Statistic title="Width" value={round(bounds.width)} />
        <Statistic title="Height" value={round(bounds.height)} />
      </Flex>

      <section>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Center
        </Typography.Title>
        <Typography.Paragraph type="secondary">The point that angles and radii are measured from. Adjust it if needed.</Typography.Paragraph>
        <Flex gap={8} wrap align="center">
          <InputNumber prefix="X" step={0.5} value={center.x} onChange={(x) => x !== null && onCenterChange({ ...center, x })} style={{ width: 130 }} />
          <InputNumber prefix="Y" step={0.5} value={center.y} onChange={(y) => y !== null && onCenterChange({ ...center, y })} style={{ width: 130 }} />
          <Tooltip title="Back to the middle of the map">
            <Button icon={<UndoOutlined />} disabled={!centerIsCustom} onClick={() => onCenterChange(undefined)}>
              Default
            </Button>
          </Tooltip>
        </Flex>
      </section>

      <section>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Flip
        </Typography.Title>
        <Flex gap={16}>
          <Checkbox checked={arrangement.flipX} onChange={(e) => onArrangementChange({ ...arrangement, flipX: e.target.checked })}>
            Flip X
          </Checkbox>
          <Checkbox checked={arrangement.flipY} onChange={(e) => onArrangementChange({ ...arrangement, flipY: e.target.checked })}>
            Flip Y
          </Checkbox>
        </Flex>
      </section>

      <section>
        <Typography.Title level={5} style={{ marginTop: 0 }}>
          Clones
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Repeat the input&apos;s LEDs, wired one set after another (for example, identical panels chained together). Each set is offset by its X
          and Y.
        </Typography.Paragraph>
        <Flex vertical gap={8}>
          {sets.length > 1 &&
            sets.map((offset, i) => (
              <Flex key={i} gap={8} wrap align="center">
                <Typography.Text style={{ width: 150, color: colors.textSecondary }}>
                  Set {i} <Typography.Text type="secondary">(LEDs {i * (ledCount / sets.length)}–{(i + 1) * (ledCount / sets.length) - 1})</Typography.Text>
                </Typography.Text>
                <InputNumber prefix="X" step={0.1} value={offset.x} onChange={(x) => x !== null && setOffset(i, { x })} style={{ width: 130 }} />
                <InputNumber prefix="Y" step={0.1} value={offset.y} onChange={(y) => y !== null && setOffset(i, { y })} style={{ width: 130 }} />
              </Flex>
            ))}
          <Flex gap={8}>
            <Button icon={<PlusOutlined />} onClick={onAddClone} disabled={ledCount === 0}>
              Clone
            </Button>
            <Button icon={<DeleteOutlined />} disabled={sets.length < 2} onClick={() => onArrangementChange({ ...arrangement, sets: sets.slice(0, -1) })}>
              Remove last clone
            </Button>
          </Flex>
        </Flex>
      </section>
    </Flex>
  );
}
