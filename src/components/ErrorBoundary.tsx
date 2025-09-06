import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('🚨 [ErrorBoundary] Error caught by boundary:', {
      errorId,
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      hasError: true,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { errorId } = this.state;
    
    console.error('🚨 [ErrorBoundary] Component stack trace:', {
      errorId,
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary',
      timestamp: new Date().toISOString()
    });

    console.error('🚨 [ErrorBoundary] Full error details:', {
      errorId,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack,
        toString: error.toString()
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      localStorage: {
        hasAuthToken: !!localStorage.getItem('auth_token'),
        hasUser: !!localStorage.getItem('user'),
        allKeys: Object.keys(localStorage)
      },
      sessionStorage: {
        allKeys: Object.keys(sessionStorage)
      }
    });

    // Store error details for display
    this.setState({
      error,
      errorInfo
    });

    // Log to console with formatted output
    console.group(`🚨 Error ${this.state.errorId}`);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          maxWidth: '800px', 
          margin: '2rem auto',
          border: '2px solid #ff0000',
          borderRadius: '8px',
          backgroundColor: '#fff5f5'
        }}>
          <h2 style={{ color: '#cc0000', marginTop: 0 }}>🚨 Something went wrong</h2>
          
          <div style={{ 
            backgroundColor: '#ffffff', 
            padding: '1rem', 
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #ffcccc'
          }}>
            <p><strong>Error ID:</strong> {this.state.errorId}</p>
            <p><strong>Time:</strong> {new Date().toISOString()}</p>
            {this.state.error && (
              <>
                <p><strong>Error:</strong> {this.state.error.message}</p>
                <details style={{ marginTop: '1rem' }}>
                  <summary style={{ cursor: 'pointer', color: '#0066cc' }}>
                    Technical Details (click to expand)
                  </summary>
                  <pre style={{ 
                    backgroundColor: '#f5f5f5', 
                    padding: '1rem', 
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                  }}>
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <div>
                      <h4>Component Stack:</h4>
                      <pre style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '1rem', 
                        overflow: 'auto',
                        fontSize: '0.875rem'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </details>
              </>
            )}
          </div>

          <p style={{ marginBottom: '1rem' }}>
            Please check the browser console for detailed error logs. 
            The error has been logged with ID: <code>{this.state.errorId}</code>
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
            
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#cc6600',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Storage & Reload
            </button>

            <button 
              onClick={() => {
                console.log('🐛 [ErrorBoundary] Manual state reset triggered');
                this.setState({ 
                  hasError: false, 
                  error: null, 
                  errorInfo: null,
                  errorId: ''
                });
              }}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}