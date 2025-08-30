import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';
import { withCors } from './middleware/cors';
import { withValidation, validators } from './middleware/validation';
import { withRateLimit, rateLimitPresets } from './middleware/rate-limiter';
import type { 
  UserProfileResponse, 
  UpdateUserProfileRequest,
  UserStats 
} from './types/index';

// Rate limit: 30 requests per minute for profile operations
const profileRateLimit = withRateLimit({
  ...rateLimitPresets.api,
  max: 30
});

export const handler: Handler = withCors()(
  profileRateLimit(async (event, context) => {
    try {
      const user = requireUser(context);

      switch (event.httpMethod) {
        case 'GET':
          return await getProfile(user.sub);
        
        case 'PUT':
          return await withValidation(validators.profileUpdate().validate)(
            async (validatedEvent) => updateProfile(user.sub, validatedEvent.validatedData)
          )(event, context);
        
        case 'DELETE':
          return await deleteProfile(user.sub);
        
        default:
          return {
            statusCode: 405,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              error: 'Method Not Allowed',
              message: `Method ${event.httpMethod} not allowed`,
              allowedMethods: ['GET', 'PUT', 'DELETE'],
              timestamp: new Date().toISOString()
            })
          };
      }
    } catch (error: any) {
      console.error('User profile error:', error);

      return {
        statusCode: error.statusCode || 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.name || 'Profile Error',
          message: error.message || 'Profile operation failed',
          timestamp: new Date().toISOString()
        })
      };
    }
  })
);

// Get user profile
async function getProfile(userId: string) {
  try {
    // Get user basic info
    const [userResult] = await sql`
      SELECT id, handle, created_at 
      FROM users 
      WHERE id = ${userId}::uuid
    `;

    if (!userResult) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'User Not Found',
          message: 'User profile not found',
          timestamp: new Date().toISOString()
        })
      };
    }

    // Get user stats
    const [statsResult] = await sql`
      SELECT * FROM user_stats 
      WHERE user_id = ${userId}::uuid
    ` as UserStats[];

    // Calculate additional metrics
    const [additionalStats] = await sql`
      SELECT 
        COUNT(DISTINCT gs.id) as total_sessions,
        COALESCE(AVG(gs.score), 0) as avg_score,
        COALESCE(MAX(gs.score), 0) as best_score,
        COALESCE(AVG(g.time_ms), 0) as avg_response_time,
        COUNT(CASE WHEN g.is_correct THEN 1 END) as correct_answers,
        COUNT(g.id) as total_answers,
        COUNT(DISTINCT DATE(g.created_at)) as days_played
      FROM game_sessions gs
      LEFT JOIN guesses g ON gs.id = g.session_id
      WHERE gs.user_id = ${userId}::uuid
    `;

    // Get recent activity
    const recentSessions = await sql`
      SELECT 
        gs.id,
        gs.score,
        gs.streak,
        gs.questions_answered,
        gs.started_at,
        gs.ended_at,
        gs.status,
        COUNT(g.id) as guesses_made,
        COALESCE(AVG(g.time_ms), 0) as avg_time
      FROM game_sessions gs
      LEFT JOIN guesses g ON gs.id = g.session_id
      WHERE gs.user_id = ${userId}::uuid
      GROUP BY gs.id, gs.score, gs.streak, gs.questions_answered, gs.started_at, gs.ended_at, gs.status
      ORDER BY gs.started_at DESC
      LIMIT 10
    `;

    // Get category performance
    const categoryStats = await sql`
      SELECT 
        c.name as category_name,
        c.css_category,
        COUNT(g.id) as questions_answered,
        COUNT(CASE WHEN g.is_correct THEN 1 END) as correct_answers,
        ROUND(
          (COUNT(CASE WHEN g.is_correct THEN 1 END)::numeric / 
           NULLIF(COUNT(g.id), 0) * 100), 2
        ) as accuracy_percentage,
        COALESCE(AVG(g.time_ms), 0) as avg_response_time
      FROM categories c
      JOIN passages p ON c.id = p.category_id
      JOIN guesses g ON p.id = g.passage_id
      WHERE g.user_id = ${userId}::uuid
      GROUP BY c.id, c.name, c.css_category
      ORDER BY questions_answered DESC
      LIMIT 20
    `;

    const stats: UserStats = statsResult || {
      user_id: userId,
      games_played: additionalStats?.total_sessions || 0,
      total_questions: additionalStats?.total_answers || 0,
      correct: additionalStats?.correct_answers || 0,
      streak_best: 0,
      last_played_at: null
    };

    const response: UserProfileResponse & { 
      additionalStats?: any,
      recentSessions?: any[],
      categoryPerformance?: any[]
    } = {
      id: userResult.id,
      handle: userResult.handle,
      stats,
      created_at: userResult.created_at,
      additionalStats: {
        totalSessions: additionalStats?.total_sessions || 0,
        averageScore: Math.round((additionalStats?.avg_score || 0) * 100) / 100,
        bestScore: additionalStats?.best_score || 0,
        averageResponseTime: Math.round(additionalStats?.avg_response_time || 0),
        accuracyPercentage: stats.total_questions > 0 
          ? Math.round((stats.correct / stats.total_questions) * 10000) / 100 
          : 0,
        daysPlayed: additionalStats?.days_played || 0
      },
      recentSessions: recentSessions.map(session => ({
        ...session,
        duration: session.ended_at && session.started_at 
          ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000)
          : null,
        avg_time: Math.round(session.avg_time || 0)
      })),
      categoryPerformance: categoryStats
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
}

// Update user profile
async function updateProfile(userId: string, updateData: UpdateUserProfileRequest) {
  try {
    const { handle } = updateData;

    // Check if handle is already taken (if provided)
    if (handle) {
      const [existingUser] = await sql`
        SELECT id FROM users 
        WHERE handle = ${handle} AND id != ${userId}::uuid
      `;

      if (existingUser) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Handle Taken',
            message: 'This handle is already taken by another user',
            field: 'handle',
            timestamp: new Date().toISOString()
          })
        };
      }
    }

    // Update user profile
    const [updatedUser] = await sql`
      UPDATE users 
      SET handle = ${handle || null}
      WHERE id = ${userId}::uuid
      RETURNING id, handle, created_at
    `;

    if (!updatedUser) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'User Not Found',
          message: 'User not found for update',
          timestamp: new Date().toISOString()
        })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Profile updated successfully',
        user: updatedUser,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

// Delete user profile (soft delete - anonymize data)
async function deleteProfile(userId: string) {
  try {
    // Instead of hard deleting, we'll anonymize the user's data
    // This preserves the integrity of game statistics while removing personal info
    await sql`
      BEGIN;
      
      -- Anonymize user data
      UPDATE users 
      SET handle = 'deleted_user_' || SUBSTRING(id::text, 1, 8)
      WHERE id = ${userId}::uuid;
      
      -- Optionally remove user stats (uncomment if you want to delete stats too)
      -- DELETE FROM user_stats WHERE user_id = ${userId}::uuid;
      
      COMMIT;
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Profile deleted successfully',
        note: 'User data has been anonymized while preserving game statistics',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Delete profile error:', error);
    await sql`ROLLBACK`;
    throw error;
  }
}