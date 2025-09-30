import { JobsView } from "@/components/JobsView";
import type { Job } from "@/lib/types";

function mapJob(j: any): Job {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location || '',
    salary: undefined,
    type: j.jobType,
    postedDate: j.datePosted || '',
    description: j.description || undefined,
    skills: [],
    classification: j.classification || undefined,
    score: 0,
    action: j.action || undefined,
  } as Job;
}

async function getInitialData(qs: string): Promise<Job[]> {
  const baseUrl = "http://backend:8000";
  try {
    const jobsUrl = `${baseUrl}/jobs${qs ? `?${qs}` : ''}`;
    const [jobsRes] = await Promise.all([
      fetch(jobsUrl, { cache: "no-store" }),
    ]);
    const jobsJson = jobsRes.ok ? await jobsRes.json() : { jobs: [] };
    const raw = Array.isArray(jobsJson.jobs) ? jobsJson.jobs : [];
    return raw.map(mapJob);
  } catch {
    return [] as Job[];
  }
}

export default async function JobsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const sp = searchParams || {};
  const pickFirst = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] : v;
  const classificationRaw = pickFirst(sp.classification);
  const locationRaw = pickFirst(sp.location);
  const typeRaw = pickFirst(sp.type);
  const searchRaw = pickFirst(sp.search);
  const sortRaw = pickFirst(sp.sort);

  const params = new URLSearchParams();
  // Always restrict to reviewed state for discovery page base set
  params.set('state', 'reviewed');
  if (classificationRaw && ['safety','target','reach','dream'].includes(classificationRaw)) params.set('classification', classificationRaw);
  if (locationRaw) params.set('location', locationRaw);
  if (typeRaw) params.set('job_type', typeRaw); // backend expects job_type
  if (searchRaw) {
    params.set('company', searchRaw);
    params.set('title', searchRaw);
  }
  params.set('sort', sortRaw && /^(classification|company|date_posted|state|title):(asc|desc)$/.test(sortRaw) ? sortRaw : 'date_posted:desc');

  const jobs = await getInitialData(params.toString());
  const initialCategory = classificationRaw && ['safety','target','reach','dream'].includes(classificationRaw) ? classificationRaw : 'all';
  return <JobsView initialJobs={jobs} initialCategory={initialCategory} />;
}