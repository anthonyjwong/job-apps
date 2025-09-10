"use client";
import React from 'react';
import { AppliedApp, AppStateName, Theme } from '../types/dashboard';
import StatusPill from './StatusPill';

export interface AppliedCompaniesListProps {
  apps: AppliedApp[];
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  darkMode: boolean;
  theme: Theme;
  muted: string;
  editingStatusFor: string | null;
  savingAppId: string | null;
  setEditingStatusFor: (id: string | null) => void;
  updateAppState: (appId: string, next: AppStateName) => void; // simplify for now
}

export const AppliedCompaniesList: React.FC<AppliedCompaniesListProps> = ({
  apps,
  expanded,
  setExpanded,
  darkMode,
  theme,
  muted,
  editingStatusFor,
  savingAppId,
  setEditingStatusFor,
  updateAppState,
}) => {
  const sortedApps = [...apps].sort((a, b) => (a.company || 'Unknown').localeCompare(b.company || 'Unknown'));
  const grouped: Record<string, AppliedApp[]> = sortedApps.reduce((acc, a) => {
    const key = a.company || 'Unknown';
    (acc[key] ||= []).push(a);
    return acc;
  }, {} as Record<string, AppliedApp[]>);
  const toggle = (company: string) => setExpanded(prev => ({ ...prev, [company]: !prev[company] }));

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {Object.entries(grouped).map(([company, items]) => {
        if (items.length <= 1) {
          const a = items[0];
          return (
            <li key={a.app_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: theme.text, whiteSpace: 'nowrap' }}>{company}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, overflow: 'hidden' }}>
                    <span style={{ color: muted, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '0 1 auto' }}>{a.title}</span>
                    {a.referred ? (
                      <span
                        title="Referred"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          lineHeight: 1,
                          color: theme.link,
                          border: `1px solid ${theme.border}`,
                          background: darkMode ? '#1f2937' : '#f3f4f6',
                          borderRadius: 999,
                          padding: '2px 6px',
                          whiteSpace: 'nowrap',
                          flex: 'none',
                        }}
                      >
                        ★ Referred
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <StatusPill
                app={a}
                darkMode={darkMode}
                theme={theme}
                muted={muted}
                editingStatusFor={editingStatusFor}
                savingAppId={savingAppId}
                setEditingStatusFor={setEditingStatusFor}
                updateAppState={updateAppState}
              />
            </li>
          );
        }
        const isOpen = !!expanded[company];
        return (
          <li key={company} style={{ borderBottom: `1px solid ${theme.border}` }}>
            <button
              onClick={() => toggle(company)}
              aria-expanded={isOpen}
              style={{
                all: 'unset',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '10px 12px',
                cursor: 'pointer',
              }}
            >
              <span aria-hidden style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 120ms ease' }}>▸</span>
              <span style={{ fontWeight: 700, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company}</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                fontSize: 12,
                color: muted,
                border: `1px solid ${theme.border}`,
                borderRadius: 999,
                padding: '3px 10px',
                marginRight: 24,
              }}>{items.length}</span>
            </button>
            {isOpen && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {items.map(a => (
                  <li key={a.app_id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, padding: '8px 12px', borderTop: `1px dashed ${theme.border}`, background: darkMode ? '#1d1d20' : '#fafafa' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ color: muted, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '0 1 auto' }}>{a.title}</span>
                        {a.referred ? (
                          <span
                            title="Referred"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 10,
                              lineHeight: 1,
                              color: theme.link,
                              border: `1px solid ${theme.border}`,
                              background: darkMode ? '#1f2937' : '#f3f4f6',
                              borderRadius: 999,
                              padding: '1px 6px',
                              whiteSpace: 'nowrap',
                              flex: 'none',
                            }}
                          >
                            ★ Referred
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <StatusPill
                      app={a}
                      darkMode={darkMode}
                      theme={theme}
                      muted={muted}
                      editingStatusFor={editingStatusFor}
                      savingAppId={savingAppId}
                      setEditingStatusFor={setEditingStatusFor}
                      updateAppState={updateAppState}
                    />
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default AppliedCompaniesList;