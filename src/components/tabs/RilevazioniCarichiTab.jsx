import React, { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell,
  QrCode,
  Send,
  Smartphone,
  Copy,
  CheckCircle2,
  RefreshCw,
  Clock,
  MessageSquare,
  Calendar,
  ExternalLink,
  Mail,
  TrendingUp,
  Search,
  Edit3,
  Trash2,
  Plus,
  Save,
  X,
  Package,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  getCategoryIcon,
  EXERCISE_PRESETS,
  toDateInputValue,
  formatDayLabel,
  normalizeWorkoutLog
} from '../ClientPortal';

export default function RilevazioniCarichiTab({
  patient,
  onOpenSimulation,
  onUpdatePatient
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Selettore Giornata nello Storico Terapista ('ALL', 'LATEST', o 'YYYY-MM-DD')
  const [selectedDay, setSelectedDay] = useState('ALL');

  // Esercizio selezionato per visualizzare il Grafico di Progressione nel Tempo
  const [selectedExerciseProgression, setSelectedExerciseProgression] = useState(null);

  // Modal / Pannello Generatore Magic Link & QR Code
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [patientEmail, setPatientEmail] = useState(patient?.email || '');
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [magicLinkStatus, setMagicLinkStatus] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal Modifica / Inserimento Manuale da parte del Terapista (può modificare qualsiasi cosa anche a posteriori)
  const [editingModalOpen, setEditingModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [formDate, setFormDate] = useState(() => toDateInputValue(new Date().toISOString()));
  const [formTime, setFormTime] = useState('15:00');
  const [formExercise, setFormExercise] = useState('');
  const [formSets, setFormSets] = useState('4');
  const [formReps, setFormReps] = useState('8');
  const [formWeightKg, setFormWeightKg] = useState('');
  const [formTempo, setFormTempo] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // URL diretto al Portale Paziente Mobile per questo specifico paziente
  const clientPortalUrl = `${window.location.origin}/?portal=client&patientId=${patient?.id || ''}`;

  const syncLogsLocallyAndParent = (updatedList) => {
    setLogs(updatedList);
    if (patient?.id) {
      const localKey = `acl_workout_logs_${patient.id}`;
      try {
        localStorage.setItem(localKey, JSON.stringify(updatedList));
      } catch {}
    }
    if (onUpdatePatient && patient) {
      onUpdatePatient({
        ...patient,
        workout_logs: updatedList
      });
    }
  };

  // Caricamento rilevazioni carichi da Supabase ('workout_logs') + Realtime Sync + Live Polling
  const fetchPatientWorkoutLogs = async (silent = false) => {
    if (!patient?.id) return;
    if (!silent) setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('patient_id', String(patient.id))
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          if (data.length > 0) {
            const normalized = data.map(normalizeWorkoutLog);
            setLogs(normalized);
            const localKey = `acl_workout_logs_${patient.id}`;
            try {
              localStorage.setItem(localKey, JSON.stringify(normalized));
            } catch {}
            if (!silent) setLoading(false);
            return;
          }
        }
      }

      // Fallback locale se non ci sono ancora record cloud per questo paziente
      const localKey = `acl_workout_logs_${patient.id}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setLogs(JSON.parse(saved).map(normalizeWorkoutLog));
      } else if (Array.isArray(patient?.workout_logs) && patient.workout_logs.length > 0) {
        setLogs(patient.workout_logs.map(normalizeWorkoutLog));
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Errore lettura workout_logs:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientWorkoutLogs();

    if (!isSupabaseConfigured || !patient?.id) return;

    // 1. Sottoscrizione Realtime su Supabase
    const channel = supabase
      .channel(`therapist_workout_logs_${patient.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_logs'
        },
        () => {
          fetchPatientWorkoutLogs(true);
        }
      )
      .subscribe();

    // 2. Aggiornamento Live automatico ogni 4 secondi per garantire sincronizzazione istantanea anche senza websocket
    const liveInterval = setInterval(() => {
      fetchPatientWorkoutLogs(true);
    }, 4000);

    return () => {
      clearInterval(liveInterval);
      supabase.removeChannel(channel);
    };
  }, [patient?.id]);

  // Raggruppamento per Giornate ('YYYY-MM-DD')
  const groupedByDay = useMemo(() => {
    const map = {};
    logs.forEach(log => {
      const dayKey = toDateInputValue(log.created_at);
      if (!map[dayKey]) {
        map[dayKey] = [];
      }
      map[dayKey].push(log);
    });
    const sortedDays = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return { map, sortedDays };
  }, [logs]);

  // Elenco univoco esercizi svolti dal paziente (per selezione rapida progressione)
  const uniqueExercises = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.exercise_name).filter(Boolean)));
  }, [logs]);

  // Dati cronologici di progressione per l'esercizio selezionato
  const progressionSeries = useMemo(() => {
    if (!selectedExerciseProgression) return [];
    const target = selectedExerciseProgression.toLowerCase().trim();
    return logs
      .filter(l => l.exercise_name?.toLowerCase().trim() === target)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [selectedExerciseProgression, logs]);

  // Apre il modal per modificare qualsiasi campo di una rilevazione esistente
  const handleOpenEditModal = (log) => {
    const dt = log.created_at ? new Date(log.created_at) : new Date();
    const hours = String(dt.getHours()).padStart(2, '0');
    const mins = String(dt.getMinutes()).padStart(2, '0');

    setEditingLog(log);
    setFormDate(toDateInputValue(log.created_at));
    setFormTime(`${hours}:${mins}`);
    setFormExercise(log.exercise_name || '');
    setFormSets(String(log.sets ?? 4));
    setFormReps(String(log.reps ?? 8));
    setFormWeightKg(String(log.weight_kg ?? 0));
    setFormTempo(log.tempo_speed || log.tempo_execution || '');
    setFormNotes(log.notes || log.notes_rpe || '');
    setEditingModalOpen(true);
  };

  // Apre il modal per inserire una nuova rilevazione da parte del Terapista (eventualmente in una giornata specifica)
  const handleOpenNewModal = (presetDate = null) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    setEditingLog(null);
    setFormDate(presetDate && presetDate !== 'ALL' ? presetDate : toDateInputValue(now.toISOString()));
    setFormTime(`${hours}:${mins}`);
    setFormExercise('');
    setFormSets('4');
    setFormReps('8');
    setFormWeightKg('');
    setFormTempo('3-0-1-0');
    setFormNotes('Nessun dolore (0/10)');
    setEditingModalOpen(true);
  };

  // Salva la modifica o il nuovo inserimento effettuato dal Terapista
  const handleSaveTherapistEdit = async (e) => {
    e.preventDefault();
    if (!formExercise.trim() || formWeightKg === '') return;

    setSavingEdit(true);

    let finalIso = new Date().toISOString();
    try {
      const [y, m, d] = formDate.split('-').map(Number);
      const [hh, mm] = (formTime || '15:00').split(':').map(Number);
      const composed = new Date(y, m - 1, d, hh || 15, mm || 0, 0);
      if (!isNaN(composed.getTime())) {
        finalIso = composed.toISOString();
      }
    } catch {}

    const dbPayload = {
      ...(editingLog?.id && !String(editingLog.id).startsWith('seed-') ? { id: editingLog.id } : {}),
      patient_id: String(patient?.id || 'demo-patient'),
      patient_email: patient?.email || null,
      exercise_name: formExercise.trim(),
      sets: Number(formSets) || 1,
      reps: String(formReps || '1'),
      weight_kg: parseFloat(String(formWeightKg).replace(',', '.')) || 0,
      tempo_speed: formTempo.trim() || 'Standard',
      notes: formNotes.trim() || 'Nessun dolore',
      created_at: finalIso
    };

    try {
      if (editingLog) {
        if (isSupabaseConfigured && editingLog.id && !String(editingLog.id).startsWith('seed-')) {
          // Delete + Insert con stesso UUID per garantire l'update su Supabase
          await supabase.from('workout_logs').delete().eq('id', editingLog.id);
          const { error } = await supabase.from('workout_logs').insert([dbPayload]);
          if (error) {
            console.warn('Info update Supabase workout_logs:', error.message);
          }
        }

        const normalized = normalizeWorkoutLog({ ...editingLog, ...dbPayload });
        const updatedList = logs
          .map(item => (item.id === editingLog.id ? normalized : item))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        syncLogsLocallyAndParent(updatedList);
      } else {
        let savedRow = normalizeWorkoutLog({
          ...dbPayload,
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `wlog-${Date.now()}`
        });

        if (isSupabaseConfigured && patient?.id) {
          const { data, error } = await supabase
            .from('workout_logs')
            .insert([dbPayload])
            .select();

          if (error) {
            console.warn('Info insert Supabase workout_logs:', error.message);
          } else if (Array.isArray(data) && data.length > 0) {
            savedRow = normalizeWorkoutLog(data[0]);
          }
        }

        const updatedList = [savedRow, ...logs].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        syncLogsLocallyAndParent(updatedList);
      }

      setEditingModalOpen(false);
      setEditingLog(null);
    } catch (err) {
      console.error('Errore salvataggio modifica terapista:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Eliminazione di una riga da parte del Terapista
  const handleDeleteLogByTherapist = async (logId) => {
    const updatedList = logs.filter(item => item.id !== logId);
    syncLogsLocallyAndParent(updatedList);

    if (isSupabaseConfigured && logId && !String(logId).startsWith('seed-')) {
      try {
        await supabase.from('workout_logs').delete().eq('id', logId);
      } catch (err) {
        console.warn('Info delete Supabase workout_logs:', err);
      }
    }
  };

  // Invio Magic Link (OTP via Email) tramite Supabase Auth direttamente dalla scheda Terapista
  const handleSendMagicLinkToPatient = async (e) => {
    e.preventDefault();
    if (!patientEmail.trim()) return;
    setSendingMagicLink(true);
    setMagicLinkStatus('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: patientEmail.trim(),
        options: {
          emailRedirectTo: clientPortalUrl,
          data: {
            role: 'patient',
            patient_id: patient?.id
          }
        }
      });

      if (error) {
        setMagicLinkStatus(`⚠️ Errore Supabase: ${error.message}`);
      } else {
        setMagicLinkStatus(`✅ Magic Link inviato con successo a ${patientEmail}!`);
      }
    } catch (err) {
      setMagicLinkStatus(`⚠️ Eccezione invio: ${err.message}`);
    } finally {
      setSendingMagicLink(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(clientPortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Ciao ${patient?.nome || ''}! Ecco il tuo link personale permanente per compilare il Diario Allenamento LCA da smartphone: ${clientPortalUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Giorni filtrati da visualizzare
  const daysToRender = useMemo(() => {
    if (selectedDay === 'ALL') return groupedByDay.sortedDays;
    if (groupedByDay.map[selectedDay]) return [selectedDay];
    return groupedByDay.sortedDays;
  }, [selectedDay, groupedByDay]);

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIORE TERAPISTA: AZIONI RAPIDE */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white tracking-tight">
              Rilevazioni Carichi & Pacchetti Giornalieri
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Sync Attivo</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Seleziona una giornata per vedere il pacchetto di esercizi svolto da <strong>{patient?.nome} {patient?.cognome}</strong>, oppure clicca su un esercizio per vedere la progressione nel tempo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenNewModal(selectedDay)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Esercizio Manuale</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Genera Link Invito / Magic Link</span>
          </button>

          <button
            type="button"
            onClick={onOpenSimulation}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Simula Vista Paziente / Test Rapido</span>
          </button>
        </div>
      </div>

      {/* SELETTORE GIORNATE DI ALLENAMENTO (PACCHETTI GIORNALIERI) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Giornate di Allenamento Registrate ({groupedByDay.sortedDays.length} sedute)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Clicca su una giornata per filtrare velocemente il pacchetto di esercizi eseguito in quella data
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cerca esercizio o nota..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchPatientWorkoutLogs(false)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Sincronizza ora"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5">
          <button
            type="button"
            onClick={() => setSelectedDay('ALL')}
            className={`px-4 py-2.5 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
              selectedDay === 'ALL'
                ? 'bg-gradient-to-r from-cyan-950 to-emerald-950 border-cyan-400 text-white shadow-lg'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="text-xs font-black">Tutte le Giornate</div>
            <div className="text-[10px] font-mono text-cyan-300 mt-0.5">
              {groupedByDay.sortedDays.length} sedute • {logs.length} esercizi
            </div>
          </button>

          {groupedByDay.sortedDays.map((dayKey) => {
            const dayLogs = groupedByDay.map[dayKey] || [];
            const isSelected = selectedDay === dayKey;
            const maxKgDay = Math.max(...dayLogs.map(l => Number(l.weight_kg) || 0), 0);

            return (
              <button
                type="button"
                key={dayKey}
                onClick={() => setSelectedDay(dayKey)}
                className={`px-4 py-2.5 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950 to-emerald-950 border-cyan-400 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-black flex items-center gap-1.5">
                  <span>{formatDayLabel(dayKey)}</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 mt-0.5">
                  📦 {dayLogs.length} {dayLogs.length === 1 ? 'esercizio' : 'esercizi'} • Max {maxKgDay} kg
                </div>
              </button>
            );
          })}
        </div>

        {/* CHIP RAPIDI ESERCIZI PER VEDERE SUBITO LA PROGRESSIONE NEL TEMPO */}
        {uniqueExercises.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-extrabold text-cyan-400 shrink-0 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Progressione Esercizio:</span>
            </span>
            {uniqueExercises.map((exName, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() =>
                  setSelectedExerciseProgression(
                    selectedExerciseProgression === exName ? null : exName
                  )
                }
                className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 border transition-all cursor-pointer ${
                  selectedExerciseProgression === exName
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300'
                }`}
              >
                {getCategoryIcon(exName, 'w-3 h-3')}
                <span>{exName}</span>
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* PANNELLO PROGRESSIONE NEL TEMPO DELL'ESERCIZIO CLICCATO (INLINE ESPANDIBILE) */}
      {selectedExerciseProgression && (
        <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-cyan-500/30">
                {getCategoryIcon(selectedExerciseProgression, 'w-6 h-6')}
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                  Analisi Progressione Carichi nel Tempo
                </span>
                <h4 className="text-lg font-black text-white">
                  {selectedExerciseProgression}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedExerciseProgression(null)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Chiudi Progressione</span>
            </button>
          </div>

          {progressionSeries.length === 0 ? (
            <p className="text-xs text-slate-400">Nessun dato disponibile per questo esercizio.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* GRAFICO VISIVO DI PROGRESSIONE */}
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">
                    Curva di Progressione Carico (Kg) — {progressionSeries.length} Sedute
                  </span>
                  {(() => {
                    const first = progressionSeries[0]?.weight_kg || 0;
                    const last = progressionSeries[progressionSeries.length - 1]?.weight_kg || 0;
                    const diff = +(last - first).toFixed(1);
                    return (
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-black ${
                          diff >= 0
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {diff > 0 ? `+${diff} kg rispetto alla 1ª seduta` : `${diff} kg`}
                      </span>
                    );
                  })()}
                </div>

                <div className="flex items-end gap-3 h-40 pt-6 px-2 overflow-x-auto">
                  {progressionSeries.map((item, idx) => {
                    const maxVal = Math.max(...progressionSeries.map(x => Number(x.weight_kg) || 1), 1);
                    const pct = Math.max(Math.round(((Number(item.weight_kg) || 0) / maxVal) * 100), 15);
                    return (
                      <div key={item.id || idx} className="flex-1 min-w-[60px] flex flex-col items-center gap-1.5">
                        <span className="text-xs font-mono font-black text-emerald-400">
                          {item.weight_kg} kg
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.sets}×{item.reps}
                        </span>
                        <div className="w-full bg-slate-900 rounded-t-xl h-24 flex items-end overflow-hidden border border-slate-800 p-0.5">
                          <div
                            style={{ height: `${pct}%` }}
                            className="w-full bg-gradient-to-t from-cyan-600 via-teal-500 to-emerald-400 rounded-t-lg transition-all"
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-300">
                          {new Date(item.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STORICO DETTAGLIATO SEDUTE DI QUESTO ESERCIZIO */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 max-h-60 overflow-y-auto">
                <div className="text-xs font-extrabold text-cyan-400 sticky top-0 bg-slate-950 pb-1">
                  Dettaglio Cronologico Sedute
                </div>
                {progressionSeries
                  .slice()
                  .reverse()
                  .map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {formatDayLabel(toDateInputValue(item.created_at))}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.sets} serie × {item.reps} rip • {item.tempo_speed}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-400 text-sm">
                          {item.weight_kg} kg
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-cyan-400 hover:text-cyan-300 cursor-pointer"
                          title="Modifica questa rilevazione"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ELENCO PACCHETTI DI ESERCIZI RAGGRUPPATI PER GIORNATA */}
      {daysToRender.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-black text-white">
            Nessun pacchetto di allenamento ancora registrato per {patient?.nome}
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Usa <strong>"Simula Vista Paziente / Test Rapido"</strong> oppure <strong>"Aggiungi Esercizio Manuale"</strong> per inserire il primo pacchetto di esercizi del giorno.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {daysToRender.map((dayKey) => {
            const rawDayLogs = groupedByDay.map[dayKey] || [];
            const dayLogs = rawDayLogs.filter(
              l =>
                !searchFilter.trim() ||
                l.exercise_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
                (l.notes || '')?.toLowerCase().includes(searchFilter.toLowerCase())
            );

            if (dayLogs.length === 0) return null;

            return (
              <div
                key={dayKey}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
              >
                {/* HEADER DELLA GIORNATA (PACCHETTO DEL GIORNO) */}
                <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">
                          Pacchetto Seduta — {formatDayLabel(dayKey)}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] font-extrabold">
                          {dayLogs.length} {dayLogs.length === 1 ? 'esercizio' : 'esercizi'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Clicca sul nome di un esercizio per vedere la sua progressione nel tempo
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenNewModal(dayKey)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Aggiungi esercizio a questa giornata</span>
                  </button>
                </div>

                {/* TABELLA ESERCIZI DEL PACCHETTO GIORNALIERO */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950/40 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-extrabold tracking-wider">
                        <th className="py-2.5 px-4">Esercizio (Clicca per Progressione)</th>
                        <th className="py-2.5 px-4 text-center">Serie × Rip</th>
                        <th className="py-2.5 px-4 text-center">Carico (Kg)</th>
                        <th className="py-2.5 px-4">Velocità / Tempo</th>
                        <th className="py-2.5 px-4">Note Dolore / RPE</th>
                        <th className="py-2.5 px-4 text-right">Azioni Terapista</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {dayLogs.map((log, index) => (
                        <tr key={log.id || index} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => setSelectedExerciseProgression(log.exercise_name)}
                              className="flex items-center gap-2.5 text-left group cursor-pointer"
                              title="Clicca per vedere il grafico di progressione di questo esercizio"
                            >
                              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-cyan-500/50">
                                {getCategoryIcon(log.exercise_name)}
                              </div>
                              <div>
                                <div className="font-extrabold text-white group-hover:text-cyan-300 flex items-center gap-1">
                                  <span className="underline decoration-cyan-500/50 decoration-dotted underline-offset-4">
                                    {log.exercise_name}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                                </div>
                                <span className="text-[10px] text-cyan-400/80 font-semibold">
                                  📈 Vedi progressione
                                </span>
                              </div>
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                            {log.sets} × {log.reps}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono font-black text-xs">
                              {log.weight_kg} kg
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px]">
                              <Clock className="w-3 h-3" />
                              {log.tempo_speed || log.tempo_execution || 'Standard'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span>{log.notes || log.notes_rpe || 'Nessun dolore'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(log)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Modifica</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLogByTherapist(log.id)}
                                className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer transition-colors"
                                title="Elimina esercizio"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL TERAPISTA: MODIFICA QUALSIASI CAMPO O AGGIUNGI NUOVA RILEVAZIONE */}
      {editingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">
                  {editingLog ? 'Modifica Esercizio (Terapista)' : 'Aggiungi Esercizio al Pacchetto Giornaliero'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTherapistEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Data Giornata</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Orario</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Esercizio</label>
                <input
                  type="text"
                  required
                  list="therapist-exercise-presets"
                  value={formExercise}
                  onChange={(e) => setFormExercise(e.target.value)}
                  placeholder="Nome esercizio (es. Trap Bar Deadlift, Back Squat...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />
                <datalist id="therapist-exercise-presets">
                  {EXERCISE_PRESETS.map((item, i) => (
                    <option key={i} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Serie (Sets)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formSets}
                    onChange={(e) => setFormSets(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Ripetizioni</label>
                  <input
                    type="text"
                    required
                    value={formReps}
                    onChange={(e) => setFormReps(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-emerald-400 font-extrabold mb-1">Carico (Kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formWeightKg}
                    onChange={(e) => setFormWeightKg(e.target.value)}
                    className="w-full bg-emerald-950/30 border border-emerald-500/60 rounded-xl p-2.5 text-emerald-300 font-mono text-center font-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Velocità / Tempo Esecuzione</label>
                <input
                  type="text"
                  value={formTempo}
                  onChange={(e) => setFormTempo(e.target.value)}
                  placeholder="es. 3-0-1-0, Esplosivo 0.65 m/s..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Note Cliniche / RPE / Dolore</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="es. Nessun dolore (0/10), RPE 8/10..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl font-black flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingEdit ? 'Salvataggio...' : 'Salva sul Cloud'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GENERATORE DI LINK / QR CODE E INVIO MAGIC LINK */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">
                  Invito Portale Mobile — {patient?.nome} {patient?.cognome}
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                Chiudi ✕
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-2.5 rounded-2xl shrink-0 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(clientPortalUrl)}`}
                  alt="QR Code Portale Paziente"
                  className="w-32 h-32 rounded-lg"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold uppercase">
                  Scansione Diretta in Studio
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  Fai inquadrare il QR Code al Paziente
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Il paziente apre direttamente la sua vista mobile su smartphone e può salvarla sulla schermata Home.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Link Diretto Permanente Portale Paziente:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={clientPortalUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Invia su WhatsApp</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSendMagicLinkToPatient} className="pt-3 border-t border-slate-800 space-y-2.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Oppure invia Magic Link ufficiale (OTP via Email):</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="email.paziente@esempio.it"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={sendingMagicLink}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMagicLink ? 'Invio...' : 'Invia Email'}</span>
                </button>
              </div>
              {magicLinkStatus && (
                <p className="text-[11px] font-semibold text-emerald-400 pt-1">
                  {magicLinkStatus}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
