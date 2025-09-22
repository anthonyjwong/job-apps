"use client";

import { applyToJob, saveJobAction, unsaveJobAction } from "@/app/jobs/actions";
import { Brain, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { apiService } from "../lib/api";
import type { Job } from "../lib/types";
import { JobCard } from "./JobCard";
import { JobsFilters } from "./JobsFilters";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

type JobsViewProps = {
  initialJobs: Job[];
  initialSaved: string[];
  initialCategory?: string;
};

export function JobsView({ initialJobs, initialSaved, initialCategory = 'all' }: JobsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [classificationFilter, setCategoryFilter] = useState(initialCategory);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [savedJobs, setSavedJobs] = useState<string[]>(initialSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await apiService.getJobs({
          search: searchQuery || undefined,
          classification: classificationFilter === "all" ? undefined : classificationFilter,
          location: locationFilter === "all" ? undefined : locationFilter,
          type: typeFilter === "all" ? undefined : typeFilter,
        });
        if (!ignore && response.data) {
          setJobs(response.data.jobs);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchJobs();
    return () => {
      ignore = true;
    };
  }, [searchQuery, classificationFilter, locationFilter, typeFilter]);

  const handleApply = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const response = await applyToJob({
      company: job.company,
      position: job.title,
      location: job.location,
      salary: job.salary,
      type: job.type,
      classification: job.classification,
    });
    if (response.success) {
      (window as any).showToast?.({
        type: "success",
        title: "Application Submitted!",
        message: `Successfully applied to ${job.title} at ${job.company}`,
      });
    } else {
      (window as any).showToast?.({
        type: "error",
        title: "Error",
        message: response.message ?? "Failed to submit application. Please try again.",
      });
    }
  };

  const handleSave = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const wasSaved = savedJobs.includes(jobId);

    if (wasSaved) {
      setSavedJobs((prev) => prev.filter((id) => id !== jobId));
      const resp = await unsaveJobAction(jobId);
      if (resp.success) {
        (window as any).showToast?.({
          type: "info",
          title: "Job Removed",
          message: `Removed ${job.title} from saved jobs`,
        });
      } else {
        setSavedJobs((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
        (window as any).showToast?.({
          type: "error",
          title: "Unsave Failed",
          message: resp.message ?? "Could not remove from saved. Please retry.",
        });
      }
    } else {
      setSavedJobs((prev) => (prev.includes(jobId) ? prev : [...prev, jobId]));
      const resp = await saveJobAction(jobId);
      if (resp.success) {
        (window as any).showToast?.({
          type: "success",
          title: "Job Saved!",
          message: `${job.title} at ${job.company} saved for later`,
        });
      } else {
        setSavedJobs((prev) => prev.filter((id) => id !== jobId));
        (window as any).showToast?.({
          type: "error",
          title: "Save Failed",
          message: resp.message ?? "Could not save job. Please retry.",
        });
      }
    }
  };

  const sortedJobs = jobs; // already sorted by API

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl">AI-Powered Job Discovery</h1>
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <Brain className="w-3 h-3 mr-1" />
            Smart Matching
          </Badge>
        </div>
        <p className="text-muted-foreground mb-4">
          Our AI analyzes your likelihood of landing an interview for each job. Dream roles represent career goals to build towards, while other categories focus on immediate opportunities.
        </p>

      {/* Search and Filters */}
      <JobsFilters
        search={searchQuery}
        onSearch={setSearchQuery}
        classification={classificationFilter}
        onCategory={setCategoryFilter}
        location={locationFilter}
        onLocation={setLocationFilter}
        type={typeFilter}
        onType={setTypeFilter}
      />

      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading jobs..." : `Showing ${sortedJobs.length} jobs, sorted by interview likelihood`}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Zap className="w-3 h-3" />
          AI-powered interview likelihood
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6">
            {sortedJobs.map((job) => (
              <JobCard key={job.id} {...job} onApply={handleApply} onSave={handleSave} isSaved={savedJobs.includes(job.id)} />
            ))}
          </div>

          {sortedJobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No jobs found matching your criteria.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setLocationFilter("all");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
