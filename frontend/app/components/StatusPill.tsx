"use client";
import React from 'react';
import { AppliedApp, AppStateName, Theme } from '../types/dashboard';

export interface StatusPillProps {
  app: AppliedApp;
  darkMode: boolean;
  theme: Theme;
  muted: string;
  editingStatusFor: string | null;
  savingAppId: string | null;
  setEditingStatusFor: (id: string | null) => void;
  updateAppState: (appId: string, next: AppStateName) => void;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  app,
  darkMode,
  theme,
  muted,
  editingStatusFor,
  savingAppId,
  setEditingStatusFor,
  updateAppState,
}) => {
  let status: string = 'Submitted';
  if (app.rejected) status = 'Rejected';
  else if (app.interview) status = 'Interview';
  else if (app.assessment) status = 'Assessment';
  else if (app.acknowledged) status = 'Acknowledged';

  let color = darkMode ? '#6b7280' : '#9ca3af';
  let bg = darkMode ? '#1f2937' : '#f3f4f6';
  let border = darkMode ? '#374151' : '#e5e7eb';
  if (status === 'Rejected') {
    color = darkMode ? '#b91c1c' : '#ef4444';
    bg = darkMode ? '#3f1d1d' : '#fee2e2';
    border = darkMode ? '#7f1d1d' : '#fecaca';
  } else if (status === 'Acknowledged') {
    color = darkMode ? '#2563eb' : '#3b82f6';
    bg = darkMode ? '#1e3a8a' : '#dbeafe';
    border = darkMode ? '#1d4ed8' : '#bfdbfe';
  } else if (status === 'Assessment') {
    color = darkMode ? '#f59e42' : '#b45309';
    bg = darkMode ? '#78350f' : '#fef3c7';
    border = darkMode ? '#b45309' : '#fde68a';
  } else if (status === 'Interview') {
    color = darkMode ? '#10b981' : '#047857';
    bg = darkMode ? '#064e3b' : '#d1fae5';
    border = darkMode ? '#047857' : '#6ee7b7';
  }

  const isEditing = editingStatusFor === app.app_id;
  const isSaving = savingAppId === app.app_id;

  const pillStyle: React.CSSProperties = {
    alignSelf: 'center',
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 999,
    background: bg,
    color,
    border: `1px solid ${border}`,
    cursor: isSaving ? 'progress' : 'pointer',
    userSelect: 'none',
  };

  if (!isEditing) {
    return (
      <span
        onClick={() => !isSaving && setEditingStatusFor(app.app_id)}
        title="Click to change status"
        style={pillStyle}
      >
        {status}
      </span>
    );
  }

  const optionStyle = (active: boolean, col: string, bgc: string, bdc: string): React.CSSProperties => ({
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 999,
    background: bgc,
    color: col,
    border: `1px solid ${bdc}`,
    opacity: isSaving && !active ? 0.6 : 1,
    cursor: isSaving ? 'progress' : 'pointer',
  });

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {(['Submitted','Acknowledged','Assessment','Interview','Rejected'] as const).map(lbl => {
        const map: Record<string, AppStateName> = {
          Submitted: 'submitted',
          Acknowledged: 'acknowledged',
          Assessment: 'assessment',
          Interview: 'interview',
          Rejected: 'rejected',
        };
        const styles: Record<string, [string,string,string]> = {
          Submitted: [ (darkMode ? '#6b7280' : '#111827'), (darkMode ? '#1f2937' : '#f3f4f6'), (darkMode ? '#374151' : '#e5e7eb')],
          Acknowledged: [ (darkMode ? '#2563eb' : '#1d4ed8'), (darkMode ? '#1e3a8a' : '#dbeafe'), (darkMode ? '#1d4ed8' : '#bfdbfe')],
          Assessment: [ (darkMode ? '#f59e42' : '#b45309'), (darkMode ? '#78350f' : '#fef3c7'), (darkMode ? '#b45309' : '#fde68a')],
          Interview: [ (darkMode ? '#10b981' : '#047857'), (darkMode ? '#064e3b' : '#d1fae5'), (darkMode ? '#047857' : '#6ee7b7')],
          Rejected: [ (darkMode ? '#b91c1c' : '#991b1b'), (darkMode ? '#3f1d1d' : '#fee2e2'), (darkMode ? '#7f1d1d' : '#fecaca')],
        };
        const [c,bgC,bdC] = styles[lbl];
        return (
          <button
            key={lbl}
            disabled={isSaving}
            onClick={() => updateAppState(app.app_id, map[lbl])}
            style={{ all: 'unset', ...optionStyle(status === lbl, c, bgC, bdC) }}
          >
            {lbl}
          </button>
        );
      })}
      <button
        disabled={isSaving}
        onClick={() => setEditingStatusFor(null)}
        style={{
          all: 'unset',
          color: muted,
          border: `1px solid ${theme.border}`,
          borderRadius: 999,
          padding: '2px 8px',
        }}
      >
        Cancel
      </button>
    </div>
  );
};

export default StatusPill;