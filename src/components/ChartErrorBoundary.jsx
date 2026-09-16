import React from 'react';

export class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Recharts Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-[350px] min-h-[350px] bg-slate-900/80 p-6 rounded-2xl border border-slate-700/80 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
            📊
          </div>
          <h4 className="text-white text-sm font-bold">Dati grafico in elaborazione...</h4>
          <p className="text-slate-400 text-xs max-w-md">
            Visualizzazione temporaneamente in aggiornamento. I dati storici dei test sono salvi.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer transition-all"
          >
            Ricarica Grafico
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
