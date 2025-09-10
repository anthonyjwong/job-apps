"use client";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

// Minimal JobRecord shape (mirrors jobs page). Optional fields for reusability.
export type JobRecord = {
  id: string;
  title: string;
  company: string;
  jobspy_id?: string; // optional to align with page type
  location?: string | null;
  min_salary?: number | null;
  max_salary?: number | null;
  date_posted?: string | null;
  job_type?: string | null;
  linkedin_job_url?: string | null;
  direct_job_url?: string | null;
  description?: string | null;
  review?: { classification?: 'safety' | 'target' | 'reach' | 'dream' | null } | null;
  approved?: boolean;
  discarded?: boolean;
};

type ThemeShape = {
  link: string; border: string; muted: string; text: string; appBg: string;
  // Allow extra theme properties without forcing callers to widen type.
  [k: string]: string | number | boolean | undefined;
};

type BaseShared = {
  theme: ThemeShape;
  darkMode: boolean;
};

type MarkdownOnlyProps = BaseShared & {
  markdown: string;
  previewLength?: number;
  onExpand?: (full: string) => void;
  expandLabel?: string;
  showExpandButton?: boolean;
  job?: undefined;
  onApprove?: never;
  onDiscard?: never;
};

type JobModeProps = BaseShared & {
  job: JobRecord;
  onApprove?: (job: JobRecord) => void | Promise<void>;
  onDiscard?: (job: JobRecord) => void | Promise<void>;
  onClassificationChange?: (jobId: string, newClassification: 'safety' | 'target' | 'reach' | 'dream') => void | Promise<void>;
  // previewLength governs description snippet; full markdown shown in internal modal on expand
  previewLength?: number;
  expandLabel?: string;
  showExpandButton?: boolean;
  markdown?: undefined; // derive from job.description
  onExpand?: never; // internal handling
};

export type JobPreviewCardProps = MarkdownOnlyProps | JobModeProps;

// Previously MarkdownRenderer – renamed to JobPreviewCard for semantic clarity.
export default function JobPreviewCard(props: JobPreviewCardProps) {
  const { darkMode, theme } = props;
  const expandLabel = props.expandLabel || 'Open details';
  const previewLength = props.previewLength ?? 0;

  // Mode detection
  const isJobMode = 'job' in props && !!props.job;
  const description = isJobMode ? (props.job.description || '') : (props.markdown || '');

  const [showFull, setShowFull] = useState(false);
  useEffect(() => {
    if (!showFull) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowFull(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showFull]);

  // Build plain text preview
  const makePreview = (md: string) => md
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '$1')
    .replace(/[*_>#\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const plain = makePreview(description);
  const truncated = previewLength > 0 && plain.length > previewLength;
  const snippet = truncated ? plain.slice(0, previewLength) + '…' : plain;

  // Classification badge (job mode only)
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);
  const [localCls, setLocalCls] = useState<('safety' | 'target' | 'reach' | 'dream' | null)>(
    isJobMode ? (props.job.review?.classification ?? null) : null
  );
  useEffect(() => {
    if (isJobMode) {
      setLocalCls(props.job.review?.classification ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJobMode ? props.job.id : undefined, isJobMode ? props.job.review?.classification : undefined]);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[data-classification-menu]')) {
        setMenuOpen(null);
      }
    };
    const onWin = () => {
      if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect();
        setAnchor({ top: r.bottom + 6, left: r.left, width: r.width });
      }
    };
    document.addEventListener('click', onDocClick);
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    onWin();
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);

  const classificationBadge = () => {
    if (!isJobMode) return null;
  const c = localCls;
    if (!c) return null;
    const palette: Record<string, { bg: string; text: string; border: string }> = {
      safety: { bg: darkMode ? '#134e4a' : '#dcfce7', text: darkMode ? '#a7f3d0' : '#065f46', border: darkMode ? '#115e59' : '#86efac' },
      target: { bg: darkMode ? '#1e3a8a' : '#dbeafe', text: darkMode ? '#93c5fd' : '#1e40af', border: darkMode ? '#1d4ed8' : '#93c5fd' },
      reach: { bg: darkMode ? '#7c2d12' : '#ffedd5', text: darkMode ? '#fdba74' : '#9a3412', border: darkMode ? '#9a3412' : '#fdba74' },
      dream: { bg: darkMode ? '#4c1d95' : '#f3e8ff', text: darkMode ? '#d8b4fe' : '#6b21a8', border: darkMode ? '#6b21a8' : '#d8b4fe' },
    } as const;
    const colors = palette[c];
    if (!colors) return null;
    const label = c.charAt(0).toUpperCase() + c.slice(1);
    const changeClassification = async (newCls: 'safety' | 'target' | 'reach' | 'dream') => {
      const prev = localCls;
      setLocalCls(newCls); // optimistic update
      try {
        const res = await fetch(`http://localhost:8000/job/${props.job.id}/classification`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classification: newCls })
        });
        if (!res.ok) {
          const t = await res.text();
          alert(`Failed to update classification: ${t}`);
          setLocalCls(prev); // revert
          return;
        }
        setMenuOpen(null);
        await (props as JobModeProps).onClassificationChange?.(props.job.id, newCls);
      } catch (e) {
        alert(`Network error updating classification: ${e instanceof Error ? e.message : 'unknown'}`);
        setLocalCls(prev); // revert
      }
    };

    return (
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          aria-label={`Classification ${label} (click to change)`}
          title={`Classification: ${label} (click to change)`}
          ref={triggerRef}
          onClick={(e) => {
            e.stopPropagation();
            if (menuOpen === props.job.id) {
              setMenuOpen(null);
            } else {
              if (triggerRef.current) {
                const r = triggerRef.current.getBoundingClientRect();
                setAnchor({ top: r.bottom + 6, left: r.left, width: r.width });
              }
              setMenuOpen(props.job.id);
            }
          }}
          style={{
            display: 'inline-block', fontSize: 12, padding: '2px 8px', borderRadius: 999,
            background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
            lineHeight: 1.6, whiteSpace: 'nowrap', cursor: 'pointer'
          }}
        >{label} ▾</button>
        {menuOpen === props.job.id && anchor && createPortal(
          (
            <div
              data-classification-menu
              role="menu"
              style={{
                position: 'fixed',
                top: Math.min(anchor.top, window.innerHeight - 180),
                left: Math.min(anchor.left, window.innerWidth - 220),
                zIndex: 9999,
                background: theme.appBg,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                minWidth: 180,
                overflow: 'hidden'
              }}
            >
              {(['safety','target','reach','dream'] as const).map((opt, idx, arr) => (
                <button
                  key={opt}
                  role="menuitemradio"
                  aria-checked={c === opt}
                  onClick={(e) => { e.stopPropagation(); void changeClassification(opt); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    background: c === opt ? (darkMode ? '#0b1220' : '#eef2ff') : theme.appBg,
                    color: theme.text, border: 'none', cursor: 'pointer',
                    borderBottom: idx < arr.length - 1 ? `1px solid ${theme.border}` : 'none'
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: c === opt ? (darkMode ? '#93c5fd' : '#1e40af') : 'transparent', display: 'inline-block' }} />
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          ),
          document.body
        )}
      </span>
    );
  };

  const renderMarkdown = (md: string) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: (p) => <a style={{ color: theme.link, textDecoration: 'underline' }} target="_blank" rel="noreferrer" {...p} />,
        p: (p) => <p style={{ margin: '8px 0' }} {...p} />,
        ul: (p) => <ul style={{ paddingLeft: 18, margin: '8px 0' }} {...p} />,
        ol: (p) => <ol style={{ paddingLeft: 18, margin: '8px 0' }} {...p} />,
        li: (p) => <li style={{ margin: '4px 0' }} {...p} />,
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
        blockquote: (p) => (
          <blockquote
            style={{ borderLeft: `3px solid ${theme.border}`, paddingLeft: 10, margin: '8px 0', color: theme.muted }}
            {...p}
          />
        ),
      }}
    >{md}</ReactMarkdown>
  );

  if (!isJobMode) {
    // markdown-only mode for legacy usages
    if (previewLength && previewLength > 0) {
      return (
        <div style={{ lineHeight: 1.5 }}>
          <p style={{ margin: '8px 0', color: theme.text }}>{snippet || '(No description provided)'}</p>
          {truncated && (props.showExpandButton !== false) && (
            <button
              type="button"
              onClick={() => props.onExpand?.(props.markdown!)}
              style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.appBg, color: theme.link, cursor: 'pointer' }}
            >{expandLabel}</button>
          )}
        </div>
      );
    }
    return renderMarkdown(description);
  }

  const job = props.job;
  const bestLink = job.direct_job_url || job.linkedin_job_url || undefined;

  return (
    <article style={{
      border: `1px solid ${theme.border}`,
      borderRadius: 8,
      background: theme.appBg,
      padding: 12,
      opacity: job.discarded ? 0.6 : 1,
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      overflow: 'hidden', // contain any accidental overflow
      wordBreak: 'break-word',
      overflowWrap: 'anywhere',
    }}>
      <header style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {bestLink ? (
              <a href={bestLink} target="_blank" rel="noreferrer" style={{ color: theme.link, textDecoration: 'underline' }}>{job.title}</a>
            ) : (
              <span>{job.title}</span>
            )}
          </h3>
          <div style={{ color: theme.muted, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.company}{job.location ? ` • ${job.location}` : ''}{job.job_type ? ` • ${job.job_type}` : ''}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {classificationBadge()}
          </div>
        </div>
        {(props.onApprove || props.onDiscard) && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {props.onApprove && (
              <button
                onClick={() => props.onApprove?.(job)}
                title="Approve (create application)"
                aria-label={`Approve ${job.title}`}
                disabled={!!job.approved || job.discarded}
                style={{
                  padding: '6px 10px', borderRadius: 8, border: 'none',
                  background: darkMode ? '#166534' : '#22c55e', color: '#fff', cursor: (job.approved || job.discarded) ? 'not-allowed' : 'pointer'
                }}
              >✓</button>
            )}
            {props.onDiscard && (
              <button
                onClick={() => props.onDiscard?.(job)}
                title="Discard job"
                aria-label={`Discard ${job.title}`}
                disabled={!!job.discarded}
                style={{
                  padding: '6px 10px', borderRadius: 8, border: 'none',
                  background: darkMode ? '#7f1d1d' : '#ef4444', color: '#fff', cursor: job.discarded ? 'not-allowed' : 'pointer'
                }}
              >✕</button>
            )}
          </div>
        )}
      </header>
      {description ? (
        <div style={{ marginTop: 8 }}>
          <p style={{ margin: '8px 0', color: theme.text, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{snippet || '(No description provided)'}</p>
          {truncated && (
            <button
              type="button"
              onClick={() => setShowFull(true)}
              style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${theme.border}`, background: theme.appBg, color: theme.link, cursor: 'pointer' }}
            >{expandLabel}</button>
          )}
        </div>
      ) : (
        <p style={{ marginTop: 8, marginBottom: 0, color: theme.muted }}>(No description provided)</p>
      )}
      {showFull && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowFull(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: theme.appBg,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              width: 'min(900px, 92vw)',
              maxHeight: '82vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: `1px solid ${theme.border}` }}>
              <strong>Job Description</strong>
              <button
                aria-label="Close"
                onClick={() => setShowFull(false)}
                style={{ background: 'transparent', color: theme.text, border: 'none', fontSize: 20, lineHeight: 1, cursor: 'pointer' }}
              >×</button>
            </div>
            <div style={{ padding: 12, overflow: 'auto' }}>
              <div style={{ lineHeight: 1.6 }}>
                {renderMarkdown(description)}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
