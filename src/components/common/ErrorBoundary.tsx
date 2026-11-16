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
      const isUr = typeof document !== 'undefined' && document.documentElement.dataset.lang === 'ur';
      return (
        <div className="kc-obsidian-card rounded-2xl p-6 text-center max-w-md mx-auto my-6">
          <div className="w-12 h-12 rounded-2xl bg-[#090D16] border border-[#D4AF37]/45 text-[#F5D061] flex items-center justify-center mx-auto mb-3 shadow-md">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">
            {this.props.title || (isUr ? 'یہ حصہ عارضی طور پر دستیاب نہیں' : 'Section Temporarily Unavailable')}
          </h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            {this.props.description || (isUr ? 'آپ کا سیشن محفوظ رکھنے کے لیے خرابی کو روک دیا گیا ہے۔' : 'A rendering issue was safely caught to keep your session stable.')}
          </p>
          {this.state.errorMessage && (
            <p className="text-[11px] font-mono text-amber-300/90 bg-[#090D16] border border-[#D4AF37]/25 rounded-lg px-2.5 py-1.5 mt-3 break-words">
              {this.state.errorMessage}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleRecover}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl kc-gold-button text-xs font-black tracking-wide cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isUr ? 'منظر بحال کریں' : 'Recover View'}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
