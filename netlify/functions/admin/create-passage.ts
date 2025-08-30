import type { Handler } from '@netlify/functions';
import { sql } from '../_db';
import { requireUser, isAdmin } from '../_auth';

export const handler: Handler = async (event, context) => {
  try {
    const user = requireUser(context);
    if (!isAdmin(user)) return { statusCode: 403, body: 'forbidden' };
    const { text, category_id, source_type, reading_level, style_tags, meta } = JSON.parse(event.body || '{}');
    if (!text || !category_id || !source_type) return { statusCode: 400, body: 'missing fields' };

    await sql/*sql*/`
      INSERT INTO passages (text, category_id, source_type, reading_level, style_tags, source_title, source_author, source_year, source_public_domain, source_citation, generator_model, prompt_signature, verified, rand_key)
      VALUES (
        ${text}, ${category_id}::int, ${source_type}::source_type,
        COALESCE(${reading_level}::int, 3),
        COALESCE(${style_tags}::text[], '{}'),
        ${meta?.source_title || null}, ${meta?.source_author || null}, ${meta?.source_year || null},
        ${meta?.source_public_domain ?? null},
        ${meta?.source_citation || null},
        ${meta?.generator_model || null},
        ${meta?.prompt_signature || null},
        COALESCE(${meta?.verified ?? false}, false),
        random()
      )
    `;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err:any) {
    return { statusCode: err.statusCode || 500, body: err.message || 'error' };
  }
};