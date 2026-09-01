'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!, this.resetError) || (
          <div className="error-boundary-fallback">
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center', 
              backgroundColor: '#fee2e2', 
              border: '1px solid #fca5a5',
              borderRadius: '0.5rem',
              margin: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <AlertTriangle size={32} color="#dc2626" />
              </div>
              <h2 style={{ marginBottom: '0.5rem', color: '#7f1d1d' }}>Something went wrong</h2>
              <p style={{ marginBottom: '1rem', color: '#9b2c2c' }}>{this.state.error?.message}</p>
              <button
                onClick={this.resetError}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 auto'
                }}
              >
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true,
): {
  status: 'idle' | 'pending' | 'success' | 'error';
  value: T | null;
  error: Error | null;
} {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const execute = React.useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { status, value, error };
}
