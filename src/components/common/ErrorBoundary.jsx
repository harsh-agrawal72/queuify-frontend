import React from 'react';
import { AlertTriangle, RefreshCw, Home, LogOut } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-12 text-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-red-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>

              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-4 italic">
                Oops! Something <span className="text-red-500 underline decoration-wavy decoration-2 underline-offset-4">crashed.</span>
              </h1>
              
              <p className="text-slate-500 font-bold mb-8 text-sm leading-relaxed">
                The application encountered an unexpected error. Don't worry, your data is safe, but we need to restart the session.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-8 p-4 bg-slate-900 rounded-2xl text-left overflow-hidden">
                  <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-2">Error Details:</p>
                  <p className="text-[11px] font-mono text-slate-300 break-all">
                    {this.state.error?.toString()}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleReset}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Home className="h-4 w-4" /> Return Home
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                    <button
                        onClick={this.handleLogout}
                        className="py-3.5 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-red-100 hover:text-red-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <LogOut className="h-3 w-3" /> Logout
                    </button>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Safety Protocol Active</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
