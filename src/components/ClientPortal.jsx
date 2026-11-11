import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  ChevronRight,
  Repeat,
  Route,
  Sparkles
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import LogoN from './LogoN';
import CardioBuilder, {
  isCardioBlockValid,
  buildCardioSessionPayload,
  formatCardioBlockToWorkoutRow,
  parseCardioLogFromWorkoutRow
} from './CardioBuilder';

// ============================================================================
// GAMIFICATION CONSTANTS & COMPONENTS (ISOLATED TO PATIENT VIEW ONLY)
// ============================================================================

export const WELCOME_MOTIVATIONAL_QUOTES = [
  'Daje tutta uomo!',
  'Altro giorno, altra leg extension...',
  'Forza e coraggio, il ginocchio ringrazia!'
];

export const SUCCESS_ACTION_PHRASES = [
  'TOP!!',
  'DAJE',
  "DI PIU'!!",
  'ADOSS!',
  'ME PARI ER CR7'
];

export const SUCCESS_DYNAMIC_EMOJIS = ['💪', '🔥', '🐐', '⚡', '🦁'];

/**
 * WelcomeMotivationalOverlay
 * Conditionally rendered overlay that appears when the patient first loads the Patient View.
 * Picks a random motivational quote, shows an animated cartoon lifter illustration/GIF placeholder,
 * and smoothly fades out + unmounts after exactly 5 seconds (5000ms).
 *
 * Framer Motion suggestion:
 * Wrap with <AnimatePresence> and replace the root <div> with:
 * <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
 */
export function WelcomeMotivationalOverlay({ onComplete, customGifUrl = null }) {
  const [quote] = useState(
    () =>
      WELCOME_MOTIVATIONAL_QUOTES[
        Math.floor(Math.random() * WELCOME_MOTIVATIONAL_QUOTES.length)
      ]
  );
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start smooth fade-out animation at 4.4s and unmount at 5.0s (5000ms total)
    const fadeTimer = setTimeout(() => {
      setIsExiting(true);
    }, 4400);

    const unmountTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-5 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500 ${
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div
        className={`w-full max-w-sm bg-white border-2 border-stone-200 rounded-3xl p-7 shadow-2xl text-center space-y-5 transform transition-all duration-500 ${
          isExiting ? 'scale-95 translate-y-2' : 'scale-100 translate-y-0'
        }`}
      >
        {/* Top pill badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span>Check-In Riabilitazione LCA</span>
        </div>

        {/* Animated GIF / Lottie Placeholder: Cartoon Stickman/Athlete struggling to lift a heavy barbell */}
        <div className="relative mx-auto w-44 h-44 rounded-3xl bg-[#faf9f6] border-2 border-stone-200 flex flex-col items-center justify-center overflow-hidden shadow-inner p-3">
          {customGifUrl ? (
            <img
              src={customGifUrl}
              alt="Motivational workout animation"
              className="w-full h-full object-contain rounded-2xl"
            />
          ) : (
            <div className="flex flex-col items-center justify-center">
              {/* Animated SVG Stickman / Cartoon Lifter struggling with a heavy barbell */}
              <svg
                viewBox="0 0 160 140"
                className="w-32 h-28 overflow-visible"
                aria-label="Cartoon lifter struggling with weight"
              >
                {/* Sweat drops */}
                <circle
                  cx="52"
                  cy="38"
                  r="3"
                  className="fill-blue-500 animate-ping"
                />
                <circle
                  cx="108"
                  cy="36"
                  r="2.5"
                  className="fill-blue-500 animate-ping"
                />

                {/* Animated Barbell + Plates group (bouncing/shaking with effort) */}
                <g className="animate-bounce">
                  {/* Barbell shaft (slightly bent from heavy weight) */}
                  <path
                    d="M 18 36 Q 80 26 142 36"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Left heavy plates */}
                  <rect x="10" y="18" width="10" height="36" rx="4" fill="#dc2626" />
                  <rect x="22" y="22" width="7" height="28" rx="3" fill="#2563eb" />
                  {/* Right heavy plates */}
                  <rect x="140" y="18" width="10" height="36" rx="4" fill="#dc2626" />
                  <rect x="131" y="22" width="7" height="28" rx="3" fill="#2563eb" />

                  {/* Hands gripping bar */}
                  <circle cx="52" cy="33" r="4.5" fill="#f59e0b" />
                  <circle cx="108" cy="33" r="4.5" fill="#f59e0b" />
                </g>

                {/* Head */}
                <circle
                  cx="80"
                  cy="54"
                  r="14"
                  fill="#fef3c7"
                  stroke="#0f172a"
                  strokeWidth="3.5"
                />
                {/* Headband */}
                <path d="M 66 49 L 94 49" stroke="#dc2626" strokeWidth="4.5" strokeLinecap="round" />
                {/* Determined squinting eyes */}
                <path d="M 73 53 L 77 55 L 73 57" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 87 53 L 83 55 L 87 57" fill="none" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
                {/* Gritted teeth mouth */}
                <rect x="74" y="60" width="12" height="4.5" rx="2" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />

                {/* Arms straining upward */}
                <path
                  d="M 68 72 L 52 35 M 92 72 L 108 35"
                  stroke="#0f172a"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />

                {/* Torso */}
                <path
                  d="M 80 68 L 80 100"
                  stroke="#2563eb"
                  strokeWidth="9"
                  strokeLinecap="round"
                />

                {/* Squatting Legs with Knee Brace on Right Knee */}
                <path
                  d="M 78 100 L 60 114 L 64 132"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 82 100 L 100 114 L 96 132"
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Teal Knee Brace highlight */}
                <circle cx="100" cy="114" r="5" fill="#0d9488" />
              </svg>
              <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-slate-500 mt-1">
                GIF / Lottie Rehab Mode 💪
              </span>
            </div>
          )}
        </div>

        {/* Motivational Quote */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
            &ldquo;{quote}&rdquo;
          </h2>
          <p className="text-xs font-bold text-slate-600">
            Registra i tuoi carichi con precisione: ogni serie conta per il Return to Sport!
          </p>
        </div>

        {/* 5-second visual progress indicator & quick skip */}
        <div className="space-y-2 pt-1">
          <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-[4800ms] ease-linear"
              style={{ width: isExiting ? '100%' : '95%' }}
            />
          </div>
          <button
            type="button"
            onClick={onComplete}
            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 uppercase tracking-wider cursor-pointer"
          >
            Inizia Subito →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * SuccessActionBanner
 * Energetic 2-second pop-up toast triggered whenever the patient saves or confirms an exercise block.
 *
 * Framer Motion suggestion:
 * Wrap with <AnimatePresence> and use:
 * <motion.div initial={{ opacity: 0, y: -30, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
 */
export function SuccessActionBanner({ toast }) {
  if (!toast) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 w-full max-w-xs sm:max-w-sm">
      <div className="bg-slate-900 text-white border-2 border-amber-400 rounded-3xl px-5 py-3.5 shadow-2xl flex items-center justify-center gap-3 animate-bounce">
        <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="energy">
          {toast.emoji}
        </span>
        <div className="text-left">
          <div className="text-lg sm:text-xl font-black tracking-tight text-amber-300 leading-none">
            {toast.phrase}
          </div>
          {toast.subtitle && (
            <div className="text-[11px] font-extrabold text-stone-200 mt-0.5">
              {toast.subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CATALOGO PREDEFINITO ESERCIZI RIABILITAZIONE LCA CON FLAG MONOPODALICO
// ============================================================================
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
  if (q.startsWith('[cardio') || q.includes('corsa') || q.includes('navett') || q.includes('bike')) return 'cardio';
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
  const iconType = ['squat', 'lunge', 'knee', 'hamstring', 'press', 'plyo', 'calf', 'cardio'].includes(iconTypeOrName)
    ? iconTypeOrName
    : getIconTypeFromExerciseName(iconTypeOrName);

  switch (iconType) {
    case 'cardio':
      return <Flame className={`${className} text-teal-600`} />;
    case 'squat':
      return <Dumbbell className={`${className} text-blue-600`} />;
    case 'lunge':
      return <Footprints className={`${className} text-teal-700`} />;
    case 'knee':
      return <Activity className={`${className} text-amber-600`} />;
    case 'hamstring':
      return <Flame className={`${className} text-rose-600`} />;
    case 'press':
      return <Zap className={`${className} text-indigo-600`} />;
    case 'plyo':
      return <TrendingUp className={`${className} text-blue-600`} />;
    default:
      return <Dumbbell className={`${className} text-blue-600`} />;
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

  // GAMIFICATION 1: Welcome Motivational Overlay (5 seconds auto-dismiss on page load)
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(true);

  // GAMIFICATION 2: 2-Second Energetic Success Toast Banner
  const [successToast, setSuccessToast] = useState(null);
  const toastTimerRef = useRef(null);

  const triggerSuccessBanner = useCallback((customSubtitle = '') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const randomPhrase =
      SUCCESS_ACTION_PHRASES[Math.floor(Math.random() * SUCCESS_ACTION_PHRASES.length)];
    const randomEmoji =
      SUCCESS_DYNAMIC_EMOJIS[Math.floor(Math.random() * SUCCESS_DYNAMIC_EMOJIS.length)];

    setSuccessToast({
      id: Date.now(),
      phrase: randomPhrase,
      emoji: randomEmoji,
      subtitle: customSubtitle
    });

    toastTimerRef.current = setTimeout(() => {
      setSuccessToast(null);
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

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

  // Stato Dinamico Multi-Blocco Cardio per la seduta corrente
  const [cardioBlocks, setCardioBlocks] = useState([]);

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
    const pastNames = Array.from(new Set(workoutLogs.map((l) => l.exercise_name))).filter(
      (n) => n && !n.startsWith('[CARDIO')
    );
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

  const validCardioBlocksCount = useMemo(
    () => cardioBlocks.filter(isCardioBlockValid).length,
    [cardioBlocks]
  );

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

  // Aggiunge l'esercizio compilato al "Pacchetto del Giorno" + mostra il Success Banner da 2s
  const handleAddExerciseToPackage = () => {
    if (!isCurrentFormLoadValid()) return;
    const newItem = buildCurrentExerciseEntry();
    setPackageItems((prev) => [...prev, newItem]);
    resetExerciseFields();
    triggerSuccessBanner(`${newItem.exercise_name} aggiunto!`);
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

  // SALVATAGGIO PACCHETTO DI ESERCIZI + BLOCCHI CARDIO DEL GIORNO (o Modifica singolo esercizio)
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
        triggerSuccessBanner('Esercizio aggiornato!');
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

    // Costruisce eventuali blocchi Cardio multipli
    const selectedDateIso = buildIsoForSelectedDate();
    const patientEmailVal = sessionUser?.email || patient?.email || null;
    const cardioPayload = buildCardioSessionPayload({
      patientId: String(targetPatientId || 'demo-patient'),
      patientEmail: patientEmailVal,
      sessionDate: workoutDate,
      blocks: cardioBlocks
    });

    const cardioWorkoutRows = cardioPayload.cardio_blocks_jsonb.map((b) =>
      normalizeWorkoutLog(
        formatCardioBlockToWorkoutRow(b, {
          patientId: String(targetPatientId || 'demo-patient'),
          patientEmail: patientEmailVal,
          createdAtISO: selectedDateIso
        })
      )
    );

    const allItemsToSave = [...itemsToSave, ...cardioWorkoutRows];
    if (allItemsToSave.length === 0) return;

    setSaving(true);
    try {
      // 1. Se ci sono blocchi cardio e la tabella `cardio_logs` è attiva su Supabase, inseriscili
      if (isSupabaseConfigured && targetPatientId && cardioPayload.cardio_logs_rows.length > 0) {
        try {
          await supabase.from('cardio_logs').insert(cardioPayload.cardio_logs_rows);
        } catch (_) {
          // Fallback automatico su workout_logs
        }
      }

      // 2. Inserimento unificato su `workout_logs` (forza + blocchi cardio)
      const dbPayloads = allItemsToSave.map((item) => ({
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
      setCardioBlocks([]);
      resetExerciseFields();
      setSelectedHistoryDay(workoutDate);
      triggerSuccessBanner(`${insertedRows.length} blocchi registrati!`);
      setSaveSuccess(
        `Sessione salvata (${insertedRows.length} voci registrate per il ${formatDayLabel(workoutDate)})!`
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
  const totalDraftCount =
    packageItems.length + (isCurrentFormLoadValid() ? 1 : 0) + validCardioBlocksCount;

  // SCHERMATA 1: LOGIN MAGIC LINK PAZIENTE (Mostrata solo se non c'è né sessione né patientId/token nel Magic Link)
  if (!effectiveSimMode && !sessionUser && !targetPatientId) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-slate-900 flex flex-col justify-center items-center p-4 font-sans">
        {showWelcomeOverlay && (
          <WelcomeMotivationalOverlay onComplete={() => setShowWelcomeOverlay(false)} />
        )}

        <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <LogoN className="w-16 h-16 rounded-2xl border border-stone-200 shadow-md" />
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-black uppercase tracking-wider">
              Portale Paziente Mobile
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Diario Allenamento LCA
            </h1>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              Accedi senza password tramite <strong>Magic Link</strong>. Inserisci la tua email per ricevere il link di accesso diretto sul tuo smartphone.
            </p>
          </div>

          {magicLinkSent ? (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-black text-slate-900">Controlla la tua Email!</h3>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                Abbiamo inviato un link magico a <strong className="text-slate-900">{authEmail}</strong>.<br />
                Tocca il pulsante nell&apos;email per entrare subito nel tuo Diario Allenamento.
              </p>
              <button
                type="button"
                onClick={() => setMagicLinkSent(false)}
                className="text-xs text-blue-600 underline font-extrabold pt-2 cursor-pointer"
              >
                Usa un altro indirizzo email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                  La tua Email personale
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="nome.cognome@email.it"
                    className="w-full bg-[#faf9f6] border border-stone-300 focus:border-blue-600 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={sendingOtp}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{sendingOtp ? 'Invio Link in corso...' : 'Invia Magic Link via Email'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {patient && (
            <div className="pt-4 border-t border-stone-200 text-center">
              <button
                type="button"
                onClick={() =>
                  setSessionUser({
                    id: `pat-user-${patient.id}`,
                    email: patient.email || `${patient.nome?.toLowerCase()}@paziente.it`,
                    user_metadata: { role: 'patient', patient_id: patient.id }
                  })
                }
                className="w-full py-2.5 bg-[#f4f3ef] hover:bg-stone-200/80 text-blue-700 font-extrabold text-xs rounded-xl border border-stone-300 transition-all cursor-pointer"
              >
                ⚡ Entra Subito come {patient.nome} {patient.cognome} (Link Personale)
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 font-bold pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Connessione Protetta RLS • Privacy Paziente Garantita</span>
          </div>
        </div>
      </div>
    );
  }

  // SCHERMATA 2: INTERFACCIA PAZIENTE / SMARTPHONE (EDITORIAL LIGHT THEME + GAMIFICATION)
  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 pb-24 font-sans">
      {/* GAMIFICATION 1: WELCOME MOTIVATIONAL OVERLAY (5s auto-dismiss) */}
      {showWelcomeOverlay && (
        <WelcomeMotivationalOverlay onComplete={() => setShowWelcomeOverlay(false)} />
      )}

      {/* GAMIFICATION 2: 2-SECOND ENERGETIC SUCCESS TOAST BANNER */}
      <SuccessActionBanner toast={successToast} />

      {/* BANNER MODALITÀ SIMULAZIONE TERAPISTA */}
      {(effectiveSimMode || onExitSimulation) && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-black flex items-center justify-between shadow-xs sticky top-0 z-40 border-b border-amber-600/30">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            <span>VISTA PORTALE PAZIENTE ({targetPatientName})</span>
          </div>
          {onExitSimulation && (
            <button
              onClick={onExitSimulation}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
              <span>Torna a Vista Terapista</span>
            </button>
          )}
        </div>
      )}

      {/* TOP MOBILE BAR (Warm contrasting shade bg-[#f4f3ef] + border-stone-200) */}
      <header className="bg-[#f4f3ef]/95 backdrop-blur-md border-b border-stone-200 px-4 py-3.5 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoN className="w-10 h-10 rounded-2xl border border-stone-200 shadow-xs" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                Workout Log LCA
              </span>
              <h2 className="text-base font-black text-slate-900 leading-tight">{targetPatientName}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInstallPwa}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-blue-700 border border-stone-200 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Aggiungi a Schermata Home"
            >
              <Share className="w-3.5 h-3.5" />
              <span>Salva App</span>
            </button>

            {!effectiveSimMode && (
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut().catch(() => {});
                  setSessionUser(null);
                }}
                className="p-2 rounded-xl bg-white text-slate-600 hover:text-red-600 border border-stone-200 shadow-2xs cursor-pointer"
                title="Esci"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {showIosPwaTip && (
          <div className="max-w-md mx-auto mt-2 p-3 rounded-2xl bg-white border border-blue-200 text-xs text-slate-800 font-bold flex items-center justify-between shadow-sm">
            <span>
              📱 Per avere l&apos;app sempre pronta: tocca <strong>Condividi</strong> nel browser e scegli{' '}
              <strong>&ldquo;Aggiungi alla schermata Home&rdquo;</strong>.
            </span>
            <button
              onClick={() => setShowIosPwaTip(false)}
              className="text-blue-600 font-black ml-2 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}
      </header>

      {/* CONTENUTO PRINCIPALE MOBILE */}
      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* SWITCHER A 2 TAB */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f4f3ef] rounded-2xl border border-stone-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSection('log')}
            className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === 'log'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{editingLogId ? 'Modifica Esercizio' : 'Seduta del Giorno'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('history')}
            className={`py-3 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSection === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Storico ({groupedByDay.sortedDays.length} gg)</span>
          </button>
        </div>

        {/* SEZIONE A: COMPILAZIONE PACCHETTO DI ESERCIZI DEL GIORNO */}
        {activeSection === 'log' && (
          <div className="space-y-5">
            <form
              onSubmit={handleSaveWorkoutPackage}
              className="bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-md"
            >
              {editingLogId && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                    <Edit3 className="w-4 h-4 text-amber-600" />
                    <span>Modifica Esercizio Selezionato</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-2.5 py-1 rounded-xl bg-white text-slate-700 hover:text-slate-900 border border-stone-200 text-[11px] font-extrabold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Annulla</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-stone-200 pb-3.5">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {editingLogId ? 'Modifica Esercizio' : 'Pacchetto Esercizi del Giorno'}
                  </h3>
                  <p className="text-xs text-slate-600 font-bold">
                    Segna i carichi (SX/DX) e i blocchi cardio svolti nella seduta
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                  {getCategoryIcon(selectedCategoryIcon, 'w-5 h-5')}
                </div>
              </div>

              {/* 1. SELEZIONE GIORNATA DELL'ALLENAMENTO */}
              <div className="bg-[#faf9f6] border border-stone-200 rounded-2xl p-3.5">
                <label className="block text-xs font-black text-slate-900 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Giornata di Allenamento</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setWorkoutDate(toDateInputValue(new Date().toISOString()))}
                    className="text-[11px] text-blue-600 hover:underline font-black cursor-pointer"
                  >
                    Imposta su Oggi
                  </button>
                </label>
                <input
                  type="date"
                  required
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  className="w-full bg-white border border-stone-200 focus:border-blue-600 rounded-xl py-2.5 px-3 text-xs font-mono font-black text-slate-900 focus:outline-none"
                />
              </div>

              {/* 2. RICERCA / SELEZIONE ESERCIZIO CON AUTOCOMPLETAMENTO & RILEVAMENTO MONOPODALICO */}
              <div className="relative">
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  Esercizio Forza / Riabilitazione (Opzionale se solo Cardio)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-blue-600 absolute left-3.5 top-3.5" />
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
                    className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-2xl py-3 pl-10 pr-4 text-sm font-extrabold text-slate-900 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                {showSuggestions && (
                  <div className="mt-1.5 max-h-56 overflow-y-auto bg-white border border-stone-200 rounded-2xl shadow-xl divide-y divide-stone-100 z-20 relative">
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
                        className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/50 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-xl bg-[#faf9f6] border border-stone-200">
                            {getCategoryIcon(item.icon)}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span>{item.name}</span>
                              {item.isUnilateral && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 font-mono font-black">
                                  SX + DX
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">{item.category}</div>
                          </div>
                        </div>
                        {item.defaultTempo && (
                          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
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
                <label className="block text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  Modalità Esecuzione &amp; Rilevazione Carico
                </label>
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f4f3ef] rounded-2xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setIsUnilateralMode(false)}
                    className={`py-2.5 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isUnilateralMode
                        ? 'bg-white text-slate-900 border border-stone-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bilaterale (1 Carico)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUnilateralMode(true)}
                    className={`py-2.5 px-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isUnilateralMode
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      Serie (Sets)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="20"
                      value={sets}
                      onChange={(e) => setSets(e.target.value)}
                      className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-2xl p-3 text-center text-base font-black text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      Ripetizioni
                    </label>
                    <input
                      type="text"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-2xl p-3 text-center text-base font-black text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-blue-700 mb-1">
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
                      className="w-full bg-blue-50/50 border-2 border-blue-600 rounded-2xl p-3 text-center text-base font-black text-slate-900 placeholder-slate-400 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-[#faf9f6] p-4 rounded-2xl border border-stone-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 mb-1">
                        Serie per Gamba
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max="20"
                        value={sets}
                        onChange={(e) => setSets(e.target.value)}
                        className="w-full bg-white border border-stone-200 focus:border-blue-600 rounded-xl p-2.5 text-center text-sm font-black text-slate-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-700 mb-1">
                        Ripetizioni per Gamba
                      </label>
                      <input
                        type="text"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                        className="w-full bg-white border border-stone-200 focus:border-blue-600 rounded-xl p-2.5 text-center text-sm font-black text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* DOPPIO CAMPO CARICO SEPARATO: GAMBA SINISTRA (SX) vs GAMBA DESTRA (DX) */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-2xl bg-white border-2 border-blue-500 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-blue-700 uppercase tracking-wider">
                          🦵 Gamba SX (Kg)
                        </span>
                        {injuredSide.includes('sx') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-black">
                            Operato
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        placeholder="Kg SX"
                        value={weightSxKg}
                        onChange={(e) => setWeightSxKg(e.target.value)}
                        className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-xl p-2.5 text-center text-base font-black text-slate-900 font-mono focus:outline-none"
                      />
                    </div>

                    <div className="p-3 rounded-2xl bg-white border-2 border-teal-600 space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-teal-800 uppercase tracking-wider">
                          🦵 Gamba DX (Kg)
                        </span>
                        {injuredSide.includes('dx') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-black">
                            Operato
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        placeholder="Kg DX"
                        value={weightDxKg}
                        onChange={(e) => setWeightDxKg(e.target.value)}
                        className="w-full bg-[#faf9f6] border border-stone-200 focus:border-teal-600 rounded-xl p-2.5 text-center text-base font-black text-slate-900 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {liveLsiForm !== null && (
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs">
                      <span className="text-slate-700 font-extrabold">Simmetria Carico SX vs DX (LSI):</span>
                      <strong
                        className={`font-mono font-black ${
                          liveLsiForm >= 90 ? 'text-emerald-700' : 'text-amber-700'
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
                  <label className="block text-[11px] font-black text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Velocità / Tempo (Opz.)</span>
                  </label>
                  <input
                    type="text"
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    placeholder="es. 3-0-1-0 o Esplosivo"
                    className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Note / Dolore / RPE (Opz.)</span>
                  </label>
                  <input
                    type="text"
                    value={notesRpe}
                    onChange={(e) => setNotesRpe(e.target.value)}
                    placeholder="es. Nessun dolore (0/10)"
                    className="w-full bg-[#faf9f6] border border-stone-200 focus:border-blue-600 rounded-xl py-2.5 px-3 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* PULSANTE PER AGGIUNGERE PIÙ ESERCIZI AL PACCHETTO DEL GIORNO */}
              {!editingLogId && (
                <button
                  type="button"
                  onClick={handleAddExerciseToPackage}
                  disabled={!isCurrentFormLoadValid()}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 disabled:opacity-40 text-blue-800 border-2 border-dashed border-blue-300 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>+ Aggiungi questo esercizio al Pacchetto del Giorno</span>
                </button>
              )}

              {/* 5. COMPONENTE MODULARE MULTI-BLOCK CARDIO BUILDER */}
              {!editingLogId && (
                <div className="pt-2 border-t border-stone-200">
                  <CardioBuilder
                    blocks={cardioBlocks}
                    onChange={setCardioBlocks}
                    title="Sessione Cardio Multi-Blocco"
                    subtitle="Combina più blocchi cardio nella stessa seduta (es. 6×5m Navette + 5×50m Ripetute + 15 min Corsa Z2)"
                  />
                </div>
              )}

              {/* RIEPILOGO PACCHETTO IN PREPARAZIONE */}
              {packageItems.length > 0 && !editingLogId && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-blue-900">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>Pacchetto in preparazione ({packageItems.length} esercizi)</span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-600">{workoutDate}</span>
                  </div>
                  <div className="divide-y divide-blue-200/60">
                    {packageItems.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.exercise_name, 'w-3.5 h-3.5')}
                          <div>
                            <div className="font-black text-slate-900">{item.exercise_name}</div>
                            <div className="text-[10px] text-slate-600 font-mono font-bold">
                              {item.sets} × {item.reps} •{' '}
                              {item.is_unilateral ? (
                                <span className="text-slate-900 font-black">
                                  SX <strong className="text-blue-700">{item.weight_sx_kg} kg</strong> | DX{' '}
                                  <strong className="text-teal-700">{item.weight_dx_kg} kg</strong>
                                </span>
                              ) : (
                                <strong className="text-slate-900">{item.weight_kg} kg</strong>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromPackageDraft(idx)}
                          className="p-1.5 text-slate-500 hover:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-black flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {/* PULSANTE PRINCIPALE: SALVA PACCHETTO ALLENAMENTO DEL GIORNO */}
              <button
                type="submit"
                disabled={saving || (!editingLogId && totalDraftCount === 0)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {saving
                    ? 'Salvataggio in corso...'
                    : editingLogId
                    ? 'Salva Modifica Esercizio'
                    : `Salva Pacchetto Allenamento (${totalDraftCount} Voci)`}
                </span>
              </button>
            </form>

            {/* ANTEPRIMA DEGLI ESERCIZI GIÀ SALVATI NELLA GIORNATA SELEZIONATA */}
            {existingLogsForSelectedDate.length > 0 && !editingLogId && (
              <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span>Già registrati nel pacchetto del {formatDayLabel(workoutDate)}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[10px] font-black">
                    {existingLogsForSelectedDate.length} voci
                  </span>
                </div>
                <div className="space-y-2">
                  {existingLogsForSelectedDate.map((log, i) => {
                    const cardioInfo = parseCardioLogFromWorkoutRow(log);
                    return (
                      <div
                        key={log.id || i}
                        className="bg-[#faf9f6] border border-stone-200 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedExerciseForProgression(log.exercise_name)}
                          className="flex items-center gap-2 text-left hover:text-blue-600 cursor-pointer"
                        >
                          {getCategoryIcon(log.exercise_name, 'w-3.5 h-3.5')}
                          <span className="font-black text-slate-900 underline decoration-dotted underline-offset-2">
                            {cardioInfo ? cardioInfo.title : log.exercise_name}
                          </span>
                        </button>
                        <div className="flex items-center gap-2">
                          {cardioInfo ? (
                            <span className="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-mono text-[10px] font-black">
                              {cardioInfo.modality === 'continuo'
                                ? `${cardioInfo.duration_min || 0}m • ${cardioInfo.distance_km || 0}km (${cardioInfo.pace})`
                                : `${cardioInfo.work_per_set} • Rec ${cardioInfo.rest}`}
                            </span>
                          ) : (
                            <>
                              <span className="font-mono font-bold text-slate-600">
                                {log.sets}×{log.reps}
                              </span>
                              {log.is_unilateral ? (
                                <div className="flex items-center gap-1 font-mono text-[11px]">
                                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-black">
                                    SX {log.weight_sx_kg}kg
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-800 font-black">
                                    DX {log.weight_dx_kg}kg
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono font-black text-slate-900">{log.weight_kg} kg</span>
                              )}
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditLog(log)}
                            className="p-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="Modifica"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEZIONE B: STORICO PER GIORNATE & PROGRESSIONE PER ESERCIZIO */}
        {activeSection === 'history' && (
          <div className="space-y-4">
            {/* 1. SELETTORE GIORNATE DI ALLENAMENTO */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-3 shadow-md">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Seleziona Giornata di Allenamento</span>
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  Tocca una data per vedere il pacchetto di esercizi e blocchi cardio svolti quel giorno
                </p>
              </div>

              {groupedByDay.sortedDays.length === 0 ? (
                <div className="text-xs text-slate-500 font-bold italic py-2">
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
                            ? 'bg-blue-600 border-blue-700 text-white shadow-md'
                            : 'bg-[#faf9f6] border-stone-200 text-slate-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="text-xs font-black">{formatDayLabel(dayKey)}</div>
                        <div
                          className={`text-[10px] font-mono font-bold mt-0.5 ${
                            isSelected ? 'text-blue-100' : 'text-blue-600'
                          }`}
                        >
                          📦 {dayLogs.length} {dayLogs.length === 1 ? 'voce' : 'voci'}
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setSelectedHistoryDay('ALL')}
                    className={`px-3.5 py-2.5 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${
                      activeHistoryDay === 'ALL'
                        ? 'bg-blue-600 border-blue-700 text-white shadow-md'
                        : 'bg-[#faf9f6] border-stone-200 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-black">Tutte le Giornate</div>
                    <div
                      className={`text-[10px] font-mono font-bold mt-0.5 ${
                        activeHistoryDay === 'ALL' ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {workoutLogs.length} totali
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 2. PACCHETTO ESERCIZI DELLA GIORNATA SELEZIONATA */}
            {loadingLogs ? (
              <div className="p-8 text-center text-xs font-bold text-slate-500">
                Caricamento storico in corso...
              </div>
            ) : (
              (activeHistoryDay === 'ALL' ? groupedByDay.sortedDays : [activeHistoryDay])
                .filter(Boolean)
                .map((dayKey) => {
                  const dayLogs = groupedByDay.map[dayKey] || [];
                  if (dayLogs.length === 0) return null;

                  return (
                    <div
                      key={dayKey}
                      className="bg-white border border-stone-200 rounded-3xl p-5 space-y-3.5 shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                            Pacchetto Allenamento Giornaliero
                          </span>
                          <h4 className="text-base font-black text-slate-900">{formatDayLabel(dayKey)}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWorkoutDate(dayKey);
                            setActiveSection('log');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-black flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Aggiungi a questa data</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {dayLogs.map((log, idx) => {
                          const cardioInfo = parseCardioLogFromWorkoutRow(log);
                          const lsiLoad = log.is_unilateral
                            ? calcLoadLsiPct(log.weight_sx_kg, log.weight_dx_kg)
                            : null;

                          if (cardioInfo) {
                            return (
                              <div
                                key={log.id || idx}
                                className="bg-[#faf9f6] border border-teal-200 rounded-2xl p-4 space-y-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                                      {cardioInfo.modality === 'continuo' ? (
                                        <Route className="w-4 h-4" />
                                      ) : (
                                        <Repeat className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                                        {cardioInfo.modality === 'continuo'
                                          ? 'Cardio Continuo'
                                          : 'Ripetute / Navette'}
                                      </span>
                                      <h5 className="text-sm font-black text-slate-900 mt-1">
                                        {cardioInfo.title}
                                      </h5>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    {cardioInfo.modality === 'continuo' ? (
                                      <>
                                        <div className="text-sm font-black text-teal-800 font-mono">
                                          {cardioInfo.duration_min || 0} min • {cardioInfo.distance_km || 0} km
                                        </div>
                                        <div className="text-[10px] font-extrabold text-slate-600 font-mono">
                                          Passo: {cardioInfo.pace} • {cardioInfo.speed}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-sm font-black text-teal-800 font-mono">
                                          {cardioInfo.work_per_set}
                                        </div>
                                        <div className="text-[10px] font-extrabold text-slate-600 font-mono">
                                          Recupero: {cardioInfo.rest}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-stone-200">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-stone-200 cursor-pointer"
                                    title="Elimina blocco cardio"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={log.id || idx}
                              className="bg-[#faf9f6] border border-stone-200 rounded-2xl p-4 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectedExerciseForProgression(log.exercise_name)}
                                  className="flex items-center gap-2.5 text-left group cursor-pointer"
                                >
                                  <div className="p-2 rounded-xl bg-white border border-stone-200 group-hover:border-blue-500">
                                    {getCategoryIcon(log.exercise_name)}
                                  </div>
                                  <div>
                                    <h5 className="text-sm font-black text-slate-900 group-hover:text-blue-600 flex items-center gap-1">
                                      <span className="underline decoration-blue-400 decoration-dotted underline-offset-4">
                                        {log.exercise_name}
                                      </span>
                                      <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                                    </h5>
                                    <span className="text-[10px] text-blue-600 font-extrabold flex items-center gap-1">
                                      <TrendingUp className="w-3 h-3" />
                                      <span>Vedi progressione nel tempo</span>
                                    </span>
                                  </div>
                                </button>

                                <div className="text-right shrink-0">
                                  {log.is_unilateral ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-end gap-1.5 font-mono text-xs">
                                        <span className="px-2 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-black">
                                          SX: {log.weight_sx_kg} kg
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-black">
                                          DX: {log.weight_dx_kg} kg
                                        </span>
                                      </div>
                                      <div className="text-[10px] font-extrabold text-slate-600 font-mono">
                                        {log.sets} serie × {log.reps} rip{' '}
                                        {lsiLoad !== null && (
                                          <span className="text-blue-700 ml-1">• LSI {lsiLoad}%</span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="text-base font-black text-slate-900 font-mono">
                                        {log.weight_kg} kg
                                      </div>
                                      <div className="text-[10px] font-extrabold text-slate-600 font-mono">
                                        {log.sets} serie × {log.reps} rip
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200 text-[11px]">
                                <div className="flex flex-wrap items-center gap-2">
                                  {log.tempo_speed && (
                                    <span className="px-2 py-0.5 rounded-lg bg-white border border-stone-200 text-blue-700 font-mono font-bold text-[10px]">
                                      ⏱ {log.tempo_speed}
                                    </span>
                                  )}
                                  {log.clean_notes && (
                                    <span className="text-slate-600 font-semibold italic">
                                      &ldquo;{log.clean_notes}&rdquo;
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditLog(log)}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-stone-200 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Modifica</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="p-1 rounded-lg bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-stone-200 cursor-pointer"
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

      {/* MODAL PROGRESSIONE NEL TEMPO DELL'ESERCIZIO CLICCATO (EDITORIAL LIGHT THEME) */}
      {selectedExerciseForProgression && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200">
                  {getCategoryIcon(selectedExerciseForProgression, 'w-5 h-5')}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block">
                    Progressione Carichi nel Tempo
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedExerciseForProgression}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExerciseForProgression(null)}
                className="p-2 rounded-xl bg-[#faf9f6] text-slate-600 hover:text-slate-900 border border-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {exerciseProgressionData.length === 0 ? (
              <p className="text-xs font-bold text-slate-500 text-center py-4">Nessun dato trovato.</p>
            ) : (
              <>
                {(() => {
                  const hasUnilateral = exerciseProgressionData.some((d) => d.is_unilateral);
                  if (hasUnilateral) {
                    const lastEntry = exerciseProgressionData[exerciseProgressionData.length - 1];
                    const lsiLast = calcLoadLsiPct(lastEntry?.weight_sx_kg, lastEntry?.weight_dx_kg);
                    return (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 text-center">
                          <span className="text-[10px] text-blue-700 font-black block">Ultimo SX</span>
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {lastEntry?.weight_sx_kg ?? 0} kg
                          </span>
                        </div>
                        <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-3 text-center">
                          <span className="text-[10px] text-teal-800 font-black block">Ultimo DX</span>
                          <span className="text-sm font-black text-slate-900 font-mono">
                            {lastEntry?.weight_dx_kg ?? 0} kg
                          </span>
                        </div>
                        <div className="bg-[#faf9f6] border border-stone-200 rounded-2xl p-3 text-center">
                          <span className="text-[10px] text-slate-600 font-black block">Simmetria LSI</span>
                          <span className="text-sm font-black text-slate-900 font-mono">
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
                      <div className="bg-[#faf9f6] border border-stone-200 rounded-2xl p-3 text-center">
                        <span className="text-[10px] text-slate-600 font-black block">1ª Seduta</span>
                        <span className="text-sm font-black text-slate-900 font-mono">{firstKg} kg</span>
                      </div>
                      <div className="bg-[#faf9f6] border border-stone-200 rounded-2xl p-3 text-center">
                        <span className="text-[10px] text-slate-600 font-black block">Picco Max</span>
                        <span className="text-sm font-black text-slate-900 font-mono">{maxKg} kg</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center">
                        <span className="text-[10px] text-blue-700 font-black block">Evoluzione</span>
                        <span className="text-sm font-black font-mono text-blue-700">
                          {deltaKg > 0 ? `+${deltaKg} kg` : `${deltaKg} kg`}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* MICRO GRAFICO DI PROGRESSIONE A BARRE */}
                <div className="bg-[#faf9f6] border border-stone-200 rounded-2xl p-4 space-y-2">
                  <div className="text-[11px] font-black text-slate-900 flex items-center justify-between">
                    <span>Andamento Carico (Kg) per Seduta</span>
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                      <span className="text-blue-600">■ SX</span>
                      <span className="text-teal-600">■ DX</span>
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
                            <span className="text-[9.5px] font-mono font-black text-slate-900">
                              {d.weight_sx_kg}/{d.weight_dx_kg}kg
                            </span>
                            <div className="w-full bg-white rounded-t-lg h-20 flex items-end gap-1 p-1 border border-stone-200">
                              <div
                                style={{ height: `${pctSx}%` }}
                                className="flex-1 bg-blue-600 rounded-t transition-all"
                                title={`SX: ${d.weight_sx_kg} kg`}
                              />
                              <div
                                style={{ height: `${pctDx}%` }}
                                className="flex-1 bg-teal-600 rounded-t transition-all"
                                title={`DX: ${d.weight_dx_kg} kg`}
                              />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-slate-500">
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
                          <span className="text-[10px] font-mono font-black text-slate-900">
                            {d.weight_kg}kg
                          </span>
                          <div className="w-full bg-white rounded-t-lg h-20 flex items-end overflow-hidden border border-stone-200 p-0.5">
                            <div
                              style={{ height: `${pct}%` }}
                              className="w-full bg-blue-600 rounded-t-md transition-all"
                            />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-slate-500">
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
                  <div className="text-xs font-black text-slate-800">
                    Storico Sedute — {selectedExerciseForProgression}
                  </div>
                  {exerciseProgressionData
                    .slice()
                    .reverse()
                    .map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-[#faf9f6] border border-stone-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-black text-slate-900">
                            {formatDayLabel(toDateInputValue(item.created_at))}
                          </div>
                          <div className="text-[10px] font-bold text-slate-600">
                            {item.sets} serie × {item.reps} rip • {item.tempo_speed}
                          </div>
                        </div>
                        <div className="text-right">
                          {item.is_unilateral ? (
                            <div className="font-mono font-black text-slate-900 text-xs">
                              <span className="text-blue-700">SX {item.weight_sx_kg}kg</span> •{' '}
                              <span className="text-teal-700">DX {item.weight_dx_kg}kg</span>
                            </div>
                          ) : (
                            <div className="font-mono font-black text-slate-900 text-sm">
                              {item.weight_kg} kg
                            </div>
                          )}
                          {item.clean_notes && (
                            <div className="text-[10px] text-slate-500 font-semibold italic truncate max-w-[140px]">
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
