import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error occurred.'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Kifayat Connect ErrorBoundary]', error, errorInfo);
  }

  handleRecover = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#111622] border border-[#D4AF37]/35 rounded-2xl p-6 text-center max-w-md mx-auto my-6 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-[#D4AF37]/40 text-[#F5D061] flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">
            {this.props.title || 'Section Temporarily Unavailable'}
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {this.props.description || 'A rendering issue was safely caught to keep your session stable.'}
          </p>
          {this.state.errorMessage && (
            <p className="text-[11px] font-mono text-amber-300/80 bg-[#0A0D12] border border-slate-800 rounded-lg px-2.5 py-1.5 mt-3 break-words">
              {this.state.errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleRecover}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl kc-gold-button text-xs font-black tracking-wide transition hover:opacity-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recover View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
