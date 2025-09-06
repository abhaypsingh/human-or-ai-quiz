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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const startTs = useRef<number>(Date.now());

  async function load() {
    console.log('📖 [QuizCard] Loading next question...');
    setLoading(true);
    setError(null);
    
    try {
      const d = await nextQuestion(sessionId);
      console.log('📖 [QuizCard] Received passage:', d);
      
      if (!d) {
        console.log('📖 [QuizCard] No passage available');
        setError('No more passages available. Please check if the database has content.');
        setPassage(null);
      } else {
        setPassage(d);
        setReveal(null);
        setCorrect(null);
        applyThemeTokens(d?.theme_tokens || {});
        startTs.current = Date.now();
      }
    } catch (err: any) {
      console.error('📖 [QuizCard] Error loading question:', err);
      setError(`Failed to load question: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function guess(kind: 'ai'|'human') {
    console.log('📖 [QuizCard] Making guess:', kind);
    
    if (!passage) {
      console.log('📖 [QuizCard] No passage to guess on');
      return;
    }
    
    if (reveal) {
      console.log('📖 [QuizCard] Already revealed, ignoring guess');
      return;
    }
    
    setLoading(true);
    
    try {
      const timeMs = Date.now() - startTs.current;
      console.log('📖 [QuizCard] Submitting guess:', { sessionId, passageId: passage.id, kind, timeMs });
      
      const res = await submitGuess(sessionId, passage.id, kind, timeMs);
      console.log('📖 [QuizCard] Guess result:', res);
      
      setReveal(res.truth);
      setCorrect(res.correct);
      setScore(res.score);
      setStreak(res.streak);
    } catch (err: any) {
      console.error('📖 [QuizCard] Error submitting guess:', err);
      setError(`Failed to submit guess: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    console.log('📖 [QuizCard] Component mounted, loading first question');
    load(); 
  }, [sessionId]);

  // If there's an error and no passage
  if (error && !passage) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.25rem', lineHeight: 1.6 }}>
          <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#cc0000' }}>Error</h2>
          <p>{error}</p>
          <button onClick={() => load()} style={{ marginTop: 16 }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.25rem', lineHeight: 1.6 }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Human or AI?</h2>
        <p style={{ opacity: 0.8, marginTop: 0 }}>Category: <b>{passage?.category_name || '—'}</b></p>
        
        <div style={{ minHeight: '100px', marginBottom: 16 }}>
          {loading && !passage ? (
            <p style={{ fontSize: '1.125rem', opacity: 0.6 }}>Loading passage...</p>
          ) : passage ? (
            <p style={{ fontSize: '1.125rem' }}>{passage.text}</p>
          ) : (
            <p style={{ fontSize: '1.125rem', opacity: 0.6 }}>No passage available</p>
          )}
        </div>

        {!reveal && passage && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button 
              onClick={() => guess('human')} 
              disabled={loading || !passage}
              aria-label="Guess Human"
              style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              📚 Human
            </button>
            <button 
              className="ghost" 
              onClick={() => guess('ai')} 
              disabled={loading || !passage}
              aria-label="Guess AI"
              style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              🤖 AI
            </button>
            <button 
              className="ghost" 
              onClick={() => load()} 
              disabled={loading}
              aria-label="Skip"
              style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              ⏭️ Skip
            </button>
          </div>
        )}

        {reveal && (
          <div role="status" aria-live="polite" style={{ marginTop: 16 }}>
            <div style={{ fontSize: '1.25rem', marginBottom: 8 }}>
              {correct ? '✅' : '❌'} <b>{correct ? 'Correct!' : 'Not quite.'}</b>
            </div>
            <div>The passage was written by: <b>{reveal === 'ai' ? '🤖 AI' : '📚 Human'}</b></div>
            <div style={{ marginTop: 8, opacity: 0.8 }}>
              Score: {score} · Streak: {streak}
            </div>
            <div style={{ marginTop: 12 }}>
              <button 
                onClick={load} 
                disabled={loading}
                style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                Next passage →
              </button>
            </div>
          </div>
        )}

        {error && passage && (
          <div style={{ 
            marginTop: 16, 
            padding: '0.5rem', 
            background: '#ffebee', 
            color: '#c62828',
            borderRadius: 4 
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}