import { Flex, Tabs, Typography } from "antd";
import { REPO_URL } from "../lib/support";
import { CodeBlock, CopyButton, ExternalLink } from "./common";

export function OutputPanel({ fastLedCode, pixelblazeMap }: { fastLedCode: string; pixelblazeMap: string }) {
  return (
    <Tabs
      type="card"
      items={[
        {
          key: "fastled",
          label: "FastLED",
          children: (
            <Flex vertical gap={8}>
              <Typography.Text type="secondary">
                Copy and paste this into your <ExternalLink href="https://www.arduino.cc/en/software">Arduino</ExternalLink> sketch for{" "}
                <ExternalLink href="https://github.com/FastLED/FastLED">FastLED</ExternalLink>. Here&apos;s an{" "}
                <ExternalLink href={`${REPO_URL}/blob/main/fastled-map-demo/fastled-map-demo.ino`}>example sketch</ExternalLink>.
              </Typography.Text>
              <CodeBlock>{fastLedCode}</CodeBlock>
              <div>
                <CopyButton text={fastLedCode} />
              </div>
            </Flex>
          ),
        },
        {
          key: "pixelblaze",
          label: "Pixelblaze",
          children: (
            <Flex vertical gap={8}>
              <Typography.Text type="secondary">
                Copy and paste this into your <ExternalLink href="https://www.bhencke.com/mapping-in-pixelblaze">Pixelblaze</ExternalLink> Mapper
                tab.
              </Typography.Text>
              <CodeBlock>{pixelblazeMap}</CodeBlock>
              <div>
                <CopyButton text={pixelblazeMap} />
              </div>
            </Flex>
          ),
        },
      ]}
    />
  );
}
