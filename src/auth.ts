import { useAuth0 } from '@auth0/auth0-react';

let getTokenFn: (() => Promise<string>) | null = null;
let isAuthenticatedFn: (() => boolean) | null = null;

export const authFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  try {
    if (isAuthenticatedFn?.() && getTokenFn) {
      const token = await getTokenFn();
      init.headers = { 
        ...(init.headers || {}), 
        Authorization: `Bearer ${token}` 
      };
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return fetch(input, init);
};

export const useAuth = () => {
  const { 
    loginWithRedirect, 
    logout, 
    user, 
    isAuthenticated, 
    isLoading,
    getAccessTokenSilently 
  } = useAuth0();

  // Store references for authFetch to use
  getTokenFn = getAccessTokenSilently;
  isAuthenticatedFn = () => isAuthenticated;

  const openLogin = () => loginWithRedirect();
  const openSignup = () => loginWithRedirect({ 
    authorizationParams: {
      screen_hint: 'signup'
    }
  });
  
  const signOut = () => logout({ 
    logoutParams: {
      returnTo: window.location.origin 
    }
  });

  const currentUser = () => {
    if (!isAuthenticated || !user) return null;
    return {
      id: user.sub,
      email: user.email,
      user_metadata: {
        full_name: user.name,
        avatar_url: user.picture
      }
    };
  };

  return {
    openLogin,
    openSignup,
    logout: signOut,
    currentUser,
    authFetch,
    isLoading,
    isAuthenticated
  };
};
