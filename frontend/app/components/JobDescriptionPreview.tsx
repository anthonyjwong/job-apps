"use client";
import React from 'react';

export interface JobDescriptionPreviewProps {
  markdown: string;
  darkMode: boolean;
  theme: { link: string; border: string; text: string; appBg: string } & Record<string, any>;
  onOpen: (markdown: string) => void;
  previewLength?: number;
}

function makePreview(md: string, n: number) {
  const text = md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[*_>#\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > n ? text.slice(0, n) + '…' : text;
}

const JobDescriptionPreview: React.FC<JobDescriptionPreviewProps> = ({ markdown, darkMode, theme, onOpen, previewLength = 280 }) => {
  if (!markdown) return null;
  const snippet = makePreview(markdown, previewLength);
  const truncated = snippet.endsWith('…');
  return (
    <div style={{ marginTop: 8 }}>
      <p style={{ margin: '8px 0', color: theme.text, lineHeight: 1.5 }}>{snippet}</p>
      {truncated && (
        <button
          type="button"
          onClick={() => onOpen(markdown)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
            background: theme.appBg,
            color: theme.link,
            cursor: 'pointer',
          }}
        >
          Open details
        </button>
      )}
    </div>
  );
};

export default JobDescriptionPreview;
