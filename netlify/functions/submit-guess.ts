import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';

export const handler: Handler = async (event, context) => {
  try {
    const user = requireUser(context);
    const { session_id, passage_id, guess_source, time_ms } = JSON.parse(event.body || '{}');
    if (!session_id || !passage_id || !guess_source) return { statusCode: 400, body: 'bad request' };

    const [truth] = await sql/*sql*/`SELECT source_type FROM passages WHERE id = ${passage_id}::bigint`;
    if (!truth) return { statusCode: 404, body: 'passage not found' };
    const correct = truth.source_type === guess_source;

    await sql/*sql*/`
      INSERT INTO guesses (session_id, user_id, passage_id, guess_source, is_correct, time_ms)
      VALUES (${session_id}::uuid, ${user.sub}::uuid, ${passage_id}::bigint, ${guess_source}::source_type, ${correct}, ${time_ms || 0}::int);
      UPDATE game_sessions
        SET questions_answered = questions_answered + 1,
            score = score + ${correct ? 1 : 0},
            streak = CASE WHEN ${correct} THEN streak + 1 ELSE 0 END
        WHERE id = ${session_id}::uuid AND user_id = ${user.sub}::uuid;
      INSERT INTO user_stats (user_id, games_played, total_questions, correct, streak_best, last_played_at)
      VALUES (${user.sub}::uuid, 0, 1, ${correct ? 1 : 0}, ${correct ? 1 : 0}, now())
      ON CONFLICT (user_id) DO UPDATE
        SET total_questions = user_stats.total_questions + 1,
            correct = user_stats.correct + ${correct ? 1 : 0},
            streak_best = GREATEST(user_stats.streak_best, (SELECT streak FROM game_sessions WHERE id = ${session_id}::uuid)),
            last_played_at = now();
    `;

    const [sess] = await sql/*sql*/`SELECT score, streak FROM game_sessions WHERE id = ${session_id}::uuid`;
    return { statusCode: 200, headers: {'content-type':'application/json'},
             body: JSON.stringify({ correct, truth: truth.source_type, score: sess?.score || 0, streak: sess?.streak || 0 }) };
  } catch (err:any) {
    return { statusCode: err.statusCode || 500, body: err.message || 'error' };
  }
};