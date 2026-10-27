import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary component that catches rendering errors in its
 * child component tree and displays a fallback UI instead of crashing.
 * Used to wrap lazy-loaded modules to prevent uncaught errors from
 * crashing the entire app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="text-lg font-bold text-stone-700 dark:text-stone-300 mb-2">
            Something went wrong
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-600 mb-4 max-w-xs">
            This feature encountered an error and couldn't load properly.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-semibold hover:bg-cyan-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for lazy-loaded modules with error boundary protection.
 * Shows a loading spinner while the module is being fetched.
 */
export function LazyWithErrorBoundary({
  component: LazyComponent,
  loading,
  fallback,
  onError,
}: {
  component: React.LazyExoticComponent<any>;
  loading?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}) {
  return (
    <ErrorBoundary fallback={fallback} onError={(err) => onError?.(err as Error)}>
      <React.Suspense
        fallback={
          loading || (
            <div className="flex items-center justify-center p-8 min-h-[200px]">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
          )
        }
      >
        <LazyComponent />
      </React.Suspense>
    </ErrorBoundary>
  );
}
