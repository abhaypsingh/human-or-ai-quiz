// Simple fetch wrapper without authentication
const apiFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, init);
};

export async function startSession(categoryFilter: number[] | null) {
  console.log('[API] startSession called with categoryFilter:', categoryFilter);
  const url = '/.netlify/functions/start-session';
  const body = { category_filter: categoryFilter };
  
  console.log('[API] Sending startSession request:', { url, body });
  
  try {
    const res = await apiFetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    console.log('[API] startSession response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[API] startSession failed:', {
        status: res.status,
        errorText
      });
      throw new Error(`Failed to start session: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log('[API] startSession success, session data:', data);
    return data;
  } catch (error) {
    console.error('[API] startSession error:', {
      error,
      message: (error as any).message,
      stack: (error as any).stack
    });
    throw error;
  }
}

export async function nextQuestion(sessionId: string) {
  console.log('[API] nextQuestion called with sessionId:', sessionId);
  const url = `/.netlify/functions/next-question?session_id=${encodeURIComponent(sessionId)}`;
  
  console.log('[API] Sending nextQuestion request to:', url);
  
  try {
    const res = await apiFetch(url);
    
    console.log('[API] nextQuestion response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[API] nextQuestion failed:', {
        status: res.status,
        errorText
      });
      throw new Error(`Failed to fetch passage: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log('[API] nextQuestion success, question data:', data);
    return data;
  } catch (error) {
    console.error('[API] nextQuestion error:', {
      error,
      message: (error as any).message,
      stack: (error as any).stack
    });
    throw error;
  }
}

export async function submitGuess(sessionId: string, passageId: number, guess: 'ai'|'human', timeMs: number) {
  console.log('[API] submitGuess called:', { sessionId, passageId, guess, timeMs });
  const url = '/.netlify/functions/submit-guess';
  const body = { session_id: sessionId, passage_id: passageId, guess_source: guess, time_ms: timeMs };
  
  console.log('[API] Sending submitGuess request:', { url, body });
  
  try {
    const res = await apiFetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    console.log('[API] submitGuess response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[API] submitGuess failed:', {
        status: res.status,
        errorText
      });
      throw new Error(`Failed to submit guess: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log('[API] submitGuess success, result:', data);
    return data;
  } catch (error) {
    console.error('[API] submitGuess error:', {
      error,
      message: (error as any).message,
      stack: (error as any).stack
    });
    throw error;
  }
}

export async function getSessionStats(sessionId: string) {
  console.log('[API] getSessionStats called for sessionId:', sessionId);
  const url = `/.netlify/functions/session-stats?session_id=${encodeURIComponent(sessionId)}`;
  
  console.log('[API] Sending getSessionStats request to:', url);
  
  try {
    const res = await apiFetch(url);
    
    console.log('[API] getSessionStats response:', {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[API] getSessionStats failed:', {
        status: res.status,
        errorText
      });
      // Return default stats if the endpoint doesn't exist
      return {
        total_questions: 0,
        correct: 0,
        streak_best: 0
      };
    }
    
    const data = await res.json();
    console.log('[API] getSessionStats success, stats data:', data);
    return data;
  } catch (error) {
    console.error('[API] getSessionStats error:', {
      error,
      message: (error as any).message,
      stack: (error as any).stack
    });
    // Return default stats on error
    return {
      total_questions: 0,
      correct: 0,
      streak_best: 0
    };
  }
}