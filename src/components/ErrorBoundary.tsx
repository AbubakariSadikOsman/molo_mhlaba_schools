import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in app tree:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="center-loading" style={{ flexDirection: 'column', gap: 10, padding: 24, textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>Something went wrong.</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{this.state.error.message}</div>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
