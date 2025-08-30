import { useEffect, useState } from 'react';
import { initIdentity, openLogin, openSignup, logout, currentUser } from './auth';
import { startSession, meStats } from './api';
import { QuizCard } from './components/QuizCard';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);

  useEffect(() => {
    initIdentity();
    setUser(currentUser());
  }, []);

  async function begin() {
    if (!currentUser()) { openLogin(); return; }
    const res = await startSession(null);
    setSessionId(res.session_id);
    const st = await meStats();
    setStats(st);
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h1 style={{ margin: 0 }}>Human or AI?</h1>
        <div style={{ display:'flex', gap: 8, alignItems:'center' }}>
          {user ? (
            <>
              <span style={{ opacity: 0.8 }}>Hi, {user.user_metadata?.full_name || user.email}</span>
              <button className="ghost" onClick={() => logout()}>Sign out</button>
            </>
          ) : (
            <>
              <button className="ghost" onClick={() => openLogin()}>Sign in</button>
              <button onClick={() => openSignup()}>Sign up</button>
            </>
          )}
        </div>
      </header>

      {!sessionId ? (
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