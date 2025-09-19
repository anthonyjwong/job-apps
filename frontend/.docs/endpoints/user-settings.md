# User Settings API

Base: `/api/user/settings`

## GET /api/user/settings
- Response 200
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@email.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "title": "Senior Software Engineer",
    "experience": "5-7 years",
    "salaryMin": "120000",
    "salaryMax": "180000",
    "bio": "Experienced full-stack developer..."
  },
  "notifications": {
    "emailDigest": true,
    "applicationUpdates": true,
    "interviewReminders": true,
    "newJobMatches": false,
    "weeklyReport": true,
    "pushNotifications": true,
    "smsReminders": false
  },
  "preferences": {
    "autoApplyEnabled": false,
    "defaultApplicationStatus": "applied",
    "reminderDays": "3",
    "dataRetention": "12",
    "exportFormat": "json",
    "timezone": "America/Los_Angeles"
  },
  "privacy": {
    "profileVisible": true,
    "analyticsEnabled": true,
    "dataSharing": false,
    "marketingEmails": false
  }
}
```

## PATCH /api/user/settings
- Request: partial update
```json
{ "profile": { "firstName": "Jane" } }
```
- Response 200
```json
{ "success": true, "settings": { /* full settings */ } }
```

## POST /api/user/settings
- Request: full replacement
```json
{ /* entire UserSettings object */ }
```
- Response 200
```json
{ "success": true }
```
