import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

// DUMMY DATA DI FALLBACK STATICO
const DEFAULT_FALLBACK_DATA = [
  { testName: 'Test #1', lsi_quad: 70, cmj_height: 20, rsi_mod: 0.40, single_hop: 72, peak_power: 42 },
  { testName: 'Test #2', lsi_quad: 82, cmj_height: 25, rsi_mod: 0.50, single_hop: 80, peak_power: 48 },
  { testName: 'Test #3', lsi_quad: 89, cmj_height: 31, rsi_mod: 0.58, single_hop: 86, peak_power: 53 }
];

export default function MultiMetricChart({ data, activeMetricDefs, viewMode }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. DUMMY DATA DI CONFERMA (FALLBACK)
  const chartData = (data && data.length > 0) ? data : DEFAULT_FALLBACK_DATA;

  // Se non ancora montato nel DOM, mostra il fallback visuale
  if (!isMounted) {
    return (
      <div className="w-full h-[350px] min-h-[350px] bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold">Dati grafico in elaborazione...</p>
      </div>
    );
  }

  // Active lines list or default 2 lines
  const linesToRender = activeMetricDefs && activeMetricDefs.length > 0
    ? activeMetricDefs
    : [
        { cleanKey: 'lsi_quad', label: 'LSI Quadricipite', color: '#06b6d4' },
        { cleanKey: 'cmj_height', label: 'Altezza CMJ', color: '#10b981' }
      ];

  // 3. RENDER RECHARTS MINIMO GARANTITO
  return (
    <div className="w-full h-[350px] min-h-[350px] bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
      <ResponsiveContainer width="100%" height="100%" minHeight={350}>
        <LineChart data={chartData} margin={{ top: 15, right: 25, left: 0, bottom: 15 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="testName" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} unit={viewMode === 'relative' ? '%' : ''} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#ffffff' }} />
          
          {linesToRender.map((m) => (
            <Line
              key={m.cleanKey || m.id}
              type="monotone"
              dataKey={m.cleanKey || m.id}
              stroke={m.color || '#06b6d4'}
              strokeWidth={3}
              dot={{ r: 6 }}
              name={m.label || m.name || m.cleanKey}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
