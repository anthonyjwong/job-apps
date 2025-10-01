"use client";

import { saveJobAction } from "@/app/jobs/actions";
import { Brain, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { apiService } from "../lib/api";
import type { Job, JobClassification } from "../lib/types";
import { JobCard } from "./JobCard";
import { JobsFilters } from "./JobsFilters";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

type JobsViewProps = {
  initialJobs: Job[];
  initialCategory?: string;
};

export function JobsView({ initialJobs, initialCategory = 'all' }: JobsViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [classificationFilter, setCategoryFilter] = useState(initialCategory);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('date_posted:desc');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Sync classification with URL param if it changes client-side via router.push
    const urlClass = searchParams?.get('classification');
    if (urlClass && urlClass !== classificationFilter) {
      const valid = ['safety', 'target', 'reach', 'dream'];
      if (valid.includes(urlClass)) {
        setCategoryFilter(urlClass);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Debounced URL sync for filters/search
  useEffect(() => {
    const commit = () => {
      const params = new URLSearchParams();
      if (classificationFilter !== 'all') params.set('classification', classificationFilter);
      if (locationFilter !== 'all') params.set('location', locationFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (sort && sort !== 'date_posted:desc') params.set('sort', sort);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const qs = params.toString();
      router.replace(`/jobs${qs ? `?${qs}` : ''}`);
    };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(commit, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [classificationFilter, locationFilter, typeFilter, sort, searchQuery, router]);
  useEffect(() => {
    let ignore = false;
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await apiService.getJobs({
          search: searchQuery || undefined,
          classification: classificationFilter === 'all' ? undefined : classificationFilter,
          location: locationFilter === 'all' ? undefined : locationFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          sort: sort || undefined,
          state: 'reviewed',
        });
        if (!ignore && response.data) {
          const transformed = response.data.jobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location || '',
            salary: undefined,
            type: j.jobType,
            postedDate: j.datePosted || '',
            description: j.description || undefined,
            skills: [],
            classification: j.classification || 'safety',
            score: 0,
            action: j.action || undefined,
          }) as Job);
          setJobs(transformed);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchJobs();
    return () => { ignore = true; };
  }, [searchQuery, classificationFilter, locationFilter, typeFilter, sort]);

  const handleSave = async (jobId: string) => {
    console.log("Approving job", jobId);
  };

  const handleClassificationChange = (jobId: string, newClassification: JobClassification) => {
    setJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, classification: newClassification } : job
      )
    );

    const job = jobs.find(j => j.id === jobId);
    if (job && (window as any).showToast) {
      (window as any).showToast({
        type: 'success',
        title: 'Classification Updated',
        message: `${job.title} moved to ${newClassification} classification`,
      });
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
          sort={sort}
          onSort={setSort}
        />

      </div>

      {/* Results */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading jobs..." : `Showing ${sortedJobs.length} jobs`}
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
              <JobCard
                key={job.id}
                {...job}
                onSave={handleSave}
                onClassificationChange={handleClassificationChange}
              />
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
