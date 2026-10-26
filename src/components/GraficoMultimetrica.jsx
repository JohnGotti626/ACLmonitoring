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
    color: '#059669', // Emerald-600
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
    color: '#0D9488', // Teal-600
    getRawValue: (t) => parsePositiveNum(t?.jumpHeight ?? t?.jump_height_cm ?? t?.altezza_salto)
  },
  {
    id: 'rsiCmj',
    cleanKey: 'rsi_mod',
    label: 'RSImod',
    unit: 'm/s',
    color: '#D97706', // Amber-600
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
    color: '#E11D48', // Rose-600
    getRawValue: (t) => parsePositiveNum(t?.lsiSingleHop ?? t?.lsi_single_hop)
  },
  {
    id: 'peakPower',
    cleanKey: 'peak_power',
    label: 'Peak Power',
    unit: 'W/kg',
    color: '#7C3AED', // Violet-600
    getRawValue: (t) => parsePositiveNum(t?.peakPower ?? t?.peak_power_w ?? t?.potenza_picco)
  },
  {
    id: 'eccBrakingSX',
    cleanKey: 'ecc_braking',
    label: 'Eccentric Impulse SX',
    unit: 'N·s',
    color: '#EA580C', // Orange-600
    getRawValue: (t) => parsePositiveNum(t?.eccBrakingSX ?? t?.ecc_braking_sx)
  },
  {
    id: 'lsiFlex',
    cleanKey: 'lsi_flex',
    label: 'LSI Flessori',
    unit: '%',
    color: '#0284C7', // Sky-600
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
    setActiveMetrics((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  };

  const rawTests = sortTestsByDate(tests);

  if (rawTests.length === 0) {
    return (
      <div className="w-full bg-white p-4 rounded-xl border border-slate-200/80 text-center space-y-2 no-print shadow-sm">
        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg w-fit mx-auto">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
        </div>
        <h4 className="text-sm font-bold text-slate-900">Nessuna sessione disponibile per il Grafico Storico</h4>
        <p className="text-xs text-slate-500">Inserisci almeno un test nella Batteria Test per visualizzare il trend temporale.</p>
      </div>
    );
  }

  const startX = 65;
  const endX = 945;
  const numTests = rawTests.length;

  const validCountByMetric = {};
  METRIC_CONFIG.forEach((m) => {
    validCountByMetric[m.id] = rawTests.filter((t) => m.getRawValue(t) !== null).length;
  });

  const activeMetricDefs = METRIC_CONFIG.filter((m) => activeMetrics.includes(m.id));

  const rawSeriesByMetric = {};
  const allPlottedValues = [];

  activeMetricDefs.forEach((m) => {
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

    if (validEntries.length === 0) return;

    const baseVal = validEntries[0].absVal > 0 ? validEntries[0].absVal : 1;

    const plotted = validEntries.map((entry) => {
      const val =
        viewMode === 'relative'
          ? parseFloat((((entry.absVal - baseVal) / baseVal) * 100).toFixed(1))
          : entry.absVal;
      allPlottedValues.push(val);
      return {
        ...entry,
        val
      };
    });

    rawSeriesByMetric[m.id] = plotted;
  });

  const minVal = allPlottedValues.length > 0 ? Math.min(...allPlottedValues) : 0;
  const maxVal = allPlottedValues.length > 0 ? Math.max(...allPlottedValues) : 100;
  const span = maxVal - minVal === 0 ? 20 : maxVal - minVal;

  const topY = 38;
  const bottomY = 250;

  const metricLinesData = activeMetricDefs
    .filter((m) => rawSeriesByMetric[m.id] && rawSeriesByMetric[m.id].length > 0)
    .map((m) => {
      const points = rawSeriesByMetric[m.id].map((pt) => {
        const x =
          numTests === 1
            ? 500
            : Math.round(startX + (pt.sessionIdx * (endX - startX)) / (numTests - 1));
        const normalized = (pt.val - minVal) / span;
        const y = Math.round(bottomY - normalized * (bottomY - topY));
        return {
          ...pt,
          x,
          y
        };
      });

      const pathD = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

      return {
        def: m,
        points,
        pathD
      };
    });

  const midVal = ((maxVal + minVal) / 2).toFixed(1);

  return (
    <div className="w-full bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm no-print break-inside-avoid">
      {/* 1. HEADER COMPATTO + TOGGLE MODALITÀ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-100 text-slate-600 shrink-0">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide leading-tight">
              GRAFICO MULTIMETRICA (TREND TEMPORALE)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              Confronto storico tra sessioni (i test non eseguiti vengono ignorati)
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('relative')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'relative'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Percent className="w-3 h-3" />
            <span>Variazione %</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('absolute')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              viewMode === 'absolute'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>Valori Assoluti</span>
          </button>
        </div>
      </div>

      {/* 2. LEGENDA METRICHE COMPATTA */}
      <div className="flex flex-wrap gap-2 mb-4">
        {METRIC_CONFIG.map((m) => {
          const isActive = activeMetrics.includes(m.id);
          const count = validCountByMetric[m.id] || 0;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMetric(m.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-50/70 text-slate-900 border-emerald-300 shadow-xs'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isActive ? m.color : '#94A3B8' }}
              />
              <span>{m.label}</span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({count > 0 ? `${count}` : 'N/A'})
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. CONTENITORE GRAFICO CON ALTEZZA FISSA h-[380px] */}
      <div className="w-full h-[380px] min-h-[380px] bg-slate-50/60 rounded-lg border border-slate-200/80 p-3 flex flex-col justify-between relative">
        <div className="w-full flex-1 relative">
          {metricLinesData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-medium">
              Nessun dato numerico rilevato per le metriche selezionate (Stato: Non testato / N/A).
            </div>
          ) : (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 1000 290"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              {/* Griglia orizzontale e valori asse Y */}
              <line x1="50" y1={topY} x2="975" y2={topY} stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
              <text x="42" y={topY + 4} textAnchor="end" fill="#64748B" fontSize="11" fontFamily="monospace">
                {viewMode === 'relative' ? `${maxVal >= 0 ? '+' : ''}${maxVal}%` : maxVal}
              </text>

              <line x1="50" y1={(topY + bottomY) / 2} x2="975" y2={(topY + bottomY) / 2} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth="1" />
              <text x="42" y={(topY + bottomY) / 2 + 4} textAnchor="end" fill="#64748B" fontSize="11" fontFamily="monospace">
                {viewMode === 'relative' ? `${midVal >= 0 ? '+' : ''}${midVal}%` : midVal}
              </text>

              <line x1="50" y1={bottomY} x2="975" y2={bottomY} stroke="#E2E8F0" strokeDasharray="4 4" strokeWidth="1" />
              <text x="42" y={bottomY + 4} textAnchor="end" fill="#64748B" fontSize="11" fontFamily="monospace">
                {viewMode === 'relative' ? `${minVal >= 0 ? '+' : ''}${minVal}%` : minVal}
              </text>

              {metricLinesData.map((mLine) => (
                <g key={mLine.def.id}>
                  {mLine.points.length > 1 && (
                    <path
                      d={mLine.pathD}
                      fill="none"
                      stroke={mLine.def.color}
                      strokeWidth="3"
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
                        stroke="#FFFFFF"
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
                        y={pt.y - 12}
                        textAnchor="middle"
                        fill="#0F172A"
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
            <div className="absolute top-2 right-2 bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-[11px] space-y-1 font-sans pointer-events-none z-30">
              <div className="text-slate-900 font-bold flex items-center justify-between gap-3 border-b border-slate-100 pb-1">
                <span>{hoveredPoint.testLabel}</span>
                <span className="text-[10px] text-emerald-700 font-mono font-bold">{hoveredPoint.date}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredPoint.color }} />
                <span className="text-slate-600 font-semibold">{hoveredPoint.metricLabel}:</span>
                <span className="text-slate-900 font-mono font-bold text-xs">
                  {hoveredPoint.absVal} {hoveredPoint.unit}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Etichette Asse Orizzontale */}
        <div className="w-full flex justify-between text-xs font-mono font-bold text-slate-600 px-6 pt-2.5 border-t border-slate-200">
          {rawTests.map((t, idx) => (
            <div key={t.id || idx} className="text-center">
              <span className="block text-slate-900 font-bold text-xs">
                {t.session_name || t.label || `Sessione #${idx + 1}`}
              </span>
              <span className="block text-[10px] text-emerald-700 font-semibold">
                {t.dateRange || t.date || ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
