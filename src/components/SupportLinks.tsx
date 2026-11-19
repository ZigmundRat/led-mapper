import { GithubOutlined, HeartOutlined } from "@ant-design/icons";
import { Button, Space, Typography } from "antd";
import { DONATE_URL, REPO_URL } from "../lib/support";

/** The support message followed by Donate / Star on GitHub buttons. */
export function SupportLinks() {
  return (
    <Space wrap size="small" align="center" style={{ justifyContent: "center" }}>
      <Typography.Text type="secondary">LED Mapper is free and open source. If it&apos;s useful to you, please consider supporting its development.</Typography.Text>
      <Space.Compact>
        <Button size="small" icon={<HeartOutlined />} href={DONATE_URL} target="_blank" rel="noopener noreferrer">
          Donate
        </Button>
        <Button size="small" icon={<GithubOutlined />} href={REPO_URL} target="_blank" rel="noopener noreferrer">
          Star on GitHub
        </Button>
      </Space.Compact>
    </Space>
  );
}
