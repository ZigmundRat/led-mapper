import { CopyOutlined } from "@ant-design/icons";
import { App, Button, type ButtonProps } from "antd";
import { type ReactNode, useCallback } from "react";
import { colors, monoFont } from "../theme";

/** Copies text, confirming with a toast. */
export function useCopy() {
  const { message } = App.useApp();
  return useCallback(
    (text: string, what = "Copied") => {
      navigator.clipboard.writeText(text).then(
        () => void message.success(`${what} to clipboard`),
        (error: unknown) => void message.error(`Couldn't copy: ${error instanceof Error ? error.message : String(error)}`)
      );
    },
    [message]
  );
}

export function CopyButton({ text, children = "Copy", ...props }: { text: string; children?: ReactNode } & ButtonProps) {
  const copy = useCopy();
  return (
    <Button icon={<CopyOutlined />} onClick={() => copy(text, "Copied")} {...props}>
      {children}
    </Button>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function CodeBlock({ children, maxHeight = 360 }: { children: ReactNode; maxHeight?: number }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        maxHeight,
        overflow: "auto",
        whiteSpace: "pre-wrap",
        overflowWrap: "anywhere",
        fontFamily: monoFont,
        fontSize: 12,
        lineHeight: 1.6,
        background: colors.page,
        border: `1px solid ${colors.grid}`,
        borderRadius: 6,
        color: colors.textSecondary,
      }}
    >
      {children}
    </pre>
  );
}

/** A textarea that keeps long rows on one line, for pasted spreadsheet data. */
export const codeTextAreaStyle = { fontFamily: monoFont, fontSize: 12, tabSize: 4, whiteSpace: "pre", overflowWrap: "normal", overflowX: "auto" } as const;
