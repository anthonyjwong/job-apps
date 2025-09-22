# Saved Jobs API

Base: `/api/saved-jobs`

## GET /api/saved-jobs
- Response 200
```json
{
  "savedJobs": [
    {
      "id": "saved-1",
      "jobId": "job-2",
      "userId": "user-1",
      "savedDate": "2024-01-20",
      "notes": "Interesting remote opportunity, good tech stack",
      "jobDetails": { "title": "Senior Full Stack Engineer", "company": "InnovateCorp", "location": "Remote", "salary": "$120k - $150k", "classification": "target" }
    }
  ],
  "total": 3
}
```

## POST /api/saved-jobs
- Request
```json
{ "jobId": "job-2", "notes": "optional", "jobDetails": { "title": "..." } }
```
- Response 200
```json
{ "savedJob": { "id": "saved-123", "jobId": "job-2", "userId": "user-1", "savedDate": "2024-01-21", "notes": "optional", "jobDetails": {} }, "message": "Job saved successfully" }
```

## PATCH /api/saved-jobs
- Request
```json
{ "id": "saved-1", "notes": "Updated notes" }
```
- Response 200
```json
{ "savedJob": { "id": "saved-1", "notes": "Updated notes" }, "message": "Saved job updated successfully" }
```

## DELETE /api/saved-jobs?jobId=JOB_ID
- Response 200
```json
{ "message": "Job removed from saved jobs" }
```
