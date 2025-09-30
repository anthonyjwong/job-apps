// API service layer for handling all backend calls
import type { Application, Assessment, Interview, Job, NewApplication, SavedJob } from './types';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiService {
  private baseUrl = 'http://localhost:8000';

  private async fetchApi<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData.error || 'An error occurred' };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: 'Network error occurred' };
    }
  }

  // Applications API
  async getApplications() {
    return this.fetchApi<{ applications: Application[]; total: number }>('/applications');
  }

  async createApplication(application: NewApplication) {
    return this.fetchApi<{ application: Application; message: string }>('/applications', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  }

  async updateApplication(id: string, updates: Partial<Application>) {
    return this.fetchApi<{ application: Application; message: string }>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates }),
    });
  }

  async deleteApplication(id: number) {
    return this.fetchApi<{ message: string }>(`/applications?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Jobs API
  async getJobs(params?: {
    search?: string;
    classification?: string;
    location?: string;
    type?: string;
    sort?: string; // expected format field:direction matching backend (e.g., date_posted:desc)
  }) {
    // Backend /jobs endpoint expects: classification (can be repeated), location, job_type, company, title
    // Frontend supplies: search (matches company OR title substring), classification (single), location, type.
    const queryParams = new URLSearchParams();
    if (params) {
      const { search, classification, location, type, sort } = params;
      if (classification) {
        // API supports multiple classification values; we send single if provided
        queryParams.append('classification', classification);
      }
      if (location) queryParams.append('location', location);
      if (type) queryParams.append('job_type', type); // translate to backend param
      if (search) {
        // send search to both company and title to broaden match similar to free-text
        queryParams.append('company', search);
        queryParams.append('title', search);
      }
      if (sort) {
        queryParams.append('sort', sort);
      }
    }

    const qs = queryParams.toString();
    const endpoint = `/jobs${qs ? `?${qs}` : ''}`;
    if (process.env.NODE_ENV !== 'production') {
      // Debug logging for filter issue investigation
      // eslint-disable-next-line no-console
      console.debug('[apiService.getJobs] endpoint:', endpoint);
    }
    return this.fetchApi<{ jobs: Job[]; total: number; totalAvailable: number }>(endpoint);
  }

  // Interviews API
  async getInterviews() {
    return this.fetchApi<{ interviews: Interview[]; total: number; upcoming: number; completed: number }>('/interviews');
  }

  async createInterview(interview: Omit<Interview, 'id'>) {
    return this.fetchApi<{ interview: Interview; message: string }>('/interviews', {
      method: 'POST',
      body: JSON.stringify(interview),
    });
  }

  async updateInterview(id: string, updates: Partial<Interview>) {
    return this.fetchApi<{ interview: Interview; message: string }>('/interviews', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates }),
    });
  }

  async deleteInterview(id: string) {
    return this.fetchApi<{ message: string }>(`/interviews?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Assessments API
  async getAssessments() {
    return this.fetchApi<{ assessments: Assessment[]; total: number; pending: number; completed: number; scheduled: number }>('/assessments');
  }

  async createAssessment(assessment: Omit<Assessment, 'id'>) {
    return this.fetchApi<{ assessment: Assessment; message: string }>('/assessments', {
      method: 'POST',
      body: JSON.stringify(assessment),
    });
  }

  async updateAssessment(id: string, updates: Partial<Assessment>) {
    return this.fetchApi<{ assessment: Assessment; message: string }>('/assessments', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...updates }),
    });
  }

  async deleteAssessment(id: string) {
    return this.fetchApi<{ message: string }>(`/assessments?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics API
  async getAnalytics() {
    return this.fetchApi<any>('/analytics');
  }

  // Saved Jobs API
  async getSavedJobs() {
    return this.fetchApi<{ savedJobs: SavedJob[]; total: number }>('/saved-jobs');
  }

  async saveJob(jobId: string, notes?: string) {
    return this.fetchApi<{ savedJob: SavedJob; message: string }>('/saved-jobs', {
      method: 'POST',
      body: JSON.stringify({ jobId, notes }),
    });
  }

  async unsaveJob(jobId: string) {
    return this.fetchApi<{ message: string }>(`/saved-jobs?jobId=${jobId}`, {
      method: 'DELETE',
    });
  }

  // Notifications API
  async getNotifications(unreadOnly = false) {
    return this.fetchApi<any>(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
  }

  async createNotification(notification: any) {
    return this.fetchApi<any>('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  async markNotificationAsRead(id: string) {
    return this.fetchApi<any>('/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id, isRead: true }),
    });
  }

  async markAllNotificationsAsRead() {
    return this.fetchApi<any>('/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id: 'all' }),
    });
  }
}

export const apiService = new ApiService();