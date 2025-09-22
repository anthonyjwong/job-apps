# Analytics API

Base: `/api/analytics`

## GET /api/analytics
- Response 200
```json
{
  "overview": {
    "totalApplications": 6,
    "responseRate": 67,
    "interviewRate": 50,
    "offerRate": 17,
    "avgTimeToResponse": 5.2
  },
  "classificationBreakdown": {
    "safety": { "applications": 2, "interviews": 2, "offers": 0, "interviewRate": 100, "avgTimeToResponse": 3.5 },
    "target": { "applications": 2, "interviews": 1, "offers": 0, "interviewRate": 50, "avgTimeToResponse": 4.0 },
    "reach": { "applications": 1, "interviews": 1, "offers": 1, "interviewRate": 100, "avgTimeToResponse": 7.0 },
    "dream": { "applications": 1, "interviews": 0, "offers": 0, "interviewRate": 0, "avgTimeToResponse": 0 }
  },
  "monthlyTrends": [ { "month": "Sep", "applications": 8, "interviews": 3, "offers": 1 } ],
  "weeklyActivity": [ { "week": "Week 1", "applications": 2, "interviews": 1 } ],
  "topCompanies": [ { "name": "TechCorp", "applications": 1, "interviews": 1, "offers": 0 } ],
  "skillsInDemand": [ { "skill": "React", "count": 8, "trend": "+15%" } ],
  "applicationSources": [ { "source": "Company Website", "count": 3, "percentage": 50 } ],
  "interviewTypes": [ { "type": "Phone Screen", "count": 4, "successRate": 75 } ],
  "recommendations": [ { "type": "classification_focus", "title": "Optimize Your Application Strategy", "description": "...", "priority": "high", "actionItems": ["..."] } ],
  "goalProgress": { "weeklyApplicationTarget": 5, "currentWeekApplications": 3, "weeklyInterviewTarget": 2, "currentWeekInterviews": 2, "monthlyOfferTarget": 1, "currentMonthOffers": 1 }
}
```
