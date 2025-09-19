"use client";

import { createApplicationAction } from "@/app/actions";
import type { Application, Assessment, Interview, NewApplication } from "@/lib/types";
import { ArrowRight, Bell, Brain, Calendar, Clock, Plus, Shield, Star, Target, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AddApplicationModal } from "./AddApplicationModal";
import { ApplicationItem } from "./ApplicationItem";
import { JobCategoryBadge } from "./JobCategoryBadge";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

type HomeInteractiveProps = {
  interviews: Interview[];
  assessments: Assessment[];
  applications: Application[];
  stats: {
    totalApplications: number;
    responseRate: number;
    thisWeekApplications: number;
    weeklyGoal: number;
    goalProgress: number;
    categoryStats: Record<"safety"|"target"|"reach"|"dream", number>;
    categorySuccessRates: Record<"safety"|"target"|"reach"|"dream", number>;
  };
};

export function HomeInteractive({ interviews, assessments, applications, stats }: HomeInteractiveProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [apps, setApps] = useState(applications);

  const recentActivity = [
    ...interviews.slice(0, 2).map(interview => ({
      type: "interview" as const,
      company: interview.company,
      action: "Interview scheduled",
      time: "2 hours ago",
    })),
    ...applications.slice(0, 2).map(app => ({
      type: "application" as const,
      company: app.company,
      action: "Application submitted",
      time: "1 day ago",
    })),
  ].slice(0, 3);

  const handleAddApplication = async (newApp: NewApplication) => {
    const resp = await createApplicationAction(newApp);
    if (resp.success) {
      setApps(prev => [{ id: resp.id ?? Math.random(), ...newApp }, ...prev]);
      (window as any).showToast?.({ type: "success", title: "Saved", message: "Application added" });
    } else {
      (window as any).showToast?.({ type: "error", title: "Error", message: resp.message ?? "Failed to add application" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with Welcome Message */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h1>Good morning, Alex!</h1>
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            <Brain className="w-3 h-3 mr-1" />
            AI-Powered
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Land more interviews with AI-powered job classification. Track dream roles to plan your career growth journey.
        </p>
      </div>

      {/* AI-Powered Category Breakdown */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-safety/20 bg-gradient-to-br from-safety/5 to-safety/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-safety" />
                  <p className="text-sm text-muted-foreground">Safety Jobs</p>
                </div>
                <p className="text-2xl font-medium">{stats.categoryStats.safety}</p>
                <p className="text-xs text-safety font-medium">{stats.categorySuccessRates.safety}% interview rate</p>
              </div>
              <JobCategoryBadge category="safety" size="sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-target/20 bg-gradient-to-br from-target/5 to-target/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-target" />
                  <p className="text-sm text-muted-foreground">Target Jobs</p>
                </div>
                <p className="text-2xl font-medium">{stats.categoryStats.target}</p>
                <p className="text-xs text-target font-medium">{stats.categorySuccessRates.target}% interview rate</p>
              </div>
              <JobCategoryBadge category="target" size="sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-reach/20 bg-gradient-to-br from-reach/5 to-reach/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-reach" />
                  <p className="text-sm text-muted-foreground">Reach Jobs</p>
                </div>
                <p className="text-2xl font-medium">{stats.categoryStats.reach}</p>
                <p className="text-xs text-reach font-medium">{stats.categorySuccessRates.reach}% interview rate</p>
              </div>
              <JobCategoryBadge category="reach" size="sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-dream/20 bg-gradient-to-br from-dream/5 to-dream/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-dream" />
                  <p className="text-sm text-muted-foreground">Dream Jobs</p>
                </div>
                <p className="text-2xl font-medium">{stats.categoryStats.dream}</p>
                <p className="text-xs text-dream font-medium">Career Goals</p>
              </div>
              <JobCategoryBadge category="dream" size="sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Applications</p>
                <p className="text-lg font-medium">{stats.totalApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-2 mt-1.5" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Response Rate</p>
                <p className="text-lg font-medium">{isFinite(stats.responseRate) ? stats.responseRate : 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-3 mt-1.5" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Interviews</p>
                <p className="text-lg font-medium">{interviews.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-chart-4 mt-1.5" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Assessments</p>
                <p className="text-lg font-medium">{assessments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights & Goals */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Insights & Recommendations
            </CardTitle>
            <CardDescription>Strategic guidance based on your application portfolio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-safety/10 border border-safety/20">
                <Shield className="w-4 h-4 text-safety mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Strong interview potential</p>
                  <p className="text-xs text-muted-foreground">{stats.categoryStats.safety} safety applications with {stats.categorySuccessRates.safety}% interview rate</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-reach/10 border border-reach/20">
                <TrendingUp className="w-4 h-4 text-reach mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Stretch your capabilities</p>
                  <p className="text-xs text-muted-foreground">Reach applications show {stats.categorySuccessRates.reach}% interview rate</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-dream/10 border border-dream/20">
                <Star className="w-4 h-4 text-dream mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Building towards your future</p>
                  <p className="text-xs text-muted-foreground">Track {stats.categoryStats.dream} dream roles to understand career progression and skill gaps</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weekly Goal</CardTitle>
            <CardDescription>Interview-focused application strategy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm">Progress</span><span className="text-sm font-medium">{stats.thisWeekApplications}/{stats.weeklyGoal}</span></div>
              <Progress value={stats.goalProgress} className="h-2" />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Focus on interview success:</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-safety" />Safety</span><span>50%</span></div>
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-target" />Target</span><span>35%</span></div>
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-reach" />Reach</span><span>15%</span></div>
                <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-dream" />Dream</span><span>Career goals</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setShowAddModal(true)}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"><Plus className="w-5 h-5 text-primary-foreground" /></div>
                <div>
                  <h3>Add New Application</h3>
                  <p className="text-sm text-muted-foreground">Track a new job application</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="transition-colors hover:bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Link href="/jobs" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center"><Brain className="w-5 h-5 text-primary-foreground" /></div>
                <div>
                  <h3>AI Job Discovery</h3>
                  <p className="text-sm text-muted-foreground">1,198 opportunities, AI-classified</p>
                </div>
              </Link>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Interviews, Assessments, Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between"><span>Upcoming Interviews</span><Badge variant="secondary">{interviews.length}</Badge></CardTitle>
            <CardDescription>Your scheduled interviews this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {interviews.length > 0 ? interviews.map((interview, index) => (
              <div key={index} className="space-y-2 p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between"><div className="font-medium">{interview.company}</div><Badge variant="outline">{interview.type}</Badge></div>
                <p className="text-sm text-muted-foreground truncate">{interview.position}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{interview.date} at {interview.time}</div>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No upcoming interviews</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between"><span>Pending Assessments</span><Badge variant="secondary">{assessments.length}</Badge></CardTitle>
            <CardDescription>Coding challenges and take-home projects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assessments.length > 0 ? assessments.map((assessment, index) => (
              <div key={index} className="space-y-2 p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between"><div className="font-medium">{assessment.company}</div><Badge variant="outline">{assessment.type}</Badge></div>
                <p className="text-sm text-muted-foreground truncate">{assessment.position}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="w-3 h-3" />Due: {assessment.dueDate}</div>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No pending assessments</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Recent Activity</CardTitle>
            <CardDescription>Latest updates on your job search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${activity.type === "interview" ? "bg-chart-2" : activity.type === "application" ? "bg-chart-1" : "bg-chart-3"}`} />
                <div className="space-y-1">
                  <p className="text-sm">{activity.action}</p>
                  <p className="text-sm font-medium">{activity.company}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
              <Link href="/analytics">View All Activity<ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Applications</span>
            <Button size="sm" variant="ghost" onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />Add Application
            </Button>
          </CardTitle>
          <CardDescription>Your latest job applications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apps.slice(0, 5).map((application) => (
              <ApplicationItem key={application.id} company={application.company} position={application.position} status={application.status} category={application.category} />
            ))}
            {apps.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full mt-4" asChild>
                <Link href="/applications">View All Applications<ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AddApplicationModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddApplication} />
    </div>
  );
}
