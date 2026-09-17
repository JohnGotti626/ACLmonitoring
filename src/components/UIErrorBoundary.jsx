import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class UIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI Error caught by UIErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 bg-[#0a1628] rounded-2xl border border-red-500/40 flex flex-col items-center justify-center gap-3 text-center my-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-white text-sm font-extrabold uppercase tracking-wide">
            {this.props.title || 'Errore di Rendering Interfaccia'}
          </h4>
          <p className="text-slate-400 text-xs max-w-md">
            Si è verificato un problema nella visualizzazione di questo componente. I dati del paziente sono al sicuro.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-500/40 flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ripristina Visualizzazione</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
