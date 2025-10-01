import { Suspense } from "react";
import ApplicationsPipelineOverview from "./ui/home/applications-pipeline";
import PriorityActionsOverview from "./ui/home/priority-actions";
import SkillDevelopmentOverview from "./ui/home/skills";
import { ApplicationsPipelineOverviewSkeleton, PriorityActionsOverviewSkeleton, SkillDevelopmentOverviewSkeleton } from "./ui/skeletons";


export default async function HomePage() {
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        <div className="p-6 space-y-8">
          {/* priority actions overview */}
          <Suspense fallback={<PriorityActionsOverviewSkeleton />} >
            <PriorityActionsOverview />
          </Suspense>

          {/* applications pipeline */}
          <Suspense fallback={<ApplicationsPipelineOverviewSkeleton />} >
            <ApplicationsPipelineOverview />
          </Suspense>
          
          {/* skill development */}
          <Suspense fallback={<SkillDevelopmentOverviewSkeleton />} >
            <SkillDevelopmentOverview />
          </Suspense>
        </div>
      </main>
    </div>
  );
}