import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { repairCorruptedLocalCachePreserveSession } from '../../utils/cacheRecovery';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  isRoot?: boolean;
  title?: string;
  description?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
  autoRecoveryAttempted: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private recoveryTimer: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
      autoRecoveryAttempted: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error occurred.'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Kifayat Connect ErrorBoundary]', error, errorInfo);
    const repaired = repairCorruptedLocalCachePreserveSession();

    if (this.props.isRoot && !this.state.autoRecoveryAttempted && repaired.length > 0) {
      this.recoveryTimer = window.setTimeout(() => {
        this.setState({
          hasError: false,
          errorMessage: '',
          autoRecoveryAttempted: true
        });
      }, 60);
    }
  }

  componentWillUnmount() {
    if (this.recoveryTimer !== null) {
      window.clearTimeout(this.recoveryTimer);
    }
  }

  handleRecover = () => {
    repairCorruptedLocalCachePreserveSession();
    this.setState({
      hasError: false,
      errorMessage: '',
      autoRecoveryAttempted: true
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const isUr = typeof document !== 'undefined' && document.documentElement.dataset.lang === 'ur';
      const wrapperClass = this.props.isRoot
        ? 'min-h-[100dvh] w-full flex items-center justify-center p-5 bg-[#021B14] text-slate-100'
        : 'my-6 px-3';

      return (
        <div className={wrapperClass}>
          <div className="kc-obsidian-card rounded-2xl p-6 text-center max-w-md w-full mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-[#022C22] border border-[#D4AF37]/55 text-[#F5D061] flex items-center justify-center mx-auto mb-3 shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">
              {this.props.title || (isUr ? 'اسکرین محفوظ طریقے سے بحال ہو رہی ہے' : 'Recovering Secure View')}
            </h3>
            <p className="text-xs text-emerald-100/80 mt-1.5 leading-relaxed">
              {this.props.description ||
                (isUr
                  ? 'آپ کا لاگ ان سیشن محفوظ رکھتے ہوئے عارضی خرابی صاف کر دی گئی ہے۔'
                  : 'A temporary rendering issue was safely caught and broken cache was repaired while preserving your login session.')}
            </p>
            {this.state.errorMessage && (
              <p className="text-[11px] font-mono text-amber-300/90 bg-[#021B14] border border-[#D4AF37]/30 rounded-lg px-2.5 py-1.5 mt-3 break-words">
                {this.state.errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleRecover}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl kc-gold-button text-xs font-black tracking-wide cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isUr ? 'ایپ بحال کریں' : 'Restore App View'}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
