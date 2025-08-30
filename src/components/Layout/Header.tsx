import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';
import { UserStats } from '../../types';
import styles from './Header.module.css';

interface HeaderProps {
  stats?: UserStats | null;
}

export const Header: React.FC<HeaderProps> = ({ stats }) => {
  const { user, isAuthenticated, login, signup, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: 'Play', exact: true },
    { path: '/leaderboard', label: 'Leaderboard' },
    ...(isAuthenticated ? [{ path: '/profile', label: 'Profile' }] : []),
    ...(user?.app_metadata?.roles?.includes('admin') ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  const isActivePath = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className={styles.header} role="banner">
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="Human or AI - Home">
          <div className={styles.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className={styles.logoText}>Human or AI?</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.nav} role="navigation" aria-label="Main navigation">
          <ul className={styles.navList}>
            {navItems.map(({ path, label, exact }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={clsx(
                    styles.navLink,
                    isActivePath(path, exact) && styles.active
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Stats (Desktop) */}
        {stats && isAuthenticated && (
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.accuracy.toFixed(1)}%</span>
              <span className={styles.statLabel}>Accuracy</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.streak_best}</span>
              <span className={styles.statLabel}>Best Streak</span>
            </div>
          </div>
        )}

        {/* Auth Section */}
        <div className={styles.auth}>
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={userMenuRef}>
              <button
                className={styles.userButton}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <div className={styles.userAvatar}>
                  {user?.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt={user?.user_metadata?.full_name || user?.email}
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarInitial}>
                      {(user?.user_metadata?.full_name || user?.email || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span className={styles.userName}>
                  {user?.user_metadata?.full_name || user?.email}
                </span>
                <svg 
                  className={clsx(styles.chevron, isUserMenuOpen && styles.open)} 
                  width="16" 
                  height="16" 
                  fill="none" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isUserMenuOpen && (
                <div className={styles.userDropdown} role="menu">
                  <Link 
                    to="/profile" 
                    className={styles.menuItem} 
                    role="menuitem"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7-7 7 7 0 00-7 7h14z" />
                    </svg>
                    Profile
                  </Link>
                  {user?.app_metadata?.roles?.includes('admin') && (
                    <Link 
                      to="/admin" 
                      className={styles.menuItem} 
                      role="menuitem"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4a2 2 0 00-2-2H8a2 2 0 00-2 2v2m4 6V10m-4 6h8" />
                      </svg>
                      Admin
                    </Link>
                  )}
                  <hr className={styles.menuDivider} />
                  <button 
                    onClick={logout} 
                    className={styles.menuItem} 
                    role="menuitem"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authButtons}>
              <Button variant="ghost" onClick={login} size="sm">
                Sign In
              </Button>
              <Button onClick={signup} size="sm">
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <div className={clsx(styles.hamburger, isMenuOpen && styles.open)}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={styles.mobileMenu} ref={mobileMenuRef}>
          <nav className={styles.mobileNav} role="navigation" aria-label="Mobile navigation">
            <ul className={styles.mobileNavList}>
              {navItems.map(({ path, label, exact }) => (
                <li key={path}>
                  <Link
                    to={path}
                    className={clsx(
                      styles.mobileNavLink,
                      isActivePath(path, exact) && styles.active
                    )}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile Stats */}
          {stats && isAuthenticated && (
            <div className={styles.mobileStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.accuracy.toFixed(1)}%</span>
                <span className={styles.statLabel}>Accuracy</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{stats.streak_best}</span>
                <span className={styles.statLabel}>Best Streak</span>
              </div>
            </div>
          )}

          {/* Mobile Auth */}
          {!isAuthenticated && (
            <div className={styles.mobileAuth}>
              <Button variant="ghost" onClick={login} size="sm" className={styles.mobileAuthButton}>
                Sign In
              </Button>
              <Button onClick={signup} size="sm" className={styles.mobileAuthButton}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};