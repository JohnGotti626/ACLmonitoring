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
    color: '#0284c7', // Sky Blue
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
    color: '#059669', // Emerald Green
    getRawValue: (t) => parsePositiveNum(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto)
  },
  {
    id: 'rsiCmj',
    cleanKey: 'rsi_mod',
    label: 'RSImod',
    unit: 'm/s',
    color: '#d97706', // Amber
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
    color: '#db2777', // Pink
    getRawValue: (t) => parsePositiveNum(t?.lsiSingleHop ?? t?.lsi_single_hop)
  },
  {
    id: 'peakPower',
    cleanKey: 'peak_power',
    label: 'Peak Power',
    unit: 'W/kg',
    color: '#7c3aed', // Violet
    getRawValue: (t) => parsePositiveNum(t?.peakPower ?? t?.peak_power_w ?? t?.potenza_picco)
  },
  {
    id: 'eccBrakingSX',
    cleanKey: 'ecc_braking',
    label: 'Eccentric Impulse SX',
    unit: 'N·s',
    color: '#ea580c', // Orange
    getRawValue: (t) => parsePositiveNum(t?.eccBrakingSX ?? t?.ecc_braking_sx)
  },
  {
    id: 'lsiFlex',
    cleanKey: 'lsi_flex',
    label: 'LSI Ischiocrurali',
    unit: '%',
    color: '#2563eb', // Blue
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

export default function GraficoMultimetrica({ tests = [] }) {
  const [viewMode, setViewMode] = useState('relative');
  const [activeMetrics, setActiveMetrics] = useState(['lsiQuad', 'jumpHeight']);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const rawTests = sortTestsByDate(tests);

  if (!rawTests || rawTests.length === 0) {
    return (
      <div className="w-full p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 no-print shadow-xs">
        <TrendingUp className="w-8 h-8 text-sky-500/60 mx-auto" />
        <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
          Grafico Multimetrico (Nessun Dato)
        </h3>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Nessuna valutazione clinica registrata per questo paziente. Registra la prima valutazione per visualizzare l'andamento multimetrico nel tempo.
        </p>
      </div>
    );
  }

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

  // Serie storiche con persistenza cronologica (Carry-Forward dell'ultimo valore valido)
  const seriesByMetric = {};
  const baselines = {};

  activeMetricDefs.forEach(m => {
    let lastValid = null;
    const rawValues = rawTests.map(t => m.getRawValue(t));
    const firstValid = rawValues.find(v => v !== null) ?? 0;
    baselines[m.id] = firstValid > 0 ? firstValid : 1;

    seriesByMetric[m.id] = rawValues.map((v) => {
      if (v !== null) {
        lastValid = v;
        return { absVal: v, isCarriedForward: false };
      }
      // Se in una data successiva il test non è stato ripetuto, mantiene l'ultimo valore valido registrato
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
    <div className="block w-full space-y-3 no-print font-sans text-slate-900">
      
      {/* ========================================================================= */}
      {/* 1. BLOCCO SUPERIORE: FILTRI E SELEZIONE METRICHE */}
      {/* ========================================================================= */}
      <div className="w-full bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        
        {/* Intestazione Titolo + Pulsanti Toggle Modalità */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                GRAFICO MULTIMETRICA (ANDAMENTO STORICO PERSISTENTE)
              </h3>
            </div>
          </div>

          {/* Pulsanti [% Variazione Relativa | Valori Assoluti] */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('relative')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'relative'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>% Variazione Relativa</span>
            </button>

            <button
              onClick={() => setViewMode('absolute')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'absolute'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-white font-extrabold shadow-xs border-slate-300'
                    : 'bg-slate-50 text-slate-500 border-slate-200 opacity-75 hover:opacity-100'
                }`}
                style={{
                  color: isActive ? m.color : '#64748b'
                }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
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
      {/* 2. BLOCCO INFERIORE: GRAFICO */}
      {/* ========================================================================= */}
      <div className="block w-full h-[260px] min-h-[250px] bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs relative">
        
        <div className="w-full h-[235px] flex flex-col justify-between relative">
          
          <div className="w-full h-[190px] relative">
            <svg
              width="100%"
              height="190px"
              viewBox="0 0 1000 200"
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Griglie Orizzontali Dash */}
              <line x1="20" y1="30" x2="980" y2="30" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="20" y1="95" x2="980" y2="95" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />
              <line x1="20" y1="160" x2="980" y2="160" stroke="#e2e8f0" strokeDasharray="4 4" strokeWidth="1" />

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
                        stroke="#ffffff"
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
              <div className="absolute top-1 right-2 bg-white border border-slate-200 p-2.5 rounded-xl shadow-lg text-[11px] space-y-0.5 font-sans pointer-events-none z-30">
                <div className="text-slate-900 font-black flex items-center justify-between gap-3 border-b border-slate-200 pb-1">
                  <span>{hoveredPoint.testLabel}</span>
                  <span className="text-[10px] text-sky-700 font-mono font-bold">{hoveredPoint.date}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredPoint.color }} />
                  <span className="text-slate-600 font-bold">{hoveredPoint.metricLabel}:</span>
                  <span className="text-slate-900 font-mono font-black text-[11px]">{hoveredPoint.absVal} {hoveredPoint.unit}</span>
                </div>
                {hoveredPoint.isCarriedForward && (
                  <div className="text-[9.5px] text-amber-700 font-semibold">
                    Dato persistente da test precedente
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Riga Orizzontale Etichette Date/Test Sotto l'SVG */}
          <div className="w-full flex justify-between text-xs font-mono font-bold text-slate-700 px-4 pt-1.5 border-t border-slate-200">
            {rawTests.map((t, idx) => (
              <div key={idx} className="text-center">
                <span className="block text-slate-900 font-black">{t.label || `TEST #${idx + 1}`}</span>
                <span className="block text-[10px] text-sky-700 font-semibold">{t.date || ''}</span>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}

