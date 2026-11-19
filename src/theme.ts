import { theme, type ThemeConfig } from "antd";

/** Dark palette, shared with body / bsky-metrics / masto-metrics. */
export const colors = {
  page: "#0d0d0d",
  surface: "#1a1a19",
  elevated: "#232321",
  textPrimary: "#f0efec",
  textSecondary: "#c3c2b7",
  textMuted: "#898781",
  grid: "#2c2c2a",
  axis: "#383835",
  accent: "#3987e5",
  good: "#0ca30c",
  warning: "#fab219",
  critical: "#d03b3b",
} as const;

export const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

export const themeConfig: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: colors.accent,
    colorInfo: colors.accent,
    colorSuccess: colors.good,
    colorError: colors.critical,
    colorWarning: colors.warning,
    colorBgLayout: colors.page,
    colorBgContainer: colors.surface,
    colorBgElevated: colors.elevated,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextTertiary: colors.textMuted,
    colorBorder: colors.axis,
    colorBorderSecondary: colors.grid,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    fontFamilyCode: monoFont,
  },
  components: {
    Layout: { headerBg: colors.surface, bodyBg: colors.page, headerPadding: "0 16px" },
  },
};
