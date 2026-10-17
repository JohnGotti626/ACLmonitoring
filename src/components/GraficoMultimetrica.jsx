import React, { useState } from 'react';
import { TrendingUp, Percent, BarChart2 } from 'lucide-react';
import { sortTestsByDate } from '../utils/testUtils';

const parsePositiveNum = (v) => {
  if (v === null || v === undefined || v === '' || v === '-') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace('%', '').replace(',', '.').trim());
  return !isNaN(n) && n > 0 ? n : null;
};

const METRIC_CONFIG = [
  {
    id: 'lsiQuad',
    cleanKey: 'lsi_quad',
    label: 'LSI Quadricipite',
    unit: '%',
    color: '#06B6D4', // Cyan Clinico
    getRawValue: (t) => {
      const direct = parsePositiveNum(t?.lsiQuad ?? t?.lsi_quad_calculated);
      if (direct !== null) return direct;
      const sx = parsePositiveNum(t?.quadSano ?? t?.iso_leg_ext_sx);
      const dx = parsePositiveNum(t?.quadOp ?? t?.iso_leg_ext_dx);
      if (sx !== null && dx !== null) {
        return parseFloat(((Math.min(sx, dx) / Math.max(sx, dx)) * 100).toFixed(1));
      }
      return null;
    }
  },
  {
    id: 'jumpHeight',
    cleanKey: 'cmj_height',
    label: 'Altezza CMJ',
    unit: 'cm',
    color: '#0D9488', // Teal Muto
    getRawValue: (t) => parsePositiveNum(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto)
  },
  {
    id: 'rsiCmj',
    cleanKey: 'rsi_mod',
    label: 'RSImod',
    unit: 'm/s',
    color: '#F59E0B', // Amber Clinico
    getRawValue: (t) => {
      const direct = parsePositiveNum(t?.rsiCmj ?? t?.rsi_cmj ?? t?.rsi_mod);
      if (direct !== null) return direct;
      const h = parsePositiveNum(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto);
      const ct = parsePositiveNum(t?.contractionTime ?? t?.contraction_time_ms ?? t?.tempo_contrazione);
      if (h !== null && ct !== null) {
        return parseFloat(((h / 100) / (ct / 1000)).toFixed(2));
      }
      return null;
    }
  },
  {
    id: 'lsiSingleHop',
    cleanKey: 'single_hop',
    label: 'Single Hop LSI',
    unit: '%',
    color: '#F43F5E', // Rose Muto
    getRawValue: (t) => parsePositiveNum(t?.lsiSingleHop ?? t?.lsi_single_hop)
  },
  {
    id: 'peakPower',
    cleanKey: 'peak_power',
    label: 'Peak Power',
    unit: 'W/kg',
    color: '#A855F7', // Purple Muto
    getRawValue: (t) => parsePositiveNum(t?.peakPower ?? t?.peak_power_w ?? t?.potenza_picco)
  },
  {
    id: 'eccBrakingSX',
    cleanKey: 'ecc_braking',
    label: 'Eccentric Impulse SX',
    unit: 'N·s',
    color: '#FB923C', // Warm Orange
    getRawValue: (t) => parsePositiveNum(t?.eccBrakingSX ?? t?.ecc_braking_sx)
  },
  {
    id: 'lsiFlex',
    cleanKey: 'lsi_flex',
    label: 'LSI Flessori',
    unit: '%',
    color: '#38BDF8', // Sky Clinico
    getRawValue: (t) => {
      const direct = parsePositiveNum(t?.lsiFlex ?? t?.lsi_curl_calculated);
      if (direct !== null) return direct;
      const sx = parsePositiveNum(t?.flexSano ?? t?.iso_leg_curl_sx);
      const dx = parsePositiveNum(t?.flexOp ?? t?.iso_leg_curl_dx);
      if (sx !== null && dx !== null) {
        return parseFloat(((Math.min(sx, dx) / Math.max(sx, dx)) * 100).toFixed(1));
      }
      return null;
    }
  }
];

export default function GraficoMultimetrica({ tests }) {
  const [viewMode, setViewMode] = useState('relative'); // 'relative' | 'absolute'
  const [activeMetrics, setActiveMetrics] = useState(['lsiQuad', 'jumpHeight', 'rsiCmj']);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const toggleMetric = (id) => {
    setActiveMetrics(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter(m => m !== id);
      }
      return [...prev, id];
    });
  };

  // Ordina sempre i test in ordine cronologico temporale (dal più vecchio al più recente)
  const rawTests = sortTestsByDate(tests);

  if (rawTests.length === 0) {
    return (
      <div className="w-full bg-[#1E293B] p-6 rounded-2xl border border-[#334155] text-center space-y-2 no-print shadow-md">
        <TrendingUp className="w-7 h-7 text-[#06B6D4] mx-auto" />
        <h4 className="text-sm font-extrabold text-white">Nessuna sessione disponibile per il Grafico Storico</h4>
        <p className="text-xs text-[#94A3B8]">Inserisci almeno un test nella Batteria Test per visualizzare il trend temporale.</p>
      </div>
    );
  }

  const activeMetricDefs = METRIC_CONFIG.filter(m => activeMetrics.includes(m.id));

  // Costruisce la serie storica con forward-fill dell'ultimo dato valido
  const baselines = {};
  const seriesByMetric = {};

  METRIC_CONFIG.forEach(m => {
    const rawValues = rawTests.map(t => m.getRawValue(t));
    const firstValid = rawValues.find(v => v !== null) ?? 1;
    baselines[m.id] = firstValid !== 0 ? firstValid : 1;

    let lastValid = null;
    seriesByMetric[m.id] = rawValues.map((v) => {
      if (v !== null) {
        lastValid = v;
        return { absVal: v, isCarriedForward: false };
      }
      if (lastValid !== null) {
        return { absVal: lastValid, isCarriedForward: true };
      }
      return { absVal: firstValid, isCarriedForward: true };
    });
  });

  // Coordinate SVG per viewBox "0 0 1000 200"
  const startX = 50;
  const endX = 950;
  const numTests = rawTests.length;

  const metricLinesData = activeMetricDefs.map(m => {
    const series = seriesByMetric[m.id] || [];
    const values = series.map(({ absVal }) => {
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
      const y = 160 - ((val - minV) / range) * 135;
      const absVal = series[idx]?.absVal ?? 0;
      const isCarriedForward = series[idx]?.isCarriedForward ?? false;
      return {
        x,
        y,
        val: Number(val.toFixed(1)),
        absVal,
        isCarriedForward,
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
    <div className="block w-full space-y-3 no-print font-sans text-white">
      
      {/* ========================================================================= */}
      {/* 1. BLOCCO SUPERIORE: FILTRI E SELEZIONE METRICHE */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#1E293B] p-4 rounded-2xl border border-[#334155] shadow-md space-y-2.5">
        
        {/* Intestazione Titolo + Pulsanti Toggle Modalità */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0F172A] border border-[#334155] rounded-lg text-[#06B6D4]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wide">
                GRAFICO MULTIMETRICA (ANDAMENTO STORICO PERSISTENTE)
              </h3>
            </div>
          </div>

          {/* Pulsanti [% Variazione Relativa | Valori Assoluti] */}
          <div className="flex items-center gap-1 bg-[#0F172A] p-1 rounded-xl border border-[#334155] self-start sm:self-auto">
            <button
              onClick={() => setViewMode('relative')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'relative'
                  ? 'bg-[#0D9488] text-white shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>% Variazione Relativa</span>
            </button>

            <button
              onClick={() => setViewMode('absolute')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'absolute'
                  ? 'bg-[#06B6D4] text-slate-950 shadow-sm'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Valori Assoluti</span>
            </button>
          </div>
        </div>

        {/* Pillole delle Metriche Selezionabili */}
        <div className="flex flex-row flex-wrap items-center gap-1.5">
          {METRIC_CONFIG.map(m => {
            const isActive = activeMetrics.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleMetric(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-[#0F172A] font-extrabold shadow-xs border-[#334155]'
                    : 'bg-[#0F172A]/60 text-[#94A3B8] border-[#334155]/60 opacity-75 hover:opacity-100'
                }`}
                style={{
                  color: isActive ? '#FFFFFF' : '#94A3B8'
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                <span>{isActive ? `✓ ${m.label}` : m.label}</span>
                <span className="text-[9.5px] font-mono text-[#94A3B8]">({m.unit})</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. BLOCCO INFERIORE: GRAFICO */}
      {/* ========================================================================= */}
      <div className="block w-full h-[260px] min-h-[250px] bg-[#1E293B] p-3.5 rounded-2xl border border-[#334155] shadow-md relative">
        
        <div className="w-full h-[235px] flex flex-col justify-between relative">
          
          <div className="w-full h-[190px] relative">
            <svg
              width="100%"
              height="190px"
              viewBox="0 0 1000 200"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Griglie Orizzontali Dash (#334155) */}
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
                        stroke="#0F172A"
                        strokeWidth="2"
                        onMouseEnter={() => setHoveredPoint({ ...pt, metricLabel: mLine.def.label, color: mLine.def.color, unit: mLine.def.unit })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      
                      {/* Valore Etichetta sopra il Punto */}
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        fill="#FFFFFF"
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
              <div className="absolute top-1 right-2 bg-[#0F172A] border border-[#334155] p-2.5 rounded-xl shadow-2xl text-[11px] space-y-0.5 font-sans pointer-events-none z-30">
                <div className="text-white font-black flex items-center justify-between gap-3 border-b border-[#334155] pb-1">
                  <span>{hoveredPoint.testLabel}</span>
                  <span className="text-[10px] text-[#06B6D4] font-mono font-bold">{hoveredPoint.date}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredPoint.color }} />
                  <span className="text-[#94A3B8] font-bold">{hoveredPoint.metricLabel}:</span>
                  <span className="text-white font-mono font-black text-[11px]">{hoveredPoint.absVal} {hoveredPoint.unit}</span>
                </div>
                {hoveredPoint.isCarriedForward && (
                  <div className="text-[9.5px] text-amber-400 font-semibold">
                    Dato persistente da test precedente
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Riga Orizzontale Etichette Date/Test Sotto l'SVG */}
          <div className="w-full flex justify-between text-xs font-mono font-bold text-[#94A3B8] px-4 pt-1.5 border-t border-[#334155]">
            {rawTests.map((t, idx) => (
              <div key={idx} className="text-center">
                <span className="block text-white font-black">{t.label || `TEST #${idx + 1}`}</span>
                <span className="block text-[10px] text-[#06B6D4] font-semibold">{t.date || ''}</span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
