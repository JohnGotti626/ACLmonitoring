import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Trash2,
  Timer,
  Gauge,
  Repeat,
  Route,
  Flame,
  FileText,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

/**
 * Crea un nuovo blocco cardio vuoto con default "Continuo" o "Ripetute/Navette"
 */
export function createEmptyCardioBlock(modality = 'continuo') {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `cardio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    modality, // 'continuo' | 'ripetute'
    note: '', // es. "Navette 5m" o "Corsa Z2"
    // Campi esclusivi modalità "Continuo"
    duration_min: '',
    distance_km: '',
    // Campi esclusivi modalità "Ripetute/Navette"
    sets: '',
    work_per_set: '',
    rest: '',
  };
}

/**
 * Calcola automaticamente Passo (min/km in formato MM:SS /km) e Velocità (km/h)
 * a partire da Durata (min) e Distanza (km).
 */
export function calculatePaceAndSpeed(durationMin, distanceKm) {
  const dur = parseFloat(String(durationMin || '').replace(',', '.'));
  const dist = parseFloat(String(distanceKm || '').replace(',', '.'));

  if (!dur || !dist || dur <= 0 || dist <= 0 || Number.isNaN(dur) || Number.isNaN(dist)) {
    return {
      paceFormatted: '--:-- /km',
      speedFormatted: '--.- km/h',
      paceDecimal: null,
      speedKmh: null,
    };
  }

  // Pace = min / km
  const paceDecimal = dur / dist;
  let paceMinutes = Math.floor(paceDecimal);
  let paceSeconds = Math.round((paceDecimal - paceMinutes) * 60);
  if (paceSeconds === 60) {
    paceMinutes += 1;
    paceSeconds = 0;
  }

  // Speed = km / (min / 60)
  const speedKmh = dist / (dur / 60);

  return {
    paceFormatted: `${paceMinutes}:${String(paceSeconds).padStart(2, '0')} /km`,
    speedFormatted: `${speedKmh.toFixed(1)} km/h`,
    paceDecimal: Number(paceDecimal.toFixed(2)),
    speedKmh: Number(speedKmh.toFixed(1)),
  };
}

/**
 * Verifica se un blocco cardio contiene dati validi da salvare
 */
export function isCardioBlockValid(block) {
  if (!block) return false;
  if (block.modality === 'continuo') {
    const dur = parseFloat(String(block.duration_min || '').replace(',', '.'));
    const dist = parseFloat(String(block.distance_km || '').replace(',', '.'));
    return (dur > 0 && !Number.isNaN(dur)) || (dist > 0 && !Number.isNaN(dist));
  }
  if (block.modality === 'ripetute') {
    const sets = parseInt(block.sets, 10);
    const hasWork = String(block.work_per_set || '').trim().length > 0;
    return (sets > 0 && !Number.isNaN(sets)) || hasWork;
  }
  return false;
}

/**
 * Costruisce il payload strutturato per Supabase (sia per tabella relazionale `cardio_logs`
 * sia per colonna JSONB `cardio_blocks`).
 */
export function buildCardioSessionPayload({
  sessionId,
  patientId,
  patientEmail,
  sessionDate,
  blocks = [],
}) {
  const validBlocks = blocks.filter(isCardioBlockValid);

  const normalizedBlocks = validBlocks.map((block, index) => {
    const isContinuo = block.modality === 'continuo';
    const { paceFormatted, speedKmh } = isContinuo
      ? calculatePaceAndSpeed(block.duration_min, block.distance_km)
      : { paceFormatted: null, speedKmh: null };

    return {
      block_order: index + 1,
      modality: isContinuo ? 'continuo' : 'ripetute',
      exercise_note: (block.note || '').trim() || (isContinuo ? 'Cardio Continuo' : 'Ripetute / Navette'),
      // Valori Continuo
      duration_min: isContinuo ? parseFloat(String(block.duration_min).replace(',', '.')) || null : null,
      distance_km: isContinuo ? parseFloat(String(block.distance_km).replace(',', '.')) || null : null,
      calculated_pace: isContinuo ? paceFormatted : null,
      calculated_speed_kmh: isContinuo ? speedKmh : null,
      // Valori Ripetute/Navette
      sets: !isContinuo ? parseInt(block.sets, 10) || null : null,
      work_per_set: !isContinuo ? (block.work_per_set || '').trim() || null : null,
      rest_time: !isContinuo ? (block.rest || '').trim() || null : null,
    };
  });

  // Righe pronte per INSERT multiplo nella tabella `cardio_logs`
  const cardioLogsRows = normalizedBlocks.map((b) => ({
    session_id: sessionId || null,
    patient_id: String(patientId),
    patient_email: patientEmail || null,
    session_date: sessionDate || new Date().toISOString().split('T')[0],
    block_order: b.block_order,
    modality: b.modality,
    exercise_note: b.exercise_note,
    duration_min: b.duration_min,
    distance_km: b.distance_km,
    calculated_pace: b.calculated_pace,
    calculated_speed_kmh: b.calculated_speed_kmh,
    sets: b.sets,
    work_per_set: b.work_per_set,
    rest_time: b.rest_time,
  }));

  return {
    session_id: sessionId || null,
    patient_id: String(patientId),
    session_date: sessionDate || new Date().toISOString().split('T')[0],
    cardio_blocks_jsonb: normalizedBlocks,
    cardio_logs_rows: cardioLogsRows,
  };
}

/**
 * Converte un blocco cardio normalizzato in una riga compatibile con `workout_logs`
 * così che lo storico cardio sia sempre visibile anche senza migrazioni manuali.
 */
export function formatCardioBlockToWorkoutRow(block, { patientId, patientEmail, createdAtISO }) {
  const isContinuo = block.modality === 'continuo';
  const label = (block.exercise_note || block.note || '').trim() || (isContinuo ? 'Corsa Continua' : 'Ripetute / Navette');

  if (isContinuo) {
    const dur = block.duration_min ?? '';
    const dist = block.distance_km ?? '';
    const { paceFormatted, speedFormatted, speedKmh } = calculatePaceAndSpeed(dur, dist);
    return {
      patient_id: String(patientId),
      patient_email: patientEmail || 'paziente@acl.local',
      exercise_name: `[CARDIO CONTINUO] ${label}`,
      sets: 1,
      reps: `${dur || 0} min • ${dist || 0} km`,
      weight_kg: speedKmh || 0,
      tempo_speed: paceFormatted !== '--:-- /km' ? `${paceFormatted} (${speedFormatted})` : null,
      notes: `[CARDIO:CONTINUO | Durata: ${dur || 0} min | Distanza: ${dist || 0} km | Passo: ${paceFormatted} | Vel: ${speedFormatted}] ${label}`.trim(),
      created_at: createdAtISO || new Date().toISOString(),
    };
  }

  const setsCount = parseInt(block.sets, 10) || 1;
  const work = block.work_per_set || '-';
  const rest = block.rest_time || block.rest || '-';
  return {
    patient_id: String(patientId),
    patient_email: patientEmail || 'paziente@acl.local',
    exercise_name: `[CARDIO RIPETUTE] ${label}`,
    sets: setsCount,
    reps: `${work}${rest && rest !== '-' ? ` (Rec: ${rest})` : ''}`,
    weight_kg: 0,
    tempo_speed: rest && rest !== '-' ? `Rec ${rest}` : null,
    notes: `[CARDIO:RIPETUTE | Serie: ${setsCount}x${work} | Rec: ${rest}] ${label}`.trim(),
    created_at: createdAtISO || new Date().toISOString(),
  };
}

/**
 * Helper per riconoscere e decodificare una riga cardio da `workout_logs`
 */
export function parseCardioLogFromWorkoutRow(log) {
  if (!log) return null;
  const name = String(log.exercise_name || '');
  const notes = String(log.notes || '');

  const isContinuo =
    name.startsWith('[CARDIO CONTINUO]') || notes.includes('[CARDIO:CONTINUO');
  const isRipetute =
    name.startsWith('[CARDIO RIPETUTE]') || notes.includes('[CARDIO:RIPETUTE');

  if (!isContinuo && !isRipetute) return null;

  const cleanTitle = name
    .replace(/^\[CARDIO CONTINUO\]\s*/i, '')
    .replace(/^\[CARDIO RIPETUTE\]\s*/i, '')
    .trim();

  if (isContinuo) {
    const durMatch = notes.match(/Durata:\s*([\d.,]+)\s*min/i);
    const distMatch = notes.match(/Distanza:\s*([\d.,]+)\s*km/i);
    const paceMatch = notes.match(/Passo:\s*([^|\]]+)/i);
    const velMatch = notes.match(/Vel:\s*([^|\]]+)/i);
    return {
      isCardio: true,
      modality: 'continuo',
      title: cleanTitle || 'Cardio Continuo',
      duration_min: durMatch ? durMatch[1] : null,
      distance_km: distMatch ? distMatch[1] : null,
      pace: paceMatch ? paceMatch[1].trim() : log.tempo_speed || '--:-- /km',
      speed: velMatch ? velMatch[1].trim() : log.weight_kg ? `${log.weight_kg} km/h` : '--.- km/h',
    };
  }

  const serieMatch = notes.match(/Serie:\s*([^|\]]+)/i);
  const recMatch = notes.match(/Rec:\s*([^|\]]+)/i);
  return {
    isCardio: true,
    modality: 'ripetute',
    title: cleanTitle || 'Ripetute / Navette',
    sets: log.sets || 1,
    work_per_set: serieMatch ? serieMatch[1].trim() : log.reps || '-',
    rest: recMatch ? recMatch[1].trim() : log.tempo_speed || '-',
  };
}

/**
 * Salva tutti i blocchi cardio su Supabase
 */
export async function saveCardioBlocksToSupabase({
  sessionId,
  patientId,
  patientEmail,
  sessionDate,
  createdAtISO,
  blocks = [],
  mirrorToWorkoutLogs = true,
}) {
  const payload = buildCardioSessionPayload({
    sessionId,
    patientId,
    patientEmail,
    sessionDate,
    blocks,
  });

  if (payload.cardio_logs_rows.length === 0) {
    return { data: [], count: 0 };
  }

  let cardioTableData = null;
  try {
    const { data, error } = await supabase
      .from('cardio_logs')
      .insert(payload.cardio_logs_rows)
      .select();
    if (!error) {
      cardioTableData = data;
    }
  } catch (_) {
    // Fallback silenzioso su workout_logs
  }

  let workoutLogsData = [];
  if (mirrorToWorkoutLogs) {
    const workoutRows = payload.cardio_blocks_jsonb.map((b) =>
      formatCardioBlockToWorkoutRow(b, {
        patientId,
        patientEmail,
        createdAtISO,
      })
    );
    const { data, error } = await supabase
      .from('workout_logs')
      .insert(workoutRows)
      .select();
    if (error) throw error;
    workoutLogsData = data || [];
  }

  return {
    cardioLogs: cardioTableData,
    workoutLogs: workoutLogsData,
    payload,
    count: payload.cardio_logs_rows.length,
  };
}

/**
 * Dynamic Multi-Block "Cardio Builder" Component (Editorial Light Theme)
 */
export default function CardioBuilder({
  blocks: controlledBlocks,
  onChange,
  title = 'Cardio Builder Multi-Blocco',
  subtitle = 'Aggiungi blocchi distinti nella stessa seduta (es. Navette 6x5m + Intervalli 5x50m + Corsa Z2 15 min)',
  compact = false,
}) {
  const [internalBlocks, setInternalBlocks] = useState([]);
  const blocks = controlledBlocks !== undefined ? controlledBlocks : internalBlocks;

  const updateBlocks = (nextBlocks) => {
    if (onChange) {
      onChange(nextBlocks);
    } else {
      setInternalBlocks(nextBlocks);
    }
  };

  const handleAddBlock = (defaultModality = 'continuo') => {
    updateBlocks([...blocks, createEmptyCardioBlock(defaultModality)]);
  };

  const handleRemoveBlock = (blockId) => {
    updateBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const handleBlockChange = (blockId, field, value) => {
    updateBlocks(
      blocks.map((b) => (b.id === blockId ? { ...b, [field]: value } : b))
    );
  };

  const handleModalityToggle = (blockId, modality) => {
    updateBlocks(
      blocks.map((b) => (b.id === blockId ? { ...b, modality } : b))
    );
  };

  return (
    <div className="bg-[#faf9f6] border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 text-slate-900">
      {/* Header Sezione Cardio */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
            <Flame size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                {title}
              </h3>
              {blocks.length > 0 && (
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                  {blocks.length} {blocks.length === 1 ? 'Blocco' : 'Blocchi'}
                </span>
              )}
            </div>
            {!compact && (
              <p className="text-xs text-slate-600 font-bold mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Preset rapidi opzionali per inserimento ultra-rapido */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAddBlock('continuo')}
            className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 text-teal-800 border border-stone-200 hover:border-teal-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Aggiungi blocco Continuo (es. Corsa Z2, Bike)"
          >
            <Plus size={12} /> Continuo
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('ripetute')}
            className="text-[11px] font-extrabold px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-800 border border-stone-200 hover:border-blue-300 transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Aggiungi blocco Ripetute / Navette"
          >
            <Plus size={12} /> Ripetute/Navette
          </button>
        </div>
      </div>

      {/* Lista dinamica dei Blocchi Cardio */}
      {blocks.length === 0 ? (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-5 text-center">
          <p className="text-xs text-slate-700 font-extrabold">
            Nessun blocco cardio inserito in questa sessione.
          </p>
          <p className="text-[11px] text-slate-500 font-semibold mt-1">
            Puoi combinare più blocchi nella stessa giornata (es.{' '}
            <span className="text-slate-900 font-extrabold">Navette 6×5m</span> +{' '}
            <span className="text-slate-900 font-extrabold">Intervalli 5×50m</span> +{' '}
            <span className="text-slate-900 font-extrabold">15 min Corsa Z2</span>).
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {blocks.map((block, index) => {
            const isContinuo = block.modality === 'continuo';
            const { paceFormatted, speedFormatted, paceDecimal } = isContinuo
              ? calculatePaceAndSpeed(block.duration_min, block.distance_km)
              : { paceFormatted: '--:-- /km', speedFormatted: '--.- km/h', paceDecimal: null };

            return (
              <div
                key={block.id}
                className="bg-white border border-stone-200 hover:border-teal-500 rounded-2xl p-4 transition-all shadow-sm space-y-3.5"
              >
                {/* Top bar della Card: Indice blocco + Toggle Modalità + Elimina */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-black flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                      Blocco Cardio #{index + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Segmented Toggle: Continuo vs Ripetute/Navette */}
                    <div className="inline-flex rounded-xl bg-[#f4f3ef] p-1 border border-stone-200">
                      <button
                        type="button"
                        onClick={() => handleModalityToggle(block.id, 'continuo')}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                          isContinuo
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <Route size={12} />
                        Continuo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModalityToggle(block.id, 'ripetute')}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                          !isContinuo
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <Repeat size={12} />
                        Ripetute/Navette
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(block.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors cursor-pointer"
                      title="Rimuovi blocco cardio"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Input Esercizio / Note (comune a entrambi i blocchi) */}
                <div>
                  <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-1">
                    <FileText size={11} className="text-teal-700" />
                    Esercizio / Note
                  </label>
                  <input
                    type="text"
                    value={block.note}
                    onChange={(e) => handleBlockChange(block.id, 'note', e.target.value)}
                    placeholder={
                      isContinuo
                        ? 'Es. Corsa Z2, Tapis Roulant, Bike Erg...'
                        : 'Es. Navette 5m cambio direzione, Intervalli lineari 50m...'
                    }
                    className="w-full bg-[#faf9f6] border border-stone-200 focus:border-teal-600 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none transition-colors"
                  />
                </div>

                {/* Input specifici per modalità */}
                {isContinuo ? (
                  <div className="space-y-3">
                    {/* SOLO Durata (min) e Distanza (km) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                          Durata (min)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          inputMode="decimal"
                          value={block.duration_min}
                          onChange={(e) =>
                            handleBlockChange(block.id, 'duration_min', e.target.value)
                          }
                          placeholder="Es. 15"
                          className="w-full bg-[#faf9f6] border border-stone-200 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 placeholder-slate-400 outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                          Distanza (km)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          inputMode="decimal"
                          value={block.distance_km}
                          onChange={(e) =>
                            handleBlockChange(block.id, 'distance_km', e.target.value)
                          }
                          placeholder="Es. 3.0"
                          className="w-full bg-[#faf9f6] border border-stone-200 focus:border-teal-600 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 placeholder-slate-400 outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Box Read-Only Auto-Calcolati: Pace (min/km) & Speed (km/h) */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="bg-teal-50/70 border border-teal-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1">
                            <Timer size={11} /> Pace (Auto)
                          </span>
                          <p className="text-sm font-black text-slate-900 mt-0.5">
                            {paceFormatted}
                          </p>
                        </div>
                        {paceDecimal && (
                          <Sparkles size={14} className="text-teal-600 shrink-0" />
                        )}
                      </div>

                      <div className="bg-teal-50/70 border border-teal-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 flex items-center gap-1">
                            <Gauge size={11} /> Speed (Auto)
                          </span>
                          <p className="text-sm font-black text-slate-900 mt-0.5">
                            {speedFormatted}
                          </p>
                        </div>
                        {paceDecimal && (
                          <Activity size={14} className="text-teal-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Modalità "Ripetute/Navette": SOLO Number of Sets, Distance/Time per Set, Rest */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                        Numero Serie (Sets)
                      </label>
                      <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        value={block.sets}
                        onChange={(e) =>
                          handleBlockChange(block.id, 'sets', e.target.value)
                        }
                        placeholder="Es. 6"
                        className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 placeholder-slate-400 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                        Distanza / Tempo per Set
                      </label>
                      <input
                        type="text"
                        value={block.work_per_set}
                        onChange={(e) =>
                          handleBlockChange(block.id, 'work_per_set', e.target.value)
                        }
                        placeholder="Es. 5m, 50m o 30s"
                        className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 placeholder-slate-400 outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-1">
                        Recupero (Rest)
                      </label>
                      <input
                        type="text"
                        value={block.rest}
                        onChange={(e) =>
                          handleBlockChange(block.id, 'rest', e.target.value)
                        }
                        placeholder="Es. 45s o 1:00"
                        className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-sm font-black text-slate-900 placeholder-slate-400 outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pulsante principale "+ Aggiungi Blocco Cardio" in fondo alla lista */}
      <button
        type="button"
        onClick={() => handleAddBlock('continuo')}
        className="w-full py-3 px-4 rounded-2xl bg-teal-50 hover:bg-teal-100 border-2 border-dashed border-teal-400 text-teal-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
      >
        <Plus size={16} className="text-teal-700" />
        + Aggiungi Blocco Cardio
      </button>
    </div>
  );
}
