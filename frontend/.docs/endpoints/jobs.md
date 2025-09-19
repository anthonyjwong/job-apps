# Jobs API

Base: `/api/jobs`

## GET /api/jobs[?search=&category=&location=&type=]
- Query params (optional):
  - `search`: string
  - `category`: one of `safety|target|reach|dream|all`
  - `location`: string (contains match)
  - `type`: one of `full-time|part-time|contract|remote|all`
- Response 200
```json
{
  "jobs": [
    {
      "id": "job-1",
      "title": "Frontend Developer",
      "company": "TechFlow",
      "location": "San Francisco",
      "salary": "$90k - $120k",
      "type": "full-time",
      "postedDate": "2024-01-20",
      "description": "...",
      "skills": ["React", "TypeScript"],
      "category": "safety",
      "aiScore": 85,
      "aiAction": "Highlight your React portfolio projects and emphasize your TypeScript experience"
    }
  ],
  "total": 10,
  "totalAvailable": 10
}
```
