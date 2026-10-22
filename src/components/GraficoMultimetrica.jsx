import React, { useState } from 'react';
import { TrendingUp, Percent, BarChart2 } from 'lucide-react';
import { sortTestsByDate, toStrictNullOrNumber } from '../utils/testUtils';

const parsePositiveNum = (v) => toStrictNullOrNumber(v, false);

const METRIC_CONFIG = [
  {
    id: 'lsiQuad',
    cleanKey: 'lsi_quad',
    label: 'LSI Quadricipite',
    unit: '%',
    color: '#06B6D4',
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
    color: '#10B981',
    getRawValue: (t) => parsePositiveNum(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto)
  },
  {
    id: 'rsiCmj',
    cleanKey: 'rsi_mod',
    label: 'RSImod',
    unit: 'm/s',
    color: '#F59E0B',
    getRawValue: (t) => {
      const direct = parsePositiveNum(t?.rsiCmj ?? t?.rsi_cmj ?? t?.rsi_mod);
      if (direct !== null) return direct;
      const h = parsePositiveNum(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto);
      const ct = parsePositiveNum(t?.contractionTime ?? t?.contraction_time_ms ?? t?.tempo_contrazione);
      if (h !== null && ct !== null && ct > 0) {
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
    color: '#F43F5E',
    getRawValue: (t) => parsePositiveNum(t?.lsiSingleHop ?? t?.lsi_single_hop)
  },
  {
    id: 'peakPower',
    cleanKey: 'peak_power',
    label: 'Peak Power',
    unit: 'W/kg',
    color: '#A855F7',
    getRawValue: (t) => parsePositiveNum(t?.peakPower ?? t?.peak_power_w ?? t?.potenza_picco)
  },
  {
    id: 'eccBrakingSX',
    cleanKey: 'ecc_braking',
    label: 'Eccentric Impulse SX',
    unit: 'N·s',
    color: '#FB923C',
    getRawValue: (t) => parsePositiveNum(t?.eccBrakingSX ?? t?.ecc_braking_sx)
  },
  {
    id: 'lsiFlex',
    cleanKey: 'lsi_flex',
    label: 'LSI Flessori',
    unit: '%',
    color: '#38BDF8',
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

  const rawTests = sortTestsByDate(tests);

  if (rawTests.length === 0) {
    return (
      <div className="w-full bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 text-center space-y-2 no-print shadow-md">
        <TrendingUp className="w-7 h-7 text-sky-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-100">Nessuna sessione disponibile per il Grafico Storico</h4>
        <p className="text-xs text-slate-400">Inserisci almeno un test nella Batteria Test per visualizzare il trend temporale.</p>
      </div>
    );
  }

  const startX = 60;
  const endX = 940;
  const numTests = rawTests.length;

  // Filtra rigorosamente i valori null/undefined per ogni metrica prima di calcolare baseline, variazioni % e punti SVG
  const validCountByMetric = {};
  METRIC_CONFIG.forEach(m => {
    validCountByMetric[m.id] = rawTests.filter(t => m.getRawValue(t) !== null).length;
  });

  const activeMetricDefs = METRIC_CONFIG.filter(m => activeMetrics.includes(m.id));

  // Raccogli tutti i punti validi (non-null) delle metriche selezionate
  const rawSeriesByMetric = {};
  const allPlottedValues = [];

  activeMetricDefs.forEach(m => {
    const validEntries = [];
    rawTests.forEach((t, idx) => {
      const absVal = m.getRawValue(t);
      if (absVal !== null && absVal !== undefined) {
        validEntries.push({
          sessionIdx: idx,
          absVal,
          testLabel: t.session_name || t.label || `Sessione #${idx + 1}`,
          date: t.dateRange || t.date || ''
        });
      }
    });

    if (validEntries.length > 0) {
      const baseline = validEntries[0].absVal;
      const computedEntries = validEntries.map(entry => {
        const plottedVal =
          viewMode === 'relative'
            ? baseline > 0
              ? ((entry.absVal - baseline) / baseline) * 100
              : 0
            : entry.absVal;
        allPlottedValues.push(plottedVal);
        return {
          ...entry,
          val: Number(plottedVal.toFixed(1))
        };
      });
      rawSeriesByMetric[m.id] = computedEntries;
    } else {
      rawSeriesByMetric[m.id] = [];
    }
  });

  const globalMin = allPlottedValues.length > 0 ? Math.min(...allPlottedValues) : 0;
  const globalMax = allPlottedValues.length > 0 ? Math.max(...allPlottedValues) : 100;
  const globalRange = globalMax - globalMin === 0 ? 1 : globalMax - globalMin;

  const metricLinesData = activeMetricDefs
    .map(m => {
      const entries = rawSeriesByMetric[m.id] || [];
      if (entries.length === 0) return null;

      const points = entries.map((entry) => {
        const x =
          numTests > 1
            ? startX + (entry.sessionIdx / (numTests - 1)) * (endX - startX)
            : startX + (endX - startX) / 2;
        const y = 160 - ((entry.val - globalMin) / globalRange) * 125;
        return {
          ...entry,
          x,
          y
        };
      });

      const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

      return {
        def: m,
        points,
        pathD
      };
    })
    .filter(Boolean);

  return (
    <div className="block w-full space-y-3 no-print font-sans text-white">

      {/* 1. BLOCCO SUPERIORE: FILTRI E SELEZIONE METRICHE */}
      <div className="w-full bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wide">
                GRAFICO MULTIMETRICA (IGNORA TEST ASSENTI / NULL)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700/70 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('relative')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'relative'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Percent className="w-3 h-3" />
              <span>% Variazione Relativa</span>
            </button>

            <button
              onClick={() => setViewMode('absolute')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                viewMode === 'absolute'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
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
            const validCount = validCountByMetric[m.id] || 0;
            return (
              <button
                key={m.id}
                onClick={() => toggleMetric(m.id)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isActive
                    ? 'bg-slate-900 text-white border-slate-500 shadow-xs'
                    : 'bg-slate-900/50 text-slate-400 border-slate-700/60 opacity-80 hover:opacity-100'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: m.color }}
                />
                <span>{isActive ? `✓ ${m.label}` : m.label}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {validCount > 0 ? `(${m.unit})` : '(Non testato)'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. BLOCCO INFERIORE: GRAFICO SVG */}
      <div className="block w-full h-[265px] min-h-[255px] bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 shadow-lg relative">
        <div className="w-full h-[235px] flex flex-col justify-between relative">
          <div className="w-full h-[185px] relative">
            {metricLinesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Nessun dato numerico rilevato per le metriche selezionate (Stato: Non testato / N/A).
              </div>
            ) : (
              <svg
                width="100%"
                height="185px"
                viewBox="0 0 1000 200"
                preserveAspectRatio="none"
                className="overflow-visible"
              >
                <line x1="20" y1="35" x2="980" y2="35" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="20" y1="97" x2="980" y2="97" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="20" y1="160" x2="980" y2="160" stroke="#334155" strokeDasharray="4 4" strokeWidth="1" />

                {metricLinesData.map((mLine) => (
                  <g key={mLine.def.id}>
                    {mLine.points.length > 1 && (
                      <path
                        d={mLine.pathD}
                        fill="none"
                        stroke={mLine.def.color}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {mLine.points.map((pt, pIdx) => (
                      <g key={pIdx} className="cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="6"
                          fill={mLine.def.color}
                          stroke="#0F172A"
                          strokeWidth="2"
                          onMouseEnter={() =>
                            setHoveredPoint({
                              ...pt,
                              metricLabel: mLine.def.label,
                              color: mLine.def.color,
                              unit: mLine.def.unit
                            })
                          }
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 11}
                          textAnchor="middle"
                          fill="#F8FAFC"
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
            )}

            {hoveredPoint && (
              <div className="absolute top-1 right-2 bg-slate-900 border border-slate-600 p-3 rounded-xl shadow-2xl text-[11px] space-y-1 font-sans pointer-events-none z-30">
                <div className="text-slate-100 font-bold flex items-center justify-between gap-3 border-b border-slate-700 pb-1">
                  <span>{hoveredPoint.testLabel}</span>
                  <span className="text-[10px] text-sky-400 font-mono font-bold">{hoveredPoint.date}</span>
                </div>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredPoint.color }} />
                  <span className="text-slate-300 font-semibold">{hoveredPoint.metricLabel}:</span>
                  <span className="text-white font-mono font-bold text-xs">
                    {hoveredPoint.absVal} {hoveredPoint.unit}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Etichette Asse Orizzontale */}
          <div className="w-full flex justify-between text-xs font-mono font-bold text-slate-400 px-4 pt-2 border-t border-slate-700/60">
            {rawTests.map((t, idx) => (
              <div key={t.id || idx} className="text-center">
                <span className="block text-slate-100 font-bold text-xs">
                  {t.session_name || t.label || `Sessione #${idx + 1}`}
                </span>
                <span className="block text-[10px] text-sky-400 font-semibold">
                  {t.dateRange || t.date || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
