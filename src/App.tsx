import { useEffect, useState } from 'react';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { startSession } from './api';
import { QuizCard } from './components/QuizCard';
import { ErrorBoundary } from './components/ErrorBoundary';

interface SessionStats {
  totalQuestions: number;
  correct: number;
  bestStreak: number;
  currentStreak: number;
}

function AppContent() {
  console.log('🎨 [App] AppContent rendering');
  
  const { session, isLoading, createSession } = useSession();
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalQuestions: 0,
    correct: 0,
    bestStreak: 0,
    currentStreak: 0
  });
  
  console.log('🎨 [App] Current state:', {
    session: session ? { sessionId: session.sessionId } : null,
    isLoading,
    quizSessionId,
    sessionStats,
    error
  });

  const updateStats = (newScore: number, newStreak: number, isCorrect: boolean) => {
    console.log('🎨 [App] Updating stats:', { newScore, newStreak, isCorrect });
    setSessionStats(prev => ({
      totalQuestions: prev.totalQuestions + 1,
      correct: newScore,
      bestStreak: Math.max(prev.bestStreak, newStreak),
      currentStreak: newStreak
    }));
  };

  async function begin() {
    console.log('🎨 [App] begin() called');
    setError(null);
    
    // Reset stats for new session
    setSessionStats({
      totalQuestions: 0,
      correct: 0,
      bestStreak: 0,
      currentStreak: 0
    });
    
    try {
      // Create a session if we don't have one
      if (!session) {
        console.log('🎨 [App] Creating new session');
        await createSession();
      }
      
      console.log('🎨 [App] Starting new quiz session');
      const res = await startSession(null);
      console.log('🎨 [App] Quiz session started successfully:', res);
      setQuizSessionId(res.session_id);
    } catch (error) {
      console.error('🎨 [App] Failed to start session:', {
        error,
        message: (error as any).message,
        stack: (error as any).stack
      });
      setError(`Failed to start session: ${(error as any).message}`);
    }
  }

  if (isLoading) {
    console.log('🎨 [App] Showing loading state');
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Human or AI?</h1>
        <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
          {quizSessionId && sessionStats.totalQuestions > 0 && (
            <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>
              Score: {sessionStats.correct}/{sessionStats.totalQuestions} 
              {sessionStats.currentStreak > 1 && ` 🔥 ${sessionStats.currentStreak}`}
            </span>
          )}
        </div>
      </header>

      {!quizSessionId ? (
        <section style={{ marginTop: 24 }}>
          <p>Guess whether a passage is from a real book or AI. Test your ability to spot AI-generated text!</p>
          <button onClick={begin}>Start playing</button>
        </section>
      ) : (
        <section style={{ marginTop: 24 }}>
          <QuizCard 
            sessionId={quizSessionId} 
            onStatsUpdate={updateStats}
          />
        </section>
      )}

      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '1rem', 
          marginTop: 24, 
          borderRadius: 4,
          border: '1px solid #ef5350'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {quizSessionId && sessionStats.totalQuestions > 0 && (
        <footer style={{ marginTop: 48, opacity: 0.8 }}>
          <small>
            Total: {sessionStats.totalQuestions} · 
            Correct: {sessionStats.correct} · 
            Best streak: {sessionStats.bestStreak}
            {sessionStats.totalQuestions > 0 && 
              ` · Accuracy: ${Math.round((sessionStats.correct / sessionStats.totalQuestions) * 100)}%`
            }
          </small>
        </footer>
      )}
    </main>
  );
}

export default function App() {
  console.log('🎨 [App] Main App component rendering');
  
  return (
    <ErrorBoundary>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </ErrorBoundary>
  );
}