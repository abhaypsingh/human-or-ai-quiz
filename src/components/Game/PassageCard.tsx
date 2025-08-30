import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Passage } from '../../types';
import styles from './PassageCard.module.css';

interface PassageCardProps {
  passage: Passage | null;
  isLoading?: boolean;
  isRevealed?: boolean;
  guessResult?: {
    correct: boolean;
    guess: 'ai' | 'human';
    actual: 'ai' | 'human';
  } | null;
  className?: string;
}

export const PassageCard: React.FC<PassageCardProps> = ({
  passage,
  isLoading = false,
  isRevealed = false,
  guessResult = null,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Animation effect when new passage loads
  useEffect(() => {
    if (passage) {
      setIsVisible(false);
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [passage]);

  if (isLoading) {
    return (
      <div className={clsx(styles.card, styles.loading, className)}>
        <div className={styles.header}>
          <div className={styles.category}>
            <div className={styles.skeleton} style={{ width: '120px' }} />
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.skeleton} style={{ width: '100%', height: '1.5rem', marginBottom: '0.75rem' }} />
          <div className={styles.skeleton} style={{ width: '95%', height: '1.5rem', marginBottom: '0.75rem' }} />
          <div className={styles.skeleton} style={{ width: '90%', height: '1.5rem', marginBottom: '0.75rem' }} />
          <div className={styles.skeleton} style={{ width: '85%', height: '1.5rem' }} />
        </div>
      </div>
    );
  }

  if (!passage) {
    return (
      <div className={clsx(styles.card, styles.empty, className)}>
        <div className={styles.emptyContent}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C12 5.56 12.56 5 13.253 5H18.5a1 1 0 01.707.293L21 7.086M12 19.253v-13m0 13C12 20.44 12.56 21 13.253 21H18.5a1 1 0 00.707-.293L21 18.914M12 19.253H5.753c-.693 0-1.253-.56-1.253-1.253V7c0-.693.56-1.253 1.253-1.253H12M21 7.086v10.828" />
            </svg>
          </div>
          <p>Ready to begin your next challenge?</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={clsx(
        styles.card, 
        isVisible && styles.visible,
        isRevealed && styles.revealed,
        guessResult?.correct && styles.correct,
        guessResult && !guessResult.correct && styles.incorrect,
        className
      )}
      style={{
        '--category-color': passage.theme_tokens?.palette?.accent || '#3b82f6',
      } as React.CSSProperties}
    >
      {/* Header with category and metadata */}
      <div className={styles.header}>
        <div className={styles.category}>
          <div className={styles.categoryIcon}>
            <svg width="16" height="16" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l4 4a2 2 0 010 2.828l-4 4a2 2 0 01-1.414.586H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
            </svg>
          </div>
          <span className={styles.categoryName}>
            {passage.category_name}
          </span>
        </div>

        {/* Show source and book info when revealed */}
        {isRevealed && (
          <div className={styles.metadata}>
            <div className={clsx(
              styles.source,
              passage.source === 'human' ? styles.human : styles.ai
            )}>
              <span className={styles.sourceIcon}>
                {passage.source === 'human' ? '📚' : '🤖'}
              </span>
              {passage.source === 'human' ? 'Human' : 'AI'}
            </div>
            {passage.book_title && (
              <div className={styles.bookInfo}>
                <div className={styles.bookTitle}>{passage.book_title}</div>
                {passage.author && (
                  <div className={styles.author}>by {passage.author}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className={styles.content}>
        <div 
          className={styles.text}
          role="article"
          aria-label={`Passage from ${passage.category_name}`}
        >
          {passage.text}
        </div>

        {/* Guess result feedback */}
        {isRevealed && guessResult && (
          <div className={clsx(
            styles.feedback,
            guessResult.correct ? styles.feedbackCorrect : styles.feedbackIncorrect
          )}>
            <div className={styles.feedbackIcon}>
              {guessResult.correct ? (
                <svg width="20" height="20" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg width="20" height="20" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className={styles.feedbackContent}>
              <div className={styles.feedbackTitle}>
                {guessResult.correct ? 'Correct!' : 'Not quite.'}
              </div>
              <div className={styles.feedbackDetail}>
                You guessed <strong>{guessResult.guess}</strong>, 
                it was actually <strong>{guessResult.actual}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Difficulty indicator */}
      {passage.difficulty && (
        <div className={styles.difficulty}>
          <div className={styles.difficultyLabel}>Difficulty</div>
          <div className={styles.difficultyStars}>
            {Array.from({ length: 5 }, (_, i) => (
              <span 
                key={i} 
                className={clsx(
                  styles.star,
                  i < passage.difficulty! && styles.filled
                )}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};