import type { HandlerEvent, HandlerContext } from '@netlify/functions';

// Database types
export type SourceType = 'ai' | 'human';
export type SessionStatus = 'open' | 'closed';

// Database table interfaces
export interface Category {
  id: number;
  name: string;
  domain: string;
  css_category: string;
  theme_tokens: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Passage {
  id: number;
  text: string;
  category_id: number;
  source_type: SourceType;
  reading_level: number;
  style_tags: string[];
  source_title?: string;
  source_author?: string;
  source_year?: number;
  source_public_domain?: boolean;
  source_citation?: string;
  generator_model?: string;
  prompt_signature?: string;
  verified: boolean;
  rand_key: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  handle?: string;
  created_at: string;
  sub: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: any;
  };
  app_metadata: {
    roles?: string[];
    [key: string]: any;
  };
}

export interface GameSession {
  id: string;
  user_id: string;
  status: SessionStatus;
  score: number;
  streak: number;
  questions_answered: number;
  category_filter: number[];
  started_at: string;
  ended_at?: string;
}

export interface Guess {
  id: number;
  session_id: string;
  user_id: string;
  passage_id: number;
  guess_source: SourceType;
  is_correct: boolean;
  time_ms: number;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  games_played: number;
  total_questions: number;
  correct: number;
  streak_best: number;
  last_played_at?: string;
}

// API request/response types
export interface StartSessionRequest {
  category_filter?: number[];
}

export interface StartSessionResponse {
  session_id: string;
}

export interface NextQuestionRequest {
  session_id: string;
}

export interface QuestionWithCategory extends Passage {
  category_name: string;
  css_category: string;
  theme_tokens: Record<string, any>;
}

export interface SubmitGuessRequest {
  session_id: string;
  passage_id: number;
  guess_source: SourceType;
  time_ms?: number;
}

export interface SubmitGuessResponse {
  correct: boolean;
  truth: SourceType;
  score: number;
  streak: number;
}

export interface UserProfileResponse {
  id: string;
  handle?: string;
  stats: UserStats;
  created_at: string;
}

export interface UpdateUserProfileRequest {
  handle?: string;
}

export interface SessionHistoryResponse {
  sessions: Array<GameSession & {
    accuracy?: number;
    duration?: number;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface FeedbackRequest {
  type: 'bug' | 'feature' | 'general';
  title: string;
  message: string;
  metadata?: {
    url?: string;
    userAgent?: string;
    timestamp?: string;
    [key: string]: any;
  };
}

export interface FeedbackResponse {
  id: string;
  status: 'received';
  message: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    auth: 'up' | 'down';
  };
  uptime: number;
  memory?: {
    used: number;
    total: number;
  };
}

// Error types
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  received?: any;
  expected?: any;
}

// Rate limiting types
export interface RateLimitState {
  count: number;
  resetTime: number;
  remaining: number;
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyGenerator?: (event: HandlerEvent, context: HandlerContext) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

// Middleware types
export interface CorsOptions {
  origin?: string | string[] | boolean | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

export interface ValidationSchema {
  [field: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
  };
}

// Enhanced authentication types
export interface AuthenticatedUser extends User {
  roles: string[];
  permissions: string[];
  isAdmin: boolean;
}

export interface JWTPayload {
  sub: string;
  email: string;
  roles?: string[];
  exp: number;
  iat: number;
  iss: string;
}

// Session security types
export interface SessionSecurityContext {
  user_id: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  last_activity: string;
  suspicious_activity: boolean;
}

// Anti-cheat types
export interface AntiCheatMetrics {
  avg_time_per_question: number;
  total_questions: number;
  accuracy_rate: number;
  time_variance: number;
  suspicious_patterns: string[];
  risk_score: number;
}

// Logging types
export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  context?: {
    userId?: string;
    sessionId?: string;
    functionName?: string;
    requestId?: string;
    [key: string]: any;
  };
}

// Database connection types
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  idleTimeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface QueryContext {
  userId?: string;
  sessionId?: string;
  functionName?: string;
  retryCount?: number;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Cache types
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string;
  tags?: string[];
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// Common utility types
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface HandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  rateLimitOptions?: RateLimitOptions;
  corsOptions?: CorsOptions;
  validationSchema?: ValidationSchema;
  cacheOptions?: CacheOptions;
}

// Re-export common types
export type { HandlerEvent, HandlerContext } from '@netlify/functions';