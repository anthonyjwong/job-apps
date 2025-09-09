"use client";
import React from 'react';
import { JobsSummary, Theme } from '../types/dashboard';
import { colorAt } from '../utils/color';
import PieChart from './PieChart';

interface JobsSummaryCardProps {
  jobs: JobsSummary | null;
  unapprovedJobsCount: number | null;
  darkMode: boolean;
  theme: Theme;
  muted: string;
  cardStyle: React.CSSProperties;
  cardTitleStyle: React.CSSProperties;
  listStyle: (t: Theme) => React.CSSProperties;
}

export const JobsSummaryCard: React.FC<JobsSummaryCardProps> = ({
  jobs,
  unapprovedJobsCount,
  darkMode,
  theme,
  muted,
  cardStyle,
  cardTitleStyle,
  listStyle,
}) => (
  <div style={cardStyle}>
    <h3 style={cardTitleStyle}>Jobs</h3>
    <div style={{ fontSize: 12, color: muted, marginTop: -6, marginBottom: 8 }}>Summary</div>
    {jobs ? (
      <div>
        <ul style={listStyle(theme)}>
          {typeof unapprovedJobsCount === 'number' && (
            <li>In discovery queue: {unapprovedJobsCount}</li>
          )}
        </ul>
        {jobs && (
          <section style={{ marginTop: 24 }}>
            {(() => {
              const cls = jobs.classifications;
              const items = [
                { label: 'Safety', value: cls.safety },
                { label: 'Target', value: cls.target },
                { label: 'Reach', value: cls.reach },
                { label: 'Dream', value: cls.dream },
                ...(typeof cls.unreviewed === 'number' ? [{ label: 'Unreviewed', value: cls.unreviewed }] : []),
              ].filter(d => typeof d.value === 'number' && d.value > 0);
              const total = items.reduce((a, b) => a + (isFinite(b.value) ? b.value : 0), 0);
              if (items.length === 0 || total === 0) {
                return (
                  <div style={{
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    padding: 16,
                    background: theme.appBg,
                    color: muted,
                    textAlign: 'center',
                  }}>
                    No classification data yet.
                  </div>
                );
              }
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 1fr) 1fr',
                  gap: 12,
                  alignItems: 'center',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: 10,
                  background: theme.appBg,
                }}>
                  <div style={{ justifySelf: 'center' }}>
                    <PieChart
                      data={items}
                      size={200}
                      thickness={20}
                      dark={darkMode}
                      ariaLabel="Classification distribution"
                    />
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
                    {items.map((item, i) => (
                      <li key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            display: 'inline-block',
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: colorAt(i, darkMode),
                            border: `1px solid ${darkMode ? '#000' : '#fff'}`,
                          }} />
                          <span style={{ color: theme.text }}>{item.label}</span>
                        </div>
                        <span style={{ fontWeight: 600 }}>{item.value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </section>
        )}
      </div>
    ) : (
      <p>Loading…</p>
    )}
  </div>
);

export default JobsSummaryCard;