import netlifyIdentity from 'netlify-identity-widget';

export function initIdentity() {
  netlifyIdentity.on('init', user => {
    // no-op
  });
  netlifyIdentity.on('login', () => {
    window.location.reload();
  });
  netlifyIdentity.on('logout', () => {
    window.location.reload();
  });
  netlifyIdentity.init();
}

export function openLogin() {
  netlifyIdentity.open('login');
}
export function openSignup() {
  netlifyIdentity.open('signup');
}
export function logout() {
  netlifyIdentity.logout();
}
export function currentUser(): any | null {
  return netlifyIdentity.currentUser();
}
export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = netlifyIdentity.currentUser();
  if (user) {
    const token = await user.token?.access_token ? user.token.access_token : user?.jwt();
    init.headers = { ...(init.headers || {}), Authorization: `Bearer ${token}` };
  }
  return fetch(input, init);
}