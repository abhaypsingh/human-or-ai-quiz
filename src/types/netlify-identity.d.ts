declare module 'netlify-identity-widget' {
  export interface User {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
    app_metadata?: {
      provider?: string;
      roles?: string[];
    };
  }

  export interface NetlifyIdentity {
    init(): void;
    open(): void;
    close(): void;
    on(event: string, callback: (user?: User) => void): void;
    off(event: string, callback: (user?: User) => void): void;
    currentUser(): User | null;
    logout(): Promise<void>;
  }

  const netlifyIdentity: NetlifyIdentity;
  export default netlifyIdentity;
}

interface Window {
  netlifyIdentity?: {
    init(): void;
    open(): void;
    close(): void;
    on(event: string, callback: (user?: any) => void): void;
    off(event: string, callback: (user?: any) => void): void;
    currentUser(): any;
    logout(): Promise<void>;
  };
}