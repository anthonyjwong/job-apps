import { Application, GetApplicationsResponse, PriorityActions } from "@/lib/types";

const baseUrl = "http://backend:8000";

export async function fetchPriorityActionsData(): Promise<PriorityActions> {
  try {
    const response = await fetch(`${baseUrl}/applications/priority`, { cache: "no-store" });
    if (!response.ok) throw new Error('Failed to fetch priority actions');
    return response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch priority actions data.');
  }
}

export async function fetchPreparedApplications(): Promise<Application[]> {
  try {
    const response = await fetch(`${baseUrl}/applications?form_state=prepared`, { cache: "no-store" });
    if (!response.ok) throw new Error('Failed to fetch prepared applications');
    const responseJson: GetApplicationsResponse = await response.json();
    return responseJson.applications;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch prepared applications.');
  }
}

export async function fetchSkillDevelopmentData() {
  const skillGaps = [
    { skill: "React", jobs: 12, priority: "high" },
    { skill: "TypeScript", jobs: 8, priority: "medium" },
    { skill: "AWS", jobs: 6, priority: "high" },
  ];
  return skillGaps;
}