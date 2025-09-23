"use client";

import { Brain, Briefcase, MapPin, Search, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { apiService } from "../lib/api";
import { Job } from "../lib/types";
import { JobCard } from "./JobCard";
import { JobClassificationBadge } from "./JobClassificationBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export function JobDiscovery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [classificationFilter, setCategoryFilter] = useState("all");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await apiService.getJobs({
          search: searchQuery,
          classification: classificationFilter === "all" ? undefined : classificationFilter,
          location: locationFilter === "all" ? undefined : locationFilter,
          type: typeFilter === "all" ? undefined : typeFilter,
        });

        if (response.data) {
          setJobs(response.data.jobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [searchQuery, classificationFilter, locationFilter, typeFilter]);

  // Fetch saved jobs on component mount
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        const response = await apiService.getSavedJobs();
        if (response.data) {
          setSavedJobs(response.data.savedJobs.map((job: any) => job.jobId));
        }
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
      }
    };

    fetchSavedJobs();
  }, []);

  const handleApply = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const applicationData = {
        company: job.company,
        position: job.title,
        status: "submitted" as const,
        applicationDate: new Date().toISOString().split('T')[0],
        location: job.location,
        salary: job.salary,
        jobType: job.type,
        classification: job.classification,
      };
      
      const response = await apiService.createApplication(applicationData);
      
      if (response.data) {
        if ((window as any).showToast) {
          (window as any).showToast({
            type: 'success',
            title: 'Application Submitted!',
            message: `Successfully applied to ${job.title} at ${job.company}`,
          });
        }
      } else {
        if ((window as any).showToast) {
          (window as any).showToast({
            type: 'error',
            title: 'Error',
            message: 'Failed to submit application. Please try again.',
          });
        }
      }
    }
  };

  const handleSave = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      if (savedJobs.includes(jobId)) {
        // Unsave the job
        const response = await apiService.unsaveJob(jobId);
        if (response.data) {
          setSavedJobs(prev => prev.filter(id => id !== jobId));
          if ((window as any).showToast) {
            (window as any).showToast({
              type: 'info',
              title: 'Job Removed',
              message: `Removed ${job.title} from saved jobs`,
            });
          }
        }
      } else {
        // Save the job
        const response = await apiService.saveJob(jobId);
        if (response.data) {
          setSavedJobs(prev => [...prev, jobId]);
          if ((window as any).showToast) {
            (window as any).showToast({
              type: 'success',
              title: 'Job Saved!',
              message: `${job.title} at ${job.company} saved for later`,
            });
          }
        }
      }
    }
  };

  // Jobs are already filtered by the API, so we can use them directly
  const sortedJobs = jobs;

  const classificationStats = {
    safety: jobs.filter(job => job.classification === "safety").length,
    target: jobs.filter(job => job.classification === "target").length,
    reach: jobs.filter(job => job.classification === "reach").length,
    dream: jobs.filter(job => job.classification === "dream").length,
  };

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
        
        {/* How It Works */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium">How AI Classification Works</h4>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes job requirements against your profile to predict your likelihood of landing an interview. 
                  Dream roles help you identify career aspirations and skill gaps to work towards.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-safety"></div>
                    <span><strong>Safety:</strong> 80%+ interview rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-target"></div>
                    <span><strong>Target:</strong> 60-80% interview rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-reach"></div>
                    <span><strong>Reach:</strong> 30-60% interview rate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-dream"></div>
                    <span><strong>Dream:</strong> Future career goals</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-safety/10 border border-safety/20">
            <JobClassificationBadge classification="safety" size="sm" />
            <span className="text-sm font-medium">{classificationStats.safety}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-target/10 border border-target/20">
            <JobClassificationBadge classification="target" size="sm" />
            <span className="text-sm font-medium">{classificationStats.target}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-reach/10 border border-reach/20">
            <JobClassificationBadge classification="reach" size="sm" />
            <span className="text-sm font-medium">{classificationStats.reach}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-dream/10 border border-dream/20">
            <JobClassificationBadge classification="dream" size="sm" />
            <span className="text-sm font-medium">{classificationStats.dream}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs, companies, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Select value={classificationFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <SelectValue placeholder="AI Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="safety">Safety Jobs</SelectItem>
                <SelectItem value="target">Target Jobs</SelectItem>
                <SelectItem value="reach">Reach Jobs</SelectItem>
                <SelectItem value="dream">Dream Jobs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <SelectValue placeholder="Location" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="San Francisco">San Francisco</SelectItem>
                <SelectItem value="New York">New York</SelectItem>
                <SelectItem value="Austin">Austin</SelectItem>
                <SelectItem value="Seattle">Seattle</SelectItem>
                <SelectItem value="Remote">Remote</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <SelectValue placeholder="Job Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full Time</SelectItem>
                <SelectItem value="part-time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
              <JobCard
                key={job.id}
                {...job}
                onApply={handleApply}
                onSave={handleSave}
                isSaved={savedJobs.includes(job.id)}
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