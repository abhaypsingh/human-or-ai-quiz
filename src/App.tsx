import { useEffect, useState } from 'react';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { startSession, getSessionStats } from './api';
import { QuizCard } from './components/QuizCard';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  console.log('🎨 [App] AppContent rendering');
  
  const { session, isLoading, createSession, updateStats } = useSession();
  const [quizSessionId, setQuizSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  console.log('🎨 [App] Current state:', {
    session: session ? { sessionId: session.sessionId } : null,
    isLoading,
    quizSessionId,
    hasStats: !!session?.stats,
    error
  });

  useEffect(() => {
    console.log('🎨 [App] useEffect triggered');
    
    if (session && quizSessionId) {
      console.log('🎨 [App] Session exists, fetching stats');
      fetchStats();
    }
  }, [quizSessionId]);

  async function fetchStats() {
    console.log('🎨 [App] fetchStats called');
    if (!quizSessionId) return;
    
    setError(null);
    
    try {
      const stats = await getSessionStats(quizSessionId);
      console.log('🎨 [App] Stats fetched successfully:', stats);
      updateStats(stats);
    } catch (error) {
      console.error('🎨 [App] Failed to fetch stats:', {
        error,
        message: (error as any).message,
        stack: (error as any).stack
      });
      // Don't show error for stats, just log it
    }
  }

  async function begin() {
    console.log('🎨 [App] begin() called');
    setError(null);
    
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
      
      // Update stats after starting session
      if (res.session_id) {
        await fetchStats();
      }
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
          {session?.stats && (
            <span style={{ opacity: 0.6, fontSize: '0.9rem' }}>
              Score: {session.stats.correct}/{session.stats.total_questions}
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
          <QuizCard sessionId={quizSessionId} />
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

      {session?.stats && (
        <footer style={{ marginTop: 48, opacity: 0.8 }}>
          <small>Total: {session.stats.total_questions} · Correct: {session.stats.correct} · Best streak: {session.stats.streak_best}</small>
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