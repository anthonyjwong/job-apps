import { NextRequest, NextResponse } from 'next/server';

// Generate analytics data based on application data
export async function GET() {
  try {
    const analytics = {
      overview: {
        totalApplications: 6,
        responseRate: 67, // 4 out of 6 got responses
        interviewRate: 50, // 3 out of 6 got interviews
        offerRate: 17, // 1 out of 6 got offers
        avgTimeToResponse: 5.2 // days
      },
      categoryBreakdown: {
        safety: {
          applications: 2,
          interviews: 2,
          offers: 0,
          interviewRate: 100,
          avgTimeToResponse: 3.5
        },
        target: {
          applications: 2,
          interviews: 1,
          offers: 0,
          interviewRate: 50,
          avgTimeToResponse: 4.0
        },
        reach: {
          applications: 1,
          interviews: 1,
          offers: 1,
          interviewRate: 100,
          avgTimeToResponse: 7.0
        },
        dream: {
          applications: 1,
          interviews: 0,
          offers: 0,
          interviewRate: 0,
          avgTimeToResponse: 0
        }
      },
      monthlyTrends: [
        { month: "Sep", applications: 8, interviews: 3, offers: 1 },
        { month: "Oct", applications: 12, interviews: 5, offers: 0 },
        { month: "Nov", applications: 15, interviews: 8, offers: 2 },
        { month: "Dec", applications: 10, interviews: 6, offers: 1 },
        { month: "Jan", applications: 6, interviews: 3, offers: 1 }
      ],
      weeklyActivity: [
        { week: "Week 1", applications: 2, interviews: 1 },
        { week: "Week 2", applications: 1, interviews: 0 },
        { week: "Week 3", applications: 3, interviews: 2 },
        { week: "Week 4", applications: 0, interviews: 0 }
      ],
      topCompanies: [
        { name: "TechCorp", applications: 1, interviews: 1, offers: 0 },
        { name: "StartupXYZ", applications: 1, interviews: 1, offers: 0 },
        { name: "InnovateLabs", applications: 1, interviews: 1, offers: 1 },
        { name: "BigTech Inc", applications: 1, interviews: 0, offers: 0 },
        { name: "GrowthCo", applications: 1, interviews: 1, offers: 0 },
        { name: "DataDriven", applications: 1, interviews: 1, offers: 0 }
      ],
      skillsInDemand: [
        { skill: "React", count: 8, trend: "+15%" },
        { skill: "TypeScript", count: 6, trend: "+25%" },
        { skill: "Node.js", count: 4, trend: "+10%" },
        { skill: "AWS", count: 3, trend: "+40%" },
        { skill: "Python", count: 3, trend: "+5%" },
        { skill: "Kubernetes", count: 2, trend: "+60%" }
      ],
      applicationSources: [
        { source: "Company Website", count: 3, percentage: 50 },
        { source: "LinkedIn", count: 2, percentage: 33 },
        { source: "Referral", count: 1, percentage: 17 }
      ],
      interviewTypes: [
        { type: "Phone Screen", count: 4, successRate: 75 },
        { type: "Technical", count: 3, successRate: 67 },
        { type: "Final", count: 1, successRate: 100 },
        { type: "Cultural Fit", count: 2, successRate: 50 }
      ],
      recommendations: [
        {
          type: "category_focus",
          title: "Optimize Your Application Strategy",
          description: "Your safety applications have a 100% interview rate. Consider applying to more safety category jobs to maximize interviews.",
          priority: "high",
          actionItems: [
            "Apply to 2-3 more safety category positions this week",
            "Use successful safety applications as templates",
            "Focus 60% of applications on safety roles"
          ]
        },
        {
          type: "skill_development",
          title: "Trending Skill: AWS",
          description: "AWS is showing +40% growth in job postings. Consider strengthening your cloud skills.",
          priority: "medium",
          actionItems: [
            "Complete AWS fundamentals course",
            "Add AWS projects to portfolio",
            "Highlight existing cloud experience"
          ]
        },
        {
          type: "follow_up",
          title: "Follow Up Opportunities",
          description: "You have applications with no response after 7+ days. Consider following up.",
          priority: "medium",
          actionItems: [
            "Send follow-up emails to BigTech Inc and DataDriven",
            "Use LinkedIn to connect with hiring managers",
            "Prepare personalized follow-up messages"
          ]
        }
      ],
      goalProgress: {
        weeklyApplicationTarget: 5,
        currentWeekApplications: 3,
        weeklyInterviewTarget: 2,
        currentWeekInterviews: 2,
        monthlyOfferTarget: 1,
        currentMonthOffers: 1
      }
    };

    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}