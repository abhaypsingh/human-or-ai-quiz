import { useEffect, useRef, useState } from 'react';
import { nextQuestion, submitGuess } from '../api';
import { applyThemeTokens } from '../theme';

type Passage = {
  id: number;
  text: string;
  category_name: string;
  css_category: string;
  theme_tokens: any;
};

export function QuizCard({ sessionId }: { sessionId: string }) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [reveal, setReveal] = useState<null | 'ai' | 'human'>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const startTs = useRef<number>(Date.now());

  async function load() {
    const d = await nextQuestion(sessionId);
    setPassage(d);
    setReveal(null);
    setCorrect(null);
    applyThemeTokens(d?.theme_tokens || {});
    startTs.current = Date.now();
  }

  async function guess(kind: 'ai'|'human') {
    if (!passage) return;
    const timeMs = Date.now() - startTs.current;
    const res = await submitGuess(sessionId, passage.id, kind, timeMs);
    setReveal(res.truth);
    setCorrect(res.correct);
    setScore(res.score);
    setStreak(res.streak);
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.25rem', lineHeight: 1.6 }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Human or AI?</h2>
        <p style={{ opacity: 0.8, marginTop: 0 }}>Category: <b>{passage?.category_name || '—'}</b></p>
        <p style={{ fontSize: '1.125rem' }}>{passage?.text || 'Loading…'}</p>

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={() => guess('human')} aria-label="Guess Human">Book</button>
          <button className="ghost" onClick={() => guess('ai')} aria-label="Guess AI">AI</button>
          <button className="ghost" onClick={() => load()} aria-label="Skip">Skip</button>
        </div>

        {reveal && (
          <div role="status" aria-live="polite" style={{ marginTop: 16 }}>
            <b>{correct ? 'Correct!' : 'Not quite.'}</b>
            <span> Truth: {reveal.toUpperCase()}</span>
            <div style={{ marginTop: 8, opacity: 0.8 }}>Score: {score} · Streak: {streak}</div>
            <div style={{ marginTop: 12 }}>
              <button onClick={load}>Next passage</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}