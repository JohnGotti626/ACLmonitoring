import React, { useState } from 'react';
import { TrendingUp, Percent, BarChart2, Info } from 'lucide-react';

const METRIC_CONFIG = [
  {
    id: 'lsiQuad',
    cleanKey: 'lsi_quad',
    label: 'LSI Quadricipite',
    unit: '%',
    color: '#06b6d4', // Cyan
    getValue: (t) => {
      const val = parseFloat(t?.lsiQuad);
      return !isNaN(val) ? val : 72.4;
    }
  },
  {
    id: 'jumpHeight',
    cleanKey: 'cmj_height',
    label: 'Altezza CMJ',
    unit: 'cm',
    color: '#10b981', // Emerald Green
    getValue: (t) => {
      const val = parseFloat(t?.jumpHeight);
      return !isNaN(val) ? val : 28.1;
    }
  },
  {
    id: 'rsiCmj',
    cleanKey: 'rsi_mod',
    label: 'RSImod',
    unit: 'm/s',
    color: '#f59e0b', // Amber Gold
    getValue: (t) => {
      const val = parseFloat(t?.rsiCmj);
      return !isNaN(val) ? val : 0.43;
    }
  },
  {
    id: 'lsiSingleHop',
    cleanKey: 'single_hop',
    label: 'Single Hop LSI',
    unit: '%',
    color: '#ec4899', // Neon Pink
    getValue: (t) => {
      const val = parseFloat(t?.lsiSingleHop);
      return !isNaN(val) ? val : 73.9;
    }
  },
  {
    id: 'peakPower',
    cleanKey: 'peak_power',
    label: 'Peak Power',
    unit: 'W/kg',
    color: '#a855f7', // Purple
    getValue: (t) => {
      const val = parseFloat(t?.peakPower);
      return !isNaN(val) ? val : 44.8;
    }
  },
  {
    id: 'eccBrakingSX',
    cleanKey: 'ecc_braking',
    label: 'Eccentric Impulse SX',
    unit: 'N·s',
    color: '#f97316', // Orange
    getValue: (t) => {
      const val = parseFloat(t?.eccBrakingSX);
      return !isNaN(val) ? val : 220;
    }
  },
  {
    id: 'lsiFlex',
    cleanKey: 'lsi_flex',
    label: 'LSI Ischiocrurali',
    unit: '%',
    color: '#3b82f6', // Blue
    getValue: (t) => {
      const val = parseFloat(t?.lsiFlex);
      return !isNaN(val) ? val : 75.5;
    }
  }
];

export default function GraficoMultimetrica({ tests = [] }) {
  const [viewMode, setViewMode] = useState('relative');
  const [activeMetrics, setActiveMetrics] = useState(['lsiQuad', 'jumpHeight']);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Dati di fallback se l'array del paziente è vuoto
  const rawTests = (tests && tests.length > 0) ? tests : [
    { id: 't1', label: 'TEST #1', date: '10/08', lsiQuad: 72.4, jumpHeight: 28.1, rsiCmj: 0.43, lsiSingleHop: 73.9, peakPower: 44.8, eccBrakingSX: 220, lsiFlex: 75.5 },
    { id: 't2', label: 'TEST #2', date: '10/09', lsiQuad: 81.5, jumpHeight: 32.5, rsiCmj: 0.53, lsiSingleHop: 80.5, peakPower: 49.2, eccBrakingSX: 235, lsiFlex: 82.0 },
    { id: 't3', label: 'TEST #3', date: '10/10', lsiQuad: 88.5, jumpHeight: 35.8, rsiCmj: 0.61, lsiSingleHop: 86.0, peakPower: 52.4, eccBrakingSX: 248, lsiFlex: 88.0 },
    { id: 't4', label: 'TEST #4', date: '10/11', lsiQuad: 94.2, jumpHeight: 38.0, rsiCmj: 0.68, lsiSingleHop: 92.0, peakPower: 55.0, eccBrakingSX: 260, lsiFlex: 92.5 }
  ];

  const toggleMetric = (id) => {
    if (activeMetrics.includes(id)) {
      if (activeMetrics.length > 1) {
        setActiveMetrics(activeMetrics.filter(mId => mId !== id));
      }
    } else {
      setActiveMetrics([...activeMetrics, id]);
    }
  };

  const activeMetricDefs = METRIC_CONFIG.filter(m => activeMetrics.includes(m.id));

  // Baseline values (Test #1)
  const baselines = {};
  activeMetricDefs.forEach(m => {
    const val = m.getValue(rawTests[0]);
    baselines[m.id] = val !== 0 ? val : 1;
  });

  // Coordinate SVG per viewBox "0 0 1000 200"
  const startX = 50;
  const endX = 950;
  const numTests = rawTests.length;

  const metricLinesData = activeMetricDefs.map(m => {
    const values = rawTests.map(t => {
      const absVal = m.getValue(t);
      if (viewMode === 'relative') {
        const baseVal = baselines[m.id];
        return baseVal !== 0 ? ((absVal - baseVal) / baseVal) * 100 : 0;
      }
      return absVal;
    });

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = (maxV - minV) === 0 ? 1 : (maxV - minV);

    const points = values.map((val, idx) => {
      const x = numTests > 1 ? startX + (idx / (numTests - 1)) * (endX - startX) : startX + (endX - startX) / 2;
      // Y axis: 25 at top, 160 at bottom
      const y = 160 - ((val - minV) / range) * 135;
      const absVal = m.getValue(rawTests[idx]);
      return {
        x,
        y,
        val: Number(val.toFixed(1)),
        absVal,
        testLabel: rawTests[idx].label || `TEST #${idx + 1}`,
        date: rawTests[idx].date || ''
      };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    return {
      def: m,
      points,
      pathD
    };
  });

  return (
    <div className="block w-full space-y-3 no-print font-sans text-slate-100">
      
      {/* ========================================================================= */}
      {/* 1. BLOCCO SUPERIORE: FILTRI E SELEZIONE METRICHE */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#0a1628] p-3.5 rounded-xl border border-slate-800 shadow-md space-y-2.5">
        
        {/* Intestazione Titolo + Pulsanti Toggle Modalità */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 rounded-lg text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wide">
                GRAFICO MULTIMETRICA
              </h3>
            </div>
          </div>

          {/* Pulsanti [% Variazione Relativa | Valori Assoluti] */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shadow-inner self-start sm:self-auto">
            <button
              onClick={() => setViewMode('relative')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'relative'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm border border-cyan-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>% Variazione Relativa</span>
            </button>

            <button
              onClick={() => setViewMode('absolute')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'absolute'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md border border-cyan-400/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Valori Assoluti</span>
            </button>
          </div>
        </div>

        {/* Pillole delle Metriche Selezionabili (flex-row flex-wrap gap-1.5) */}
        <div className="flex flex-row flex-wrap items-center gap-1.5">
          {METRIC_CONFIG.map(m => {
            const isActive = activeMetrics.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleMetric(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                  isActive
                    ? 'bg-slate-900 font-extrabold shadow-sm border-cyan-500/60'
                    : 'bg-slate-950/60 text-slate-500 border-slate-800 opacity-60 hover:opacity-100'
                }`}
                style={{
                  color: isActive ? m.color : '#94a3b8'
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: m.color }}
                />
                <span>{isActive ? `✓ ${m.label}` : m.label}</span>
                <span className="text-[9.5px] font-mono opacity-80">({m.unit})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. BLOCCO INFERIORE: ESCLUSIVO PER IL GRAFICO (block, w-full, max h-[260px]) */}
      {/* ========================================================================= */}
      <div className="block w-full h-[260px] min-h-[250px] bg-[#0a1628] p-3 rounded-2xl border border-slate-800 shadow-xl relative">
        
        {/* Div pulito h-[235px] w-full */}
        <div className="w-full h-[235px] flex flex-col justify-between relative">
          
          {/* SVG del Grafico (width="100%" height="190px" viewBox="0 0 1000 200" preserveAspectRatio="none") */}
          <div className="w-full h-[190px] relative">
            <svg
              width="100%"
              height="190px"
              viewBox="0 0 1000 200"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Griglie Orizzontali Dash */}
              <line x1="20" y1="30" x2="980" y2="30" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="20" y1="95" x2="980" y2="95" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="20" y1="160" x2="980" y2="160" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />

              {/* Render delle Linee Multi-Metrica */}
              {metricLinesData.map((mLine) => (
                <g key={mLine.def.id}>
                  <path
                    d={mLine.pathD}
                    fill="none"
                    stroke={mLine.def.color}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Punti Dati (Circle Dots r=6) */}
                  {mLine.points.map((pt, pIdx) => (
                    <g key={pIdx} className="cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="6"
                        fill={mLine.def.color}
                        stroke="#020617"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredPoint({ ...pt, metricLabel: mLine.def.label, color: mLine.def.color, unit: mLine.def.unit })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      
                      {/* Valore Etichetta sopra il Punto */}
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        fill={mLine.def.color}
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {viewMode === 'relative' ? `${pt.val >= 0 ? '+' : ''}${pt.val}%` : pt.absVal}
                      </text>
                    </g>
                  ))}
                </g>
              ))}
            </svg>

            {/* Tooltip Hover */}
            {hoveredPoint && (
              <div className="absolute top-1 right-2 bg-slate-900 border border-slate-700 p-2 rounded-xl shadow-2xl text-[11px] space-y-0.5 font-sans pointer-events-none z-30">
                <div className="text-white font-black flex items-center justify-between gap-3 border-b border-slate-800 pb-0.5">
                  <span>{hoveredPoint.testLabel}</span>
                  <span className="text-[10px] text-cyan-400 font-mono font-bold">{hoveredPoint.date}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredPoint.color }} />
                  <span className="text-slate-200 font-bold">{hoveredPoint.metricLabel}:</span>
                  <span className="text-white font-mono font-black text-[11px]">{hoveredPoint.absVal} {hoveredPoint.unit}</span>
                </div>
              </div>
            )}
          </div>

          {/* Riga Orizzontale Ben Spaziata delle Etichette Date/Test Sotto l'SVG */}
          <div className="w-full flex justify-between text-xs font-mono font-bold text-slate-200 px-4 pt-1.5 border-t border-slate-800/90">
            {rawTests.map((t, idx) => (
              <div key={idx} className="text-center">
                <span className="block text-slate-100 font-black">{t.label || `TEST #${idx + 1}`}</span>
                <span className="block text-[10px] text-cyan-400 font-semibold">{t.date || ''}</span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
