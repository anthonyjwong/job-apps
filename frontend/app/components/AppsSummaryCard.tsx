"use client";
import React from 'react';
import { AppsSummary, Theme } from '../types/dashboard';
import { colorAt } from '../utils/color';
import PieChart from './PieChart';
import { UnimplementedContainer } from './UnimplementedContainer';

interface AppsSummaryCardProps {
  apps: AppsSummary | null;
  unapprovedAppsCount: number | null;
  approvedNoAppCount: number;
  approvedNoAppSources: Record<string, number>;
  darkMode: boolean;
  theme: Theme;
  muted: string;
  cardStyle: React.CSSProperties;
  cardTitleStyle: React.CSSProperties;
  listStyle: (t: Theme) => React.CSSProperties;
}

export const AppsSummaryCard: React.FC<AppsSummaryCardProps> = ({
  apps,
  unapprovedAppsCount,
  approvedNoAppCount,
  approvedNoAppSources,
  darkMode,
  theme,
  muted,
  cardStyle,
  cardTitleStyle,
  listStyle,
}) => (
  <div style={cardStyle}>
    <h3 style={cardTitleStyle}>Applications</h3>
    <div style={{ fontSize: 12, color: muted, marginTop: -6, marginBottom: 8 }}>Summary</div>
    {apps ? (
      <div>
        <ul style={listStyle(theme)}>
          {typeof unapprovedAppsCount === 'number' && (
            <li style={{ marginBottom: 24 }}>In approval queue: {unapprovedAppsCount}</li>
          )}
          {typeof apps.approved === 'number' && <li>Approved: {apps.approved}</li>}
          <li>Submitted: {apps.submitted}</li>
          <UnimplementedContainer as="li">
            <p style={{ margin: 0 }}>Acknowledged: {apps.acknowledged}</p>
            <p style={{ margin: 0 }}>Rejected: {apps.rejected}</p>
          </UnimplementedContainer>
          <li style={{ marginTop: 24 }}>Unprepared: {approvedNoAppCount}</li>
          {approvedNoAppSources && Object.keys(approvedNoAppSources).length > 0 && (
            <section>
              <h4>Top Site Sources</h4>
              {(() => {
                const entries = Object.entries(approvedNoAppSources).slice(0, 8);
                const total = entries.reduce((acc, [, v]) => acc + (typeof v === 'number' ? v : 0), 0);
                if (entries.length === 0 || total === 0) {
                  return (
                    <div style={{
                      border: `1px solid ${theme.border}`,
                      borderRadius: 12,
                      padding: 12,
                      background: theme.appBg,
                      color: muted,
                      textAlign: 'center',
                    }}>
                      No source data yet.
                    </div>
                  );
                }
                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(160px, 1fr) 1fr',
                    gap: 12,
                    alignItems: 'center',
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    padding: 10,
                    background: theme.appBg,
                  }}>
                    <div style={{ justifySelf: 'center' }}>
                      <PieChart
                        data={entries.map(([label, value]) => ({ label, value }))}
                        size={180}
                        thickness={18}
                        dark={darkMode}
                        ariaLabel="Top Sources by job count"
                      />
                    </div>
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                      {entries.map(([host, count], i) => (
                        <li key={host} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: colorAt(i, darkMode),
                              border: `1px solid ${darkMode ? '#000' : '#fff'}`,
                            }} />
                            <span style={{ color: theme.text }}>{host}</span>
                          </div>
                          <span style={{ fontWeight: 600 }}>{count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </section>
          )}
        </ul>
      </div>
    ) : (
      <p>Loading…</p>
    )}
  </div>
);

export default AppsSummaryCard;