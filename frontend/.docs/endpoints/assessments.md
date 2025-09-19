# Assessments API

Base: `/api/assessments`

## GET /api/assessments
- Response 200
```json
{
  "assessments": [
    {
      "id": "assessment-1",
      "company": "TechCorp",
      "position": "Senior Frontend Developer",
      "type": "Take-home",
      "title": "React Dashboard Component",
      "description": "Build a responsive dashboard component with charts and real-time data",
      "dueDate": "2024-01-28",
      "timeLimit": "4 hours",
      "status": "pending",
      "applicationId": 1,
      "instructions": "Create a React component...",
      "submissionUrl": "",
      "notes": "Focus on component architecture and performance",
      "estimatedEffort": "Medium",
      "skills": ["React", "TypeScript"]
    }
  ],
  "total": 5,
  "pending": 3,
  "completed": 1,
  "scheduled": 1
}
```

## POST /api/assessments
- Request
```json
{
  "company": "Acme",
  "position": "Frontend Engineer",
  "type": "Take-home",
  "title": "UI Coding Task",
  "description": "Build a small UI",
  "dueDate": "2024-02-05",
  "timeLimit": "4 hours",
  "status": "pending",
  "applicationId": 8,
  "instructions": "",
  "submissionUrl": "",
  "notes": "",
  "estimatedEffort": "Medium",
  "skills": []
}
```
- Response 200
```json
{ "assessment": { "id": "assessment-1700000000", /* body fields */ }, "message": "Assessment created successfully" }
```

## PATCH /api/assessments
- Request
```json
{ "id": "assessment-1", "status": "completed" }
```
- Response 200
```json
{ "assessment": { "id": "assessment-1", "status": "completed" }, "message": "Assessment updated successfully" }
```

## DELETE /api/assessments?id=ID
- Response 200
```json
{ "message": "Assessment deleted successfully" }
```
