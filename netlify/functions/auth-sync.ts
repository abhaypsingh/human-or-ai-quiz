import type { Handler } from '@netlify/functions';
import { sql } from './_db';
import { requireUser } from './_auth';

export const handler: Handler = async (event, context) => {
  try {
    const user = requireUser(context);
    const id = user.sub;
    const handle = user.user_metadata?.full_name || user.email || null;

    await sql/*sql*/`
      INSERT INTO users (id, handle)
      VALUES (${id}::uuid, ${handle})
      ON CONFLICT (id) DO UPDATE SET handle = EXCLUDED.handle
    `;

    return { statusCode: 200, body: JSON.stringify({ ok: true, id, handle }) };
  } catch (err:any) {
    return { statusCode: err.statusCode || 500, body: err.message || 'error' };
  }
};