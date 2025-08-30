import { authFetch } from './auth';

export async function startSession(categoryFilter: number[] | null) {
  const res = await authFetch('/.netlify/functions/start-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ category_filter: categoryFilter })
  });
  if (!res.ok) throw new Error('Failed to start session');
  return res.json();
}

export async function nextQuestion(sessionId: string) {
  const res = await authFetch(`/.netlify/functions/next-question?session_id=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Failed to fetch passage');
  return res.json();
}

export async function submitGuess(sessionId: string, passageId: number, guess: 'ai'|'human', timeMs: number) {
  const res = await authFetch('/.netlify/functions/submit-guess', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, passage_id: passageId, guess_source: guess, time_ms: timeMs })
  });
  if (!res.ok) throw new Error('Failed to submit guess');
  return res.json();
}

export async function meStats() {
  const res = await authFetch('/.netlify/functions/me-stats');
  if (!res.ok) throw new Error('Failed to load stats');
  return res.json();
}