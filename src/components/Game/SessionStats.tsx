import React, { useMemo } from 'react';
import { UserStats, GameSession } from '../../types';
import styles from './SessionStats.module.css';

interface SessionStatsProps {
  stats?: UserStats | null;
  session?: GameSession | null;
  className?: string;
  variant?: 'compact' | 'detailed' | 'live';
  showTitle?: boolean;
}

export const SessionStats: React.FC<SessionStatsProps> = ({
  stats,
  session,
  className,
  variant = 'detailed',
  showTitle = true
}) => {
  const displayStats = useMemo(() => {
    if (!stats && !session) return null;
    
    // Prioritize session stats if available, otherwise use overall stats
    const currentStreak = session?.current_streak ?? stats?.streak_current ?? 0;
    const bestStreak = Math.max(session?.best_streak ?? 0, stats?.streak_best ?? 0);
    const totalQuestions = session?.total_questions ?? stats?.total_questions ?? 0;
    const correctAnswers = session?.correct_answers ?? stats?.correct ?? 0;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const avgTime = stats?.avg_time_ms ? Math.round(stats.avg_time_ms / 1000) : null;
    const gamesPlayed = stats?.games_played ?? 0;

    return {
      currentStreak,
      bestStreak,
      totalQuestions,
      correctAnswers,
      accuracy,
      avgTime,
      gamesPlayed
    };
  }, [stats, session]);

  if (!displayStats) return null;

  const {
    currentStreak,
    bestStreak,
    totalQuestions,
    correctAnswers,
    accuracy,
    avgTime,
    gamesPlayed
  } = displayStats;

  const renderStatItem = (
    icon: string,
    label: string,
    value: string | number,
    color?: string,
    animate?: boolean
  ) => (
    <div className={`${styles.statItem} ${animate ? styles.animate : ''}`}>
      <div className={styles.statIcon} style={color ? { color } : undefined}>
        {icon}
      </div>
      <div className={styles.statContent}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );

  const renderCompactStats = () => (
    <div className={styles.compactStats}>
      {renderStatItem('🎯', 'Accuracy', `${Math.round(accuracy)}%`)}
      {renderStatItem('🔥', 'Streak', currentStreak, currentStreak > 0 ? '#ef4444' : undefined, currentStreak > 0)}
      {renderStatItem('✅', 'Correct', `${correctAnswers}/${totalQuestions}`)}
    </div>
  );

  const renderDetailedStats = () => (
    <div className={styles.detailedStats}>
      <div className={styles.primaryStats}>
        {renderStatItem('🎯', 'Accuracy', `${Math.round(accuracy)}%`, accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444')}
        {renderStatItem('🔥', 'Current Streak', currentStreak, currentStreak > 0 ? '#ef4444' : undefined, currentStreak > 0)}
        {renderStatItem('⚡', 'Best Streak', bestStreak, bestStreak > 0 ? '#8b5cf6' : undefined)}
      </div>
      
      <div className={styles.secondaryStats}>
        {renderStatItem('✅', 'Correct', correctAnswers)}
        {renderStatItem('❓', 'Total', totalQuestions)}
        {stats && avgTime && renderStatItem('⏱️', 'Avg Time', `${avgTime}s`)}
        {stats && renderStatItem('🎮', 'Games', gamesPlayed)}
      </div>
    </div>
  );

  const renderLiveStats = () => (
    <div className={styles.liveStats}>
      <div className={styles.liveHeader}>
        <h4 className={styles.liveTitle}>Session Progress</h4>
        <div className={styles.liveProgress}>
          <div 
            className={styles.progressBar}
            style={{ 
              '--progress': `${totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0}%` 
            } as React.CSSProperties}
          >
            <div className={styles.progressFill} />
          </div>
        </div>
      </div>
      
      <div className={styles.liveBody}>
        {renderStatItem('🎯', 'Accuracy', `${Math.round(accuracy)}%`, accuracy >= 70 ? '#10b981' : '#64748b')}
        {currentStreak > 0 && renderStatItem('🔥', 'Streak', currentStreak, '#ef4444', true)}
        {renderStatItem('✅', 'Score', `${correctAnswers}/${totalQuestions}`)}
      </div>
    </div>
  );

  return (
    <div className={`${styles.sessionStats} ${styles[variant]} ${className || ''}`}>
      {showTitle && variant !== 'live' && (
        <h3 className={styles.title}>
          {variant === 'compact' ? 'Stats' : 'Your Statistics'}
        </h3>
      )}
      
      {variant === 'compact' && renderCompactStats()}
      {variant === 'detailed' && renderDetailedStats()}
      {variant === 'live' && renderLiveStats()}
      
      {/* Category Performance */}
      {variant === 'detailed' && stats?.categories_performance && stats.categories_performance.length > 0 && (
        <div className={styles.categoryStats}>
          <h4 className={styles.categoryTitle}>Performance by Category</h4>
          <div className={styles.categoryList}>
            {stats.categories_performance.map((category, index) => (
              <div key={index} className={styles.categoryItem}>
                <div className={styles.categoryName}>{category.category_name}</div>
                <div className={styles.categoryAccuracy}>
                  {Math.round(category.accuracy)}%
                  <span className={styles.categoryCount}>
                    ({category.correct}/{category.total})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};