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

interface QuizCardProps {
  sessionId: string;
  onStatsUpdate?: (score: number, streak: number, isCorrect: boolean) => void;
}

export function QuizCard({ sessionId, onStatsUpdate }: QuizCardProps) {
  const [passage, setPassage] = useState<Passage | null>(null);
  const [reveal, setReveal] = useState<null | 'ai' | 'human'>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const startTs = useRef<number>(Date.now());

  async function load() {
    console.log('📖 [QuizCard] Loading next question...');
    setLoading(true);
    setError(null);
    setReveal(null);
    setCorrect(null);
    
    try {
      const d = await nextQuestion(sessionId);
      console.log('📖 [QuizCard] Received passage:', d);
      
      if (!d) {
        console.log('📖 [QuizCard] No passage available');
        setError('No more passages available. The database may need more content.');
        setPassage(null);
      } else {
        setPassage(d);
        applyThemeTokens(d?.theme_tokens || {});
        startTs.current = Date.now();
      }
    } catch (err: any) {
      console.error('📖 [QuizCard] Error loading question:', err);
      setError(`Failed to load question: ${err.message}`);
      setPassage(null);
    } finally {
      setLoading(false);
    }
  }

  const handleGuess = async (kind: 'ai' | 'human') => {
    console.log('📖 [QuizCard] handleGuess called with:', kind);
    
    // Prevent multiple clicks
    if (submitting || reveal || !passage) {
      console.log('📖 [QuizCard] Ignoring click - submitting:', submitting, 'reveal:', reveal, 'passage:', !!passage);
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const timeMs = Date.now() - startTs.current;
      console.log('📖 [QuizCard] Submitting guess:', { sessionId, passageId: passage.id, kind, timeMs });
      
      const res = await submitGuess(sessionId, passage.id, kind, timeMs);
      console.log('📖 [QuizCard] Guess result:', res);
      
      setReveal(res.truth);
      setCorrect(res.correct);
      setScore(res.score);
      setStreak(res.streak);
      
      // Notify parent component of stats update
      if (onStatsUpdate) {
        onStatsUpdate(res.score, res.streak, res.correct);
      }
    } catch (err: any) {
      console.error('📖 [QuizCard] Error submitting guess:', err);
      setError(`Failed to submit guess: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    console.log('📖 [QuizCard] Skip clicked');
    if (!loading && !submitting) {
      load();
    }
  };

  const handleNext = () => {
    console.log('📖 [QuizCard] Next clicked');
    if (!loading && !submitting) {
      load();
    }
  };

  useEffect(() => { 
    console.log('📖 [QuizCard] Component mounted, loading first question');
    load(); 
  }, [sessionId]);

  // Show error state if no passage could be loaded
  if (error && !passage && !loading) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.25rem', lineHeight: 1.6 }}>
          <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Oops!</h2>
          <p style={{ color: '#ef5350' }}>{error}</p>
          <button 
            onClick={() => load()} 
            style={{ marginTop: 16 }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, padding: '1.25rem', lineHeight: 1.6 }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Human or AI?</h2>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Category: <b>{passage?.category_name || (loading ? 'Loading...' : '—')}</b>
        </p>
        
        {/* Passage text */}
        <div style={{ minHeight: '120px', marginBottom: 20, marginTop: 20 }}>
          {loading ? (
            <p style={{ fontSize: '1.125rem', opacity: 0.5, fontStyle: 'italic' }}>
              Loading passage...
            </p>
          ) : passage ? (
            <p style={{ fontSize: '1.125rem', lineHeight: 1.7 }}>
              {passage.text}
            </p>
          ) : (
            <p style={{ fontSize: '1.125rem', opacity: 0.5 }}>
              No passage available.
            </p>
          )}
        </div>

        {/* Guess buttons - only show if we have a passage and haven't revealed */}
        {passage && !reveal && !loading && (
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button 
              onClick={() => handleGuess('human')}
              disabled={submitting}
              style={{ 
                opacity: submitting ? 0.5 : 1, 
                cursor: submitting ? 'not-allowed' : 'pointer',
                minWidth: '100px'
              }}
            >
              {submitting ? '...' : '📚 Human'}
            </button>
            <button 
              className="ghost" 
              onClick={() => handleGuess('ai')}
              disabled={submitting}
              style={{ 
                opacity: submitting ? 0.5 : 1, 
                cursor: submitting ? 'not-allowed' : 'pointer',
                minWidth: '100px'
              }}
            >
              {submitting ? '...' : '🤖 AI'}
            </button>
            <button 
              className="ghost" 
              onClick={handleSkip}
              disabled={submitting}
              style={{ 
                opacity: submitting ? 0.5 : 1, 
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Skip →
            </button>
          </div>
        )}

        {/* Results - show after reveal */}
        {reveal && (
          <div style={{ marginTop: 20, padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ fontSize: '1.25rem', marginBottom: 12 }}>
              <span style={{ marginRight: 8 }}>{correct ? '✅' : '❌'}</span>
              <b>{correct ? 'Correct!' : 'Not quite.'}</b>
            </div>
            
            <div style={{ marginBottom: 12 }}>
              This passage was written by: <b style={{ color: reveal === 'ai' ? '#ffa726' : '#66bb6a' }}>
                {reveal === 'ai' ? '🤖 AI' : '📚 Human'}
              </b>
            </div>
            
            <div style={{ opacity: 0.8, marginBottom: 16 }}>
              Score: <b>{score}</b> · Streak: <b>{streak}</b>
            </div>
            
            <button 
              onClick={handleNext}
              disabled={loading || submitting}
              style={{ 
                opacity: (loading || submitting) ? 0.5 : 1, 
                cursor: (loading || submitting) ? 'not-allowed' : 'pointer'
              }}
            >
              Next Passage →
            </button>
          </div>
        )}

        {/* Error message (non-critical) */}
        {error && passage && (
          <div style={{ 
            marginTop: 16, 
            padding: '0.75rem', 
            background: 'rgba(239, 83, 80, 0.1)', 
            color: '#ef5350',
            borderRadius: 4,
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}