import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';

export const handler: Handler = async (event) => {
  try {
    const user = requireUser(event);
    const qp = new URLSearchParams(event.rawQuery || '');
    const session_id = qp.get('session_id');
    if (!session_id) return { statusCode: 400, body: 'missing session_id' };

    // Load category filter from session
    const [sess] = await sql/*sql*/`SELECT category_filter FROM game_sessions WHERE id = ${session_id}::uuid AND user_id = ${user.id}::uuid AND status = 'open'`;
    if (!sess) return { statusCode: 404, body: 'session not found' };
    const filter = sess.category_filter || [];

    const rows = await sql(`
      WITH r AS (SELECT random() AS k)
      (
        SELECT p.id, p.text, c.name AS category_name, c.css_category, c.theme_tokens
        FROM passages p
        JOIN categories c ON c.id = p.category_id, r
        WHERE (${filter.length} = 0 OR p.category_id = ANY(${filter}::int[]))
          AND NOT EXISTS (SELECT 1 FROM guesses g WHERE g.user_id = '${user.id}'::uuid AND g.passage_id = p.id)
          AND p.rand_key >= r.k
        ORDER BY p.rand_key ASC
        LIMIT 1
      )
      UNION ALL
      (
        SELECT p.id, p.text, c.name AS category_name, c.css_category, c.theme_tokens
        FROM passages p
        JOIN categories c ON c.id = p.category_id, r
        WHERE (${filter.length} = 0 OR p.category_id = ANY(${filter}::int[]))
          AND NOT EXISTS (SELECT 1 FROM guesses g WHERE g.user_id = '${user.id}'::uuid AND g.passage_id = p.id)
          AND p.rand_key < r.k
        ORDER BY p.rand_key ASC
        LIMIT 1
      )
      LIMIT 1;
    `);

    const row = rows[0] || null;
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify(row) };
  } catch (err:any) {
    return { statusCode: err.statusCode || 500, body: err.message || 'error' };
  }
};