"use client";

import { createApplicationAction } from "@/app/actions";
import { apiService } from "@/lib/api";
import type { Application, Assessment, Interview, NewApplication, SavedJob } from "@/lib/types";
import { AlertCircle, ArrowRight, Bell, BookOpen, Brain, Calendar, CheckCircle, Clock, FileText, Lightbulb, MessageSquare, Plus, Send, Shield, Sparkles, Star, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { JobClassificationBadge } from "../components/JobClassificationBadge";
import { AddApplicationModal } from "./AddApplicationModal";
import { ApplicationItem } from "./ApplicationItem";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

type HomeInteractiveProps = {
  initialInterviews?: Interview[];
  initialAssessments?: Assessment[];
  initialApplications?: Application[];
  initialSavedJobs?: SavedJob[];
  weeklyGoal?: number;
  onNavigate?: (section: string) => void;
  enableClientRefresh?: boolean; // if true, refetch on mount
};

export function HomeInteractive({
  onNavigate,
  enableClientRefresh = true,
}: HomeInteractiveProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // interviews, assessments, followups

  const handleAddApplication = async (newApp: NewApplication) => {
    const response = await apiService.createApplication(newApp);
    if (response.data?.application) {
      setApplicationList((prev) => [response.data!.application, ...prev]);
    } else {
      console.error("Error creating application:", response.error);
    }
  };

  // Derived analytics-lite stats
  const totalApplications = applicationList.length;
  const thisWeekApplications = applicationList.filter(a => {
    const d = new Date(a.applicationDate);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo && d <= now;
  }).length;
  const goalProgress = weeklyGoal ? Math.min(100, Math.round((thisWeekApplications / weeklyGoal) * 100)) : 0;
  const classificationCounts: Record<string, number> = { safety: 0, target: 0, reach: 0, dream: 0 };
  applicationList.forEach(a => { if (a.classification) classificationCounts[a.classification]++; });

  const totalActionItems = upcomingInterviews.length + pendingAssessments.length + stalledApplications.length;

  return (
    <div className="p-6 space-y-8">
      {/* Header with Opportunity Spotlight */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1>Good morning, Alex!</h1>
          {totalActionItems > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {totalActionItems} action{totalActionItems === 1 ? '' : 's'} needed
            </Badge>
          )}
        </div>

        <p className="text-muted-foreground">
          Stay on top of priority actions and application momentum.
        </p>
      </div>

      {/* Action Items Overview - Scalable Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Upcoming Interviews */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${upcomingInterviews.length > 0 ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
          onClick={() => onNavigate?.("interviews")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${upcomingInterviews.length > 0 ? 'bg-blue-500' : 'bg-muted'}`}>
                  <Calendar className={`w-5 h-5 ${upcomingInterviews.length > 0 ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">Interviews</p>
                  <p className="text-sm text-muted-foreground">
                    {upcomingInterviews.length === 0 ? 'None scheduled' : `${upcomingInterviews.length} upcoming`}
                  </p>
                </div>
              </div>
              {upcomingInterviews.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {upcomingInterviews.length}
                </Badge>
              )}
            </div>
            {upcomingInterviews.length > 0 && (
              <div className="mt-3 p-2 bg-white/50 dark:bg-white/5 rounded border">
                <p className="text-xs text-muted-foreground">Next: {upcomingInterviews[0]?.company}</p>
                <p className="text-xs font-medium">{upcomingInterviews[0]?.date}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assessments */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${pendingAssessments.length > 0 ? 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20' : ''}`}
          onClick={() => onNavigate?.("applications")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${pendingAssessments.length > 0 ? 'bg-orange-500' : 'bg-muted'}`}>
                  <FileText className={`w-5 h-5 ${pendingAssessments.length > 0 ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">Assessments</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingAssessments.length === 0 ? 'None pending' : `${pendingAssessments.length} pending`}
                  </p>
                </div>
              </div>
              {pendingAssessments.length > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  {pendingAssessments.length}
                </Badge>
              )}
            </div>
            {pendingAssessments.length > 0 && (
              <div className="mt-3 p-2 bg-white/50 dark:bg-white/5 rounded border">
                <p className="text-xs text-muted-foreground">Due: {pendingAssessments[0]?.dueDate}</p>
                <p className="text-xs font-medium">{pendingAssessments[0]?.company}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-ups Needed */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${stalledApplications.length > 0 ? 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20' : ''}`}
          onClick={() => onNavigate?.("applications")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stalledApplications.length > 0 ? 'bg-yellow-500' : 'bg-muted'}`}>
                  <MessageSquare className={`w-5 h-5 ${stalledApplications.length > 0 ? 'text-white' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">Follow-ups</p>
                  <p className="text-sm text-muted-foreground">
                    {stalledApplications.length === 0 ? 'All current' : `${stalledApplications.length} overdue`}
                  </p>
                </div>
              </div>
              {stalledApplications.length > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  {stalledApplications.length}
                </Badge>
              )}
            </div>
            {stalledApplications.length > 0 && (
              <div className="mt-3 p-2 bg-white/50 dark:bg-white/5 rounded border">
                <p className="text-xs text-muted-foreground">Oldest: {(() => {
                  const first = stalledApplications[0];
                  if (!first) return 0;
                  const applied = new Date(first.applicationDate).getTime();
                  if (isNaN(applied)) return 0;
                  return Math.floor((Date.now() - applied) / (1000 * 60 * 60 * 24));
                })()} days</p>
                <p className="text-xs font-medium">{stalledApplications[0]?.company}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success State when all caught up */}
      {totalActionItems === 0 && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">All caught up!</p>
                <p className="text-sm text-green-600 dark:text-green-400">No urgent actions needed. Keep up the great work!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. APPLICATION PIPELINE - Keep Momentum */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Application Pipeline
          </CardTitle>
          <CardDescription>
            Ready-to-submit applications to maintain your job search velocity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readyToSubmit.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No applications ready</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Save jobs from the discovery page to get AI-prepared applications
                </p>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    <span className="font-medium text-primary">1,847 new opportunities</span> waiting to be discovered
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    AI-classified and ready for your profile
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {readyToSubmit.length} applications ready to review and submit
                </p>
                <Button size="sm" onClick={() => onNavigate?.("applications")}>
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              <div className="grid gap-3">
                {readyToSubmit.map((job, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <JobClassificationBadge classification={job.category as any} size="sm" />
                      <div>
                        <p className="font-medium">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Brain className="w-3 h-3 mr-1" />
                        AI Ready
                      </Badge>
                      <Button size="sm">
                        Review & Submit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xl font-medium text-safety">{savedJobs.filter(j => j.category === 'safety').length}</p>
                  <p className="text-xs text-muted-foreground">Safety jobs saved</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-medium text-target">{savedJobs.filter(j => j.category === 'target').length}</p>
                  <p className="text-xs text-muted-foreground">Target jobs saved</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-medium text-reach">{savedJobs.filter(j => j.category === 'reach').length}</p>
                  <p className="text-xs text-muted-foreground">Reach jobs saved</p>
                </div>
              </div>

              {/* Discover More - Subtle Footer */}
              <div className="pt-4 border-t mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-primary">1,847 more opportunities</span> available
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onNavigate?.("jobs")}
                    className="text-xs"
                  >
                    Discover More
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. SKILL DEVELOPMENT - Career Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Skill Development
          </CardTitle>
          <CardDescription>
            Build skills to unlock reach and dream job opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Skill Gap Analysis */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Priority Skills to Learn
              </h4>
              <div className="space-y-3">
                {skillGaps.map((gap, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${gap.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-medium">{gap.skill}</p>
                        <p className="text-sm text-muted-foreground">
                          Required in {gap.jobs} reach/dream jobs
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Learn
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dream Job Tracking */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-dream" />
                Dream Job Progress
              </h4>
              <div className="space-y-3">
                {savedJobs.filter(job => job.category === 'dream').slice(0, 2).map((job, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{job.title} at {job.company}</p>
                      <Badge variant="outline" className="text-dream border-dream/20">
                        <Star className="w-3 h-3 mr-1" />
                        Dream
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Skill match</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} className="h-1" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Missing: Advanced React, System Design, Leadership Experience
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Resources */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-500" />
                <p className="font-medium">AI-Recommended Learning Path</p>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Based on your target jobs, focus on React advanced patterns and AWS certification
              </p>
              <Button size="sm" variant="outline">
                <BookOpen className="w-4 h-4 mr-2" />
                Start Learning Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => setShowAddModal(true)}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3>Add Application</h3>
                  <p className="text-sm text-muted-foreground">
                    Track a new job application
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => onNavigate?.("analytics")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3>View Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your progress and trends
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddApplication}
      />
    </div>
  );
}
