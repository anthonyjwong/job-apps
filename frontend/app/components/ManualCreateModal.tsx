"use client";
import React from 'react';
import { ManualCreateState } from '../hooks/useManualCreateForm';
import { Theme } from '../types/dashboard';

export type ManualCreateModalProps = {
  show: boolean;
  onClose: () => void;
  form: ManualCreateState;
  onSubmit: () => void;
  darkMode: boolean;
  theme: Theme;
  muted: string;
};

export function ManualCreateModal(props: ManualCreateModalProps) {
  const { show, onClose, form, onSubmit, darkMode, theme, muted } = props;
  const {
    manualUseDetails,
    setManualUseDetails,
    manualJobId,
    setManualJobId,
    manualUrl,
    setManualUrl,
    manualSubmitted,
    setManualSubmitted,
    manualJobTitle,
    setManualJobTitle,
    manualJobCompany,
    setManualJobCompany,
    manualJobLocation,
    setManualJobLocation,
    manualJobType,
    setManualJobType,
    manualJobUrl,
    setManualJobUrl,
    manualMinSalary,
    setManualMinSalary,
    manualMaxSalary,
    setManualMaxSalary,
    manualDatePosted,
    setManualDatePosted,
    creating,
  } = form;

  React.useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create application manually"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: 16,
          background: theme.appBg,
          minWidth: 520,
          maxWidth: '90vw',
          boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Add application</h3>
          <button
            onClick={onClose}
            style={{ all: 'unset', cursor: 'pointer', color: muted }}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: muted }}>
            {manualUseDetails ? 'Enter minimal job details' : 'Use an existing Job ID'}
          </div>
          <button
            onClick={() => setManualUseDetails(!manualUseDetails)}
            style={{ all: 'unset', color: theme.link, cursor: 'pointer' }}
          >
            {manualUseDetails ? 'Add from existing job ID' : 'Add from new job'}
          </button>
        </div>
        {!manualUseDetails ? (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: muted }}>Required</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                placeholder="Job ID (UUID)"
                value={manualJobId}
                onChange={(e) => setManualJobId(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
              <input
                placeholder="Application URL (required)"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginTop: 6 }}>Optional</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.text }} title="Mark as already submitted">
              <input type="checkbox" checked={manualSubmitted} onChange={(e) => setManualSubmitted(e.target.checked)} />
              Submitted
            </label>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: muted }}>Required</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                placeholder="Job title (required)"
                value={manualJobTitle}
                onChange={(e) => setManualJobTitle(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
              <input
                placeholder="Company (required)"
                value={manualJobCompany}
                onChange={(e) => setManualJobCompany(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
              <input
                placeholder="Location (required)"
                value={manualJobLocation}
                onChange={(e) => setManualJobLocation(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
              <input
                placeholder="Job URL (required)"
                value={manualJobUrl}
                onChange={(e) => setManualJobUrl(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: muted, marginTop: 6 }}>Optional</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                placeholder="Job type (e.g., fulltime)"
                value={manualJobType}
                onChange={(e) => setManualJobType(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
              <input
                placeholder="Min salary (optional)"
                value={manualMinSalary}
                onChange={(e) => setManualMinSalary(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
              <input
                placeholder="Max salary (optional)"
                value={manualMaxSalary}
                onChange={(e) => setManualMaxSalary(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
              <input
                type="date"
                placeholder="Date posted (YYYY-MM-DD)"
                value={manualDatePosted}
                onChange={(e) => setManualDatePosted(e.target.value)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: `1px solid ${theme.border}`,
                  background: darkMode ? '#1d1d20' : '#fff',
                  color: theme.text,
                }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.text }} title="Mark as already submitted">
              <input type="checkbox" checked={manualSubmitted} onChange={(e) => setManualSubmitted(e.target.checked)} />
              Submitted
            </label>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={onClose}
            disabled={creating}
            style={{
              all: 'unset',
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              color: muted,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={creating}
            style={{
              all: 'unset',
              padding: '8px 12px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: darkMode ? '#2563eb' : '#3b82f6',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ManualCreateModal;