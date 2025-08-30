// Core Application Types
export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    roles?: string[];
  };
}

export interface Passage {
  id: number;
  text: string;
  category_name: string;
  css_category: string;
  theme_tokens: ThemeTokens;
  source: 'ai' | 'human';
  book_title?: string;
  author?: string;
  difficulty?: number;
}

export interface GameSession {
  id: string;
  user_id?: string;
  category_filter?: number[] | null;
  created_at: string;
  completed_at?: string;
  total_questions: number;
  correct_answers: number;
  current_streak: number;
  best_streak: number;
}

export interface GameGuess {
  id: number;
  session_id: string;
  passage_id: number;
  guess_source: 'ai' | 'human';
  actual_source: 'ai' | 'human';
  correct: boolean;
  time_ms: number;
  created_at: string;
}

export interface UserStats {
  total_questions: number;
  correct: number;
  accuracy: number;
  streak_current: number;
  streak_best: number;
  avg_time_ms: number;
  games_played: number;
  categories_performance: CategoryStats[];
}

export interface CategoryStats {
  category_name: string;
  total: number;
  correct: number;
  accuracy: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_name: string;
  user_id: string;
  total_correct: number;
  total_questions: number;
  accuracy: number;
  best_streak: number;
  avg_time_ms: number;
}

// Theme Types
export interface ThemeTokens {
  palette?: {
    bg?: string;
    surface?: string;
    text?: string;
    accent?: string;
    accent2?: string;
    success?: string;
    error?: string;
    warning?: string;
    info?: string;
  };
  radius?: string;
  border?: string;
  shadowButton?: string;
  typography?: {
    ui?: string;
    scale?: {
      h1?: string;
      h2?: string;
      h3?: string;
      body?: string;
      small?: string;
    };
  };
  anim?: {
    enter?: string;
    ctaHover?: string;
    fadeIn?: string;
    slideUp?: string;
  };
  ctaStyle?: string;
}

export type Theme = 'light' | 'dark' | 'auto';

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface StartSessionResponse {
  session_id: string;
}

export interface NextQuestionResponse extends Passage {}

export interface SubmitGuessResponse {
  correct: boolean;
  truth: 'ai' | 'human';
  score: number;
  streak: number;
  explanation?: string;
  time_ms: number;
}

// Component Props Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

// Game State Types
export type GameState = 'idle' | 'loading' | 'playing' | 'revealing' | 'completed' | 'error';

export interface GameContext {
  session: GameSession | null;
  currentPassage: Passage | null;
  gameState: GameState;
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startSession: (categoryFilter?: number[]) => Promise<void>;
  submitGuess: (guess: 'ai' | 'human') => Promise<void>;
  nextQuestion: () => Promise<void>;
  resetGame: () => void;
}

// Auth Context Types
export interface AuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: () => void;
  signup: () => void;
  logout: () => void;
}

// Admin Types
export interface AdminPassage {
  id?: number;
  text: string;
  source: 'ai' | 'human';
  category_id: number;
  book_title?: string;
  author?: string;
  difficulty?: number;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  css_category: string;
  theme_tokens: ThemeTokens;
  passage_count: number;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// Keyboard Shortcuts
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

// Animation Types
export type AnimationState = 'enter' | 'exit' | 'idle';

export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}