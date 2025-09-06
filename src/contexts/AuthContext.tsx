import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  console.log('[AuthContext] Component mounted/rendered');
  console.log('[AuthContext] Current state:', { user, isLoading, token: token ? 'exists' : 'null' });

  useEffect(() => {
    console.log('[AuthContext] useEffect - Checking for existing session');
    // Check for existing session on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');
    
    console.log('[AuthContext] localStorage check:', {
      hasToken: !!storedToken,
      hasUser: !!storedUser,
      tokenLength: storedToken?.length,
      userValue: storedUser
    });
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('[AuthContext] Restoring session for user:', parsedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('[AuthContext] Failed to parse stored user:', error, storedUser);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('[AuthContext] No existing session found');
    }
    
    setIsLoading(false);
    console.log('[AuthContext] Initial loading complete');
  }, []);

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] Login attempt for email:', email);
    const requestBody = { email, password };
    console.log('[AuthContext] Login request body:', { email, passwordLength: password.length });
    
    try {
      const url = '/.netlify/functions/auth-login';
      console.log('[AuthContext] Sending login request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('[AuthContext] Login response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseText = await response.text();
      console.log('[AuthContext] Raw response body:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[AuthContext] Parsed response data:', data);
      } catch (parseError) {
        console.error('[AuthContext] Failed to parse response as JSON:', parseError);
        throw new Error(`Invalid response format: ${responseText}`);
      }

      if (!response.ok) {
        console.error('[AuthContext] Login failed with error:', data);
        throw new Error(data.message || `Login failed with status ${response.status}`);
      }

      console.log('[AuthContext] Login successful, storing credentials');
      console.log('[AuthContext] Token received:', data.token ? `${data.token.substring(0, 20)}...` : 'none');
      console.log('[AuthContext] User data received:', data.user);
      
      setToken(data.token);
      setUser(data.user);
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('[AuthContext] Credentials stored in localStorage');
    } catch (error) {
      console.error('[AuthContext] Login error details:', {
        error,
        message: (error as any).message,
        stack: (error as any).stack
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    console.log('[AuthContext] Signup attempt:', { email, name, passwordLength: password.length });
    const requestBody = { email, password, name };
    
    try {
      const url = '/.netlify/functions/auth-signup';
      console.log('[AuthContext] Sending signup request to:', url);
      console.log('[AuthContext] Signup request body:', { email, name, passwordLength: password.length });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('[AuthContext] Signup response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      const responseText = await response.text();
      console.log('[AuthContext] Raw signup response body:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('[AuthContext] Parsed signup response data:', data);
      } catch (parseError) {
        console.error('[AuthContext] Failed to parse signup response as JSON:', parseError);
        throw new Error(`Invalid response format: ${responseText}`);
      }

      if (!response.ok) {
        console.error('[AuthContext] Signup failed with error:', data);
        throw new Error(data.message || `Signup failed with status ${response.status}`);
      }

      console.log('[AuthContext] Signup successful, storing credentials');
      console.log('[AuthContext] Token received:', data.token ? `${data.token.substring(0, 20)}...` : 'none');
      console.log('[AuthContext] User data received:', data.user);
      
      setToken(data.token);
      setUser(data.user);
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      console.log('[AuthContext] New user credentials stored in localStorage');
    } catch (error) {
      console.error('[AuthContext] Signup error details:', {
        error,
        message: (error as any).message,
        stack: (error as any).stack
      });
      throw error;
    }
  };

  const logout = () => {
    console.log('[AuthContext] Logout initiated');
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    console.log('[AuthContext] User logged out, localStorage cleared');
  };

  const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input.toString();
    console.log('[AuthContext] authFetch called:', {
      url,
      method: init.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });
    
    if (token) {
      init.headers = {
        ...(init.headers || {}),
        'Authorization': `Bearer ${token}`
      };
      console.log('[AuthContext] Added Authorization header to request');
    } else {
      console.log('[AuthContext] No token available, sending request without auth');
    }
    
    try {
      const response = await fetch(input, init);
      console.log('[AuthContext] authFetch response:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      return response;
    } catch (error) {
      console.error('[AuthContext] authFetch error:', {
        url,
        error,
        message: (error as any).message
      });
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    authFetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};