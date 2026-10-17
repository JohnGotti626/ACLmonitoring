import React, { useState, useEffect, useMemo } from 'react';
import {
  Dumbbell,
  History,
  CheckCircle2,
  Plus,
  Search,
  Mail,
  ArrowRight,
  LogOut,
  Activity,
  Zap,
  Footprints,
  Flame,
  Clock,
  MessageSquare,
  TrendingUp,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  Share,
  Calendar,
  Edit3,
  Trash2,
  X,
  Package,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import LogoN from './LogoN';

// CATALOGO PREDEFINITO ESERCIZI RIABILITAZIONE LCA CON FLAG MONOPODALICO (isUnilateral)
export const EXERCISE_PRESETS = [
  { name: 'Back Squat Bilaterale', category: 'Squat & Accosciata', icon: 'squat', defaultTempo: '3-1-1-0', isUnilateral: false },
  { name: 'Front Squat', category: 'Squat & Accosciata', icon: 'squat', defaultTempo: '3-0-1-0', isUnilateral: false },
  { name: 'Goblet Squat', category: 'Squat & Accosciata', icon: 'squat', defaultTempo: '3-2-1-0', isUnilateral: false },
  { name: 'Box Squat', category: 'Squat & Accosciata', icon: 'squat', defaultTempo: '3-1-X-0', isUnilateral: false },
  { name: 'Bulgarian Split Squat', category: 'Affondi & Monopodalici', icon: 'lunge', defaultTempo: '3-1-1-0', isUnilateral: true },
  { name: 'Affondi Camminati (Walking Lunges)', category: 'Affondi & Monopodalici', icon: 'lunge', defaultTempo: '2-0-1-0', isUnilateral: true },
  { name: 'Step-Up su Box Monopodalico', category: 'Affondi & Monopodalici', icon: 'lunge', defaultTempo: '2-1-1-0', isUnilateral: true },
  { name: 'Single Leg Squat a Box', category: 'Affondi & Monopodalici', icon: 'lunge', defaultTempo: '3-1-1-0', isUnilateral: true },
  { name: 'Leg Extension Monopodalica', category: 'Isolamento Ginocchio', icon: 'knee', defaultTempo: '2-2-1-0', isUnilateral: true },
  { name: 'Leg Extension Isometrica 60° (Mono)', category: 'Isolamento Ginocchio', icon: 'knee', defaultTempo: 'Iso 45s', isUnilateral: true },
  { name: 'Leg Extension Bilaterale', category: 'Isolamento Ginocchio', icon: 'knee', defaultTempo: '2-1-1-0', isUnilateral: false },
  { name: 'Leg Curl Monopodalico', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: '3-1-1-0', isUnilateral: true },
  { name: 'Leg Curl Seduto / Prono Bilaterale', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: '3-1-1-0', isUnilateral: false },
  { name: 'Nordic Hamstring Curl', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: 'Eccentrico 4s', isUnilateral: false },
  { name: 'Romanian Deadlift (RDL) Monopodalico', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: '3-1-1-0', isUnilateral: true },
  { name: 'Hip Thrust Monopodalico', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: '2-2-1-0', isUnilateral: true },
  { name: 'Hip Thrust Bilaterale', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: '2-2-1-0', isUnilateral: false },
  { name: 'Trap Bar Deadlift', category: 'Pressa & Tirate', icon: 'press', defaultTempo: 'Esplosivo', isUnilateral: false },
  { name: 'Leg Press 45° Monopodalica', category: 'Pressa & Tirate', icon: 'press', defaultTempo: '3-0-1-0', isUnilateral: true },
  { name: 'Leg Press Orizzontale Bilaterale', category: 'Pressa & Tirate', icon: 'press', defaultTempo: '2-0-1-0', isUnilateral: false },
  { name: 'Calf Raise Seduto (Soleo) Monopodalico', category: 'Polpaccio & Caviglia', icon: 'calf', defaultTempo: '2-2-1-0', isUnilateral: true },
  { name: 'Calf Raise in Piedi Monopodalico', category: 'Polpaccio & Caviglia', icon: 'calf', defaultTempo: '2-1-1-0', isUnilateral: true },
  { name: 'Drop Jump da Box 30cm', category: 'Pliometria & Reattività', icon: 'plyo', defaultTempo: 'Contatto <250ms', isUnilateral: false }
];

// Rileva automaticamente dal nome se un esercizio è monopodalico
export function detectUnilateralFromName(name = '') {
  if (!name) return false;
  const q = name.toLowerCase().trim();
  const preset = EXERCISE_PRESETS.find((p) => p.name.toLowerCase() === q);
  if (preset) return Boolean(preset.isUnilateral);
  if (q.includes('bilateral')) return false;
  return (
    q.includes('mono') ||
    q.includes('single') ||
    q.includes('split') ||
    q.includes('bulgar') ||
    q.includes('affond') ||
    q.includes('lunge') ||
    q.includes('step-up') ||
    q.includes('step up') ||
    q.includes('unilat') ||
    q.includes('1 gamba')
  );
}

// Codifica e decodifica dei carichi SX e DX all'interno del campo notes per compatibilità totale con lo schema Supabase workout_logs
const SX_DX_REGEX = /^\[SX:\s*([0-9.,]+)\s*kg\s*\|\s*DX:\s*([0-9.,]+)\s*kg\]\s*/i;

export function encodeNotesWithUnilateralLoads(rawNotes, isUnilateral, weightSx, weightDx) {
  const cleanedNotes = String(rawNotes || '')
    .replace(SX_DX_REGEX, '')
    .trim();
  const finalNoteText = cleanedNotes || 'Nessun dolore';
  if (!isUnilateral) return finalNoteText;

  const sxNum = parseFloat(String(weightSx ?? 0).replace(',', '.')) || 0;
  const dxNum = parseFloat(String(weightDx ?? 0).replace(',', '.')) || 0;
  return `[SX: ${sxNum} kg | DX: ${dxNum} kg] ${finalNoteText}`;
}

export function parseUnilateralLoadsFromRow(row) {
  if (!row) return { isUnilateral: false, weightSx: null, weightDx: null, cleanNotes: 'Nessun dolore' };

  const rawNotes = String(row.notes || row.notes_rpe || '');
  const match = rawNotes.match(SX_DX_REGEX);

  if (match) {
    const sx = parseFloat(match[1].replace(',', '.'));
    const dx = parseFloat(match[2].replace(',', '.'));
    const cleanNotes = rawNotes.replace(SX_DX_REGEX, '').trim() || 'Nessun dolore';
    return {
      isUnilateral: true,
      weightSx: isNaN(sx) ? 0 : sx,
      weightDx: isNaN(dx) ? 0 : dx,
      cleanNotes
    };
  }

  if (row.weight_sx_kg !== undefined && row.weight_dx_kg !== undefined && (row.weight_sx_kg !== null || row.weight_dx_kg !== null)) {
    return {
      isUnilateral: true,
      weightSx: parseFloat(row.weight_sx_kg) || 0,
      weightDx: parseFloat(row.weight_dx_kg) || 0,
      cleanNotes: rawNotes || 'Nessun dolore'
    };
  }

  return {
    isUnilateral: Boolean(row.is_unilateral),
    weightSx: null,
    weightDx: null,
    cleanNotes: rawNotes || 'Nessun dolore'
  };
}

export function calcLoadLsiPct(sx, dx) {
  const nSx = parseFloat(sx);
  const nDx = parseFloat(dx);
  if (isNaN(nSx) || isNaN(nDx) || (nSx <= 0 && nDx <= 0)) return null;
  const maxV = Math.max(nSx, nDx);
  const minV = Math.min(nSx, nDx);
  if (maxV <= 0) return null;
  return Math.round((minV / maxV) * 100);
}

export function getIconTypeFromExerciseName(name = '', fallback = 'squat') {
  if (!name) return fallback;
  const q = name.toLowerCase();
  const preset = EXERCISE_PRESETS.find((p) => p.name.toLowerCase() === q);
  if (preset) return preset.icon;
  if (q.includes('squat')) return 'squat';
  if (q.includes('affond') || q.includes('split') || q.includes('lunge') || q.includes('step')) return 'lunge';
  if (q.includes('ext') || q.includes('iso') || q.includes('ginocchio')) return 'knee';
  if (
    q.includes('curl') ||
    q.includes('rdl') ||
    q.includes('deadlift') ||
    q.includes('stacco') ||
    q.includes('hip') ||
    q.includes('nordic') ||
    q.includes('flessor')
  )
    return 'hamstring';
  if (q.includes('press') || q.includes('trap bar')) return 'press';
  if (q.includes('jump') || q.includes('hop') || q.includes('salto') || q.includes('plio') || q.includes('drop'))
    return 'plyo';
  return fallback;
}

export function getCategoryIcon(iconTypeOrName, className = 'w-4 h-4') {
  const iconType = ['squat', 'lunge', 'knee', 'hamstring', 'press', 'plyo', 'calf'].includes(iconTypeOrName)
    ? iconTypeOrName
    : getIconTypeFromExerciseName(iconTypeOrName);

  switch (iconType) {
    case 'squat':
      return <Dumbbell className={`${className} text-[#06B6D4]`} />;
    case 'lunge':
      return <Footprints className={`${className} text-[#0D9488]`} />;
    case 'knee':
      return <Activity className={`${className} text-amber-400`} />;
    case 'hamstring':
      return <Flame className={`${className} text-rose-400`} />;
    case 'press':
      return <Zap className={`${className} text-purple-400`} />;
    case 'plyo':
      return <TrendingUp className={`${className} text-[#06B6D4]`} />;
    default:
      return <Dumbbell className={`${className} text-[#06B6D4]`} />;
  }
}

export function toDateInputValue(isoString) {
  if (!isoString) return new Date().toISOString().split('T')[0];
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function formatDayLabel(dateKey) {
  if (!dateKey) return '';
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const todayKey = toDateInputValue(new Date().toISOString());
    const prefix = dateKey === todayKey ? 'Oggi • ' : '';
    return (
      prefix +
      dt.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    );
  } catch {
    return dateKey;
  }
}

// Normalizza un record proveniente da Supabase o locale estraendo anche i carichi Gamba SX e Gamba DX
export function normalizeWorkoutLog(row) {
  if (!row) return row;
  const parsed = parseUnilateralLoadsFromRow(row);
  const wMain = parseFloat(row.weight_kg) || 0;

  return {
    ...row,
    exercise_name: row.exercise_name || 'Esercizio',
    category_icon: row.category_icon || getIconTypeFromExerciseName(row.exercise_name),
    sets: Number(row.sets) || 1,
    reps: String(row.reps ?? '1'),
    weight_kg: parsed.isUnilateral
      ? Math.max(parsed.weightSx ?? 0, parsed.weightDx ?? 0, wMain)
      : wMain,
    is_unilateral: parsed.isUnilateral,
    weight_sx_kg: parsed.isUnilateral ? parsed.weightSx : null,
    weight_dx_kg: parsed.isUnilateral ? parsed.weightDx : null,
    tempo_speed: row.tempo_speed || row.tempo_execution || 'Standard',
    tempo_execution: row.tempo_speed || row.tempo_execution || 'Standard',
    notes: row.notes || row.notes_rpe || 'Nessun dolore',
    clean_notes: parsed.cleanNotes,
    notes_rpe: parsed.cleanNotes,
    created_at: row.created_at || new Date().toISOString()
  };
}

export default function ClientPortal({
  patient,
  isSimulationMode = false,
  isSimulation = false,
  onExitSimulation,
  onNewLogSaved
}) {
  const effectiveSimMode = isSimulationMode || isSimulation;

  // Autenticazione Paziente (se non in modalità simulazione Terapista)
  const [authEmail, setAuthEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  // Navigazione Interna Smartphone: 'log' (Crea/Modifica Pacchetto Giorno) | 'history' (Il Mio Storico per Giornate)
  const [activeSection, setActiveSection] = useState('log');

  // Data della seduta corrente (default: Oggi, modificabile in qualsiasi momento)
  const [workoutDate, setWorkoutDate] = useState(() => toDateInputValue(new Date().toISOString()));

  // Carrello / Pacchetto di Esercizi in preparazione per la giornata selezionata
  const [packageItems, setPackageItems] = useState([]);

  // Campi per il singolo esercizio da aggiungere al pacchetto (o modificare)
  const [editingLogId, setEditingLogId] = useState(null);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('squat');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sets, setSets] = useState('4');
  const [reps, setReps] = useState('8');

  // MODALITÀ CARICO: Bilaterale (false) vs Monopodalico SX + DX (true)
  const [isUnilateralMode, setIsUnilateralMode] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [weightSxKg, setWeightSxKg] = useState('');
  const [weightDxKg, setWeightDxKg] = useState('');

  const [tempo, setTempo] = useState('');
  const [notesRpe, setNotesRpe] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Storico Allenamenti del Paziente
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Selettore Giornata nello Storico ('ALL' oppure 'YYYY-MM-DD')
  const [selectedHistoryDay, setSelectedHistoryDay] = useState('LATEST');

  // Modal / Vista Progressione nel Tempo di un singolo Esercizio cliccato
  const [selectedExerciseForProgression, setSelectedExerciseForProgression] = useState(null);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosPwaTip, setShowIosPwaTip] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Controlla la sessione Supabase al caricamento (rientro da Magic Link)
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const targetPatientId = patient?.id || sessionUser?.user_metadata?.patient_id || null;
  const targetPatientName = patient?.nome
    ? `${patient.nome} ${patient.cognome || ''}`
    : sessionUser?.email || 'Atleta LCA';
  const injuredSide = (patient?.lato_lesione || '').toLowerCase();

  // Carica lo storico da Supabase ('workout_logs') con sincronizzazione Realtime
  const fetchMyWorkoutLogs = async (silent = false) => {
    if (!silent) setLoadingLogs(true);
    try {
      if (isSupabaseConfigured && targetPatientId) {
        const { data, error } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('patient_id', String(targetPatientId))
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const normalized = data.map(normalizeWorkoutLog);
          setWorkoutLogs(normalized);
          const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
          try {
            localStorage.setItem(localKey, JSON.stringify(normalized));
          } catch {}
          if (!silent) setLoadingLogs(false);
          return;
        }
      }

      const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        setWorkoutLogs(JSON.parse(savedLocal).map(normalizeWorkoutLog));
      } else if (Array.isArray(patient?.workout_logs)) {
        setWorkoutLogs(patient.workout_logs.map(normalizeWorkoutLog));
      }
    } catch (err) {
      console.error('Errore caricamento workout_logs:', err);
    } finally {
      if (!silent) setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (!effectiveSimMode && !sessionUser && !targetPatientId) return;

    fetchMyWorkoutLogs();

    if (!isSupabaseConfigured || !targetPatientId) return;

    const channel = supabase
      .channel(`client_portal_logs_${targetPatientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_logs' }, () => {
        fetchMyWorkoutLogs(true);
      })
      .subscribe();

    const interval = setInterval(() => {
      fetchMyWorkoutLogs(true);
    }, 5000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [targetPatientId, sessionUser, effectiveSimMode]);

  // Raggruppamento allenamenti per GIORNATA ('YYYY-MM-DD')
  const groupedByDay = useMemo(() => {
    const map = {};
    workoutLogs.forEach((log) => {
      const dayKey = toDateInputValue(log.created_at);
      if (!map[dayKey]) {
        map[dayKey] = [];
      }
      map[dayKey].push(log);
    });
    const sortedDays = Object.keys(map).sort((a, b) => b.localeCompare(a));
    return { map, sortedDays };
  }, [workoutLogs]);

  // Giornata effettivamente selezionata nello storico
  const activeHistoryDay = useMemo(() => {
    if (selectedHistoryDay === 'ALL') return 'ALL';
    if (selectedHistoryDay === 'LATEST') {
      return groupedByDay.sortedDays[0] || 'ALL';
    }
    if (groupedByDay.map[selectedHistoryDay]) return selectedHistoryDay;
    return groupedByDay.sortedDays[0] || 'ALL';
  }, [selectedHistoryDay, groupedByDay]);

  const existingLogsForSelectedDate = useMemo(() => {
    return groupedByDay.map[workoutDate] || [];
  }, [groupedByDay, workoutDate]);

  // Calcolo dati di Progressione nel Tempo per l'esercizio cliccato
  const exerciseProgressionData = useMemo(() => {
    if (!selectedExerciseForProgression) return [];
    const target = selectedExerciseForProgression.toLowerCase().trim();
    return workoutLogs
      .filter((l) => l.exercise_name?.toLowerCase().trim() === target)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [selectedExerciseForProgression, workoutLogs]);

  // Suggerimenti autocompletamento
  const suggestions = useMemo(() => {
    const pastNames = Array.from(new Set(workoutLogs.map((l) => l.exercise_name))).filter(Boolean);
    const pastItems = pastNames
      .filter((name) => !EXERCISE_PRESETS.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      .map((name) => ({
        name,
        category: 'Già eseguiti',
        icon: getIconTypeFromExerciseName(name),
        defaultTempo: '',
        isUnilateral: detectUnilateralFromName(name)
      }));

    const all = [...pastItems, ...EXERCISE_PRESETS];
    if (!exerciseQuery.trim()) return all;
    const q = exerciseQuery.toLowerCase();
    return all.filter(
      (item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [exerciseQuery, workoutLogs]);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail.trim()) return;

    setSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/?portal=client${
            targetPatientId ? `&patientId=${targetPatientId}` : ''
          }`
        }
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setAuthError(err.message || "Errore durante l'invio del Magic Link.");
    } finally {
      setSendingOtp(false);
    }
  };

  const buildIsoForSelectedDate = () => {
    const now = new Date();
    if (workoutDate) {
      const [y, m, d] = workoutDate.split('-').map(Number);
      if (y && m && d) {
        const composed = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
        if (!isNaN(composed.getTime())) {
          return composed.toISOString();
        }
      }
    }
    return now.toISOString();
  };

  const isCurrentFormLoadValid = () => {
    if (!exerciseQuery.trim()) return false;
    if (isUnilateralMode) {
      return weightSxKg !== '' || weightDxKg !== '';
    }
    return weightKg !== '';
  };

  const buildCurrentExerciseEntry = (customId = undefined) => {
    const sxVal = parseFloat(String(weightSxKg || 0).replace(',', '.')) || 0;
    const dxVal = parseFloat(String(weightDxKg || 0).replace(',', '.')) || 0;
    const bilatVal = parseFloat(String(weightKg || 0).replace(',', '.')) || 0;

    const finalWeightKg = isUnilateralMode ? Math.max(sxVal, dxVal) : bilatVal;
    const encodedNotes = encodeNotesWithUnilateralLoads(notesRpe, isUnilateralMode, sxVal, dxVal);

    return normalizeWorkoutLog({
      id:
        customId ||
        (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined),
      patient_id: String(targetPatientId || 'demo-patient'),
      patient_email: sessionUser?.email || patient?.email || null,
      exercise_name: exerciseQuery.trim(),
      category_icon: selectedCategoryIcon || getIconTypeFromExerciseName(exerciseQuery.trim()),
      sets: Number(sets) || 1,
      reps: String(reps || '1'),
      weight_kg: finalWeightKg,
      is_unilateral: isUnilateralMode,
      weight_sx_kg: isUnilateralMode ? sxVal : null,
      weight_dx_kg: isUnilateralMode ? dxVal : null,
      tempo_speed: tempo.trim() || 'Standard',
      tempo_execution: tempo.trim() || 'Standard',
      notes: encodedNotes,
      notes_rpe: encodedNotes,
      created_at: buildIsoForSelectedDate()
    });
  };

  const resetExerciseFields = () => {
    setExerciseQuery('');
    setWeightKg('');
    setWeightSxKg('');
    setWeightDxKg('');
    setIsUnilateralMode(false);
    setTempo('');
    setNotesRpe('');
    setShowSuggestions(false);
  };

  // Aggiunge l'esercizio compilato al "Pacchetto del Giorno"
  const handleAddExerciseToPackage = () => {
    if (!isCurrentFormLoadValid()) return;
    const newItem = buildCurrentExerciseEntry();
    setPackageItems((prev) => [...prev, newItem]);
    resetExerciseFields();
  };

  const handleRemoveFromPackageDraft = (idx) => {
    setPackageItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Avvia la modifica di un esercizio già salvato nello storico
  const handleStartEditLog = (log) => {
    const parsed = parseUnilateralLoadsFromRow(log);
    setEditingLogId(log.id);
    setWorkoutDate(toDateInputValue(log.created_at));
    setExerciseQuery(log.exercise_name || '');
    setSelectedCategoryIcon(log.category_icon || getIconTypeFromExerciseName(log.exercise_name));
    setSets(String(log.sets || 4));
    setReps(String(log.reps || 8));

    if (parsed.isUnilateral) {
      setIsUnilateralMode(true);
      setWeightSxKg(String(parsed.weightSx ?? 0));
      setWeightDxKg(String(parsed.weightDx ?? 0));
      setWeightKg(String(log.weight_kg ?? ''));
    } else {
      setIsUnilateralMode(false);
      setWeightKg(String(log.weight_kg ?? ''));
      setWeightSxKg('');
      setWeightDxKg('');
    }

    setTempo(log.tempo_speed || log.tempo_execution || '');
    setNotesRpe(parsed.cleanNotes === 'Nessun dolore' ? '' : parsed.cleanNotes);
    setActiveSection('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    resetExerciseFields();
  };

  // Eliminazione di un esercizio dallo storico
  const handleDeleteLog = async (logId) => {
    const updatedList = workoutLogs.filter((item) => item.id !== logId);
    setWorkoutLogs(updatedList);

    const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(updatedList));
    } catch {}

    if (isSupabaseConfigured && logId) {
      try {
        await supabase.from('workout_logs').delete().eq('id', logId);
      } catch (err) {
        console.warn('Info eliminazione workout_logs:', err);
      }
    }

    if (onNewLogSaved) {
      onNewLogSaved(null, updatedList);
    }
  };

  // SALVATAGGIO PACCHETTO DI ESERCIZI DEL GIORNO (o Modifica singolo esercizio)
  const handleSaveWorkoutPackage = async (e) => {
    e.preventDefault();

    if (editingLogId) {
      if (!isCurrentFormLoadValid()) return;
      setSaving(true);
      const updatedEntry = buildCurrentExerciseEntry(editingLogId);

      const dbRow = {
        id: editingLogId,
        patient_id: String(targetPatientId || 'demo-patient'),
        patient_email: sessionUser?.email || patient?.email || null,
        exercise_name: updatedEntry.exercise_name,
        sets: updatedEntry.sets,
        reps: updatedEntry.reps,
        weight_kg: updatedEntry.weight_kg,
        tempo_speed: updatedEntry.tempo_speed,
        notes: updatedEntry.notes,
        created_at: updatedEntry.created_at
      };

      try {
        if (isSupabaseConfigured && targetPatientId) {
          await supabase.from('workout_logs').delete().eq('id', editingLogId);
          const { error } = await supabase.from('workout_logs').insert([dbRow]);
          if (error) {
            console.error('Errore salvataggio modifica su Supabase:', error.message);
          }
        }

        const normalizedEntry = normalizeWorkoutLog(dbRow);
        const updatedList = workoutLogs
          .map((item) => (item.id === editingLogId ? normalizedEntry : item))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setWorkoutLogs(updatedList);
        const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
        try {
          localStorage.setItem(localKey, JSON.stringify(updatedList));
        } catch {}

        if (onNewLogSaved) {
          onNewLogSaved(normalizedEntry, updatedList);
        }

        setEditingLogId(null);
        resetExerciseFields();
        setSaveSuccess('Modifica salvata con successo!');
        setTimeout(() => setSaveSuccess(''), 3000);
      } finally {
        setSaving(false);
      }
      return;
    }

    const itemsToSave = [...packageItems];
    if (isCurrentFormLoadValid()) {
      itemsToSave.push(buildCurrentExerciseEntry());
    }

    if (itemsToSave.length === 0) return;

    setSaving(true);
    try {
      const dbPayloads = itemsToSave.map((item) => ({
        ...(item.id ? { id: item.id } : {}),
        patient_id: String(targetPatientId || 'demo-patient'),
        patient_email: item.patient_email,
        exercise_name: item.exercise_name,
        sets: item.sets,
        reps: item.reps,
        weight_kg: item.weight_kg,
        tempo_speed: item.tempo_speed,
        notes: item.notes,
        created_at: item.created_at
      }));

      let insertedRows = dbPayloads.map(normalizeWorkoutLog);

      if (isSupabaseConfigured && targetPatientId) {
        const { data, error } = await supabase.from('workout_logs').insert(dbPayloads).select();

        if (error) {
          console.error('Errore insert pacchetto workout_logs su Supabase:', error.message);
        } else if (Array.isArray(data) && data.length > 0) {
          insertedRows = data.map(normalizeWorkoutLog);
        }
      }

      const updatedList = [...insertedRows, ...workoutLogs].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setWorkoutLogs(updatedList);

      const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
      try {
        localStorage.setItem(localKey, JSON.stringify(updatedList));
      } catch {}

      if (onNewLogSaved) {
        onNewLogSaved(insertedRows[0], updatedList);
      }

      setPackageItems([]);
      resetExerciseFields();
      setSelectedHistoryDay(workoutDate);
      setSaveSuccess(
        `Pacchetto di ${insertedRows.length} esercizi salvato per il ${formatDayLabel(workoutDate)}!`
      );
      setTimeout(() => setSaveSuccess(''), 3500);
    } catch (err) {
      console.error('Errore salvataggio pacchetto:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowIosPwaTip(!showIosPwaTip);
    }
  };

  const liveLsiForm = isUnilateralMode ? calcLoadLsiPct(weightSxKg, weightDxKg) : null;

  // SCHERMATA 1: LOGIN MAGIC LINK PAZIENTE
  if (!effectiveSimMode && !sessionUser) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white flex flex-col justify-center items-center p-4 font-sans">
        <div className="w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <LogoN className="w-16 h-16 rounded-2xl border border-[#06B6D4]/40 shadow-lg" />
            <span className="px-3 py-0.5 rounded-full bg-[#0F172A] text-[#06B6D4] border border-[#334155] text-[11px] font-extrabold uppercase tracking-wider">
              Portale Paziente Mobile
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Diario Allenamento LCA
            </h1>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Accedi senza password tramite <strong>Magic Link</strong>. Inserisci la tua email per ricevere il link di accesso diretto sul tuo smartphone.
            </p>
          </div>

          {magicLinkSent ? (
            <div className="p-5 rounded-2xl bg-[#0F172A] border border-[#0D9488] text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#0D9488] mx-auto" />
              <h3 className="text-base font-extrabold text-white">Controlla la tua Email!</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Abbiamo inviato un link magico a <strong className="text-white">{authEmail}</strong>.<br />
                Tocca il pulsante nell'email per entrare subito nel tuo Diario Allenamento.
              </p>
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-xs text-[#06B6D4] underline font-bold pt-2"
              >
                Usa un altro indirizzo email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                  La tua Email personale
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="nome.cognome@email.it"
                    className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#06B6D4] rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#94A3B8] focus:outline-none"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-300 font-semibold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full py-3.5 bg-gradient-to-r from-[#0D9488] to-[#06B6D4] hover:opacity-95 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{sendingOtp ? 'Invio Link in corso...' : 'Invia Magic Link via Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {patient && (
            <div className="pt-4 border-t border-[#334155] text-center">
              <button
                type="button"
                onClick={() =>
                  setSessionUser({
                    id: `pat-user-${patient.id}`,
                    email: patient.email || `${patient.nome?.toLowerCase()}@paziente.it`,
                    user_metadata: { role: 'patient', patient_id: patient.id }
                  })
                }
                className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-[#06B6D4] font-bold text-xs rounded-xl border border-[#334155] transition-all cursor-pointer"
              >
                ⚡ Entra Subito come {patient.nome} {patient.cognome} (Link Personale)
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-[#94A3B8] pt-2">
            <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            <span>Connessione Protetta RLS • Privacy Paziente Garantita</span>
          </div>
        </div>
      </div>
    );
  }

  // SCHERMATA 2: INTERFACCIA PAZIENTE / SMARTPHONE CON SUPPORTO MONOPODALICO GAMBA SX & DX
  return (
    <div className="min-h-screen bg-[#0F172A] text-white pb-24 font-sans">
      {/* BANNER MODALITÀ SIMULAZIONE TERAPISTA */}
      {(effectiveSimMode || onExitSimulation) && (
        <div className="bg-amber-600 text-white px-4 py-2.5 text-xs font-extrabold flex items-center justify-between shadow-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span>VISTA PORTALE PAZIENTE ({targetPatientName})</span>
          </div>
          {onExitSimulation && (
            <button
              onClick={onExitSimulation}
              className="px-3 py-1 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span>Torna a Vista Terapista</span>
            </button>
          )}
        </div>
      )}

      {/* TOP MOBILE BAR */}
      <header className="bg-[#1E293B]/95 backdrop-blur-md border-b border-[#334155] px-4 py-3.5 sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoN className="w-10 h-10 rounded-xl border border-[#334155]" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#06B6D4] block">
                Workout Log LCA
              </span>
              <h2 className="text-sm font-black text-white leading-tight">{targetPatientName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallPwa}
              className="px-2.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#06B6D4] border border-[#334155] text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
              title="Aggiungi a Schermata Home"
            >
              <Share className="w-3 h-3" />
              <span>Salva App</span>
            </button>

            {!effectiveSimMode && (
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut().catch(() => {});
                  setSessionUser(null);
                }}
                className="p-2 rounded-xl bg-[#0F172A] text-[#94A3B8] hover:text-rose-400 border border-[#334155]"
                title="Esci"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {showIosPwaTip && (
          <div className="max-w-md mx-auto mt-2 p-2.5 rounded-xl bg-[#0F172A] border border-[#06B6D4] text-[11px] text-white flex items-center justify-between">
            <span>
              📱 Per avere l'app sempre pronta: tocca <strong>Condividi</strong> nel browser e scegli{' '}
              <strong>"Aggiungi alla schermata Home"</strong>.
            </span>
            <button onClick={() => setShowIosPwaTip(false)} className="text-[#06B6D4] font-bold ml-2">
              OK
            </button>
          </div>
        )}
      </header>

      {/* CONTENUTO PRINCIPALE MOBILE */}
      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* SWITCHER A 2 TAB */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#1E293B] rounded-2xl border border-[#334155]">
          <button
            type="button"
            onClick={() => setActiveSection('log')}
            className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === 'log'
                ? 'bg-gradient-to-r from-[#0D9488] to-[#06B6D4] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{editingLogId ? 'Modifica Esercizio' : 'Seduta del Giorno'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('history')}
            className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === 'history'
                ? 'bg-gradient-to-r from-[#0D9488] to-[#06B6D4] text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Storico ({groupedByDay.sortedDays.length} gg)</span>
          </button>
        </div>

        {/* SEZIONE A: COMPILAZIONE PACCHETTO DI ESERCIZI DEL GIORNO */}
        {activeSection === 'log' && (
          <div className="space-y-4">
            <form
              onSubmit={handleSaveWorkoutPackage}
              className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5 space-y-4 shadow-xl"
            >
              {editingLogId && (
                <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
                    <Edit3 className="w-4 h-4" />
                    <span>Modifica Esercizio Selezionato</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 rounded-lg bg-[#0F172A] text-[#94A3B8] hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Annulla</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingLogId ? 'Modifica Esercizio' : 'Pacchetto Esercizi del Giorno'}
                  </h3>
                  <p className="text-[11px] text-[#94A3B8]">
                    Segna i carichi bilaterali o separati per gamba sinistra (SX) e destra (DX)
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#0F172A] border border-[#334155]">
                  {getCategoryIcon(selectedCategoryIcon, 'w-5 h-5')}
                </div>
              </div>

              {/* 1. SELEZIONE GIORNATA DELL'ALLENAMENTO */}
              <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-3">
                <label className="block text-xs font-extrabold text-[#06B6D4] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Giornata di Allenamento</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setWorkoutDate(toDateInputValue(new Date().toISOString()))}
                    className="text-[10px] text-[#0D9488] hover:underline font-extrabold"
                  >
                    Imposta su Oggi
                  </button>
                </label>
                <input
                  type="date"
                  required
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  className="w-full bg-[#1E293B] border border-[#334155] focus:border-[#06B6D4] rounded-xl py-2 px-3 text-xs font-mono font-bold text-white focus:outline-none"
                />
              </div>

              {/* 2. RICERCA / SELEZIONE ESERCIZIO CON AUTOCOMPLETAMENTO & RILEVAMENTO MONOPODALICO */}
              <div className="relative">
                <label className="block text-xs font-extrabold text-[#94A3B8] mb-1.5">
                  Esercizio da inserire nel Pacchetto
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#06B6D4] absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={exerciseQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExerciseQuery(val);
                      setSelectedCategoryIcon(getIconTypeFromExerciseName(val, selectedCategoryIcon));
                      setIsUnilateralMode(detectUnilateralFromName(val));
                      setShowSuggestions(true);
                    }}
                    placeholder="Cerca es: Bulgarian Split Squat, Leg Ext, Pressa..."
                    className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#06B6D4] rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-white placeholder-[#94A3B8] focus:outline-none"
                  />
                </div>

                {showSuggestions && (
                  <div className="mt-1.5 max-h-56 overflow-y-auto bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl divide-y divide-[#334155] z-20 relative">
                    {suggestions.map((item, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setExerciseQuery(item.name);
                          setSelectedCategoryIcon(item.icon || 'squat');
                          setIsUnilateralMode(Boolean(item.isUnilateral));
                          if (item.defaultTempo && !tempo) {
                            setTempo(item.defaultTempo);
                          }
                          setShowSuggestions(false);
                        }}
                        className="w-full px-3.5 py-2.5 text-left hover:bg-[#1E293B] flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-[#1E293B] border border-[#334155]">
                            {getCategoryIcon(item.icon)}
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.isUnilateral && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-950 text-[#06B6D4] border border-[#06B6D4]/40 font-mono">
                                  SX + DX
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#94A3B8]">{item.category}</div>
                          </div>
                        </div>
                        {item.defaultTempo && (
                          <span className="text-[10px] font-mono text-[#06B6D4] bg-[#1E293B] px-2 py-0.5 rounded border border-[#334155]">
                            {item.defaultTempo}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* SELETTORE ESPLICITO MODALITÀ CARICO: BILATERALE vs MONOPODALICO (SX + DX) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-[#94A3B8]">
                  Modalità Esecuzione & Rilevazione Carico
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#0F172A] rounded-2xl border border-[#334155]">
                  <button
                    type="button"
                    onClick={() => setIsUnilateralMode(false)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isUnilateralMode
                        ? 'bg-[#1E293B] text-white border border-[#06B6D4] shadow-sm'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Bilaterale (1 Carico)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUnilateralMode(true)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isUnilateralMode
                        ? 'bg-[#0D9488] text-white border border-[#06B6D4] shadow-sm'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    <span>Monopodalico (SX + DX)</span>
                  </button>
                </div>
              </div>

              {/* 3. SERIE (SETS), RIPETIZIONI (REPS) & CARICHI (BILATERALE O DOPPIO INPUT SX/DX) */}
              {!isUnilateralMode ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#94A3B8] mb-1">
                      Serie (Sets)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="20"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#06B6D4] rounded-2xl p-3 text-center text-base font-black text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-[#94A3B8] mb-1">
                      Ripetizioni
                    </label>
                    <input
                      type="text"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#06B6D4] rounded-2xl p-3 text-center text-base font-black text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-[#06B6D4] mb-1">
                      Carico (Kg) *
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="0"
                      placeholder="es. 60"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full bg-[#0F172A] border-2 border-[#0D9488] focus:border-[#06B6D4] rounded-2xl p-3 text-center text-base font-black text-white placeholder-[#94A3B8] focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-[#0F172A] p-3.5 rounded-2xl border border-[#334155]">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold text-[#94A3B8] mb-1">
                        Serie per Gamba
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="20"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] focus:border-[#06B6D4] rounded-xl p-2.5 text-center text-sm font-black text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-[#94A3B8] mb-1">
                        Ripetizioni per Gamba
                      </label>
                      <input
                        type="text"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        className="w-full bg-[#1E293B] border border-[#334155] focus:border-[#06B6D4] rounded-xl p-2.5 text-center text-sm font-black text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* DOPPIO CAMPO CARICO SEPARATO: GAMBA SINISTRA (SX) vs GAMBA DESTRA (DX) */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 rounded-2xl bg-[#1E293B] border-2 border-[#06B6D4]/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-[#06B6D4] uppercase tracking-wider">
                          🦵 Gamba SX (Kg)
                        </span>
                        {injuredSide.includes('sx') && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                            Operato
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        placeholder="Kg Gamba SX"
                        value={weightSxKg}
                        onChange={(e) => setWeightSxKg(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#06B6D4] rounded-xl p-2.5 text-center text-base font-black text-white font-mono focus:outline-none"
                      />
                    </div>

                    <div className="p-2.5 rounded-2xl bg-[#1E293B] border-2 border-[#0D9488] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-[#0D9488] uppercase tracking-wider">
                          🦵 Gamba DX (Kg)
                        </span>
                        {injuredSide.includes('dx') && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                            Operato
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        placeholder="Kg Gamba DX"
                        value={weightDxKg}
                        onChange={(e) => setWeightDxKg(e.target.value)}
                        className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#0D9488] rounded-xl p-2.5 text-center text-base font-black text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {liveLsiForm !== null && (
                    <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#1E293B] border border-[#334155] text-[11px]">
                      <span className="text-[#94A3B8] font-bold">Simmetria Carico SX vs DX (LSI):</span>
                      <strong
                        className={`font-mono font-black ${
                          liveLsiForm >= 90 ? 'text-[#06B6D4]' : 'text-amber-400'
                        }`}
                      >
                        {liveLsiForm}%
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {/* 4. VELOCITÀ / TEMPO & NOTE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#94A3B8] mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Velocità / Tempo (Opz.)</span>
                  </label>
                  <input
                    type="text"
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    placeholder="es. 3-0-1-0 o Esplosivo"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#94A3B8] mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Note / Dolore / RPE (Opz.)</span>
                  </label>
                  <input
                    type="text"
                    value={notesRpe}
                    onChange={(e) => setNotesRpe(e.target.value)}
                    placeholder="es. Nessun dolore (0/10)"
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-xl py-2 px-3 text-xs text-white"
                  />
                </div>
              </div>

              {/* PULSANTE PER AGGIUNGERE PIÙ ESERCIZI AL PACCHETTO DEL GIORNO */}
              {!editingLogId && (
                <button
                  type="button"
                  onClick={handleAddExerciseToPackage}
                  disabled={!isCurrentFormLoadValid()}
                  className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-40 text-[#06B6D4] border border-[#334155] font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Aggiungi un altro esercizio al Pacchetto del Giorno</span>
                </button>
              )}

              {/* RIEPILOGO PACCHETTO IN PREPARAZIONE */}
              {packageItems.length > 0 && !editingLogId && (
                <div className="bg-[#0F172A] border border-[#06B6D4]/40 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-[#06B6D4]">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4" />
                      <span>Pacchetto in preparazione ({packageItems.length} esercizi)</span>
                    </span>
                    <span className="font-mono text-[10px] text-[#94A3B8]">{workoutDate}</span>
                  </div>
                  <div className="divide-y divide-[#334155]">
                    {packageItems.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.exercise_name, 'w-3.5 h-3.5')}
                          <div>
                            <div className="font-bold text-white">{item.exercise_name}</div>
                            <div className="text-[10px] text-[#94A3B8] font-mono">
                              {item.sets} × {item.reps} •{' '}
                              {item.is_unilateral ? (
                                <span className="text-white font-bold">
                                  SX <strong className="text-[#06B6D4]">{item.weight_sx_kg} kg</strong> | DX{' '}
                                  <strong className="text-[#0D9488]">{item.weight_dx_kg} kg</strong>
                                </span>
                              ) : (
                                <strong className="text-white">{item.weight_kg} kg</strong>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromPackageDraft(idx)}
                          className="p-1 text-[#94A3B8] hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-2xl bg-teal-950 border border-[#0D9488] text-white text-xs font-extrabold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#06B6D4] shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {/* PULSANTE PRINCIPALE: SALVA PACCHETTO ALLENAMENTO DEL GIORNO */}
              <button
                type="submit"
                disabled={
                  saving ||
                  (!editingLogId && packageItems.length === 0 && !isCurrentFormLoadValid())
                }
                className="w-full py-4 bg-gradient-to-r from-[#0D9488] to-[#06B6D4] hover:opacity-95 disabled:opacity-40 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {saving
                    ? 'Salvataggio in corso...'
                    : editingLogId
                    ? 'Salva Modifica Esercizio'
                    : `Salva Pacchetto Allenamento (${
                        packageItems.length + (isCurrentFormLoadValid() ? 1 : 0)
                      } Esercizi)`}
                </span>
              </button>
            </form>

            {/* ANTEPRIMA DEGLI ESERCIZI GIÀ SALVATI NELLA GIORNATA SELEZIONATA */}
            {existingLogsForSelectedDate.length > 0 && !editingLogId && (
              <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0D9488]" />
                    <span>Già registrati nel pacchetto del {formatDayLabel(workoutDate)}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#0F172A] text-[#06B6D4] border border-[#334155] font-mono text-[10px] font-bold">
                    {existingLogsForSelectedDate.length} esercizi
                  </span>
                </div>
                <div className="space-y-1.5">
                  {existingLogsForSelectedDate.map((log, i) => (
                    <div
                      key={log.id || i}
                      className="bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-2 flex items-center justify-between text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedExerciseForProgression(log.exercise_name)}
                        className="flex items-center gap-2 text-left hover:text-[#06B6D4] cursor-pointer"
                      >
                        {getCategoryIcon(log.exercise_name, 'w-3.5 h-3.5')}
                        <span className="font-bold text-white underline decoration-dotted underline-offset-2">
                          {log.exercise_name}
                        </span>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#94A3B8]">{log.sets}×{log.reps}</span>
                        {log.is_unilateral ? (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <span className="px-1.5 py-0.5 rounded bg-[#1E293B] border border-[#06B6D4]/40 text-white font-black">
                              SX {log.weight_sx_kg}kg
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#1E293B] border border-[#0D9488]/40 text-white font-black">
                              DX {log.weight_dx_kg}kg
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono font-black text-white">{log.weight_kg} kg</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEditLog(log)}
                          className="p-1 text-[#06B6D4] hover:text-white"
                          title="Modifica"
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

        {/* SEZIONE B: STORICO PER GIORNATE & PROGRESSIONE PER ESERCIZIO */}
        {activeSection === 'history' && (
          <div className="space-y-4">
            {/* 1. SELETTORE GIORNATE DI ALLENAMENTO */}
            <div className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 space-y-3">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#06B6D4]" />
                  <span>Seleziona Giornata di Allenamento</span>
                </h3>
                <p className="text-[11px] text-[#94A3B8]">
                  Tocca una data per vedere il pacchetto di esercizi svolti quel giorno
                </p>
              </div>

              {groupedByDay.sortedDays.length === 0 ? (
                <div className="text-xs text-[#94A3B8] italic py-2">
                  Nessuna giornata ancora registrata.
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5">
                  {groupedByDay.sortedDays.map((dayKey) => {
                    const dayLogs = groupedByDay.map[dayKey] || [];
                    const isSelected = activeHistoryDay === dayKey;
                    return (
                      <button
                        type="button"
                        key={dayKey}
                        onClick={() => setSelectedHistoryDay(dayKey)}
                        className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0F172A] border-[#06B6D4] text-white shadow-md'
                            : 'bg-[#0F172A]/60 border-[#334155] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <div className="text-xs font-black">{formatDayLabel(dayKey)}</div>
                        <div className="text-[10px] font-mono text-[#06B6D4] mt-0.5">
                          📦 {dayLogs.length} {dayLogs.length === 1 ? 'esercizio' : 'esercizi'}
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setSelectedHistoryDay('ALL')}
                    className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                      activeHistoryDay === 'ALL'
                        ? 'bg-[#0F172A] border-[#06B6D4] text-white'
                        : 'bg-[#0F172A]/60 border-[#334155] text-[#94A3B8]'
                    }`}
                  >
                    <div className="text-xs font-black">Tutte le Giornate</div>
                    <div className="text-[10px] font-mono text-[#94A3B8] mt-0.5">
                      {workoutLogs.length} totali
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 2. PACCHETTO ESERCIZI DELLA GIORNATA SELEZIONATA */}
            {loadingLogs ? (
              <div className="p-8 text-center text-xs text-[#94A3B8]">Caricamento storico in corso...</div>
            ) : (
              (activeHistoryDay === 'ALL' ? groupedByDay.sortedDays : [activeHistoryDay])
                .filter(Boolean)
                .map((dayKey) => {
                  const dayLogs = groupedByDay.map[dayKey] || [];
                  if (dayLogs.length === 0) return null;

                  return (
                    <div
                      key={dayKey}
                      className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between border-b border-[#334155] pb-2.5">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#06B6D4] block">
                            Pacchetto Allenamento Giornaliero
                          </span>
                          <h4 className="text-sm font-black text-white">{formatDayLabel(dayKey)}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWorkoutDate(dayKey);
                            setActiveSection('log');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#06B6D4] border border-[#334155] text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Aggiungi a questa data</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {dayLogs.map((log, idx) => {
                          const lsiLoad = log.is_unilateral
                            ? calcLoadLsiPct(log.weight_sx_kg, log.weight_dx_kg)
                            : null;

                          return (
                            <div
                              key={log.id || idx}
                              className="bg-[#0F172A] border border-[#334155] rounded-2xl p-3.5 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedExerciseForProgression(log.exercise_name)}
                                  className="flex items-center gap-2.5 text-left group cursor-pointer"
                                >
                                  <div className="p-2 rounded-xl bg-[#1E293B] border border-[#334155] group-hover:border-[#06B6D4]">
                                    {getCategoryIcon(log.exercise_name)}
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-black text-white group-hover:text-[#06B6D4] flex items-center gap-1">
                                      <span className="underline decoration-[#06B6D4]/50 decoration-dotted underline-offset-4">
                                        {log.exercise_name}
                                      </span>
                                      <ChevronRight className="w-3.5 h-3.5 text-[#06B6D4]" />
                                    </h5>
                                    <span className="text-[10px] text-[#06B6D4] font-bold flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      <span>Vedi progressione nel tempo</span>
                                    </span>
                                  </div>
                                </button>

                                <div className="text-right shrink-0">
                                  {log.is_unilateral ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                                        <span className="px-2 py-0.5 rounded-lg bg-[#1E293B] border border-[#06B6D4]/50 text-white font-black">
                                          SX: {log.weight_sx_kg} kg
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg bg-[#1E293B] border border-[#0D9488] text-white font-black">
                                          DX: {log.weight_dx_kg} kg
                                        </span>
                                      </div>
                                      <div className="text-[10px] font-extrabold text-[#94A3B8] font-mono">
                                        {log.sets} serie × {log.reps} rip{' '}
                                        {lsiLoad !== null && (
                                          <span className="text-[#06B6D4] ml-1">• LSI {lsiLoad}%</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-base font-black text-white font-mono">
                                        {log.weight_kg} kg
                                      </div>
                                      <div className="text-[10px] font-extrabold text-[#94A3B8] font-mono">
                                        {log.sets} serie × {log.reps} rip
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#334155]/60 text-[11px]">
                                <div className="flex flex-wrap items-center gap-2">
                                  {log.tempo_speed && (
                                    <span className="px-2 py-0.5 rounded-lg bg-[#1E293B] border border-[#334155] text-[#06B6D4] font-mono text-[10px]">
                                      ⏱ {log.tempo_speed}
                                    </span>
                                  )}
                                  {log.clean_notes && (
                                    <span className="text-[#94A3B8] italic">"{log.clean_notes}"</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditLog(log)}
                                    className="px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-slate-700 text-[#06B6D4] border border-[#334155] text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Modifica</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 rounded-lg bg-[#1E293B] hover:bg-rose-950 text-[#94A3B8] hover:text-rose-400 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </main>

      {/* MODAL PROGRESSIONE NEL TEMPO DELL'ESERCIZIO CLICCATO (CON SUPPORTO SX vs DX) */}
      {selectedExerciseForProgression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0F172A] border border-[#334155]">
                  {getCategoryIcon(selectedExerciseForProgression, 'w-5 h-5')}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#06B6D4] block">
                    Progressione Carichi nel Tempo
                  </span>
                  <h3 className="text-base font-black text-white">
                    {selectedExerciseForProgression}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExerciseForProgression(null)}
                className="p-1.5 rounded-xl bg-[#0F172A] text-[#94A3B8] hover:text-white border border-[#334155] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {exerciseProgressionData.length === 0 ? (
              <p className="text-xs text-[#94A3B8] text-center py-4">Nessun dato trovato.</p>
            ) : (
              <>
                {(() => {
                  const hasUnilateral = exerciseProgressionData.some((d) => d.is_unilateral);
                  if (hasUnilateral) {
                    const lastEntry = exerciseProgressionData[exerciseProgressionData.length - 1];
                    const lsiLast = calcLoadLsiPct(lastEntry?.weight_sx_kg, lastEntry?.weight_dx_kg);
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#0F172A] border border-[#06B6D4]/50 rounded-2xl p-3 text-center">
                          <span className="text-[10px] text-[#06B6D4] font-bold block">Ultimo SX</span>
                          <span className="text-sm font-black text-white font-mono">
                            {lastEntry?.weight_sx_kg ?? 0} kg
                          </span>
                        </div>
                        <div className="bg-[#0F172A] border border-[#0D9488] rounded-2xl p-3 text-center">
                          <span className="text-[10px] text-[#0D9488] font-bold block">Ultimo DX</span>
                          <span className="text-sm font-black text-white font-mono">
                            {lastEntry?.weight_dx_kg ?? 0} kg
                          </span>
                        </div>
                        <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-3 text-center">
                          <span className="text-[10px] text-[#94A3B8] font-bold block">Simmetria LSI</span>
                          <span className="text-sm font-black text-white font-mono">
                            {lsiLast !== null ? `${lsiLast}%` : 'N/D'}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const firstKg = exerciseProgressionData[0]?.weight_kg || 0;
                  const lastKg = exerciseProgressionData[exerciseProgressionData.length - 1]?.weight_kg || 0;
                  const maxKg = Math.max(...exerciseProgressionData.map((d) => d.weight_kg || 0));
                  const deltaKg = +(lastKg - firstKg).toFixed(1);

                  return (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-3 text-center">
                        <span className="text-[10px] text-[#94A3B8] font-bold block">1ª Seduta</span>
                        <span className="text-sm font-black text-white font-mono">{firstKg} kg</span>
                      </div>
                      <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-3 text-center">
                        <span className="text-[10px] text-[#94A3B8] font-bold block">Picco Max</span>
                        <span className="text-sm font-black text-white font-mono">{maxKg} kg</span>
                      </div>
                      <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-3 text-center">
                        <span className="text-[10px] text-[#94A3B8] font-bold block">Evoluzione</span>
                        <span className="text-sm font-black font-mono text-[#06B6D4]">
                          {deltaKg > 0 ? `+${deltaKg} kg` : `${deltaKg} kg`}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* MICRO GRAFICO DI PROGRESSIONE A BARRE (DOPPIA BARRA SX/DX SE MONOPODALICO) */}
                <div className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 space-y-2">
                  <div className="text-[11px] font-bold text-white flex items-center justify-between">
                    <span>Andamento Carico (Kg) per Seduta</span>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-[#06B6D4]">■ SX</span>
                      <span className="text-[#0D9488]">■ DX</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2.5 h-32 pt-4 px-1 overflow-x-auto">
                    {exerciseProgressionData.map((d, i) => {
                      const maxVal = Math.max(
                        ...exerciseProgressionData.map((x) =>
                          Math.max(x.weight_kg || 0, x.weight_sx_kg || 0, x.weight_dx_kg || 0, 1)
                        ),
                        1
                      );

                      if (d.is_unilateral) {
                        const pctSx = Math.max(Math.round(((d.weight_sx_kg || 0) / maxVal) * 100), 12);
                        const pctDx = Math.max(Math.round(((d.weight_dx_kg || 0) / maxVal) * 100), 12);
                        return (
                          <div key={d.id || i} className="flex-1 min-w-[60px] flex flex-col items-center gap-1">
                            <span className="text-[9.5px] font-mono font-black text-white">
                              {d.weight_sx_kg}/{d.weight_dx_kg}kg
                            </span>
                            <div className="w-full bg-[#1E293B] rounded-t-lg h-20 flex items-end gap-1 p-1 border border-[#334155]">
                              <div
                                style={{ height: `${pctSx}%` }}
                                className="flex-1 bg-[#06B6D4] rounded-t transition-all"
                                title={`SX: ${d.weight_sx_kg} kg`}
                              />
                              <div
                                style={{ height: `${pctDx}%` }}
                                className="flex-1 bg-[#0D9488] rounded-t transition-all"
                                title={`DX: ${d.weight_dx_kg} kg`}
                              />
                            </div>
                            <span className="text-[9px] font-mono text-[#94A3B8]">
                              {new Date(d.created_at).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </span>
                          </div>
                        );
                      }

                      const pct = Math.max(Math.round(((d.weight_kg || 0) / maxVal) * 100), 15);
                      return (
                        <div key={d.id || i} className="flex-1 min-w-[44px] flex flex-col items-center gap-1">
                          <span className="text-[10px] font-mono font-black text-white">
                            {d.weight_kg}kg
                          </span>
                          <div className="w-full bg-[#1E293B] rounded-t-lg h-20 flex items-end overflow-hidden border border-[#334155] p-0.5">
                            <div
                              style={{ height: `${pct}%` }}
                              className="w-full bg-gradient-to-t from-[#0D9488] to-[#06B6D4] rounded-t-md transition-all"
                            />
                          </div>
                          <span className="text-[9px] font-mono text-[#94A3B8]">
                            {new Date(d.created_at).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LISTA CRONOLOGICA DELLE SEDUTE DI QUESTO ESERCIZIO */}
                <div className="space-y-1.5">
                  <div className="text-xs font-extrabold text-[#94A3B8]">
                    Storico Sedute — {selectedExerciseForProgression}
                  </div>
                  {exerciseProgressionData
                    .slice()
                    .reverse()
                    .map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-[#0F172A] border border-[#334155] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-white">
                            {formatDayLabel(toDateInputValue(item.created_at))}
                          </div>
                          <div className="text-[10px] text-[#94A3B8]">
                            {item.sets} serie × {item.reps} rip • {item.tempo_speed}
                          </div>
                        </div>
                        <div className="text-right">
                          {item.is_unilateral ? (
                            <div className="font-mono font-black text-white text-xs">
                              <span className="text-[#06B6D4]">SX {item.weight_sx_kg}kg</span> •{' '}
                              <span className="text-[#0D9488]">DX {item.weight_dx_kg}kg</span>
                            </div>
                          ) : (
                            <div className="font-mono font-black text-white text-sm">
                              {item.weight_kg} kg
                            </div>
                          )}
                          {item.clean_notes && (
                            <div className="text-[10px] text-[#94A3B8] italic truncate max-w-[140px]">
                              {item.clean_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
