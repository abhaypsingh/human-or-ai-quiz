import type { HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions';
import type { ValidationSchema, ValidationError } from '../types/index';

export class ValidationError extends Error {
  public errors: ValidationError[];
  public statusCode: number;

  constructor(errors: ValidationError[], message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    this.statusCode = 400;
  }
}

export function validateData(data: any, schema: ValidationSchema): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
        received: value,
        expected: 'non-empty value'
      });
      continue;
    }

    // Skip validation if field is not required and not provided
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }

    // Type validation
    if (rules.type && !validateType(value, rules.type)) {
      errors.push({
        field,
        message: `${field} must be of type ${rules.type}`,
        received: typeof value,
        expected: rules.type
      });
      continue;
    }

    // String/Array length validation
    if (rules.min !== undefined || rules.max !== undefined) {
      const length = getLength(value);
      
      if (rules.min !== undefined && length < rules.min) {
        errors.push({
          field,
          message: `${field} must have at least ${rules.min} ${getUnit(value)}`,
          received: length,
          expected: `>= ${rules.min}`
        });
      }
      
      if (rules.max !== undefined && length > rules.max) {
        errors.push({
          field,
          message: `${field} must have at most ${rules.max} ${getUnit(value)}`,
          received: length,
          expected: `<= ${rules.max}`
        });
      }
    }

    // Pattern validation (for strings)
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push({
        field,
        message: `${field} format is invalid`,
        received: value,
        expected: `pattern: ${rules.pattern.source}`
      });
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rules.enum.join(', ')}`,
        received: value,
        expected: rules.enum
      });
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        errors.push({
          field,
          message: typeof customResult === 'string' ? customResult : `${field} is invalid`,
          received: value,
          expected: 'custom validation to pass'
        });
      }
    }
  }

  return errors;
}

function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}

function getLength(value: any): number {
  if (typeof value === 'string' || Array.isArray(value)) {
    return value.length;
  }
  if (typeof value === 'number') {
    return value;
  }
  return 0;
}

function getUnit(value: any): string {
  if (typeof value === 'string') return 'characters';
  if (Array.isArray(value)) return 'items';
  if (typeof value === 'number') return 'value';
  return 'units';
}

// Common validation schemas
export const validationSchemas = {
  // User authentication
  userAuth: {
    email: {
      required: true,
      type: 'string' as const,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      max: 255
    },
    password: {
      required: true,
      type: 'string' as const,
      min: 8,
      max: 128
    }
  },

  // Session management
  session: {
    session_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    }
  },

  // Game session start
  startSession: {
    category_filter: {
      required: false,
      type: 'array' as const,
      max: 50,
      custom: (value: any[]) => value.every((id: any) => typeof id === 'number' && id > 0)
    }
  },

  // Guess submission
  submitGuess: {
    session_id: {
      required: true,
      type: 'string' as const,
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    },
    passage_id: {
      required: true,
      type: 'number' as const,
      min: 1
    },
    guess_source: {
      required: true,
      type: 'string' as const,
      enum: ['ai', 'human']
    },
    time_ms: {
      required: false,
      type: 'number' as const,
      min: 0,
      max: 300000 // 5 minutes max
    }
  },

  // User profile update
  profileUpdate: {
    handle: {
      required: false,
      type: 'string' as const,
      min: 2,
      max: 50,
      pattern: /^[a-zA-Z0-9_-]+$/
    }
  },

  // Feedback submission
  feedback: {
    type: {
      required: true,
      type: 'string' as const,
      enum: ['bug', 'feature', 'general']
    },
    title: {
      required: true,
      type: 'string' as const,
      min: 5,
      max: 200
    },
    message: {
      required: true,
      type: 'string' as const,
      min: 10,
      max: 2000
    },
    metadata: {
      required: false,
      type: 'object' as const
    }
  },

  // Pagination
  pagination: {
    page: {
      required: false,
      type: 'number' as const,
      min: 1,
      max: 1000
    },
    limit: {
      required: false,
      type: 'number' as const,
      min: 1,
      max: 100
    }
  },

  // Admin operations
  adminOperation: {
    action: {
      required: true,
      type: 'string' as const,
      enum: ['create', 'update', 'delete', 'verify']
    },
    resource: {
      required: true,
      type: 'string' as const,
      enum: ['user', 'passage', 'category', 'session']
    }
  }
};

// Validation middleware creator
export function createValidator(schema: ValidationSchema, location: 'body' | 'query' | 'params' = 'body') {
  return {
    validate: (event: HandlerEvent): { isValid: boolean; errors: ValidationError[]; data: any } => {
      let data: any = {};

      try {
        switch (location) {
          case 'body':
            data = event.body ? JSON.parse(event.body) : {};
            break;
          case 'query':
            data = event.queryStringParameters || {};
            // Convert string values to appropriate types for query params
            data = convertQueryParams(data, schema);
            break;
          case 'params':
            data = event.pathParameters || {};
            break;
        }
      } catch (error) {
        return {
          isValid: false,
          errors: [{
            field: 'body',
            message: 'Invalid JSON format',
            received: event.body,
            expected: 'valid JSON'
          }],
          data: null
        };
      }

      const errors = validateData(data, schema);
      return {
        isValid: errors.length === 0,
        errors,
        data
      };
    }
  };
}

// Convert query parameters to appropriate types
function convertQueryParams(params: Record<string, string>, schema: ValidationSchema): Record<string, any> {
  const converted: Record<string, any> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      converted[key] = value;
      continue;
    }

    const rule = schema[key];
    if (!rule) {
      converted[key] = value;
      continue;
    }

    switch (rule.type) {
      case 'number':
        const num = Number(value);
        converted[key] = isNaN(num) ? value : num;
        break;
      case 'boolean':
        converted[key] = value.toLowerCase() === 'true';
        break;
      case 'array':
        converted[key] = value.split(',').map(item => item.trim());
        break;
      default:
        converted[key] = value;
    }
  }

  return converted;
}

// Validation middleware wrapper
export function withValidation(schema: ValidationSchema, location: 'body' | 'query' | 'params' = 'body') {
  const validator = createValidator(schema, location);

  return (handler: Function) => {
    return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
      const { isValid, errors, data } = validator.validate(event);

      if (!isValid) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'Validation Error',
            message: 'Request validation failed',
            details: errors,
            timestamp: new Date().toISOString()
          })
        };
      }

      // Add validated data to the event for the handler to use
      (event as any).validatedData = data;

      try {
        return await handler(event, context);
      } catch (error) {
        throw error;
      }
    };
  };
}

// Specific validators for common use cases
export const validators = {
  body: (schema: ValidationSchema) => withValidation(schema, 'body'),
  query: (schema: ValidationSchema) => withValidation(schema, 'query'),
  params: (schema: ValidationSchema) => withValidation(schema, 'params'),

  // Pre-built validators
  sessionId: () => withValidation(validationSchemas.session, 'query'),
  startSession: () => withValidation(validationSchemas.startSession, 'body'),
  submitGuess: () => withValidation(validationSchemas.submitGuess, 'body'),
  profileUpdate: () => withValidation(validationSchemas.profileUpdate, 'body'),
  feedback: () => withValidation(validationSchemas.feedback, 'body'),
  pagination: () => withValidation(validationSchemas.pagination, 'query'),
  adminOperation: () => withValidation(validationSchemas.adminOperation, 'body')
};

// Helper function to sanitize input data
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data.trim();
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }

  return data;
}