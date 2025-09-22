# Applications API

Base: `/api/applications`

## GET /api/applications
- Response 200
```json
{
  "applications": [
    {
      "id": 1,
      "company": "TechCorp",
      "position": "Senior Frontend Developer",
      "status": "interviewed",
      "applicationDate": "2024-01-15",
      "location": "San Francisco",
      "salary": "$120k - $150k",
      "jobType": "full-time",
      "classification": "safety",
      "aiAction": "Highlight your React performance optimization experience in the technical discussion",
      "notes": "Really excited about this role - great culture fit"
    }
  ],
  "total": 7
}
```

## POST /api/applications
- Request
```json
{
  "company": "Acme",
  "position": "Frontend Engineer",
  "status": "submitted",
  "applicationDate": "2024-01-20",
  "location": "Remote",
  "salary": "$120k - $140k",
  "jobType": "full-time",
  "classification": "target",
  "notes": "Applied via careers page"
}
```
- Response 200
```json
{
  "application": { "id": 8, "company": "Acme", "position": "Frontend Engineer", "status": "submitted", "applicationDate": "2024-01-20", "location": "Remote", "salary": "$120k - $140k", "jobType": "full-time", "classification": "target", "aiAction": "Follow up with a personalized message highlighting your relevant experience", "notes": "Applied via careers page" },
  "message": "Application created successfully"
}
```

## PATCH /api/applications
- Request
```json
{ "id": 1, "status": "offered", "notes": "Verbal offer received" }
```
- Response 200
```json
{ "application": { "id": 1, "status": "offered", /* other fields */ }, "message": "Application updated successfully" }
```

## DELETE /api/applications?id=ID
- Response 200
```json
{ "message": "Application deleted successfully" }
```
