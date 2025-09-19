# Notifications API

Base: `/api/notifications`

## GET /api/notifications[?unreadOnly=true]
- Query params:
  - `unreadOnly`: `true|false` (optional)
- Response 200
```json
{
  "notifications": [
    {
      "id": "notif-1",
      "type": "interview_scheduled",
      "title": "Interview Scheduled",
      "message": "Technical interview with TechCorp scheduled for Jan 25, 2:00 PM",
      "timestamp": "2024-01-23T10:30:00Z",
      "isRead": false,
      "priority": "high",
      "actionUrl": "/interviews",
      "metadata": { "company": "TechCorp", "position": "Senior Frontend Developer" }
    }
  ],
  "total": 7,
  "unreadCount": 2
}
```

## POST /api/notifications
- Request
```json
{ "type": "general", "title": "...", "message": "...", "priority": "medium", "actionUrl": "", "metadata": {} }
```
- Response 200
```json
{ "notification": { "id": "notif-1700000000", /* body fields */ }, "message": "Notification created successfully" }
```

## PATCH /api/notifications
- Request: mark all read
```json
{ "id": "all" }
```
- Request: update one
```json
{ "id": "notif-1", "isRead": true }
```
- Response 200
```json
{ "notification": { "id": "notif-1", "isRead": true }, "message": "Notification updated successfully" }
```

## DELETE /api/notifications?id=ID
- Response 200
```json
{ "message": "Notification deleted successfully" }
```
