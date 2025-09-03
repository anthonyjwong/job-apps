"use client";
import React from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

export type MarkdownRendererProps = {
  markdown: string;
  theme: {
    link: string;
    border: string;
  muted: string;
  text: string;
  appBg: string;
  };
  darkMode: boolean;
};

export default function MarkdownRenderer({ markdown, theme, darkMode }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
  components={{
        a: (props) => (
          <a style={{ color: theme.link, textDecoration: 'underline' }} target="_blank" rel="noreferrer" {...props} />
        ),
        p: (props) => <p style={{ margin: '8px 0' }} {...props} />,
        ul: (props) => <ul style={{ paddingLeft: 18, margin: '8px 0' }} {...props} />,
        ol: (props) => <ol style={{ paddingLeft: 18, margin: '8px 0' }} {...props} />,
        li: (props) => <li style={{ margin: '4px 0' }} {...props} />,
        code: ((({ inline, ...rest }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => (
          <code
            style={{
              background: darkMode ? '#111827' : '#f3f4f6',
              border: `1px solid ${theme.border}`,
              borderRadius: 6,
              padding: inline ? '0 4px' : '8px',
              display: inline ? 'inline' : 'block',
              overflowX: 'auto',
            }}
            {...rest}
          />
        )) as unknown) as Components['code'],
        blockquote: (props) => (
          <blockquote
            style={{
              borderLeft: `3px solid ${theme.border}`,
              paddingLeft: 10,
              margin: '8px 0',
              color: theme.muted,
            }}
            {...props}
          />
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  );
}
