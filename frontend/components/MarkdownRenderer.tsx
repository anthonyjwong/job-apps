"use client";
import React, { useMemo, useState } from 'react';
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
    collapsible?: boolean;
    previewCharLimit?: number; // number of raw characters for preview
    previewLinesApprox?: number; // soft guidance for future refinement
};

function buildPreview(markdown: string, limit: number): string {
    if (markdown.length <= limit) return markdown;
    let slice = markdown.slice(0, limit);

    const openFence = (slice.match(/```/g) || []).length % 2 === 1;
    if (openFence) {
        const lastFence = slice.lastIndexOf('```');
        if (lastFence > -1) slice = slice.slice(0, lastFence);
    }

    // avoid cutting off in middle of word
    const lastSpace = slice.lastIndexOf(' ');
    if (lastSpace > -1) slice = slice.slice(0, lastSpace);

    return slice.trimEnd() + '…';
}

export default function MarkdownRenderer({
    markdown,
    theme,
    darkMode,
    collapsible = false,
    previewCharLimit = 260,
}: MarkdownRendererProps) {
    const [expanded, setExpanded] = useState(false);
    const isLong = collapsible && markdown.length > previewCharLimit;
    const contentToRender = useMemo(
        () => (isLong && !expanded ? buildPreview(markdown, previewCharLimit) : markdown),
        [markdown, isLong, expanded, previewCharLimit]
    );

    return (
        <div>
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
                a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
                    <a style={{ color: theme.link, textDecoration: 'underline' }} target="_blank" rel="noreferrer" {...props} />
                ),
                p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p style={{ margin: '8px 0' }} {...props} />,
                ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul style={{ paddingLeft: 18, margin: '8px 0' }} {...props} />,
                ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => <ol style={{ paddingLeft: 18, margin: '8px 0' }} {...props} />,
                li: (props: React.LiHTMLAttributes<HTMLLIElement>) => <li style={{ margin: '4px 0' }} {...props} />,
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
                blockquote: (props: React.BlockquoteHTMLAttributes<HTMLElement>) => (
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
            {contentToRender}
        </ReactMarkdown>
        {isLong && (
            <button
                type="button"
                onClick={() => setExpanded(e => !e)}
                style={{
                    marginTop: 4,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--primary)',
                    background: 'transparent',
                    cursor: 'pointer'
                }}
            >
                {expanded ? 'Show less' : 'Show more'}
            </button>
        )}
        </div>
    );
}
