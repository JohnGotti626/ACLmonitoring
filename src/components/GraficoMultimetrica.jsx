import React, { useState, useMemo } from 'react';
import { TrendingUp, Percent, BarChart2 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
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

function CustomChartTooltip({ active, payload, label, viewMode }) {
  if (!active || !payload || payload.length === 0) return null;
  const sessionMeta = payload[0]?.payload;

  return (
    <div className="bg-slate-950/95 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1.5">
        <span className="font-bold text-slate-100">{sessionMeta?.sessionLabel || label}</span>
        {sessionMeta?.sessionDate && (
          <span className="text-[10px] font-mono font-semibold text-sky-400">
            {sessionMeta.sessionDate}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {payload.map((entry) => {
          const mDef = METRIC_CONFIG.find((m) => m.id === entry.dataKey);
          if (!mDef || entry.value === null || entry.value === undefined) return null;
          const absVal = sessionMeta?.[`${mDef.id}_abs`];
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: mDef.color }}
                />
                <span className="text-slate-300 font-medium">{mDef.label}:</span>
              </div>
              <div className="font-mono font-bold text-white">
                {viewMode === 'relative' ? (
                  <>
                    <span className={entry.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {entry.value >= 0 ? `+${entry.value}%` : `${entry.value}%`}
                    </span>
                    {absVal !== null && absVal !== undefined && (
                      <span className="text-slate-400 text-[10px] ml-1.5">
                        ({absVal} {mDef.unit})
                      </span>
                    )}
                  </>
                ) : (
                  <span>
                    {entry.value} {mDef.unit}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GraficoMultimetrica({ tests }) {
  const [viewMode, setViewMode] = useState('relative'); // 'relative' | 'absolute'
  const [activeMetrics, setActiveMetrics] = useState(['lsiQuad', 'jumpHeight', 'rsiCmj']);

  const toggleMetric = (id) => {
    setActiveMetrics((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  };

  const rawTests = useMemo(() => sortTestsByDate(tests), [tests]);

  // Calcola il conteggio di rilevazioni valide (non-null) e il primo valore baseline valido per ciascuna metrica
  const { validCountByMetric, baselinesByMetric, chartData, hasAnyPlottedValue } = useMemo(() => {
    const counts = {};
    const baselines = {};

    METRIC_CONFIG.forEach((m) => {
      const validVals = rawTests
        .map((t) => m.getRawValue(t))
        .filter((v) => v !== null && v !== undefined);
      counts[m.id] = validVals.length;
      baselines[m.id] = validVals.length > 0 ? validVals[0] : null;
    });

    let anyValid = false;

    const rows = rawTests.map((t, idx) => {
      const sLabel = t.session_name || t.label || `Val. ${idx + 1}`;
      const sDate = t.dateRange || t.date || '';
      const rowObj = {
        name: sDate ? `${sLabel} (${sDate})` : sLabel,
        shortName: sLabel,
        sessionLabel: sLabel,
        sessionDate: sDate
      };

      METRIC_CONFIG.forEach((m) => {
        const rawVal = m.getRawValue(t);
        rowObj[`${m.id}_abs`] = rawVal;

        if (rawVal === null || rawVal === undefined) {
          rowObj[m.id] = null; // Rigorosamente null se non testato
        } else {
          if (activeMetrics.includes(m.id)) anyValid = true;
          if (viewMode === 'relative') {
            const base = baselines[m.id];
            rowObj[m.id] =
              base !== null && base > 0
                ? Number((((rawVal - base) / base) * 100).toFixed(1))
                : 0;
          } else {
            rowObj[m.id] = Number(rawVal.toFixed(2));
          }
        }
      });

      return rowObj;
    });

    return {
      validCountByMetric: counts,
      baselinesByMetric: baselines,
      chartData: rows,
      hasAnyPlottedValue: anyValid
    };
  }, [rawTests, viewMode, activeMetrics]);

  const activeMetricDefs = METRIC_CONFIG.filter((m) => activeMetrics.includes(m.id));

  if (rawTests.length === 0) {
    return (
      <div className="w-full bg-slate-900/90 p-4 rounded-xl border border-slate-800 text-center space-y-2 no-print shadow-xl">
        <TrendingUp className="w-6 h-6 text-sky-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-100">
          Nessuna sessione disponibile per il Grafico Multimetrica
        </h4>
        <p className="text-xs text-slate-400">
          Inserisci almeno un test nella Batteria Test per visualizzare il trend temporale.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl no-print font-sans text-white flex flex-col">
      {/* HEADER + TOGGLE MODALITÀ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sky-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-xs sm:text-sm uppercase tracking-wide">
              Grafico Multimetrica (Andamento Storico)
            </h3>
            <p className="text-[11px] text-slate-400">
              Confronto longitudinale sui soli test realmente eseguiti
            </p>
          </div>
        </div>

        {/* Toggle [% Variazione Relativa | Valori Assoluti] */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('relative')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'relative'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Percent className="w-3 h-3" />
            <span>% Variazione Relativa</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('absolute')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'absolute'
                ? 'bg-sky-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>Valori Assoluti</span>
          </button>
        </div>
      </div>

      {/* LEGENDA COMPATTA METRICHE (1-2 righe pulite con flex-wrap gap-2 mb-4) */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {METRIC_CONFIG.map((m) => {
          const isActive = activeMetrics.includes(m.id);
          const validCount = validCountByMetric[m.id] || 0;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMetric(m.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActive
                  ? 'bg-slate-800 text-white border-slate-600 shadow-xs'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800/80 opacity-75 hover:opacity-100'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <span>{isActive ? `✓ ${m.label}` : m.label}</span>
              <span className="text-[10px] font-mono text-slate-400">
                {validCount > 0 ? `(${m.unit})` : '(N/A)'}
              </span>
            </button>
          );
        })}
      </div>

      {/* CONTENITORE GRAFICO AD ALTEZZA FISSA E RESPONSIVE (h-[380px]) */}
      <div className="w-full h-[380px] bg-slate-950/60 rounded-xl border border-slate-800/80 p-3">
        {!hasAnyPlottedValue ? (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-medium text-center px-4">
            Nessun dato rilevato per le metriche selezionate (Stato: Non testato / N/A).
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 24, left: 4, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#94a3b8"
                tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }}
                tickLine={{ stroke: '#334155' }}
                axisLine={{ stroke: '#334155' }}
                padding={{ left: 24, right: 24 }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickLine={{ stroke: '#334155' }}
                axisLine={{ stroke: '#334155' }}
                width={46}
                tickFormatter={(val) => (viewMode === 'relative' ? `${val}%` : val)}
              />
              <Tooltip content={<CustomChartTooltip viewMode={viewMode} />} />

              {viewMode === 'relative' && (
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
              )}

              {activeMetricDefs.map((m) => (
                <Line
                  key={m.id}
                  type="monotone"
                  dataKey={m.id}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={3}
                  connectNulls={true}
                  dot={{
                    r: 5,
                    fill: m.color,
                    stroke: '#0f172a',
                    strokeWidth: 2
                  }}
                  activeDot={{
                    r: 7,
                    fill: m.color,
                    stroke: '#f8fafc',
                    strokeWidth: 2
                  }}
                  label={{
                    position: 'top',
                    fill: '#f8fafc',
                    fontSize: 11,
                    fontWeight: 700,
                    formatter: (val) => {
                      if (val === null || val === undefined) return '';
                      return viewMode === 'relative'
                        ? `${val >= 0 ? '+' : ''}${val}%`
                        : val;
                    }
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
