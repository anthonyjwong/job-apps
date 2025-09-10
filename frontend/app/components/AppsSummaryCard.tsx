"use client";
import React from 'react';
import { AppsSummary, Theme } from '../types/dashboard';

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
          <p>Submitted: {apps.submitted}</p>
          <p>Acknowledged: {apps.acknowledged}</p>
          <p>Rejected: {apps.rejected}</p>
        </ul>
      </div>
    ) : (
      <p>Loading…</p>
    )}
  </div>
);

export default AppsSummaryCard;