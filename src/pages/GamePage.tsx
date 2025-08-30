import React, { useState, useEffect, useRef, useCallback } from 'react';
import { startSession, nextQuestion, submitGuess, meStats } from '../api';
import { currentUser } from '../auth';
import { applyThemeTokens } from '../theme';
import { GuessButtons } from '../components/Game/GuessButtons';
import { ResultFeedback } from '../components/Game/ResultFeedback';
import { SessionStats } from '../components/Game/SessionStats';
import { PassageCard } from '../components/Game/PassageCard';
import { Button } from '../components/common/Button';
import { 
  Passage, 
  GameSession, 
  UserStats, 
  SubmitGuessResponse, 
  GameState 
} from '../types';
import styles from './GamePage.module.css';

interface GamePageProps {
  onNavigate?: (page: 'leaderboard' | 'profile' | 'admin') => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onNavigate }) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>('idle');
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentPassage, setCurrentPassage] = useState<Passage | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [result, setResult] = useState<SubmitGuessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Game tracking
  const startTimeRef = useRef<number>(Date.now());
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Load user stats
  const loadUserStats = useCallback(async () => {
    try {
      const userStats = await meStats();
      setStats(userStats);
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  }, []);

  // Start a new game session
  const startNewSession = useCallback(async (categoryFilter?: number[]) => {
    try {
      setGameState('loading');
      setError(null);
      
      const sessionData = await startSession(categoryFilter || null);
      setSession(sessionData);
      setQuestionsAnswered(0);
      setCorrectAnswers(0);
      setCurrentStreak(0);
      setResult(null);
      
      await loadNextQuestion(sessionData.session_id);
    } catch (err) {
      console.error('Failed to start session:', err);
      setError('Failed to start game session. Please try again.');
      setGameState('error');
    }
  }, []);

  // Load next question
  const loadNextQuestion = useCallback(async (sessionId: string) => {
    try {
      setGameState('loading');
      const passage = await nextQuestion(sessionId);
      
      setCurrentPassage(passage);
      setResult(null);
      setGameState('playing');
      
      // Apply theme tokens for the passage category
      if (passage.theme_tokens) {
        applyThemeTokens(passage.theme_tokens);
      }
      
      startTimeRef.current = Date.now();
    } catch (err) {
      console.error('Failed to load question:', err);
      setError('Failed to load next question. Please try again.');
      setGameState('error');
    }
  }, []);

  // Submit a guess
  const handleGuess = useCallback(async (guess: 'ai' | 'human') => {
    if (!session || !currentPassage || gameState !== 'playing') return;
    
    try {
      setGameState('revealing');
      const timeMs = Date.now() - startTimeRef.current;
      
      const response = await submitGuess(session.session_id, currentPassage.id, guess, timeMs);
      setResult(response);
      
      // Update local counters
      setQuestionsAnswered(prev => prev + 1);
      if (response.correct) {
        setCorrectAnswers(prev => prev + 1);
        setCurrentStreak(response.streak);
      } else {
        setCurrentStreak(0);
      }
      
      setGameState('revealing');
      
      // Auto-advance after showing result
      setTimeout(() => {
        if (session) {
          loadNextQuestion(session.session_id);
        }
      }, 4000);
      
    } catch (err) {
      console.error('Failed to submit guess:', err);
      setError('Failed to submit guess. Please try again.');
      setGameState('error');
    }
  }, [session, currentPassage, gameState, loadNextQuestion]);

  // Skip current question
  const handleSkip = useCallback(() => {
    if (session && gameState === 'playing') {
      loadNextQuestion(session.session_id);
    }
  }, [session, gameState, loadNextQuestion]);

  // End current session
  const handleEndSession = useCallback(() => {
    setSession(null);
    setCurrentPassage(null);
    setResult(null);
    setGameState('idle');
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setCurrentStreak(0);
    
    // Reload user stats after session ends
    loadUserStats();
  }, [loadUserStats]);

  // Initialize component
  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

  const renderGameContent = () => {
    switch (gameState) {
      case 'idle':
        return (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeHeader}>
              <h1 className={styles.welcomeTitle}>Human or AI?</h1>
              <p className={styles.welcomeSubtitle}>
                Test your ability to distinguish between human-written and AI-generated text.
              </p>
            </div>
            
            {stats && (
              <div className={styles.statsPreview}>
                <SessionStats 
                  stats={stats} 
                  variant="compact" 
                  showTitle={false}
                />
              </div>
            )}
            
            <div className={styles.startActions}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => startNewSession()}
                className={styles.startButton}
              >
                Start Playing
              </Button>
              
              {onNavigate && (
                <div className={styles.navigationButtons}>
                  <Button
                    variant="secondary"
                    onClick={() => onNavigate('leaderboard')}
                  >
                    Leaderboard
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => onNavigate('profile')}
                  >
                    My Profile
                  </Button>
                </div>
              )}
            </div>
          </div>
        );

      case 'loading':
        return (
          <div className={styles.loadingScreen}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Loading next question...</p>
          </div>
        );

      case 'playing':
        return (
          <div className={styles.gameScreen}>
            <div className={styles.gameHeader}>
              <SessionStats 
                session={{
                  ...session!,
                  total_questions: questionsAnswered,
                  correct_answers: correctAnswers,
                  current_streak: currentStreak,
                  best_streak: Math.max(currentStreak, stats?.streak_best || 0)
                }}
                variant="live"
              />
              
              <div className={styles.gameActions}>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className={styles.skipButton}
                >
                  Skip
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleEndSession}
                  className={styles.endButton}
                >
                  End Session
                </Button>
              </div>
            </div>

            <div className={styles.gameContent}>
              {currentPassage && (
                <PassageCard 
                  passage={currentPassage}
                  className={styles.passageCard}
                />
              )}
              
              <GuessButtons 
                onGuess={handleGuess}
                disabled={gameState !== 'playing'}
                className={styles.guessButtons}
              />
            </div>
          </div>
        );

      case 'revealing':
        return (
          <div className={styles.gameScreen}>
            <div className={styles.gameHeader}>
              <SessionStats 
                session={{
                  ...session!,
                  total_questions: questionsAnswered,
                  correct_answers: correctAnswers,
                  current_streak: currentStreak,
                  best_streak: Math.max(currentStreak, stats?.streak_best || 0)
                }}
                variant="live"
              />
            </div>

            <div className={styles.gameContent}>
              {currentPassage && (
                <PassageCard 
                  passage={currentPassage}
                  revealed={true}
                  className={styles.passageCard}
                />
              )}
              
              <ResultFeedback 
                result={result}
                className={styles.resultFeedback}
              />
              
              <div className={styles.nextActions}>
                <Button
                  variant="primary"
                  onClick={() => session && loadNextQuestion(session.session_id)}
                  className={styles.nextButton}
                >
                  Next Question
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={handleEndSession}
                  className={styles.endButton}
                >
                  End Session
                </Button>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className={styles.errorScreen}>
            <div className={styles.errorIcon}>⚠️</div>
            <h2 className={styles.errorTitle}>Something went wrong</h2>
            <p className={styles.errorMessage}>{error}</p>
            <div className={styles.errorActions}>
              <Button
                variant="primary"
                onClick={() => setGameState('idle')}
              >
                Back to Home
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const user = currentUser();
  
  return (
    <div className={styles.gamePage}>
      <div className={styles.container}>
        {renderGameContent()}
      </div>
      
      {/* Background decoration */}
      <div className={styles.backgroundPattern} />
    </div>
  );
};