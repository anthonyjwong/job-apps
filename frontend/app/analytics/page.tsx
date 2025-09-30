import { ArrowRight, ArrowUp, Brain, Calendar, Shield, Star, Target, TrendingUp, Zap } from "lucide-react";
import { headers } from "next/headers";
import { ApplicationTrendsChart, InterviewFunnelChart, InterviewRateTrendsChart, type ApplicationTrendPoint, type InterviewFunnelStep, type WeeklyInterviewRate } from "../../components/AnalyticsCharts";
import { JobClassificationBadge } from "../../components/JobClassificationBadge";
import { StatsCard } from "../../components/StatsCard";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import type { AnalyticsData, JobClassification } from "../../lib/types";

async function getAnalytics(): Promise<AnalyticsData> {
  const baseUrl = "http://backend:8000";
  const res = await fetch(`${baseUrl}/analytics`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export default async function AnalyticsPage() {
  const analyticsData = await getAnalytics();

  // Use API data or fallback to defaults
  const totalApplications = analyticsData?.overview?.totalApplications || 0;
  const totalInterviews = Math.round(((analyticsData?.overview?.interviewRate || 0) * totalApplications) / 100);
  const totalOffers = Math.round(((analyticsData?.overview?.offerRate || 0) * totalApplications) / 100);
  const averageInterviewRate = analyticsData?.overview?.interviewRate || 0;
  const aiAccuracy = 92; // Static for now
  const careerProgress = 68; // Static for now

  // Use API data for trends and categories
  const applicationTrends: ApplicationTrendPoint[] = analyticsData?.monthlyTrends || [];
  
  const classificationPerformance = analyticsData?.classificationBreakdown ? [
    { 
      classification: "Safety", 
      applications: analyticsData.classificationBreakdown.safety.applications, 
      interviews: analyticsData.classificationBreakdown.safety.interviews, 
      interviewRate: analyticsData.classificationBreakdown.safety.interviewRate, 
      color: "hsl(var(--safety))",
      description: "High interview likelihood"
    },
    { 
      classification: "Target", 
      applications: analyticsData.classificationBreakdown.target.applications, 
      interviews: analyticsData.classificationBreakdown.target.interviews, 
      interviewRate: analyticsData.classificationBreakdown.target.interviewRate, 
      color: "hsl(var(--target))",
      description: "Good interview likelihood"
    },
    { 
      classification: "Reach", 
      applications: analyticsData.classificationBreakdown.reach.applications, 
      interviews: analyticsData.classificationBreakdown.reach.interviews, 
      interviewRate: analyticsData.classificationBreakdown.reach.interviewRate, 
      color: "hsl(var(--reach))",
      description: "Medium interview likelihood"
    },
    { 
      classification: "Dream", 
      applications: analyticsData.classificationBreakdown.dream.applications, 
      interviews: analyticsData.classificationBreakdown.dream.interviews, 
      interviewRate: analyticsData.classificationBreakdown.dream.interviewRate, 
      color: "hsl(var(--dream))",
      description: "Career aspiration tracking"
    },
  ] : [];

  const weeklyInterviewRates: WeeklyInterviewRate[] = [
    { week: "Week 1", safety: 85, target: 70, reach: 45, dream: 10 },
    { week: "Week 2", safety: 82, target: 72, reach: 48, dream: 15 },
    { week: "Week 3", safety: 88, target: 65, reach: 42, dream: 12 },
    { week: "Week 4", safety: 90, target: 75, reach: 50, dream: 20 },
    { week: "Week 5", safety: 87, target: 68, reach: 44, dream: 8 },
    { week: "Week 6", safety: 85, target: 73, reach: 47, dream: 25 },
  ];

  const interviewFunnel: InterviewFunnelStep[] = [
    { stage: "Applications", count: 112, percentage: 100 },
    { stage: "Phone Screens", count: 48, percentage: 43 },
    { stage: "Technical Rounds", count: 32, percentage: 29 },
    { stage: "Final Rounds", count: 18, percentage: 16 },
    { stage: "Offers", count: 8, percentage: 7 },
  ];

  const topCompanies = analyticsData?.topCompanies?.map((company: any) => ({
    company: company.name,
    applications: company.applications,
    interviews: company.interviews,
    status: company.interviews > 0 ? "Interviewing" : company.applications > 0 ? "Applied" : "No Status",
    classification: "target" as JobClassification // Default classification since API doesn't provide this
  })) || [];

  // Career progression data (static for now, could be made dynamic)
  const skillDevelopment = [
    { skill: "System Architecture", current: 65, target: 90, priority: "high" },
    { skill: "Technical Leadership", current: 55, target: 85, priority: "high" },
    { skill: "Distributed Systems", current: 70, target: 95, priority: "medium" },
    { skill: "Team Management", current: 40, target: 80, priority: "medium" },
    { skill: "Mentoring", current: 60, target: 85, priority: "low" },
  ];

  return (
    <>
      <h1 className="sr-only">Analytics</h1>
      <div className="p-6 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1>Interview Success Analytics</h1>
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
              <Brain className="w-3 h-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Track your interview success with AI-powered insights and monitor career progression toward dream roles
          </p>
        </div>

        {/* Key Interview Success Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <StatsCard
            title="Interview Rate"
            value={`${averageInterviewRate}%`}
            iconName="target"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Total Interviews"
            value={totalInterviews.toString()}
            iconName="users"
            trend={{ value: 28, isPositive: true }}
          />
          <StatsCard
            title="AI Accuracy"
            value={`${aiAccuracy}%`}
            iconName="brain"
            trend={{ value: 3.5, isPositive: true }}
          />
          <StatsCard
            title="Applications"
            value={totalApplications.toString()}
            iconName="zap"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Career Progress"
            value={`${careerProgress}%`}
            iconName="star"
            trend={{ value: 15, isPositive: true }}
          />
          <StatsCard
            title="Offers"
            value={totalOffers.toString()}
            iconName="trending-up"
            trend={{ value: 25, isPositive: true }}
          />
        </div>

        {/* AI Category Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              AI Category Performance
            </CardTitle>
            <CardDescription>
              Interview success rates by AI-predicted job categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {classificationPerformance.map((classification) => (
                <Card key={classification.classification} className={`border-2`} style={{ borderColor: classification.color + '20' }}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <JobClassificationBadge classification={classification.classification.toLowerCase() as JobClassification} size="sm" />
                        <div className="text-right">
                          <div className="text-2xl font-medium" style={{ color: classification.color }}>
                            {classification.interviewRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">Interview Rate</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Applications:</span>
                          <span className="font-medium">{classification.applications}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Interviews:</span>
                          <span className="font-medium">{classification.interviews}</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${classification.interviewRate}%`, 
                            backgroundColor: classification.color 
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{classification.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Weekly Interview Rate Trends by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Rate Trends</CardTitle>
              <CardDescription>
                Weekly interview success rates by AI classification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InterviewRateTrendsChart data={weeklyInterviewRates} />
            </CardContent>
          </Card>

          {/* Interview Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Interview Success Funnel</CardTitle>
              <CardDescription>
                Your progression from application to offer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InterviewFunnelChart data={interviewFunnel} />
            </CardContent>
          </Card>

          {/* Application Volume Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Application & Interview Trends</CardTitle>
              <CardDescription>
                Monthly progression of applications and interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApplicationTrendsChart data={applicationTrends} />
            </CardContent>
          </Card>

          {/* Career Progression Skills Gap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-dream" />
                Career Progression Skills
              </CardTitle>
              <CardDescription>
                Progress toward dream role requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillDevelopment.map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            skill.priority === 'high' ? 'border-destructive text-destructive' :
                            skill.priority === 'medium' ? 'border-reach text-reach' :
                            'border-muted-foreground text-muted-foreground'
                          }`}
                        >
                          {skill.priority} priority
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {skill.current}% → {skill.target}%
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-dream/60 to-dream" 
                        style={{ width: `${skill.current}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Performance by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Company Performance Analysis</CardTitle>
            <CardDescription>
              Interview success rates by company and AI classification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCompanies.map((company: any, index: number) => (
                <div key={company.company} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{company.company}</div>
                        <JobClassificationBadge classification={company.classification} size="sm" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {company.applications} applications • {company.interviews} interviews
                        {company.interviews > 0 && (
                          <span className="ml-2 text-primary">
                            ({Math.round((company.interviews / company.applications) * 100)}% interview rate)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.interviews > 0 && company.applications > 0 && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <ArrowUp className="w-3 h-3" />
                        Strong match
                      </div>
                    )}
                    <Badge 
                      variant={
                        company.status === "Offer" ? "default" :
                        company.status === "Interviewing" || company.status === "Assessment" ? "secondary" :
                        company.status === "Rejected" ? "destructive" : "outline"
                      }
                    >
                      {company.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI-Powered Insights & Recommendations */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Interview Success Insights
              </CardTitle>
              <CardDescription>
                AI-powered recommendations to maximize interview opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-safety/10 border border-safety/20 rounded-lg">
                  <Shield className="w-5 h-5 text-safety mt-0.5" />
                  <div>
                    <div className="font-medium">Excellent Safety Performance</div>
                    <p className="text-sm text-muted-foreground">
                      Your 80% interview rate on safety jobs is outstanding! Continue focusing on similar roles to maintain momentum.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-target/10 border border-target/20 rounded-lg">
                  <Target className="w-5 h-5 text-target mt-0.5" />
                  <div>
                    <div className="font-medium">Strong Target Category Results</div>
                    <p className="text-sm text-muted-foreground">
                      69% interview rate on target jobs shows great profile alignment. Increase applications in this classification.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-reach/10 border border-reach/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-reach mt-0.5" />
                  <div>
                    <div className="font-medium">Reach Category Growth</div>
                    <p className="text-sm text-muted-foreground">
                      43% interview rate on reach jobs shows potential. Focus on skill development to improve this rate.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-dream" />
                Career Progression Insights
              </CardTitle>
              <CardDescription>
                Strategic guidance for achieving your dream roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-dream/10 border border-dream/20 rounded-lg">
                  <Star className="w-5 h-5 text-dream mt-0.5" />
                  <div>
                    <div className="font-medium">Dream Role Progress</div>
                    <p className="text-sm text-muted-foreground">
                      You've tracked 7 dream roles. Focus on developing System Architecture and Technical Leadership skills.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <ArrowRight className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Skill Development Priority</div>
                    <p className="text-sm text-muted-foreground">
                      Based on dream role analysis, prioritize System Architecture (65→90%) and Technical Leadership (55→85%).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-chart-4 mt-0.5" />
                  <div>
                    <div className="font-medium">Strategic Timeline</div>
                    <p className="text-sm text-muted-foreground">
                      Continue building experience with current interview success while developing skills for future dream roles.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Recommended Actions
            </CardTitle>
            <CardDescription>
              Strategic next steps to maximize interview success and career growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <h4 className="font-medium">Interview Success Focus</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-safety" />
                    <span>Apply to 15+ safety jobs this month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-target" />
                    <span>Increase target applications by 25%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-reach" />
                    <span>Prepare thoroughly for reach interviews</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium">Career Development</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-dream" />
                    <span>Complete System Architecture course</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-dream" />
                    <span>Seek technical leadership opportunities</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-dream" />
                    <span>Track 2-3 new dream roles this quarter</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}