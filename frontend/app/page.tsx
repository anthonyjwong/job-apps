import { HomeInteractive } from "@/components/HomeInteractive";
import type { Application, Assessment, Interview } from "@/lib/types";
import { headers } from "next/headers";

async function fetchHomeData(): Promise<{ interviews: Interview[]; assessments: Assessment[]; applications: Application[] }> {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
  const protocol = hdrs.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${protocol}://${host}`;
  try {
    const [interviewsRes, assessmentsRes, applicationsRes] = await Promise.all([
      fetch(`${baseUrl}/api/interviews`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/assessments`, { cache: "no-store" }),
      fetch(`${baseUrl}/api/applications`, { cache: "no-store" }),
    ]);
    const interviewsJson = interviewsRes.ok ? await interviewsRes.json() : { interviews: [] };
    const assessmentsJson = assessmentsRes.ok ? await assessmentsRes.json() : { assessments: [] };
    const applicationsJson = applicationsRes.ok ? await applicationsRes.json() : { applications: [] };
    return {
      interviews: interviewsJson.interviews ?? [],
      assessments: assessmentsJson.assessments ?? [],
      applications: applicationsJson.applications ?? [],
    };
  } catch {
    return { interviews: [], assessments: [], applications: [] };
  }
}

export default async function HomePage() {
  const { interviews, assessments, applications } = await fetchHomeData();

  const totalApplications = applications.length;
  const interviewedApps = applications.filter((app) => app.status === "interview").length;
  const responseRate = Math.round((interviewedApps / Math.max(totalApplications, 1)) * 100);
  const thisWeekApplications = 3;
  const weeklyGoal = 5;
  const goalProgress = Math.min((thisWeekApplications / weeklyGoal) * 100, 100);
  const classificationStats = {
    safety: applications.filter((app) => app.classification === "safety").length,
    target: applications.filter((app) => app.classification === "target").length,
    reach: applications.filter((app) => app.classification === "reach").length,
    dream: applications.filter((app) => app.classification === "dream").length,
  } as const;
  const classificationSuccessRates = {
    safety: Math.round((applications.filter((app) => app.classification === "safety" && (app.status === "interview" || app.status === "offer")).length / Math.max(classificationStats.safety, 1)) * 100),
    target: Math.round((applications.filter((app) => app.classification === "target" && (app.status === "interview" || app.status === "offer")).length / Math.max(classificationStats.target, 1)) * 100),
    reach: Math.round((applications.filter((app) => app.classification === "reach" && (app.status === "interview" || app.status === "offer")).length / Math.max(classificationStats.reach, 1)) * 100),
    dream: Math.round((applications.filter((app) => app.classification === "dream" && (app.status === "interview" || app.status === "offer")).length / Math.max(classificationStats.dream, 1)) * 100),
  } as const;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <div className="p-6">
          <HomeInteractive
            interviews={interviews}
            assessments={assessments}
            applications={applications}
            stats={{
              totalApplications,
              responseRate,
              thisWeekApplications,
              weeklyGoal,
              goalProgress,
              classificationStats,
              classificationSuccessRates,
            }}
          />
        </div>
      </main>
    </div>
  );
}