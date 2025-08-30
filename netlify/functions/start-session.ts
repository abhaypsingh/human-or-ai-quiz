import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';
import crypto from 'crypto';

export const handler: Handler = async (event) => {
  try {
    const user = requireUser(event);
    const { category_filter } = JSON.parse(event.body || '{}');
    const session_id = crypto.randomUUID();

    await sql/*sql*/`
      INSERT INTO game_sessions (id, user_id, status, category_filter)
      VALUES (${session_id}::uuid, ${user.id}::uuid, 'open', ${category_filter || []}::int[])
    `;

    return { statusCode: 200, body: JSON.stringify({ session_id }) };
  } catch (err:any) {
    return { statusCode: err.statusCode || 500, body: err.message || 'error' };
  }
};