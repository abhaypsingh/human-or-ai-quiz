import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Logo and Description */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className={styles.logoText}>Human or AI?</span>
            </div>
            <p className={styles.description}>
              Test your ability to distinguish between human-written and AI-generated text.
            </p>
          </div>

          {/* Quick Links */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Quick Links</h3>
            <nav className={styles.links}>
              <Link to="/" className={styles.link}>
                Play Game
              </Link>
              <Link to="/leaderboard" className={styles.link}>
                Leaderboard
              </Link>
              <Link to="/profile" className={styles.link}>
                Profile
              </Link>
            </nav>
          </div>

          {/* Help & Support */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Support</h3>
            <nav className={styles.links}>
              <a 
                href="mailto:support@humanor-ai.com" 
                className={styles.link}
                aria-label="Contact support via email"
              >
                Contact
              </a>
              <a 
                href="#" 
                className={styles.link}
                onClick={(e) => {
                  e.preventDefault();
                  // This would open a help modal or navigate to help page
                }}
              >
                Help
              </a>
              <a 
                href="#" 
                className={styles.link}
                onClick={(e) => {
                  e.preventDefault();
                  // This would show keyboard shortcuts modal
                }}
              >
                Shortcuts
              </a>
            </nav>
          </div>

          {/* Social Links */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Connect</h3>
            <div className={styles.socialLinks}>
              <a 
                href="https://github.com" 
                className={styles.socialLink}
                aria-label="View source on GitHub"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                className={styles.socialLink}
                aria-label="Follow us on Twitter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottom}>
          <div className={styles.bottomContent}>
            <div className={styles.copyright}>
              <p>&copy; {currentYear} Human or AI? All rights reserved.</p>
            </div>
            <div className={styles.bottomLinks}>
              <a href="#" className={styles.bottomLink}>Privacy</a>
              <a href="#" className={styles.bottomLink}>Terms</a>
              <a href="#" className={styles.bottomLink}>Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};