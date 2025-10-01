import { AddApplicationModal } from "@/components/AddApplicationModal";
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
          <Suspense fallback={<PriorityActionsOverviewSkeleton />} >
            <PriorityActionsOverview />
          </Suspense>

          <Suspense fallback={<ApplicationsPipelineOverviewSkeleton />} >
            <ApplicationsPipelineOverview />
          </Suspense>
          
          <Suspense fallback={<SkillDevelopmentOverviewSkeleton />} >
            <SkillDevelopmentOverview />
          </Suspense>

          {/* Add Application Modal */}
          {/* <AddApplicationModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddApplication}
          /> */}
        </div>
      </main>
    </div>
  );
}