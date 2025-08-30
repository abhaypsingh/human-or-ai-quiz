import React, { useEffect, useState } from 'react';
import { SubmitGuessResponse } from '../../types';
import styles from './ResultFeedback.module.css';

interface ResultFeedbackProps {
  result: SubmitGuessResponse | null;
  onClose?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
  className?: string;
}

export const ResultFeedback: React.FC<ResultFeedbackProps> = ({
  result,
  onClose,
  autoHide = true,
  autoHideDelay = 3000,
  className
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'reveal' | 'exit'>('enter');

  useEffect(() => {
    if (!result) {
      setIsVisible(false);
      return;
    }

    // Show feedback
    setIsVisible(true);
    setAnimationPhase('enter');

    // Reveal answer after brief delay
    const revealTimer = setTimeout(() => {
      setAnimationPhase('reveal');
    }, 500);

    // Auto-hide if enabled
    let hideTimer: NodeJS.Timeout;
    if (autoHide) {
      hideTimer = setTimeout(() => {
        setAnimationPhase('exit');
        setTimeout(() => {
          setIsVisible(false);
          onClose?.();
        }, 300);
      }, autoHideDelay);
    }

    return () => {
      clearTimeout(revealTimer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [result, autoHide, autoHideDelay, onClose]);

  if (!result || !isVisible) return null;

  const isCorrect = result.correct;
  const actualSource = result.truth;
  const explanation = result.explanation;
  const timeTaken = Math.round(result.time_ms / 1000);

  return (
    <div 
      className={`
        ${styles.resultFeedback} 
        ${isCorrect ? styles.correct : styles.incorrect}
        ${styles[animationPhase]}
        ${className || ''}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Main Result */}
      <div className={styles.resultHeader}>
        <div className={styles.resultIcon}>
          {isCorrect ? (
            <span role="img" aria-label="Correct" className={styles.correctIcon}>
              ✅
            </span>
          ) : (
            <span role="img" aria-label="Incorrect" className={styles.incorrectIcon}>
              ❌
            </span>
          )}
        </div>
        
        <div className={styles.resultText}>
          <h3 className={styles.resultTitle}>
            {isCorrect ? 'Correct!' : 'Incorrect!'}
          </h3>
          <p className={styles.resultSubtitle}>
            This passage was written by{' '}
            <span className={styles.actualSource}>
              {actualSource === 'ai' ? '🤖 AI' : '👤 Human'}
            </span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.resultStats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Time</span>
          <span className={styles.statValue}>{timeTaken}s</span>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Score</span>
          <span className={styles.statValue}>+{result.score}</span>
        </div>
        
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Streak</span>
          <span className={styles.statValue}>{result.streak}</span>
        </div>
      </div>

      {/* Explanation */}
      {explanation && animationPhase === 'reveal' && (
        <div className={styles.explanation}>
          <h4 className={styles.explanationTitle}>Why?</h4>
          <p className={styles.explanationText}>{explanation}</p>
        </div>
      )}

      {/* Close Button */}
      {onClose && !autoHide && (
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close feedback"
        >
          ×
        </button>
      )}

      {/* Progress bar for auto-hide */}
      {autoHide && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ 
              animationDuration: `${autoHideDelay}ms`,
              animationPlayState: animationPhase === 'exit' ? 'paused' : 'running'
            }}
          />
        </div>
      )}
    </div>
  );
};