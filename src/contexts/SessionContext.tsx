import React, { createContext, useContext, useState, useEffect } from 'react';

interface SessionData {
  sessionId: string;
  userId?: string;
  name?: string;
  stats?: {
    total_questions: number;
    correct: number;
    streak_best: number;
  };
}

interface SessionContextType {
  session: SessionData | null;
  isLoading: boolean;
  createSession: () => Promise<void>;
  updateStats: (stats: any) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session in sessionStorage
    const storedSession = sessionStorage.getItem('quiz_session');
    
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        setSession(parsedSession);
      } catch (error) {
        console.error('Failed to parse stored session:', error);
        sessionStorage.removeItem('quiz_session');
      }
    }
    
    setIsLoading(false);
  }, []);

  const createSession = async () => {
    // Generate a unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newSession: SessionData = {
      sessionId,
      stats: {
        total_questions: 0,
        correct: 0,
        streak_best: 0
      }
    };
    
    setSession(newSession);
    sessionStorage.setItem('quiz_session', JSON.stringify(newSession));
  };

  const updateStats = (stats: any) => {
    if (!session) return;
    
    const updatedSession = {
      ...session,
      stats
    };
    
    setSession(updatedSession);
    sessionStorage.setItem('quiz_session', JSON.stringify(updatedSession));
  };

  const clearSession = () => {
    setSession(null);
    sessionStorage.removeItem('quiz_session');
  };

  const value = {
    session,
    isLoading,
    createSession,
    updateStats,
    clearSession
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};