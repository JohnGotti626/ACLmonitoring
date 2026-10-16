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
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import LogoN from './LogoN';

// CATALOGO PREDEFINITO ESERCIZI RIABILITAZIONE LCA CON ICONE RAPPRESENTATIVE PER CATEGORIA
export const EXERCISE_PRESETS = [
  { name: 'Back Squat Bilaterale', category: 'Squat & Accosciata', icon: 'squat', defaultTempo: '3-1-1-0' },
  { name: 'Front Squat', category: 'Squat & Accosciata', icon: 'squat', defaultTempo: '3-0-1-0' },
  { name: 'Goblet Squat', category: 'Squat & Accosciata', icon: 'squat', defaultTempo: '3-2-1-0' },
  { name: 'Box Squat', category: 'Squat & Accosciata', icon: 'squat', defaultTempo: '3-1-X-0' },
  { name: 'Bulgarian Split Squat', category: 'Affondi & Monopodalici', icon: 'lunge', defaultTempo: '3-1-1-0' },
  { name: 'Affondi Camminati (Walking Lunges)', category: 'Affondi & Monopodalici', icon: 'lunge', defaultTempo: '2-0-1-0' },
  { name: 'Step-Up su Box', category: 'Affondi & Monopodalici', icon: 'lunge', defaultTempo: '2-1-1-0' },
  { name: 'Single Leg Squat a Box', category: 'Affondi & Monopodalici', icon: 'lunge', defaultTempo: '3-1-1-0' },
  { name: 'Leg Extension Monopodalica', category: 'Isolamento Ginocchio', icon: 'knee', defaultTempo: '2-2-1-0' },
  { name: 'Leg Extension Isometrica 60°', category: 'Isolamento Ginocchio', icon: 'knee', defaultTempo: 'Iso 45s' },
  { name: 'Leg Curl Seduto / Prono', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: '3-1-1-0' },
  { name: 'Nordic Hamstring Curl', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: 'Eccentrico 4s' },
  { name: 'Romanian Deadlift (RDL) Monopodalico', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: '3-1-1-0' },
  { name: 'Hip Thrust Bilaterale / Mono', category: 'Catena Posteriore', icon: 'hamstring', defaultTempo: '2-2-1-0' },
  { name: 'Trap Bar Deadlift', category: 'Pressa & Tirate', icon: 'press', defaultTempo: 'Esplosivo' },
  { name: 'Leg Press 45° Monopodalica', category: 'Pressa & Tirate', icon: 'press', defaultTempo: '3-0-1-0' },
  { name: 'Leg Press Orizzontale Bilaterale', category: 'Pressa & Tirate', icon: 'press', defaultTempo: '2-0-1-0' },
  { name: 'Calf Raise Seduto (Soleo)', category: 'Polpaccio & Caviglia', icon: 'calf', defaultTempo: '2-2-1-0' },
  { name: 'Calf Raise in Piedi Monopodalico', category: 'Polpaccio & Caviglia', icon: 'calf', defaultTempo: '2-1-1-0' },
  { name: 'Drop Jump da Box 30cm', category: 'Pliometria & Reattività', icon: 'plyo', defaultTempo: 'Contatto <250ms' }
];

export function getCategoryIcon(iconType, className = 'w-4 h-4') {
  switch (iconType) {
    case 'squat':
      return <Dumbbell className={`${className} text-cyan-400`} />;
    case 'lunge':
      return <Footprints className={`${className} text-emerald-400`} />;
    case 'knee':
      return <Activity className={`${className} text-amber-400`} />;
    case 'hamstring':
      return <Flame className={`${className} text-rose-400`} />;
    case 'press':
      return <Zap className={`${className} text-purple-400`} />;
    case 'plyo':
      return <TrendingUp className={`${className} text-teal-400`} />;
    default:
      return <Dumbbell className={`${className} text-cyan-400`} />;
  }
}

export function toDateInputValue(isoString) {
  if (!isoString) return new Date().toISOString().split('T')[0];
  try {
    return new Date(isoString).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
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

  // Navigazione Interna Smartphone: 'log' (Segna Esercizio) | 'history' (Il Mio Storico)
  const [activeSection, setActiveSection] = useState('log');

  // Form 'Segna Esercizio' (e Modifica Esercizio esistente)
  const [editingLogId, setEditingLogId] = useState(null);
  const [workoutDate, setWorkoutDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exerciseQuery, setExerciseQuery] = useState('');
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState('squat');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sets, setSets] = useState('4');
  const [reps, setReps] = useState('8');
  const [weightKg, setWeightKg] = useState('');
  const [tempo, setTempo] = useState('');
  const [notesRpe, setNotesRpe] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Storico Allenamenti del Paziente
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Carica lo storico da Supabase ('workout_logs') + fallback sicuro sulla scheda paziente
  const fetchMyWorkoutLogs = async () => {
    setLoadingLogs(true);
    try {
      if (isSupabaseConfigured && targetPatientId) {
        const { data, error } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('patient_id', targetPatientId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          setWorkoutLogs(data);
          const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
          try {
            localStorage.setItem(localKey, JSON.stringify(data));
          } catch {}
          setLoadingLogs(false);
          return;
        }
      }

      // Fallback sui workout_logs salvati dentro l'oggetto patient o localStorage del paziente
      const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        setWorkoutLogs(JSON.parse(savedLocal));
      } else if (Array.isArray(patient?.workout_logs)) {
        setWorkoutLogs(patient.workout_logs);
      }
    } catch (err) {
      console.error('Errore caricamento workout_logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (effectiveSimMode || sessionUser || targetPatientId) {
      fetchMyWorkoutLogs();
    }
  }, [targetPatientId, sessionUser, effectiveSimMode]);

  // Suggerimenti autocompletamento: combina esercizi passati del paziente + catalogo predefinito
  const suggestions = useMemo(() => {
    const pastNames = Array.from(new Set(workoutLogs.map(l => l.exercise_name))).filter(Boolean);
    const pastItems = pastNames
      .filter(name => !EXERCISE_PRESETS.some(p => p.name.toLowerCase() === name.toLowerCase()))
      .map(name => ({ name, category: 'Recenti', icon: 'squat', defaultTempo: '' }));

    const all = [...pastItems, ...EXERCISE_PRESETS];
    if (!exerciseQuery.trim()) return all;
    const q = exerciseQuery.toLowerCase();
    return all.filter(item =>
      item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [exerciseQuery, workoutLogs]);

  // Gestione invio Magic Link (OTP via Email)
  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail.trim()) return;

    setSendingOtp(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/?portal=client${targetPatientId ? `&patientId=${targetPatientId}` : ''}`
        }
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setAuthError(err.message || 'Errore durante l\'invio del Magic Link.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Avvia la modifica di un esercizio già registrato
  const handleStartEditLog = (log) => {
    setEditingLogId(log.id);
    setWorkoutDate(toDateInputValue(log.created_at));
    setExerciseQuery(log.exercise_name || '');
    setSelectedCategoryIcon(log.category_icon || 'squat');
    setSets(String(log.sets || 4));
    setReps(String(log.reps || 8));
    setWeightKg(String(log.weight_kg ?? ''));
    setTempo(log.tempo_execution || log.tempo_speed || '');
    setNotesRpe(log.notes_rpe || log.notes || '');
    setActiveSection('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLogId(null);
    setWorkoutDate(new Date().toISOString().split('T')[0]);
    setExerciseQuery('');
    setWeightKg('');
    setTempo('');
    setNotesRpe('');
  };

  // Eliminazione di un esercizio dallo storico paziente
  const handleDeleteLog = async (logId) => {
    const updatedList = workoutLogs.filter(item => item.id !== logId);
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

  // Salvataggio Nuovo Esercizio o Aggiornamento Esercizio Esistente
  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    if (!exerciseQuery.trim() || weightKg === '') return;

    setSaving(true);

    // Costruisce il timestamp mantenendo l'ora corrente (o l'ora originale se in modifica) con la data scelta
    const now = new Date();
    let finalIsoDate = now.toISOString();
    if (workoutDate) {
      const [y, m, d] = workoutDate.split('-').map(Number);
      if (y && m && d) {
        const composed = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
        if (!isNaN(composed.getTime())) {
          finalIsoDate = composed.toISOString();
        }
      }
    }

    const entryData = {
      id: editingLogId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `wlog-${Date.now()}`),
      patient_id: targetPatientId || 'demo-patient',
      patient_email: sessionUser?.email || patient?.email || null,
      user_id: sessionUser?.id || null,
      exercise_name: exerciseQuery.trim(),
      category_icon: selectedCategoryIcon,
      sets: Number(sets) || 1,
      reps: String(reps || '1'),
      weight_kg: parseFloat(String(weightKg).replace(',', '.')) || 0,
      tempo_execution: tempo.trim() || 'Standard',
      notes_rpe: notesRpe.trim() || 'Nessun dolore',
      created_at: finalIsoDate
    };

    try {
      if (editingLogId) {
        // MODIFICA DI UN ESERCIZIO ESISTENTE
        if (isSupabaseConfigured && targetPatientId) {
          const { error } = await supabase
            .from('workout_logs')
            .update({
              exercise_name: entryData.exercise_name,
              category_icon: entryData.category_icon,
              sets: entryData.sets,
              reps: entryData.reps,
              weight_kg: entryData.weight_kg,
              tempo_execution: entryData.tempo_execution,
              notes_rpe: entryData.notes_rpe,
              created_at: entryData.created_at
            })
            .eq('id', editingLogId);

          if (error) {
            console.warn('Info update workout_logs (fallback attivo):', error.message);
          }
        }

        const updatedList = workoutLogs
          .map(item => (item.id === editingLogId ? { ...item, ...entryData } : item))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setWorkoutLogs(updatedList);
        const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
        try {
          localStorage.setItem(localKey, JSON.stringify(updatedList));
        } catch {}

        if (onNewLogSaved) {
          onNewLogSaved(entryData, updatedList);
        }

        setEditingLogId(null);
        setSaveSuccess('Modifica salvata e sincronizzata con successo!');
      } else {
        // INSERIMENTO NUOVO ESERCIZIO
        if (isSupabaseConfigured && targetPatientId) {
          const { error } = await supabase.from('workout_logs').insert([
            {
              id: entryData.id,
              patient_id: entryData.patient_id,
              patient_email: entryData.patient_email,
              user_id: entryData.user_id,
              exercise_name: entryData.exercise_name,
              category_icon: entryData.category_icon,
              sets: entryData.sets,
              reps: entryData.reps,
              weight_kg: entryData.weight_kg,
              tempo_execution: entryData.tempo_execution,
              notes_rpe: entryData.notes_rpe,
              created_at: entryData.created_at
            }
          ]);
          if (error) {
            console.warn('Info salvataggio tabella workout_logs (fallback attivo):', error.message);
          }
        }

        const updatedList = [entryData, ...workoutLogs].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setWorkoutLogs(updatedList);

        const localKey = `acl_workout_logs_${targetPatientId || 'default'}`;
        try {
          localStorage.setItem(localKey, JSON.stringify(updatedList));
        } catch {}

        if (onNewLogSaved) {
          onNewLogSaved(entryData, updatedList);
        }

        setSaveSuccess('Esercizio salvato e sincronizzato con il tuo fisioterapista!');
      }

      setWeightKg('');
      setNotesRpe('');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      console.error('Errore salvataggio esercizio:', err);
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

  // SCHERMATA 1: LOGIN MAGIC LINK PAZIENTE (Se non autenticato e non in modalità Simulazione Terapista)
  if (!effectiveSimMode && !sessionUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <LogoN className="w-16 h-16 rounded-2xl border border-cyan-500/40 shadow-lg" />
            <span className="px-3 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[11px] font-extrabold uppercase tracking-wider">
              Portale Paziente Mobile
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Diario Allenamento LCA
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Accedi senza password tramite <strong>Magic Link</strong>. Inserisci la tua email per ricevere il link di accesso diretto sul tuo smartphone.
            </p>
          </div>

          {magicLinkSent ? (
            <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-extrabold text-white">Controlla la tua Email!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Abbiamo inviato un link magico a <strong className="text-emerald-300">{authEmail}</strong>.<br />
                Tocca il pulsante nell'email per entrare subito nel tuo Diario Allenamento.
              </p>
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-xs text-cyan-400 underline font-bold pt-2"
              >
                Usa un altro indirizzo email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  La tua Email personale
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="nome.cognome@email.it"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none"
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
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{sendingOtp ? 'Invio Link in corso...' : 'Invia Magic Link via Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Pulsante Accesso Immediato se aperto dal Link Diretto del Paziente */}
          {patient && (
            <div className="pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() =>
                  setSessionUser({
                    id: `pat-user-${patient.id}`,
                    email: patient.email || `${patient.nome?.toLowerCase()}@paziente.it`,
                    user_metadata: { role: 'patient', patient_id: patient.id }
                  })
                }
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-cyan-500/30 transition-all cursor-pointer"
              >
                ⚡ Entra Subito come {patient.nome} {patient.cognome} (Link Personale)
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Connessione Protetta RLS • Privacy Paziente Garantita</span>
          </div>
        </div>
      </div>
    );
  }

  // SCHERMATA 2: INTERFACCIA PAZIENTE / SMARTPHONE ULTRA-INTUITIVA
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 font-sans">
      {/* BANNER MODALITÀ SIMULAZIONE TERAPISTA */}
      {(effectiveSimMode || onExitSimulation) && (
        <div className="bg-gradient-to-r from-amber-600/90 to-orange-600/90 text-white px-4 py-2.5 text-xs font-extrabold flex items-center justify-between shadow-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span>VISTA PORTALE PAZIENTE ({targetPatientName})</span>
          </div>
          {onExitSimulation && (
            <button
              onClick={onExitSimulation}
              className="px-3 py-1 bg-slate-950/90 hover:bg-slate-900 text-amber-300 rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Torna a Vista Terapista</span>
            </button>
          )}
        </div>
      )}

      {/* TOP MOBILE BAR */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LogoN className="w-10 h-10 rounded-xl border border-cyan-500/30" />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                Workout Log LCA
              </span>
              <h2 className="text-sm font-black text-white leading-tight">
                {targetPatientName}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallPwa}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
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
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400"
                title="Esci"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* SUGGERIMENTO INSTALLAZIONE PWA SU IPHONE / ANDROID */}
        {showIosPwaTip && (
          <div className="max-w-md mx-auto mt-2 p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-[11px] text-cyan-200 flex items-center justify-between">
            <span>
              📱 Per avere l'app sempre pronta: tocca <strong>Condividi</strong> nel browser e scegli <strong>"Aggiungi alla schermata Home"</strong>.
            </span>
            <button onClick={() => setShowIosPwaTip(false)} className="text-cyan-400 font-bold ml-2">OK</button>
          </div>
        )}
      </header>

      {/* CONTENUTO PRINCIPALE MOBILE (MAX-W-MD CENTRATO) */}
      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* SWITCHER A 2 GRANDI TAB: A) SEGNA ESERCIZIO | B) IL MIO STORICO */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-900 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSection('log')}
            className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === 'log'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{editingLogId ? 'Modifica Esercizio' : 'Segna Esercizio'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('history')}
            className={`py-3 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === 'history'
                ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Il Mio Storico ({workoutLogs.length})</span>
          </button>
        </div>

        {/* SEZIONE A: SEGNA ESERCIZIO (O MODIFICA ESERCIZIO) */}
        {activeSection === 'log' && (
          <form onSubmit={handleSaveWorkout} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            {editingLogId && (
              <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-300">
                  <Edit3 className="w-4 h-4" />
                  <span>Modalità Modifica Esercizio attiva</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Annulla</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {editingLogId ? 'Modifica Rilevazione Carico' : 'Nuova Rilevazione Carico'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Data impostata su oggi automaticamente (modificabile in qualsiasi momento)
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800">
                {getCategoryIcon(selectedCategoryIcon, 'w-5 h-5')}
              </div>
            </div>

            {/* DATA SEDUTA (AUTOMATICA SU OGGI MA MODIFICABILE NEL TEMPO) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Data Seduta Allenamento</span>
                </span>
                <button
                  type="button"
                  onClick={() => setWorkoutDate(new Date().toISOString().split('T')[0])}
                  className="text-[10px] text-cyan-400 hover:underline font-bold"
                >
                  Imposta Oggi
                </button>
              </label>
              <input
                type="date"
                required
                value={workoutDate}
                onChange={(e) => setWorkoutDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-xs font-mono font-bold text-white focus:outline-none"
              />
            </div>

            {/* 1. RICERCA / SELEZIONE ESERCIZIO CON AUTOCOMPLETAMENTO & ICONE */}
            <div className="relative">
              <label className="block text-xs font-extrabold text-slate-300 mb-1.5">
                1. Esercizio Svolto
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={exerciseQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setExerciseQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Cerca o scrivi es: Squat, Leg Extension, Pressa..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* MENU A TENDINA AUTOCOMPLETAMENTO CON ICONE CATEGORIA */}
              {showSuggestions && (
                <div className="mt-1.5 max-h-52 overflow-y-auto bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl divide-y divide-slate-800/80 z-20 relative">
                  {suggestions.map((item, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setExerciseQuery(item.name);
                        setSelectedCategoryIcon(item.icon || 'squat');
                        if (item.defaultTempo && !tempo) {
                          setTempo(item.defaultTempo);
                        }
                        setShowSuggestions(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-slate-900 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                          {getCategoryIcon(item.icon)}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-white">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.category}</div>
                        </div>
                      </div>
                      {item.defaultTempo && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/20">
                          {item.defaultTempo}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* CHIP RAPIDI CATEGORIA */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'squat', label: 'Squat' },
                { id: 'knee', label: 'Leg Ext' },
                { id: 'press', label: 'Pressa' },
                { id: 'lunge', label: 'Affondi' },
                { id: 'hamstring', label: 'Flessori' },
                { id: 'plyo', label: 'Salto/Plio' }
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryIcon(cat.id);
                    const preset = EXERCISE_PRESETS.find(p => p.icon === cat.id);
                    if (preset && !exerciseQuery) {
                      setExerciseQuery(preset.name);
                      setTempo(preset.defaultTempo);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 border transition-all cursor-pointer ${
                    selectedCategoryIcon === cat.id
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {getCategoryIcon(cat.id, 'w-3 h-3')}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* 2. SERIE (SETS), RIPETIZIONI (REPS), CARICO (KG) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Serie (Sets)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="20"
                  required
                  value={sets}
                  onChange={(e) => setSets(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl p-3 text-center text-base font-black text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1">
                  Ripetizioni
                </label>
                <input
                  type="text"
                  required
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl p-3 text-center text-base font-black text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-emerald-400 mb-1">
                  Carico (Kg) *
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  required
                  placeholder="es. 60"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-emerald-950/30 border-2 border-emerald-500/60 focus:border-emerald-400 rounded-2xl p-3 text-center text-base font-black text-emerald-300 placeholder-emerald-700 focus:outline-none"
                />
              </div>
            </div>

            {/* 3. CAMPO VELOCITÀ / TEMPO DI ESECUZIONE (OPZIONALE) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Velocità / Tempo Esecuzione (Opzionale)</span>
                </span>
              </label>
              <input
                type="text"
                value={tempo}
                onChange={(e) => setTempo(e.target.value)}
                placeholder="es. '3-0-1-0', 'Esplosivo', '0.65 m/s' o 'Eccentrica lenta'"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
              />
              <div className="flex gap-1.5 mt-1.5">
                {['3-0-1-0', '3-2-1-0', 'Esplosivo', 'Controllato'].map((presetTempo) => (
                  <button
                    type="button"
                    key={presetTempo}
                    onClick={() => setTempo(presetTempo)}
                    className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40"
                  >
                    {presetTempo}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. CAMPO NOTE / RPE / DOLORE (OPZIONALE) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Note / RPE / Sensazioni Ginocchio (Opzionale)</span>
              </label>
              <input
                type="text"
                value={notesRpe}
                onChange={(e) => setNotesRpe(e.target.value)}
                placeholder="es. 'Nessun dolore (VAS 0/10)', 'Fatica RPE 8/10'"
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl py-2.5 px-3.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['Nessun dolore (0/10)', 'Fatica RPE 7/10', 'Fatica RPE 8/10', 'Lieve fastidio anteriore'].map((presetNote) => (
                  <button
                    type="button"
                    key={presetNote}
                    onClick={() => setNotesRpe(presetNote)}
                    className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40"
                  >
                    {presetNote}
                  </button>
                ))}
              </div>
            </div>

            {/* FEEDBACK DI CONFERMA SALVATAGGIO */}
            {saveSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-extrabold flex items-center justify-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {/* PULSANTE GRANDE 'SALVA ESERCIZIO' */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>
                {saving
                  ? 'Salvataggio in corso...'
                  : editingLogId
                  ? 'Salva Modifiche Esercizio'
                  : 'Salva Esercizio'}
              </span>
            </button>
          </form>
        )}

        {/* SEZIONE B: IL MIO STORICO CON PROGRESSIONE CARICHI E MODIFICA IN QUALSIASI MOMENTO */}
        {activeSection === 'history' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white">Cronologia & Progressione Carichi</h3>
                <p className="text-[11px] text-slate-400">Tocca "Modifica" su qualsiasi esercizio per correggerlo</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono text-xs font-black">
                {workoutLogs.length} Serie
              </span>
            </div>

            {loadingLogs ? (
              <div className="p-8 text-center text-xs text-slate-400">Caricamento storico in corso...</div>
            ) : workoutLogs.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
                <Dumbbell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">Nessun esercizio ancora registrato</p>
                <p className="text-[11px] text-slate-500">
                  Usa la scheda "Segna Esercizio" per salvare il tuo primo carico di lavoro.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {workoutLogs.map((log, idx) => {
                  const olderSameExercise = workoutLogs
                    .slice(idx + 1)
                    .find(old => old.exercise_name?.toLowerCase() === log.exercise_name?.toLowerCase());
                  const diffKg = olderSameExercise
                    ? Number(log.weight_kg) - Number(olderSameExercise.weight_kg)
                    : null;

                  return (
                    <div
                      key={log.id || idx}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5 shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                            {getCategoryIcon(log.category_icon)}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white leading-snug">
                              {log.exercise_name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(log.created_at).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base font-black text-emerald-400 font-mono">
                            {log.weight_kg} kg
                          </div>
                          <div className="text-[10px] font-extrabold text-slate-300">
                            {log.sets} serie × {log.reps} rip
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                        <div className="flex flex-wrap items-center gap-2">
                          {(log.tempo_execution || log.tempo_speed) && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[10px]">
                              ⏱ {log.tempo_execution || log.tempo_speed}
                            </span>
                          )}
                          {(log.notes_rpe || log.notes) && (
                            <span className="text-slate-300 italic">
                              "{log.notes_rpe || log.notes}"
                            </span>
                          )}
                        </div>

                        {diffKg !== null && diffKg !== 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-extrabold ${
                              diffKg > 0
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {diffKg > 0 ? `+${diffKg} kg vs prec.` : `${diffKg} kg`}
                          </span>
                        )}
                      </div>

                      {/* PULSANTI MODIFICA ED ELIMINA PER IL PAZIENTE */}
                      <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-slate-800/50">
                        <button
                          type="button"
                          onClick={() => handleStartEditLog(log)}
                          className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Modifica</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLog(log.id)}
                          className="px-2.5 py-1 rounded-xl bg-slate-950 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Elimina</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
