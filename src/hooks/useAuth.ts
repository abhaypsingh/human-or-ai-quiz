import { useState, useEffect, useCallback } from 'react';
import { initIdentity, openLogin, openSignup, logout, currentUser } from '../auth';
import { User, AuthContext } from '../types';

export const useAuth = (): AuthContext => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication and set up listeners
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        // Initialize Netlify Identity
        initIdentity();
        
        // Set initial user state
        const current = currentUser();
        if (mounted) {
          setUser(current);
          setIsLoading(false);
        }

        // Listen for auth state changes
        const handleLogin = () => {
          if (mounted) {
            setUser(currentUser());
            setIsLoading(false);
          }
        };

        const handleLogout = () => {
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
        };

        // Set up event listeners
        if (window.netlifyIdentity) {
          window.netlifyIdentity.on('login', handleLogin);
          window.netlifyIdentity.on('logout', handleLogout);
          window.netlifyIdentity.on('error', (err) => {
            console.error('Netlify Identity error:', err);
            if (mounted) {
              setIsLoading(false);
            }
          });

          // Clean up event listeners
          return () => {
            if (window.netlifyIdentity) {
              window.netlifyIdentity.off('login', handleLogin);
              window.netlifyIdentity.off('logout', handleLogout);
            }
          };
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  // Check authentication status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const current = currentUser();
      setUser(current);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const login = useCallback(() => {
    try {
      openLogin();
    } catch (error) {
      console.error('Login error:', error);
    }
  }, []);

  const signup = useCallback(() => {
    try {
      openSignup();
    } catch (error) {
      console.error('Signup error:', error);
    }
  }, []);

  const handleLogout = useCallback(() => {
    try {
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout: handleLogout,
  };
};

// Hook for checking if user has specific role
export const useRole = (role: string): boolean => {
  const { user } = useAuth();
  return user?.app_metadata?.roles?.includes(role) ?? false;
};

// Hook for checking if user is admin
export const useIsAdmin = (): boolean => {
  return useRole('admin');
};