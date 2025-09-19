import { JobsView } from "@/components/JobsView";
import type { Job } from "@/lib/types";
import { headers } from "next/headers";

async function getInitialData(): Promise<{ jobs: Job[]; saved: string[] }> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${protocol}://${host}`;
  try {
    const [jobsRes, savedRes] = await Promise.all([
      fetch(`${baseUrl}/api/jobs`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/saved-jobs`, { cache: "no-store" }),
    ]);
    const jobsJson = jobsRes.ok ? await jobsRes.json() : { jobs: [] };
    const savedJson = savedRes.ok ? await savedRes.json() : { savedJobs: [] };
    const savedIds: string[] = Array.isArray(savedJson.savedJobs)
      ? savedJson.savedJobs.map((j: any) => j.jobId)
      : [];
    return { jobs: jobsJson.jobs ?? [], saved: savedIds };
  } catch {
    return { jobs: [], saved: [] };
  }
}

export default async function JobsPage() {
  const { jobs, saved } = await getInitialData();
  return <JobsView initialJobs={jobs} initialSaved={saved} />;
}