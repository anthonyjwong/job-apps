// Shared dashboard types
export type JobsSummary = {
  total_jobs: number;
  classifications: { safety: number; target: number; reach: number; dream: number; unreviewed?: number };
  base_urls: Record<string, number>;
};

export type AppsSummary = {
  total_apps: number;
  discarded: number;
  approved: number;
  submitted: number;
  acknowledged: number;
  rejected: number;
  approved_without_app?: { count: number; base_urls: Record<string, number> };
};

export type AppliedApp = {
  app_id: string;
  job_id: string;
  company: string;
  title: string;
  referred?: boolean;
  submitted: boolean;
  acknowledged: boolean;
  assessment: boolean;
  interview: boolean;
  rejected: boolean;
};

export type AppStateName = "submitted" | "acknowledged" | "assessment" | "interview" | "rejected";

export type Theme = { border: string; text: string; appBg: string; link: string };