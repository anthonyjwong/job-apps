// Shared application types for consistency across the application

export type ApplicationStatus = "submitted" | "interviewed" | "rejected" | "offered" | "withdrawn";

export type JobCategory = "safety" | "target" | "reach" | "dream";

export interface Application {
  id: number;
  company: string;
  position: string;
  status: ApplicationStatus;
  applicationDate: string;
  location?: string;
  salary?: string;
  jobType?: string;
  priority?: "high" | "medium" | "low";
  notes?: string;
  jobUrl?: string;
  contacts?: Array<{ name: string; role: string; email?: string }>;
  category?: JobCategory;
}

export interface NewApplication {
  company: string;
  position: string;
  status: ApplicationStatus;
  applicationDate: string;
  jobUrl?: string;
  notes?: string;
  location?: string;
  salary?: string;
  jobType?: string;
  category?: JobCategory;
  priority?: "high" | "medium" | "low";
}

// Job discovery types
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: "full-time" | "part-time" | "contract" | "remote";
  postedDate: string;
  description: string;
  skills: string[];
  category: JobCategory;
  aiScore: number;
  aiAction?: string;
}

// Interview and assessment types
export interface Interview {
  id: string;
  company: string;
  position: string;
  type: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  interviewer?: string;
  notes?: string;
  applicationId: number;
  location?: string;
  preparationItems?: string[];
}

export interface Assessment {
  id: string;
  company: string;
  position: string;
  type: string;
  title: string;
  description: string;
  dueDate: string;
  timeLimit: string;
  status: string;
  applicationId: number;
  instructions?: string;
  submissionUrl?: string;
  notes?: string;
  estimatedEffort?: string;
  skills?: string[];
}

// Saved job type
export interface SavedJob {
  id: string;
  jobId: string;
  userId: string;
  savedDate: string;
  notes?: string;
  jobDetails?: {
    title?: string;
    company?: string;
    location?: string;
    salary?: string;
    category?: JobCategory;
  };
}

// Analytics types
export interface AnalyticsOverview {
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  avgTimeToResponse: number;
}

export interface AnalyticsCategoryStats {
  applications: number;
  interviews: number;
  offers: number;
  interviewRate: number;
  avgTimeToResponse: number;
}

export interface AnalyticsCategoryBreakdown {
  safety: AnalyticsCategoryStats;
  target: AnalyticsCategoryStats;
  reach: AnalyticsCategoryStats;
  dream: AnalyticsCategoryStats;
}

export interface AnalyticsTrendPoint {
  month: string;
  applications: number;
  interviews: number;
  offers: number;
}

export interface AnalyticsTopCompany {
  name: string;
  applications: number;
  interviews: number;
  offers: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  categoryBreakdown: AnalyticsCategoryBreakdown;
  monthlyTrends: AnalyticsTrendPoint[];
  weeklyActivity: Array<{ week: string; applications: number; interviews: number }>;
  topCompanies: AnalyticsTopCompany[];
  skillsInDemand: Array<{ skill: string; count: number; trend: string }>;
  applicationSources: Array<{ source: string; count: number; percentage: number }>;
  interviewTypes: Array<{ type: string; count: number; successRate: number }>;
  recommendations: Array<{ type: string; title: string; description: string; priority: string; actionItems: string[] }>;
  goalProgress: {
    weeklyApplicationTarget: number;
    currentWeekApplications: number;
    weeklyInterviewTarget: number;
    currentWeekInterviews: number;
    monthlyOfferTarget: number;
    currentMonthOffers: number;
  };
}

// User settings types
export interface UserProfileSettings {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  experience: string;
  salaryMin: string;
  salaryMax: string;
  bio: string;
}

export interface UserNotificationSettings {
  emailDigest: boolean;
  applicationUpdates: boolean;
  interviewReminders: boolean;
  newJobMatches: boolean;
  weeklyReport: boolean;
  pushNotifications: boolean;
  smsReminders: boolean;
}

export interface UserPreferenceSettings {
  autoApplyEnabled: boolean;
  defaultApplicationStatus: string;
  reminderDays: string;
  dataRetention: string;
  exportFormat: string;
  timezone: string;
}

export interface UserPrivacySettings {
  profileVisible: boolean;
  analyticsEnabled: boolean;
  dataSharing: boolean;
  marketingEmails: boolean;
}

export interface UserSettings {
  profile: UserProfileSettings;
  notifications: UserNotificationSettings;
  preferences: UserPreferenceSettings;
  privacy: UserPrivacySettings;
}