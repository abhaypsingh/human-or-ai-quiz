import type { Handler } from '@netlify/functions';
import { sql } from '../_db';
import { requireUser, isAdmin } from '../_auth';

export const handler: Handler = async (event, context) => {
  try {
    const user = requireUser(context);
    if (!isAdmin(user)) return { statusCode: 403, body: 'forbidden' };
    const { passage_id, source_type, verified } = JSON.parse(event.body || '{}');
    if (!passage_id || !source_type) return { statusCode: 400, body: 'bad request' };

    await sql/*sql*/`
      UPDATE passages SET source_type = ${source_type}::source_type, verified = COALESCE(${verified}, verified) WHERE id = ${passage_id}::bigint
    `;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err:any) {
    return { statusCode: err.statusCode || 500, body: err.message || 'error' };
  }
};