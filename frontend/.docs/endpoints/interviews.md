# Interviews API

Base: `/api/interviews`

## GET /api/interviews
- Response 200
```json
{
  "interviews": [
    {
      "id": "interview-1",
      "company": "TechCorp",
      "position": "Senior Frontend Developer",
      "type": "Technical",
      "date": "2024-01-25",
      "time": "2:00 PM",
      "duration": 60,
      "status": "scheduled",
      "interviewer": "Sarah Johnson",
      "notes": "Focus on React performance optimization",
      "applicationId": 1,
      "location": "Video call",
      "preparationItems": ["Review React performance patterns"]
    }
  ],
  "total": 5,
  "upcoming": 3,
  "completed": 2
}
```

## POST /api/interviews
- Request
```json
{
  "company": "Acme",
  "position": "Frontend Engineer",
  "type": "Phone Screen",
  "date": "2024-02-01",
  "time": "10:00 AM",
  "duration": 30,
  "status": "scheduled",
  "interviewer": "",
  "notes": "",
  "applicationId": 8,
  "location": "Video call",
  "preparationItems": []
}
```
- Response 200
```json
{ "interview": { "id": "interview-1700000000", /* body fields */ }, "message": "Interview scheduled successfully" }
```

## PATCH /api/interviews
- Request
```json
{ "id": "interview-1", "status": "completed" }
```
- Response 200
```json
{ "interview": { "id": "interview-1", "status": "completed" }, "message": "Interview updated successfully" }
```

## DELETE /api/interviews?id=ID
- Response 200
```json
{ "message": "Interview cancelled successfully" }
```
