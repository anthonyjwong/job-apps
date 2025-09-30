import { ApplicationsView } from "@/components/ApplicationsView";
import type { Application } from "@/lib/types";

async function getApplications(): Promise<Application[]> {
  const baseUrl = "http://backend:8000";
  try {
    const res = await fetch(`${baseUrl}/applications?status=submitted&status=acknowledged&status=assessment&status=interview&status=rejected&sort=updated_at:desc`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.applications ?? [];
  } catch (e) {
    return [];
  }
}

async function getApplicationsDataSummary() {
  const baseUrl = "http://backend:8000";
  try {
    const res = await fetch(`${baseUrl}/data/applications/summary`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data ?? {};
  } catch (e) {
    return [];
  }
}

export default async function ApplicationsPage() {
  const initialApplications = await getApplications();
  const stats = await getApplicationsDataSummary();
  
  return <ApplicationsView initialApplications={initialApplications} stats={stats} />;
}