import { Theme } from '../types/dashboard';

export const cardRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
};

export const card = (theme: Theme): React.CSSProperties => ({
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  padding: 12,
  background: theme.appBg,
});

export const cardTitle: React.CSSProperties = { marginTop: 0 };

export const list = (theme: Theme): React.CSSProperties => ({
  margin: 0,
  paddingLeft: 18,
  color: theme.text,
});

export const btn = (theme: Theme, darkMode: boolean): React.CSSProperties => ({
  display: 'inline-block',
  padding: '8px 12px',
  border: `1px solid ${theme.border}`,
  borderRadius: 8,
  background: darkMode ? '#232326' : '#fff',
  color: theme.text,
});