import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';
import { withCors } from './middleware/cors';
import { withValidation, validators } from './middleware/validation';
import { withRateLimit, rateLimitPresets } from './middleware/rate-limiter';
import type { SessionHistoryResponse, PaginatedResponse } from './types/index';

// Rate limit for session history (more generous for read operations)
const historyRateLimit = withRateLimit({
  ...rateLimitPresets.readonly,
  max: 100 // 100 requests per minute
});

export const handler: Handler = withCors()(
  historyRateLimit(
    withValidation(validators.pagination(), 'query')(async (event, context) => {
      // Only allow GET requests
      if (event.httpMethod !== 'GET') {
        return {
          statusCode: 405,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Method Not Allowed',
            message: 'Only GET requests are allowed',
            allowedMethods: ['GET'],
            timestamp: new Date().toISOString()
          })
        };
      }

      try {
        const user = requireUser(context);
        const { page = 1, limit = 20 } = (event as any).validatedData;
        
        // Ensure reasonable pagination limits
        const safeLimit = Math.min(limit, 100);
        const offset = (page - 1) * safeLimit;

        // Get total count of sessions
        const [countResult] = await sql`
          SELECT COUNT(*) as total
          FROM game_sessions
          WHERE user_id = ${user.sub}::uuid
        `;

        const total = parseInt(countResult.total);
        const totalPages = Math.ceil(total / safeLimit);

        // Get session history with detailed information
        const sessions = await sql`
          SELECT 
            gs.id,
            gs.status,
            gs.score,
            gs.streak,
            gs.questions_answered,
            gs.category_filter,
            gs.started_at,
            gs.ended_at,
            -- Calculate session duration
            CASE 
              WHEN gs.ended_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (gs.ended_at - gs.started_at))::INTEGER
              ELSE NULL 
            END as duration_seconds,
            -- Calculate accuracy
            CASE 
              WHEN gs.questions_answered > 0 
              THEN ROUND((gs.score::NUMERIC / gs.questions_answered * 100), 2)
              ELSE NULL 
            END as accuracy_percentage,
            -- Get guess details
            COUNT(g.id) as total_guesses,
            COUNT(CASE WHEN g.is_correct THEN 1 END) as correct_guesses,
            COALESCE(AVG(g.time_ms), 0) as avg_response_time,
            COALESCE(MIN(g.time_ms), 0) as fastest_response,
            COALESCE(MAX(g.time_ms), 0) as slowest_response,
            -- Get category names for filters
            ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as category_names
          FROM game_sessions gs
          LEFT JOIN guesses g ON gs.id = g.session_id
          LEFT JOIN passages p ON g.passage_id = p.id
          LEFT JOIN categories c ON (
            p.category_id = c.id AND 
            (array_length(gs.category_filter, 1) IS NULL OR c.id = ANY(gs.category_filter))
          )
          WHERE gs.user_id = ${user.sub}::uuid
          GROUP BY gs.id, gs.status, gs.score, gs.streak, gs.questions_answered, 
                   gs.category_filter, gs.started_at, gs.ended_at
          ORDER BY gs.started_at DESC
          LIMIT ${safeLimit} OFFSET ${offset}
        `;

        // Process and enhance session data
        const enhancedSessions = sessions.map((session: any) => ({
          ...session,
          duration: session.duration_seconds,
          accuracy: session.questions_answered > 0 
            ? Math.round((session.score / session.questions_answered) * 100 * 100) / 100
            : null,
          avg_response_time: Math.round(session.avg_response_time || 0),
          fastest_response: session.fastest_response || null,
          slowest_response: session.slowest_response || null,
          category_names: session.category_names || [],
          performance_rating: calculatePerformanceRating(session)
        }));

        // Get summary statistics for the user
        const [summaryStats] = await sql`
          SELECT 
            COUNT(*) as total_sessions,
            COUNT(CASE WHEN status = 'closed' THEN 1 END) as completed_sessions,
            COALESCE(AVG(score), 0) as avg_score,
            COALESCE(MAX(score), 0) as best_score,
            COALESCE(MAX(streak), 0) as best_streak,
            COALESCE(AVG(CASE 
              WHEN questions_answered > 0 
              THEN (score::NUMERIC / questions_answered * 100) 
              ELSE NULL 
            END), 0) as avg_accuracy,
            COALESCE(AVG(EXTRACT(EPOCH FROM (ended_at - started_at))), 0) as avg_session_duration
          FROM game_sessions
          WHERE user_id = ${user.sub}::uuid
        `;

        const response: SessionHistoryResponse = {
          sessions: enhancedSessions,
          total,
          page,
          limit: safeLimit,
          pagination: {
            page,
            limit: safeLimit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          summary: {
            totalSessions: parseInt(summaryStats.total_sessions),
            completedSessions: parseInt(summaryStats.completed_sessions),
            averageScore: Math.round((summaryStats.avg_score || 0) * 100) / 100,
            bestScore: summaryStats.best_score || 0,
            bestStreak: summaryStats.best_streak || 0,
            averageAccuracy: Math.round((summaryStats.avg_accuracy || 0) * 100) / 100,
            averageSessionDuration: Math.round(summaryStats.avg_session_duration || 0)
          }
        };

        return {
          statusCode: 200,
          headers: { 
            'Content-Type': 'application/json',
            'X-Total-Count': total.toString(),
            'X-Total-Pages': totalPages.toString()
          },
          body: JSON.stringify(response)
        };

      } catch (error: any) {
        console.error('Session history error:', error);

        return {
          statusCode: error.statusCode || 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: error.name || 'Session History Error',
            message: error.message || 'Failed to retrieve session history',
            timestamp: new Date().toISOString()
          })
        };
      }
    })
  )
);

// Calculate performance rating based on session metrics
function calculatePerformanceRating(session: any): string {
  if (!session.questions_answered || session.questions_answered === 0) {
    return 'incomplete';
  }

  const accuracy = (session.score / session.questions_answered) * 100;
  const avgTime = session.avg_response_time || 0;

  // Performance rating logic
  if (accuracy >= 90 && avgTime <= 5000) {
    return 'excellent';
  } else if (accuracy >= 80 && avgTime <= 8000) {
    return 'great';
  } else if (accuracy >= 70 && avgTime <= 12000) {
    return 'good';
  } else if (accuracy >= 60) {
    return 'fair';
  } else {
    return 'needs_improvement';
  }
}