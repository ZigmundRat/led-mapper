import { GithubOutlined, HeartOutlined, YoutubeOutlined } from "@ant-design/icons";
import { App, Button, ConfigProvider, Dropdown, Flex, Layout, Tooltip } from "antd";
import blueskySvg from "bootstrap-icons/icons/bluesky.svg?raw";
import mastodonSvg from "bootstrap-icons/icons/mastodon.svg?raw";
import { type ReactNode, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { useIsMobile } from "../hooks/useMediaQuery";
import { DONATE_URL, REPO_URL } from "../lib/support";
import { colors, themeConfig } from "../theme";

/** Mounts the page with the dark theme. */
export function mount(page: ReactNode) {
  document.documentElement.style.colorScheme = "dark";
  document.body.style.background = colors.page;
  document.body.style.margin = "0";
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <ConfigProvider theme={themeConfig}>
        <App>{page}</App>
      </ConfigProvider>
    </StrictMode>
  );
}

/** A bundled Bootstrap Icons SVG, sized and colored like an antd icon. */
function SvgIcon({ svg }: { svg: string }) {
  return <span className="anticon" style={{ display: "inline-flex" }} dangerouslySetInnerHTML={{ __html: svg.replace(/ width="16" height="16"/, ' width="1em" height="1em"') }} />;
}

const links = [
  { href: "https://leds.social/@jasoncoon", title: "@jasoncoon on Mastodon", icon: <SvgIcon svg={mastodonSvg} /> },
  { href: "https://bsky.app/profile/evilgeniuslabs.org", title: "evilgeniuslabs.org on Bluesky", icon: <SvgIcon svg={blueskySvg} /> },
  { href: "https://www.youtube.com/jasoncoon", title: "YouTube", icon: <YoutubeOutlined /> },
  { href: REPO_URL, title: "Source code on GitHub", icon: <GithubOutlined /> },
];

const linkStyle = { color: colors.textSecondary } as const;

const supportItems = [
  {
    key: "donate",
    icon: <HeartOutlined />,
    label: (
      <a href={DONATE_URL} target="_blank" rel="noopener noreferrer">
        Donate
      </a>
    ),
  },
  {
    key: "github",
    icon: <GithubOutlined />,
    label: (
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
        Star on GitHub
      </a>
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const mobile = useIsMobile();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Header
        style={{ display: "flex", alignItems: "center", gap: 16, borderBottom: `1px solid ${colors.grid}`, position: "sticky", top: 0, zIndex: 10 }}
      >
        <a href="./" style={{ color: colors.textPrimary, fontWeight: 600, fontSize: 16, whiteSpace: "nowrap", flex: 1 }}>
          LED Mapper
        </a>
        {!mobile && (
          <span style={{ color: colors.textMuted, whiteSpace: "nowrap" }}>
            by Jason Coon of{" "}
            <a href="https://evilgeniuslabs.org" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Evil Genius Labs
            </a>
          </span>
        )}
        <Dropdown menu={{ items: supportItems }} placement="bottomRight">
          <Button type="text" icon={<HeartOutlined />} aria-label="Support LED Mapper" title="Support LED Mapper" style={{ color: colors.textSecondary, marginRight: -6 }} />
        </Dropdown>
        <Flex gap={14} style={{ fontSize: 18 }}>
          {links.map(({ href, title, icon }) => (
            <Tooltip key={href} title={title}>
              <a href={href} target="_blank" rel="noopener noreferrer" aria-label={title} style={{ ...linkStyle, display: "inline-flex" }}>
                {icon}
              </a>
            </Tooltip>
          ))}
        </Flex>
      </Layout.Header>
      <Layout.Content style={{ padding: mobile ? "12px 12px 32px" : "16px clamp(12px, 2vw, 24px) 48px", width: "100%" }}>{children}</Layout.Content>
    </Layout>
  );
}
