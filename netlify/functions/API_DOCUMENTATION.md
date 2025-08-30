# Human or AI Quiz - API Documentation

## Overview

The Human or AI Quiz API provides endpoints for managing user authentication, game sessions, guesses, and user profiles. All endpoints are built as serverless functions and include comprehensive error handling, rate limiting, and security features.

**Base URL:** `/.netlify/functions/`

## Authentication

The API uses Netlify Identity for authentication. Include the user's JWT token in requests that require authentication.

### Headers Required for Authenticated Endpoints:
```
Authorization: Bearer <jwt_token>
```

## Rate Limiting

All endpoints implement rate limiting to prevent abuse:
- **Authentication endpoints:** 5 requests per 15 minutes
- **API endpoints:** 60 requests per minute  
- **Read-only endpoints:** 200 requests per minute
- **Expensive operations:** 10 requests per minute
- **Admin endpoints:** 30 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 2025-01-15T12:30:00.000Z
```

## Endpoints

### 1. Health Check
**Endpoint:** `GET /health-check`  
**Authentication:** None required  
**Rate Limit:** Read-only (200/min)

Check the health status of the API and database.

**Query Parameters:**
- `details` (optional): Set to `"true"` to include detailed system information

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "database": "up",
    "auth": "up"
  },
  "uptime": 3600,
  "memory": {
    "used": 45,
    "total": 128
  }
}
```

### 2. User Authentication Sync
**Endpoint:** `POST /auth-sync`  
**Authentication:** Required  
**Rate Limit:** Auth (5/15min)

Synchronize user data with the database after authentication.

**Response:**
```json
{
  "ok": true,
  "id": "user-uuid",
  "handle": "username"
}
```

### 3. Start Game Session
**Endpoint:** `POST /start-session`  
**Authentication:** Required  
**Rate Limit:** API (60/min)

Create a new game session for the authenticated user.

**Request Body:**
```json
{
  "category_filter": [1, 2, 3]  // Optional array of category IDs
}
```

**Response:**
```json
{
  "session_id": "session-uuid"
}
```

### 4. Get Next Question
**Endpoint:** `GET /next-question?session_id=<session_id>`  
**Authentication:** Required  
**Rate Limit:** API (60/min)

Retrieve the next question for an active game session.

**Query Parameters:**
- `session_id` (required): UUID of the active session

**Response:**
```json
{
  "id": 123,
  "text": "Sample passage text...",
  "category_name": "Literature",
  "css_category": "literature",
  "theme_tokens": {
    "primaryColor": "#3b82f6",
    "icon": "book"
  }
}
```

### 5. Submit Guess
**Endpoint:** `POST /submit-guess`  
**Authentication:** Required  
**Rate Limit:** API (60/min)

Submit a guess for a passage in the current session.

**Request Body:**
```json
{
  "session_id": "session-uuid",
  "passage_id": 123,
  "guess_source": "ai",  // "ai" or "human"
  "time_ms": 5000        // Optional response time in milliseconds
}
```

**Response:**
```json
{
  "correct": true,
  "truth": "ai",
  "score": 15,
  "streak": 3
}
```

### 6. User Profile Management
**Endpoint:** `GET|PUT|DELETE /user-profile`  
**Authentication:** Required  
**Rate Limit:** API (30/min)

Manage user profile information.

#### Get Profile
**Method:** `GET`

**Response:**
```json
{
  "id": "user-uuid",
  "handle": "username",
  "created_at": "2025-01-01T00:00:00.000Z",
  "stats": {
    "user_id": "user-uuid",
    "games_played": 25,
    "total_questions": 150,
    "correct": 120,
    "streak_best": 12,
    "last_played_at": "2025-01-15T12:00:00.000Z"
  },
  "additionalStats": {
    "totalSessions": 25,
    "averageScore": 8.5,
    "bestScore": 15,
    "averageResponseTime": 4500,
    "accuracyPercentage": 80.0,
    "daysPlayed": 12
  }
}
```

#### Update Profile  
**Method:** `PUT`

**Request Body:**
```json
{
  "handle": "new_username"  // Optional
}
```

#### Delete Profile
**Method:** `DELETE`

Anonymizes user data while preserving game statistics.

### 7. Session History
**Endpoint:** `GET /session-history`  
**Authentication:** Required  
**Rate Limit:** Read-only (100/min)

Retrieve the user's game session history with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "sessions": [
    {
      "id": "session-uuid",
      "status": "closed",
      "score": 8,
      "streak": 5,
      "questions_answered": 10,
      "category_filter": [1, 2],
      "started_at": "2025-01-15T10:00:00.000Z",
      "ended_at": "2025-01-15T10:15:00.000Z",
      "duration": 900,
      "accuracy": 80.0,
      "avg_response_time": 4500,
      "performance_rating": "good"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 8. Submit Feedback
**Endpoint:** `POST /feedback`  
**Authentication:** Optional  
**Rate Limit:** Strict (5/hour)

Submit user feedback (bug reports, feature requests, general feedback).

**Request Body:**
```json
{
  "type": "bug",  // "bug", "feature", or "general"
  "title": "Issue with question loading",
  "message": "Detailed description of the issue...",
  "metadata": {    // Optional additional context
    "url": "/game",
    "browser": "Chrome 91"
  }
}
```

**Response:**
```json
{
  "id": "feedback-uuid",
  "status": "received",
  "message": "Thank you for your feedback! We appreciate you taking the time to help us improve."
}
```

### 9. Leaderboard
**Endpoint:** `GET /leaderboard`  
**Authentication:** None required  
**Rate Limit:** Read-only (200/min)

Get the global leaderboard (existing endpoint - enhanced with caching).

### 10. User Statistics
**Endpoint:** `GET /me-stats`  
**Authentication:** Required  
**Rate Limit:** Read-only (100/min)

Get detailed statistics for the authenticated user (existing endpoint).

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "details": {
    // Additional error context when available
  }
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `409` - Conflict (e.g., duplicate handle)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Data Types

### SourceType
```typescript
type SourceType = 'ai' | 'human';
```

### SessionStatus
```typescript
type SessionStatus = 'open' | 'closed';
```

### FeedbackType
```typescript
type FeedbackType = 'bug' | 'feature' | 'general';
```

## Security Features

1. **Authentication:** Netlify Identity integration
2. **Rate Limiting:** Per-endpoint and per-user limits
3. **Input Validation:** Comprehensive request validation
4. **CORS:** Configurable cross-origin requests
5. **Error Sanitization:** No sensitive data in error responses
6. **Session Security:** Anti-cheat and suspicious activity detection
7. **Database Security:** SQL injection protection and parameterized queries

## Middleware

The API includes several middleware layers:

1. **CORS Middleware:** Handles cross-origin requests
2. **Rate Limiting Middleware:** Prevents abuse
3. **Validation Middleware:** Validates request data
4. **Authentication Middleware:** Handles user authentication
5. **Error Handling Middleware:** Consistent error responses

## Database Schema Notes

The API assumes the following additional tables for new features:

```sql
-- Feedback table (add to schema)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Development vs Production

### Development Features:
- Detailed logging
- Permissive CORS
- Lower rate limits
- Extended error details

### Production Features:
- Structured JSON logging
- Strict CORS policies
- Production rate limits
- Minimal error exposure
- Health monitoring integration

## Monitoring & Logging

All endpoints include:
- Request/response logging
- Performance monitoring
- Error tracking
- Health check endpoints
- Rate limit monitoring

## Usage Examples

### JavaScript/TypeScript Client
```typescript
// Authentication required endpoints
const response = await fetch('/.netlify/functions/start-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    category_filter: [1, 2, 3]
  })
});

const data = await response.json();
```

### Error Handling Example
```typescript
try {
  const response = await fetch('/.netlify/functions/user-profile');
  
  if (!response.ok) {
    const error = await response.json();
    console.error(`API Error: ${error.message}`);
    
    if (response.status === 429) {
      // Handle rate limit
      const retryAfter = response.headers.get('Retry-After');
      console.log(`Rate limited. Retry after ${retryAfter} seconds`);
    }
    
    return;
  }
  
  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('Network error:', error);
}
```

## API Versioning

Currently using v1 (implicit). Future versions will use explicit versioning in the URL path.

---

For additional questions or issues, please use the `/feedback` endpoint or contact the development team.