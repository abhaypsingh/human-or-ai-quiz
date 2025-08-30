import React, { useEffect, useCallback } from 'react';
import { Button } from '../common/Button';
import styles from './GuessButtons.module.css';

interface GuessButtonsProps {
  onGuess: (guess: 'ai' | 'human') => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const GuessButtons: React.FC<GuessButtonsProps> = ({
  onGuess,
  disabled = false,
  loading = false,
  className
}) => {
  const handleKeypress = useCallback((event: KeyboardEvent) => {
    if (disabled || loading) return;
    
    // Don't trigger if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    switch (event.key.toLowerCase()) {
      case 'h':
        event.preventDefault();
        onGuess('human');
        break;
      case 'a':
        event.preventDefault();
        onGuess('ai');
        break;
      case '1':
        event.preventDefault();
        onGuess('human');
        break;
      case '2':
        event.preventDefault();
        onGuess('ai');
        break;
    }
  }, [onGuess, disabled, loading]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeypress);
    return () => window.removeEventListener('keydown', handleKeypress);
  }, [handleKeypress]);

  return (
    <div className={`${styles.guessButtons} ${className || ''}`}>
      <Button
        variant="secondary"
        size="lg"
        onClick={() => onGuess('human')}
        disabled={disabled || loading}
        loading={loading}
        className={styles.humanButton}
        icon={
          <span className={styles.buttonIcon} role="img" aria-label="Human">
            👤
          </span>
        }
      >
        <span className={styles.buttonContent}>
          <span className={styles.buttonLabel}>Human</span>
          <span className={styles.buttonShortcut}>H or 1</span>
        </span>
      </Button>
      
      <Button
        variant="primary"
        size="lg"
        onClick={() => onGuess('ai')}
        disabled={disabled || loading}
        loading={loading}
        className={styles.aiButton}
        icon={
          <span className={styles.buttonIcon} role="img" aria-label="AI">
            🤖
          </span>
        }
      >
        <span className={styles.buttonContent}>
          <span className={styles.buttonLabel}>AI</span>
          <span className={styles.buttonShortcut}>A or 2</span>
        </span>
      </Button>
    </div>
  );
};