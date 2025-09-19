# TechJobs API Documentation

This document outlines the backend API structure that has been implemented to replace dummy data with proper Next.js API routes.

## API Endpoints

### Applications (`/api/applications`)

**GET** - Retrieve all applications
- Returns: `{ applications: Application[], total: number }`

**POST** - Create new application
- Body: `NewApplication` object
- Returns: `{ application: Application, message: string }`

**PATCH** - Update existing application
- Body: `{ id: number, ...updates }`
- Returns: `{ application: Application, message: string }`

**DELETE** - Delete application
- Query: `?id=number`
- Returns: `{ message: string }`

### Jobs (`/api/jobs`)

**GET** - Search and filter jobs
- Query params: `search`, `category`, `location`, `type`
- Returns: `{ jobs: Job[], total: number, totalAvailable: number }`

Each job includes:
- AI-powered category classification (safety, target, reach, dream)
- AI score (interview likelihood percentage)
- AI action (specific recommendation for the candidate)

### Interviews (`/api/interviews`)

**GET** - Retrieve all interviews
- Returns: `{ interviews: Interview[], total: number, upcoming: number, completed: number }`

**POST** - Schedule new interview
- Body: `NewInterview` object
- Returns: `{ interview: Interview, message: string }`

**PATCH** - Update interview
- Body: `{ id: string, ...updates }`
- Returns: `{ interview: Interview, message: string }`

**DELETE** - Cancel interview
- Query: `?id=string`
- Returns: `{ message: string }`

### Assessments (`/api/assessments`)

**GET** - Retrieve all assessments
- Returns: `{ assessments: Assessment[], total: number, pending: number, completed: number, scheduled: number }`

**POST** - Create new assessment
- Body: `NewAssessment` object
- Returns: `{ assessment: Assessment, message: string }`

**PATCH** - Update assessment
- Body: `{ id: string, ...updates }`
- Returns: `{ assessment: Assessment, message: string }`

**DELETE** - Delete assessment
- Query: `?id=string`
- Returns: `{ message: string }`

### Analytics (`/api/analytics`)

**GET** - Retrieve comprehensive analytics
- Returns: Complete analytics object with:
  - Overview metrics (response rate, interview rate, etc.)
  - Category breakdown by AI classification
  - Monthly trends
  - Top companies
  - Skills in demand
  - Recommendations

### Saved Jobs (`/api/saved-jobs`)

**GET** - Retrieve saved jobs
- Returns: `{ savedJobs: SavedJob[], total: number }`

**POST** - Save a job
- Body: `{ jobId: string, notes?: string }`
- Returns: `{ savedJob: SavedJob, message: string }`

**DELETE** - Remove saved job
- Query: `?jobId=string`
- Returns: `{ message: string }`

### Notifications (`/api/notifications`)

**GET** - Retrieve notifications
- Query: `?unreadOnly=true` (optional)
- Returns: `{ notifications: Notification[], total: number, unreadCount: number }`

**POST** - Create notification
- Body: `NewNotification` object
- Returns: `{ notification: Notification, message: string }`

**PATCH** - Update notification (mark as read)
- Body: `{ id: string, isRead: boolean }` or `{ id: 'all' }` for mark all as read
- Returns: `{ notification?: Notification, message: string }`

## Key Features

### AI-Powered Job Classification

Jobs are automatically classified into four categories:
- **Safety** (80%+ interview likelihood) - Green
- **Target** (60-80% interview likelihood) - Blue  
- **Reach** (30-60% interview likelihood) - Orange
- **Dream** (<30% interview likelihood) - Purple

Each job includes:
- `aiScore`: Numerical interview likelihood (0-100)
- `aiAction`: Specific actionable advice for the candidate

### Comprehensive Analytics

The analytics endpoint provides:
- Overall performance metrics
- Category-specific breakdowns
- Monthly trends
- Skills analysis
- AI-powered recommendations
- Goal tracking

### Error Handling

All endpoints include proper error handling and return appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (validation errors)
- 404: Not Found
- 500: Internal Server Error

## Data Persistence

Currently, data is stored in memory within each API route file. In a production environment, this would be replaced with a proper database connection.

## Frontend Integration

All React components have been updated to use the API service (`lib/api.ts`) with:
- Proper loading states
- Error handling
- Optimistic updates where appropriate
- Real-time data synchronization