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
  normalizeWorkoutLog,
  detectUnilateralFromName,
  encodeNotesWithUnilateralLoads,
  parseUnilateralLoadsFromRow,
  calcLoadLsiPct
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
  const [formIsUnilateral, setFormIsUnilateral] = useState(false);
  const [formWeightKg, setFormWeightKg] = useState('');
  const [formWeightSxKg, setFormWeightSxKg] = useState('');
  const [formWeightDxKg, setFormWeightDxKg] = useState('');
  const [formTempo, setFormTempo] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const injuredSide = (patient?.lato || patient?.chirurgia?.lato || 'DX').toUpperCase();

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

  // Gestione cambio nome esercizio nel modal terapista con rilevamento automatico Monopodalico
  const handleFormExerciseChange = (val) => {
    setFormExercise(val);
    const matchedPreset = EXERCISE_PRESETS.find(
      p => p.name.toLowerCase() === val.trim().toLowerCase()
    );
    if (matchedPreset) {
      setFormIsUnilateral(Boolean(matchedPreset.isUnilateral));
    } else if (detectUnilateralFromName(val)) {
      setFormIsUnilateral(true);
    }
  };

  // Apre il modal per modificare qualsiasi campo di una rilevazione esistente
  const handleOpenEditModal = (log) => {
    const dt = log.created_at ? new Date(log.created_at) : new Date();
    const hours = String(dt.getHours()).padStart(2, '0');
    const mins = String(dt.getMinutes()).padStart(2, '0');
    const parsedUni = parseUnilateralLoadsFromRow(log);

    setEditingLog(log);
    setFormDate(toDateInputValue(log.created_at));
    setFormTime(`${hours}:${mins}`);
    setFormExercise(log.exercise_name || '');
    setFormSets(String(log.sets ?? 4));
    setFormReps(String(log.reps ?? 8));
    setFormIsUnilateral(parsedUni.isUnilateral);
    if (parsedUni.isUnilateral) {
      setFormWeightSxKg(String(parsedUni.weightSx ?? log.weight_kg ?? 0));
      setFormWeightDxKg(String(parsedUni.weightDx ?? log.weight_kg ?? 0));
      setFormWeightKg(String(log.weight_kg ?? 0));
    } else {
      setFormWeightKg(String(log.weight_kg ?? 0));
      setFormWeightSxKg(String(log.weight_kg ?? 0));
      setFormWeightDxKg(String(log.weight_kg ?? 0));
    }
    setFormTempo(log.tempo_speed || log.tempo_execution || '');
    setFormNotes(parsedUni.cleanNotes || log.clean_notes || log.notes || '');
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
    setFormIsUnilateral(false);
    setFormWeightKg('');
    setFormWeightSxKg('');
    setFormWeightDxKg('');
    setFormTempo('3-0-1-0');
    setFormNotes('Nessun dolore (0/10)');
    setEditingModalOpen(true);
  };

  // Salva la modifica o il nuovo inserimento effettuato dal Terapista
  const handleSaveTherapistEdit = async (e) => {
    e.preventDefault();
    const hasValidLoad = formIsUnilateral
      ? formWeightSxKg !== '' || formWeightDxKg !== ''
      : formWeightKg !== '';
    if (!formExercise.trim() || !hasValidLoad) return;

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

    const parsedSx = parseFloat(String(formWeightSxKg).replace(',', '.')) || 0;
    const parsedDx = parseFloat(String(formWeightDxKg).replace(',', '.')) || 0;
    const parsedBilateral = parseFloat(String(formWeightKg).replace(',', '.')) || 0;
    const effectiveWeightKg = formIsUnilateral ? Math.max(parsedSx, parsedDx) : parsedBilateral;
    const encodedNotes = encodeNotesWithUnilateralLoads(
      formNotes,
      formIsUnilateral,
      parsedSx,
      parsedDx
    );

    const dbPayload = {
      ...(editingLog?.id && !String(editingLog.id).startsWith('seed-') ? { id: editingLog.id } : {}),
      patient_id: String(patient?.id || 'demo-patient'),
      patient_email: patient?.email || null,
      exercise_name: formExercise.trim(),
      sets: Number(formSets) || 1,
      reps: String(formReps || '1'),
      weight_kg: effectiveWeightKg,
      tempo_speed: formTempo.trim() || 'Standard',
      notes: encodedNotes,
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
    <div className="space-y-6 text-stone-800">
      {/* BARRA SUPERIORE TERAPISTA: AZIONI RAPIDE */}
      <div className="bg-stone-50 p-5 rounded-xl border border-stone-300/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-none break-inside-avoid">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-stone-200/60 text-stone-700 rounded">
              <Dumbbell className="w-4 h-4 text-stone-700" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-stone-800 tracking-tight">
              Diario Carichi &amp; Pacchetti Giornalieri
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/10 text-emerald-800 border border-emerald-300/40 font-mono text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
              <span>Live Sync</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 font-medium">
            Seleziona una giornata per vedere il pacchetto di esercizi svolto da <strong className="text-stone-800">{patient?.nome} {patient?.cognome}</strong> (con carichi separati <strong>SX / DX</strong> per gli esercizi monopodalici).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={() => handleOpenNewModal(selectedDay)}
            className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-stone-100 font-semibold text-xs flex items-center gap-1.5 shadow-none transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Aggiungi Esercizio</span>
          </button>

          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/60 text-stone-700 border border-stone-300/70 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-stone-700" />
            <span>QR / Link Mobile Paziente</span>
          </button>
        </div>
      </div>

      {/* SELETTORE GIORNATE DI ALLENAMENTO (PACCHETTI GIORNALIERI) */}
      <div className="bg-stone-50 border border-stone-300/70 rounded-xl p-4 space-y-3 shadow-none print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
              <div className="p-1 bg-stone-200/60 text-stone-700 rounded">
                <Calendar className="w-4 h-4 text-stone-700" />
              </div>
              <span>Giornate di Allenamento Registrate ({groupedByDay.sortedDays.length} sedute)</span>
            </h4>
            <p className="text-[11px] text-stone-500 font-medium">
              Clicca su una giornata per filtrare velocemente il pacchetto di esercizi eseguito in quella data
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cerca esercizio o nota..."
                className="w-full bg-stone-100 border border-stone-300/70 rounded-xl py-1.5 pl-8 pr-3 text-xs text-stone-800 focus:border-stone-500 focus:bg-stone-50 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => fetchPatientWorkoutLogs(false)}
              className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200/60 text-stone-600 border border-stone-300/70 cursor-pointer"
              title="Sincronizza ora"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-stone-800' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5">
          <button
            type="button"
            onClick={() => setSelectedDay('ALL')}
            className={`px-4 py-2.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
              selectedDay === 'ALL'
                ? 'bg-stone-800 border-stone-800 text-stone-100 shadow-none'
                : 'bg-stone-100 border-stone-300/70 text-stone-600 hover:text-stone-800 hover:bg-stone-200/50'
            }`}
          >
            <div className="text-xs font-semibold">Tutte le Giornate</div>
            <div className={`text-[10px] font-mono mt-0.5 ${selectedDay === 'ALL' ? 'text-stone-300' : 'text-stone-500'}`}>
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
                className={`px-4 py-2.5 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-800 border-stone-800 text-stone-100 shadow-none'
                    : 'bg-stone-100 border-stone-300/70 text-stone-700 hover:bg-stone-200/50'
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <span>{formatDayLabel(dayKey)}</span>
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                  📦 {dayLogs.length} {dayLogs.length === 1 ? 'esercizio' : 'esercizi'} • Max {maxKgDay} kg
                </div>
              </button>
            );
          })}
        </div>

        {/* CHIP RAPIDI ESERCIZI PER VEDERE SUBITO LA PROGRESSIONE NEL TEMPO */}
        {uniqueExercises.length > 0 && (
          <div className="pt-2 border-t border-stone-300/70 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-semibold text-stone-700 shrink-0 flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Progressione Esercizio:</span>
            </span>
            {uniqueExercises.map((exName, idx) => {
              const isUni = logs.some(
                l => l.exercise_name === exName && l.is_unilateral
              );
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() =>
                    setSelectedExerciseProgression(
                      selectedExerciseProgression === exName ? null : exName
                    )
                  }
                  className={`px-3 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0 border transition-all cursor-pointer ${
                    selectedExerciseProgression === exName
                      ? 'bg-stone-800 text-stone-100 border-stone-800'
                      : 'bg-stone-100 text-stone-700 border-stone-300/70 hover:bg-stone-200/50'
                  }`}
                >
                  {getCategoryIcon(exName, 'w-3 h-3')}
                  <span>{exName}</span>
                  {isUni && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-900/10 text-emerald-800 border border-emerald-300/40 text-[9px] font-mono">
                      SX/DX
                    </span>
                  )}
                  <TrendingUp className="w-3 h-3 text-stone-600" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* PANNELLO PROGRESSIONE NEL TEMPO DELL'ESERCIZIO CLICCATO (INLINE ESPANDIBILE) */}
      {selectedExerciseProgression && (
        <div className="bg-stone-50 border border-stone-300/70 rounded-xl p-5 space-y-4 shadow-none break-inside-avoid">
          <div className="flex items-center justify-between border-b border-stone-300/70 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-stone-200/60 border border-stone-300/70">
                {getCategoryIcon(selectedExerciseProgression, 'w-5 h-5')}
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 block">
                  Analisi Progressione Carichi nel Tempo
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base sm:text-lg font-semibold text-stone-800">
                    {selectedExerciseProgression}
                  </h4>
                  {progressionSeries.some(x => x.is_unilateral) && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/10 text-emerald-800 border border-emerald-300/40 font-mono text-[10px] font-semibold">
                      Monopodalico (Confronto SX vs DX)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedExerciseProgression(null)}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/60 text-stone-700 border border-stone-300/70 text-xs font-semibold flex items-center gap-1 cursor-pointer print:hidden"
            >
              <X className="w-4 h-4" />
              <span>Chiudi Progressione</span>
            </button>
          </div>

          {progressionSeries.length === 0 ? (
            <p className="text-xs text-stone-500 font-medium">Nessun dato disponibile per questo esercizio.</p>
          ) : (
            (() => {
              const hasUnilateralInSeries = progressionSeries.some(x => x.is_unilateral);
              const latestItem = progressionSeries[progressionSeries.length - 1];
              const latestLsi = latestItem?.is_unilateral
                ? calcLoadLsiPct(latestItem.weight_sx_kg, latestItem.weight_dx_kg, injuredSide)
                : null;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* GRAFICO VISIVO DI PROGRESSIONE */}
                  <div className="lg:col-span-2 bg-stone-100 border border-stone-300/70 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-stone-800">
                          Curva di Progressione Carico (Kg) — {progressionSeries.length} Sedute
                        </span>
                        {hasUnilateralInSeries && (
                          <div className="flex items-center gap-2 text-[10px] font-semibold">
                            <span className="inline-flex items-center gap-1 text-emerald-800">
                              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-700 inline-block" />
                              Gamba SX
                            </span>
                            <span className="inline-flex items-center gap-1 text-teal-800">
                              <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 inline-block" />
                              Gamba DX
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {latestLsi !== null && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold border ${
                              latestLsi >= 90
                                ? 'bg-emerald-900/10 text-emerald-800 border-emerald-300/40'
                                : 'bg-amber-900/10 text-amber-800 border-amber-300/50'
                            }`}
                          >
                            Ultimo LSI: {latestLsi}%
                          </span>
                        )}
                        {(() => {
                          const first = progressionSeries[0]?.weight_kg || 0;
                          const last = progressionSeries[progressionSeries.length - 1]?.weight_kg || 0;
                          const diff = +(last - first).toFixed(1);
                          return (
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold border ${
                                diff >= 0
                                  ? 'bg-emerald-900/10 text-emerald-800 border-emerald-300/40'
                                  : 'bg-amber-900/10 text-amber-800 border-amber-300/50'
                              }`}
                            >
                              {diff > 0 ? `+${diff} kg vs 1ª seduta` : `${diff} kg`}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-end gap-3 h-44 pt-6 px-2 overflow-x-auto">
                      {progressionSeries.map((item, idx) => {
                        const maxVal = Math.max(
                          ...progressionSeries.map(x =>
                            Math.max(
                              Number(x.weight_kg) || 0,
                              Number(x.weight_sx_kg) || 0,
                              Number(x.weight_dx_kg) || 0
                            )
                          ),
                          1
                        );

                        if (item.is_unilateral) {
                          const sxVal = Number(item.weight_sx_kg) || 0;
                          const dxVal = Number(item.weight_dx_kg) || 0;
                          const pctSx = Math.max(Math.round((sxVal / maxVal) * 100), 12);
                          const pctDx = Math.max(Math.round((dxVal / maxVal) * 100), 12);

                          return (
                            <div
                              key={item.id || idx}
                              className="flex-1 min-w-[82px] flex flex-col items-center gap-1.5"
                            >
                              <div className="flex items-center gap-1 font-mono text-[10px] font-semibold">
                                <span className="text-emerald-800">SX:{sxVal}</span>
                                <span className="text-stone-400">|</span>
                                <span className="text-teal-800">DX:{dxVal}</span>
                              </div>
                              <span className="text-[10px] font-mono text-stone-500">
                                {item.sets}×{item.reps}
                              </span>
                              <div className="w-full bg-stone-50 rounded-t-xl h-24 flex items-end justify-center gap-1.5 overflow-hidden border border-stone-300/70 p-1">
                                <div
                                  style={{ height: `${pctSx}%` }}
                                  className="flex-1 bg-emerald-700 rounded-t-md transition-all"
                                  title={`Gamba SX: ${sxVal} kg`}
                                />
                                <div
                                  style={{ height: `${pctDx}%` }}
                                  className="flex-1 bg-teal-600 rounded-t-md transition-all"
                                  title={`Gamba DX: ${dxVal} kg`}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-semibold text-stone-700">
                                {new Date(item.created_at).toLocaleDateString('it-IT', {
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                          );
                        }

                        const pct = Math.max(
                          Math.round(((Number(item.weight_kg) || 0) / maxVal) * 100),
                          15
                        );
                        return (
                          <div
                            key={item.id || idx}
                            className="flex-1 min-w-[60px] flex flex-col items-center gap-1.5"
                          >
                            <span className="text-xs font-mono font-semibold text-emerald-800">
                              {item.weight_kg} kg
                            </span>
                            <span className="text-[10px] font-mono text-stone-500">
                              {item.sets}×{item.reps}
                            </span>
                            <div className="w-full bg-stone-50 rounded-t-xl h-24 flex items-end overflow-hidden border border-stone-300/70 p-0.5">
                              <div
                                style={{ height: `${pct}%` }}
                                className="w-full bg-emerald-700 rounded-t-lg transition-all"
                              />
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-stone-700">
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
                  <div className="bg-stone-100 border border-stone-300/70 rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                    <div className="text-xs font-semibold text-stone-800 sticky top-0 bg-stone-100 pb-1">
                      Dettaglio Cronologico Sedute
                    </div>
                    {progressionSeries
                      .slice()
                      .reverse()
                      .map((item, idx) => {
                        const rowLsi = item.is_unilateral
                          ? calcLoadLsiPct(item.weight_sx_kg, item.weight_dx_kg, injuredSide)
                          : null;
                        return (
                          <div
                            key={item.id || idx}
                            className="p-2.5 rounded-xl bg-stone-50 border border-stone-300/70 flex items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-stone-800">
                                {formatDayLabel(toDateInputValue(item.created_at))}
                              </div>
                              <div className="text-[10px] text-stone-500 font-mono">
                                {item.sets} serie × {item.reps} rip • {item.tempo_speed}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {item.is_unilateral ? (
                                <div className="text-right font-mono">
                                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                                    <span className="text-emerald-800">SX: {item.weight_sx_kg}kg</span>
                                    <span className="text-stone-400">|</span>
                                    <span className="text-teal-800">DX: {item.weight_dx_kg}kg</span>
                                  </div>
                                  {rowLsi !== null && (
                                    <div className="text-[9px] text-stone-500 font-semibold">
                                      LSI: <span className={rowLsi >= 90 ? 'text-emerald-800' : 'text-amber-700'}>{rowLsi}%</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="font-mono font-semibold text-emerald-800 text-sm">
                                  {item.weight_kg} kg
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1 text-stone-600 hover:text-stone-900 cursor-pointer print:hidden"
                                title="Modifica questa rilevazione"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ELENCO PACCHETTI DI ESERCIZI RAGGRUPPATI PER GIORNATA */}
      {daysToRender.length === 0 ? (
        <div className="bg-stone-50 border border-stone-300/70 rounded-xl p-10 text-center space-y-3 shadow-none">
          <Package className="w-8 h-8 text-stone-400 mx-auto" />
          <div className="text-sm font-semibold text-stone-800">
            Nessun pacchetto di allenamento ancora registrato per {patient?.nome}
          </div>
          <p className="text-xs text-stone-500 font-medium max-w-md mx-auto">
            Usa <strong>&quot;+ Aggiungi Esercizio&quot;</strong> per inserire il primo pacchetto di esercizi del giorno.
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
                className="bg-stone-50 border border-stone-300/70 rounded-xl overflow-hidden shadow-none break-inside-avoid"
              >
                {/* HEADER DELLA GIORNATA (PACCHETTO DEL GIORNO) */}
                <div className="p-4 bg-stone-100 border-b border-stone-300/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-1 rounded bg-stone-200/60 text-stone-700">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-stone-800">
                          Pacchetto Seduta — {formatDayLabel(dayKey)}
                        </h4>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/10 text-emerald-800 border border-emerald-300/40 font-mono text-[10px] font-semibold">
                          {dayLogs.length} {dayLogs.length === 1 ? 'esercizio' : 'esercizi'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 font-medium print:hidden">
                        Clicca sul nome di un esercizio per vedere la sua progressione nel tempo
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenNewModal(dayKey)}
                    className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-stone-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto print:hidden"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Esercizio in questa seduta</span>
                  </button>
                </div>

                {/* TABELLA ESERCIZI DEL PACCHETTO GIORNALIERO */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 text-stone-500 border-b border-stone-300/70 uppercase text-[10px] font-semibold tracking-wider">
                        <th className="py-2.5 px-4">Esercizio</th>
                        <th className="py-2.5 px-4 text-center">Serie × Rip</th>
                        <th className="py-2.5 px-4 text-center">Carico (Bilaterale o SX / DX)</th>
                        <th className="py-2.5 px-4">Velocità / Tempo</th>
                        <th className="py-2.5 px-4">Note Dolore / RPE</th>
                        <th className="py-2.5 px-4 text-right print:hidden">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-300/60">
                      {dayLogs.map((log, index) => {
                        const rowLsi = log.is_unilateral
                          ? calcLoadLsiPct(log.weight_sx_kg, log.weight_dx_kg, injuredSide)
                          : null;

                        return (
                          <tr
                            key={log.id || index}
                            className={`${index % 2 === 0 ? 'bg-stone-50' : 'bg-stone-100/70'} hover:bg-stone-200/50 transition-colors`}
                          >
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => setSelectedExerciseProgression(log.exercise_name)}
                                className="flex items-center gap-2.5 text-left group cursor-pointer"
                                title="Clicca per vedere il grafico di progressione di questo esercizio"
                              >
                                <div className="p-1 rounded bg-stone-200/60 text-stone-700 group-hover:bg-stone-300/70">
                                  {getCategoryIcon(log.exercise_name, 'w-4 h-4')}
                                </div>
                                <div>
                                  <div className="font-semibold text-stone-800 group-hover:text-stone-900 flex items-center gap-1.5 flex-wrap">
                                    <span>{log.exercise_name}</span>
                                    {log.is_unilateral && (
                                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/10 text-emerald-800 border border-emerald-300/40 font-mono text-[9px] font-semibold uppercase">
                                        SX+DX
                                      </span>
                                    )}
                                    <ChevronRight className="w-3.5 h-3.5 text-stone-500 print:hidden" />
                                  </div>
                                </div>
                              </button>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-stone-800">
                              {log.sets} × {log.reps}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {log.is_unilateral ? (
                                <div className="inline-flex flex-wrap items-center justify-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-800 border border-stone-300/70 font-mono font-semibold text-xs">
                                    SX: {log.weight_sx_kg} kg
                                  </span>
                                  <span className="px-2 py-0.5 rounded-lg bg-stone-100 text-stone-800 border border-stone-300/70 font-mono font-semibold text-xs">
                                    DX: {log.weight_dx_kg} kg
                                  </span>
                                  {rowLsi !== null && (
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-mono font-semibold text-[10px] border ${
                                        rowLsi >= 90
                                          ? 'bg-emerald-900/10 text-emerald-800 border-emerald-300/40'
                                          : 'bg-amber-900/10 text-amber-800 border-amber-300/50'
                                      }`}
                                      title={`Limb Symmetry Index del carico (Lato operato: ${injuredSide})`}
                                    >
                                      LSI {rowLsi}%
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-900/10 text-emerald-800 border border-emerald-300/40 font-mono font-semibold text-xs">
                                  {log.weight_kg} kg
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 border border-stone-300/70 text-stone-700 font-mono text-[11px]">
                                <Clock className="w-3 h-3 text-stone-600" />
                                {log.tempo_speed || log.tempo_execution || 'Standard'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-stone-600">
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                <span>{log.clean_notes || log.notes || log.notes_rpe || 'Nessun dolore'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap print:hidden">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(log)}
                                  className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/60 text-stone-700 border border-stone-300/70 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Modifica</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLogByTherapist(log.id)}
                                  className="p-1.5 rounded-lg bg-stone-100 hover:bg-rose-900/10 text-stone-500 hover:text-rose-700 border border-stone-300/70 cursor-pointer transition-colors"
                                  title="Elimina esercizio"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-lg bg-stone-50 border border-stone-300/70 rounded-xl p-6 space-y-4 shadow-none text-stone-800">
            <div className="flex items-center justify-between border-b border-stone-300/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-stone-200/60 text-stone-700 rounded">
                  <Edit3 className="w-4 h-4 text-stone-700" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  {editingLog ? 'Modifica Esercizio (Terapista)' : 'Aggiungi Esercizio al Pacchetto Giornaliero'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingModalOpen(false)}
                className="text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTherapistEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 font-semibold mb-1">Data Giornata</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-semibold mb-1">Orario</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-500 font-semibold mb-1">Esercizio</label>
                <input
                  type="text"
                  required
                  list="therapist-exercise-presets"
                  value={formExercise}
                  onChange={(e) => handleFormExerciseChange(e.target.value)}
                  placeholder="Nome esercizio (es. Single Leg Press, Bulgarian Split Squat...)"
                  className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-semibold"
                />
                <datalist id="therapist-exercise-presets">
                  {EXERCISE_PRESETS.map((item, i) => (
                    <option key={i} value={item.name} />
                  ))}
                </datalist>
              </div>

              <div className="bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-stone-700">
                    Modalità Rilevazione Carico:
                  </span>
                  <span className="text-[10px] font-mono text-emerald-800 font-semibold">
                    {formIsUnilateral ? 'Gamba SX + Gamba DX separati' : 'Carico unico bilaterale'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormIsUnilateral(false)}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs transition-all cursor-pointer border ${
                      !formIsUnilateral
                        ? 'bg-stone-800 text-stone-100 border-stone-800'
                        : 'bg-stone-50 text-stone-600 border-stone-300/70 hover:text-stone-800'
                    }`}
                  >
                    Bilaterale (1 Carico)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIsUnilateral(true)}
                    className={`py-2 px-3 rounded-lg font-semibold text-xs transition-all cursor-pointer border ${
                      formIsUnilateral
                        ? 'bg-stone-800 text-stone-100 border-stone-800'
                        : 'bg-stone-50 text-stone-600 border-stone-300/70 hover:text-stone-800'
                    }`}
                  >
                    Monopodalico (SX + DX)
                  </button>
                </div>
              </div>

              {!formIsUnilateral ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-stone-500 font-semibold mb-1">Serie (Sets)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formSets}
                      onChange={(e) => setFormSets(e.target.value)}
                      className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-mono text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 font-semibold mb-1">Ripetizioni</label>
                    <input
                      type="text"
                      required
                      value={formReps}
                      onChange={(e) => setFormReps(e.target.value)}
                      className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-mono text-center font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-800 font-semibold mb-1">Carico (Kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      required={!formIsUnilateral}
                      value={formWeightKg}
                      onChange={(e) => setFormWeightKg(e.target.value)}
                      className="w-full bg-emerald-900/10 border border-emerald-300/40 rounded-xl p-2.5 text-emerald-900 font-mono text-center font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-500 font-semibold mb-1">Serie (Sets)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formSets}
                        onChange={(e) => setFormSets(e.target.value)}
                        className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-mono text-center font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-500 font-semibold mb-1">Ripetizioni (per gamba)</label>
                      <input
                        type="text"
                        required
                        value={formReps}
                        onChange={(e) => setFormReps(e.target.value)}
                        className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-mono text-center font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-stone-100 border border-stone-300/70">
                    <div>
                      <label className="flex items-center justify-between text-stone-800 font-semibold mb-1">
                        <span>Gamba SX (Kg)</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required={formIsUnilateral}
                        value={formWeightSxKg}
                        onChange={(e) => setFormWeightSxKg(e.target.value)}
                        placeholder="es. 35"
                        className="w-full bg-stone-50 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-mono text-center font-semibold text-sm"
                      />
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-stone-800 font-semibold mb-1">
                        <span>Gamba DX (Kg)</span>
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        required={formIsUnilateral}
                        value={formWeightDxKg}
                        onChange={(e) => setFormWeightDxKg(e.target.value)}
                        placeholder="es. 40"
                        className="w-full bg-stone-50 border border-stone-300/70 rounded-xl p-2.5 text-stone-800 font-mono text-center font-semibold text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-stone-500 font-semibold mb-1">Velocità / Tempo Esecuzione</label>
                <input
                  type="text"
                  value={formTempo}
                  onChange={(e) => setFormTempo(e.target.value)}
                  placeholder="es. 3-0-1-0, Esplosivo 0.65 m/s..."
                  className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800"
                />
              </div>

              <div>
                <label className="block text-stone-500 font-semibold mb-1">Note Cliniche / RPE / Dolore</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="es. Nessun dolore (0/10), RPE 8/10..."
                  className="w-full bg-stone-100 border border-stone-300/70 rounded-xl p-2.5 text-stone-800"
                />
              </div>

              <div className="pt-3 border-t border-stone-300/70 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200/60 text-stone-700 border border-stone-300/70 rounded-xl font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xl font-semibold flex items-center gap-1.5 shadow-none cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-lg bg-stone-50 border border-stone-300/70 rounded-xl p-6 space-y-5 shadow-none text-stone-800">
            <div className="flex items-center justify-between border-b border-stone-300/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-stone-200/60 text-stone-700 rounded">
                  <QrCode className="w-4 h-4 text-stone-700" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  Invito Portale Mobile — {patient?.nome} {patient?.cognome}
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-stone-500 hover:text-stone-800 text-sm font-semibold cursor-pointer"
              >
                Chiudi ✕
              </button>
            </div>

            <div className="bg-stone-100 border border-stone-300/70 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-300/70 shrink-0 shadow-none">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(clientPortalUrl)}`}
                  alt="QR Code Portale Paziente"
                  className="w-32 h-32 rounded-lg"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/10 text-emerald-800 border border-emerald-300/40 text-[10px] font-semibold uppercase">
                  Scansione Diretta in Studio
                </span>
                <h4 className="text-sm font-semibold text-stone-800">
                  Fai inquadrare il QR Code al Paziente
                </h4>
                <p className="text-xs text-stone-500 font-medium leading-relaxed">
                  Il paziente apre direttamente la sua vista mobile su smartphone e può salvarla sulla schermata Home.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-600">
                Link Diretto Permanente Portale Paziente:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={clientPortalUrl}
                  className="flex-1 bg-stone-100 border border-stone-300/70 rounded-xl px-3 py-2 text-xs font-mono text-stone-800"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200/60 text-stone-800 border border-stone-300/70 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-900 text-stone-100 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-none cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Invia su WhatsApp</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSendMagicLinkToPatient} className="pt-3 border-t border-stone-300/70 space-y-2.5">
              <label className="block text-xs font-semibold text-stone-600 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-700" />
                <span>Oppure invia Magic Link ufficiale (OTP via Email):</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="email.paziente@esempio.it"
                  className="flex-1 bg-stone-100 border border-stone-300/70 rounded-xl px-3 py-2 text-xs text-stone-800"
                />
                <button
                  type="submit"
                  disabled={sendingMagicLink}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-stone-100 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMagicLink ? 'Invio...' : 'Invia Email'}</span>
                </button>
              </div>
              {magicLinkStatus && (
                <p className="text-[11px] font-semibold text-emerald-800 pt-1">
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
