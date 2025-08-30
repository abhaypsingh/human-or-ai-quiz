import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { startSession, meStats, setAuthFetch } from './api';
import { QuizCard } from './components/QuizCard';
import { LoginForm } from './components/LoginForm';
import { SignupForm } from './components/SignupForm';

function AppContent() {
  const { user, logout, isLoading, isAuthenticated, authFetch } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);

  useEffect(() => {
    // Set the authFetch function for the API module
    setAuthFetch(authFetch);
    
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, authFetch]);

  async function fetchStats() {
    const st = await meStats();
    setStats(st);
  }

  async function begin() {
    if (!isAuthenticated) { 
      setShowLoginForm(true); 
      return; 
    }
    const res = await startSession(null);
    setSessionId(res.session_id);
    await fetchStats();
  }

  const handleAuthSuccess = () => {
    setShowLoginForm(false);
    setShowSignupForm(false);
    fetchStats();
  };


  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Human or AI?</h1>
        <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
          {user ? (
            <>
              <span style={{ opacity: 0.8 }}>Hi, {user.name || user.email}</span>
              <button className="ghost" onClick={() => logout()}>Sign out</button>
            </>
          ) : (
            <>
              <button className="ghost" onClick={() => setShowLoginForm(true)}>Sign in</button>
              <button onClick={() => setShowSignupForm(true)}>Sign up</button>
            </>
          )}
        </div>
      </header>

      {showLoginForm ? (
        <LoginForm 
          onSuccess={handleAuthSuccess}
          onSignupClick={() => {
            setShowLoginForm(false);
            setShowSignupForm(true);
          }}
        />
      ) : showSignupForm ? (
        <SignupForm 
          onSuccess={handleAuthSuccess}
          onLoginClick={() => {
            setShowSignupForm(false);
            setShowLoginForm(true);
          }}
        />
      ) : !sessionId ? (
        <section style={{ marginTop: 24 }}>
          <p>Guess whether a passage is from a real book or AI. Sign in to save your score and climb the leaderboard.</p>
          <button onClick={begin}>Start playing</button>
        </section>
      ) : (
        <section style={{ marginTop: 24 }}>
          <QuizCard sessionId={sessionId} />
        </section>
      )}

      {stats && (
        <footer style={{ marginTop: 48, opacity: 0.8 }}>
          <small>Total: {stats.total_questions} · Correct: {stats.correct} · Best streak: {stats.streak_best}</small>
        </footer>
      )}
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
