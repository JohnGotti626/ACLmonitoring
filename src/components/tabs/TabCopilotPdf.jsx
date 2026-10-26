import React, { useState, Component, useMemo } from 'react';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Dumbbell,
  Zap,
  BookOpen,
  Printer,
  Lock,
  Unlock,
  Footprints,
  TrendingDown,
  Check,
  X,
  ShieldCheck,
  Search,
  Sliders,
  Compass,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import ModalLibreriaScientifica from '../ModalLibreriaScientifica';
import {
  sortTestsByDate,
  getLastValidMetricValue,
  toStrictNullOrNumber
} from '../../utils/testUtils';

// ============================================================================
// SYSTEM PROMPT UFFICIALE DEL COPILOT AI (NSCA CSCS • TURNER • BISHOP • ASPETAR)
// ============================================================================
export const NSCA_COPILOT_SYSTEM_PROMPT = `Sei un Clinical Strength & Conditioning Copilot specializzato nella riabilitazione post-ricostruzione LCA.
Utilizza rigorosamente le evidenze scientifiche e linee guida di:
- NSCA Strength & Conditioning (CSCS - Essentials of Strength Training and Conditioning: %1RM, Serie x Ripetizioni, Recupero, VBT)
- Anthony Turner et al. (Stretch-Shortening Cycle, RFD, Reactive Strength Index & Plyometric Continuum)
- Chris Bishop et al. (Inter-limb Asymmetry Profiling, Unilateral Jump Testing, soglie di asimmetria <10%)
- Linee Guida Cliniche Aspetar (Kyritsis, Kotsifaki, Read, Aspetar ACL Rehabilitation Criterion-Based Progression)
Analizza automaticamente:
1. Gli ultimi test biomeccanici e isometrici inseriti (inclusi trend LSI e metriche personalizzate).
2. I deficit neuromuscolari e biomeccanici segnalati dal team clinico.
3. Le direttive operative del terapista e la fase riabilitativa attiva.
Fornisci raccomandazioni strutturate con: Selezione Esercizi, Parametri di Carico NSCA (%1RM, Serie x Ripetizioni, Recupero, Velocità VBT), Progressioni e Regressioni biomeccaniche.`;

class CopilotErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Errore sconosciuto nel calcolo IA.' };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[CopilotErrorBoundary] Errore intercettato:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-xl bg-white border border-amber-300 text-slate-900 space-y-3 my-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <div className="p-1 bg-slate-100 text-slate-600 rounded">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <span>Dati Insufficienti per l&apos;Analisi Automatica Completa</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Inserisci almeno una rilevazione nella scheda <strong>2. Test &amp; Valutazioni</strong> per abilitare il calcolo completo del Copilot NSCA.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const PHASE_TARGET_MATRIX = {
  FASE_1: {
    id: 'FASE_1',
    shortName: '1. Early (ROM)',
    fullName: 'Fase 1: Early Stage (0-6 Settimane)',
    targetLsiQuad: 60,
    targetLsiHam: 65,
    targetRsiMod: 0.80,
    targetBrakingAsym: 25,
    targetHqRatio: 0.50,
    nscaFocus: 'NSCA Hypertrophy / Activation: Isometria sub-massimale e Overcoming Iso a 60°-90° (70-80% MVC, 5x6s, Rec 90s) per contrastare AMI.'
  },
  FASE_2: {
    id: 'FASE_2',
    shortName: '2. Mid (>70%)',
    fullName: 'Fase 2: Mid Stage (6-12 Settimane)',
    targetLsiQuad: 70,
    targetLsiHam: 75,
    targetRsiMod: 1.00,
    targetBrakingAsym: 20,
    targetHqRatio: 0.55,
    nscaFocus: 'NSCA Basic Strength & Hypertrophy: 67-80% 1RM, 3-4 serie x 8-12 reps, Rec 90-120s, controllo eccentrico 3s.'
  },
  FASE_3: {
    id: 'FASE_3',
    shortName: '3. Run (>80%)',
    fullName: 'Fase 3: Return to Run & Power (3-5 Mesi)',
    targetLsiQuad: 80,
    targetLsiHam: 80,
    targetRsiMod: 1.25,
    targetBrakingAsym: 15,
    targetHqRatio: 0.58,
    nscaFocus: 'NSCA Maximal Strength: 80-87% 1RM, 4 serie x 5-6 reps, Rec 2-3 min + Low-Intensity Plyometrics (SSC lungo).'
  },
  FASE_4: {
    id: 'FASE_4',
    shortName: '4. Late (>85%)',
    fullName: 'Fase 4: Late Stage & COD (5-7 Mesi)',
    targetLsiQuad: 85,
    targetLsiHam: 85,
    targetRsiMod: 1.40,
    targetBrakingAsym: 12,
    targetHqRatio: 0.60,
    nscaFocus: 'NSCA Strength-Power & Reactive SSC: 85-90% 1RM (3-5 reps) combinato con Pliometria Reattiva GCT <250ms (3-4x6-8 contatti, Rec 2-3 min).'
  },
  FASE_5: {
    id: 'FASE_5',
    shortName: '5. RTS (>90%)',
    fullName: 'Fase 5: Return to Sport & Performance (>7 Mesi)',
    targetLsiQuad: 90,
    targetLsiHam: 90,
    targetRsiMod: 1.50,
    targetBrakingAsym: 10,
    targetHqRatio: 0.60,
    nscaFocus: 'NSCA Peaking Power & Ballistic VBT: 30-60% 1RM ad alta velocità (0.75-1.0 m/s) + High-Impact Multidirectional Plyometrics.'
  }
};

function mapPatientPhaseToKey(phaseString = '') {
  const s = String(phaseString).toLowerCase();
  if (s.includes('1') || s.includes('early') || s.includes('rom')) return 'FASE_1';
  if (s.includes('2') || s.includes('mid') || s.includes('forza')) return 'FASE_2';
  if (s.includes('3') || s.includes('run') || s.includes('power') || s.includes('drills')) return 'FASE_3';
  if (s.includes('4') || s.includes('late') || s.includes('cod') || s.includes('agility')) return 'FASE_4';
  if (s.includes('5') || s.includes('rts') || s.includes('perf') || s.includes('sport') || s.includes('play')) return 'FASE_5';
  return 'FASE_3';
}

function CopilotEngineInner({ patient }) {
  const [isBiblioModalOpen, setIsBiblioModalOpen] = useState(false);

  const safePatient = patient && typeof patient === 'object' ? patient : {};
  const patientName = `${safePatient.nome || 'Paziente'} ${safePatient.cognome || ''}`.trim();
  const activePatientPhase = safePatient.fase_attuale || safePatient.fase_riabilitativa || 'Fase 3: Running & Early Power';
  const therapistDirectives = safePatient.direttive_terapista || safePatient.note_operative || '';
  const recordedDeficits = Array.isArray(safePatient.deficits_list) ? safePatient.deficits_list : [];

  const [selectedPhaseKey, setSelectedPhaseKey] = useState(() =>
    mapPatientPhaseToKey(activePatientPhase)
  );

  React.useEffect(() => {
    if (safePatient.fase_attuale || safePatient.fase_riabilitativa) {
      setSelectedPhaseKey(mapPatientPhaseToKey(safePatient.fase_attuale || safePatient.fase_riabilitativa));
    }
  }, [safePatient.id, safePatient.fase_attuale, safePatient.fase_riabilitativa]);

  const activeTargetConfig = PHASE_TARGET_MATRIX[selectedPhaseKey] || PHASE_TARGET_MATRIX.FASE_3;

  const sortedTests = useMemo(() => sortTestsByDate(safePatient?.tests), [safePatient?.tests]);
  const hasRealTests = sortedTests.length > 0;
  const latestSession = hasRealTests ? sortedTests[sortedTests.length - 1] : null;

  // Estrazione metriche dagli ultimi test validi (ignorando null)
  const rawQuadLsi = getLastValidMetricValue(sortedTests, ['lsiQuad', 'lsi_quad_calculated']);
  const rawHamLsi = getLastValidMetricValue(sortedTests, ['lsiFlex', 'lsi_curl_calculated']);
  const rawQuadSano = getLastValidMetricValue(sortedTests, ['quadSano', 'iso_leg_ext_sx']);
  const rawQuadOp = getLastValidMetricValue(sortedTests, ['quadOp', 'iso_leg_ext_dx']);
  const rawFlexSano = getLastValidMetricValue(sortedTests, ['flexSano', 'iso_leg_curl_sx']);
  const rawFlexOp = getLastValidMetricValue(sortedTests, ['flexOp', 'iso_leg_curl_dx']);

  const lsiQuad =
    rawQuadLsi ??
    (rawQuadSano !== null && rawQuadOp !== null && rawQuadSano > 0
      ? Number(((Math.min(rawQuadOp, rawQuadSano) / Math.max(rawQuadOp, rawQuadSano)) * 100).toFixed(1))
      : null);

  const lsiHam =
    rawHamLsi ??
    (rawFlexSano !== null && rawFlexOp !== null && rawFlexSano > 0
      ? Number(((Math.min(rawFlexOp, rawFlexSano) / Math.max(rawFlexOp, rawFlexSano)) * 100).toFixed(1))
      : null);

  // Calcolo trend LSI (variazione tra le ultime due rilevazioni valide)
  const lsiQuadTrendDelta = useMemo(() => {
    const validQuads = sortedTests
      .map(t => toStrictNullOrNumber(t?.lsiQuad ?? t?.lsi_quad_calculated))
      .filter(v => v !== null);
    if (validQuads.length < 2) return null;
    const diff = validQuads[validQuads.length - 1] - validQuads[validQuads.length - 2];
    return Number(diff.toFixed(1));
  }, [sortedTests]);

  const rawRsi = getLastValidMetricValue(sortedTests, ['rsiDropJump', 'djRSI', 'dj_rsi', 'rsiCmj', 'rsi_cmj']);
  const rsiVal = rawRsi !== null ? Number(rawRsi.toFixed(2)) : null;

  const rawCmjImpulseLsi = getLastValidMetricValue(sortedTests, ['cmjImpulseLsi', 'lsi_cmj_braking']);
  const rawBrakingAsym = getLastValidMetricValue(sortedTests, ['brakingAsym', 'ecc_braking_asym_calculated'], {
    allowZero: true
  });
  const brakingAsym =
    rawBrakingAsym !== null
      ? Number(Math.abs(rawBrakingAsym).toFixed(1))
      : rawCmjImpulseLsi !== null
      ? Number(Math.max(0, 100 - rawCmjImpulseLsi).toFixed(1))
      : null;

  const hqRatio =
    rawFlexOp !== null && rawQuadOp !== null && rawQuadOp > 0
      ? Number((rawFlexOp / rawQuadOp).toFixed(2))
      : rawFlexSano !== null && rawQuadSano !== null && rawQuadSano > 0
      ? Number((rawFlexSano / rawQuadSano).toFixed(2))
      : null;

  // Raccoglie tutte le metriche personalizzate misurate sul paziente
  const latestCustomMetrics = useMemo(() => {
    const map = new Map();
    sortedTests.forEach(t => {
      const cm = t?.custom_metrics;
      if (!cm || typeof cm !== 'object') return;
      Object.entries(cm).forEach(([tType, arr]) => {
        if (!Array.isArray(arr)) return;
        arr.forEach(item => {
          if (!item.is_hidden && item.metric_name && item.metric_value !== null && item.metric_value !== undefined && item.metric_value !== '') {
            map.set(`${tType}::${item.metric_name}`, {
              testType: tType,
              name: item.metric_name,
              value: item.metric_value,
              unit: item.unit || '',
              sessionLabel: t.session_name || t.label
            });
          }
        });
      });
    });
    return Array.from(map.values());
  }, [sortedTests]);

  // Calcolo Readiness Score (0-100%) sui parametri realmente testati
  const readinessScore = useMemo(() => {
    if (!hasRealTests) return null;
    const scores = [];
    if (lsiQuad !== null) scores.push(Math.min(100, (lsiQuad / activeTargetConfig.targetLsiQuad) * 100));
    if (lsiHam !== null) scores.push(Math.min(100, (lsiHam / activeTargetConfig.targetLsiHam) * 100));
    if (rsiVal !== null) scores.push(Math.min(100, (rsiVal / activeTargetConfig.targetRsiMod) * 100));
    if (brakingAsym !== null) {
      scores.push(
        brakingAsym <= activeTargetConfig.targetBrakingAsym
          ? 100
          : Math.max(0, 100 - (brakingAsym - activeTargetConfig.targetBrakingAsym) * 3.5)
      );
    }
    if (hqRatio !== null) scores.push(Math.min(100, (hqRatio / activeTargetConfig.targetHqRatio) * 100));
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [hasRealTests, lsiQuad, lsiHam, rsiVal, brakingAsym, hqRatio, activeTargetConfig]);

  // ==========================================================================
  // GENERATORE DINAMICO DI RACCOMANDAZIONI & ESERCIZI SECONDO LINEE GUIDA NSCA
  // ==========================================================================
  const nscaRecommendations = useMemo(() => {
    const recs = [];
    const dirLower = therapistDirectives.toLowerCase();
    const hasQuadDeficit =
      (lsiQuad !== null && lsiQuad < activeTargetConfig.targetLsiQuad) ||
      recordedDeficits.some(d => d.title?.toLowerCase().includes('quad') || d.title?.toLowerCase().includes('ami')) ||
      dirLower.includes('quad') ||
      dirLower.includes('estensione');

    const hasHamOrHqDeficit =
      (lsiHam !== null && lsiHam < activeTargetConfig.targetLsiHam) ||
      (hqRatio !== null && hqRatio < activeTargetConfig.targetHqRatio) ||
      safePatient.tipo_innesto === 'STG' ||
      recordedDeficits.some(d => d.title?.toLowerCase().includes('ham') || d.title?.toLowerCase().includes('flessor'));

    const hasEccentricOrLandingDeficit =
      (brakingAsym !== null && brakingAsym > activeTargetConfig.targetBrakingAsym) ||
      recordedDeficits.some(d => d.title?.toLowerCase().includes('valg') || d.title?.toLowerCase().includes('decel') || d.title?.toLowerCase().includes('frenat')) ||
      dirLower.includes('valg') ||
      dirLower.includes('eccentric') ||
      dirLower.includes('atterraggio');

    const hasPlyoOrRsiDeficit =
      (rsiVal !== null && rsiVal < activeTargetConfig.targetRsiMod) ||
      recordedDeficits.some(d => d.title?.toLowerCase().includes('stiff') || d.title?.toLowerCase().includes('rsi') || d.title?.toLowerCase().includes('plio'));

    // 1. Raccomandazione NSCA / Aspetar Forza Quadricipite / Reclutamento Neuromuscolare
    if (hasQuadDeficit || lsiQuad === null) {
      const isSevere = lsiQuad !== null && lsiQuad < 75;
      recs.push({
        id: 'nsca_quad',
        domain: 'NSCA CSCS & Aspetar Guidelines — Maximal Strength & Neural Drive (Quadricipite)',
        triggerContext:
          lsiQuad !== null
            ? `Rilevato LSI Quadricipite ${lsiQuad}% (Target Aspetar/NSCA ≥${activeTargetConfig.targetLsiQuad}%)`
            : 'Focus primario recupero simmetria estensoria ginocchio operato (Aspetar Criterion-Based)',
        exercise: isSevere
          ? 'Overcoming Isometric Leg Extension a 60° + Spanish Squat Isocinetico/Tempo'
          : 'Single-Leg Press / Rear-Foot Elevated Split Squat (RFESS) con controllo VBT',
        loadParams: isSevere
          ? 'Intensity: 80-90% MVC Isometrica • Volume: 5 serie x 6 sec • Rest: 90-120s (NSCA Neural Activation / Aspetar Early-Mid)'
          : 'Intensity: 80-85% 1RM (VBT 0.45-0.55 m/s) • Volume: 4 serie x 6 reps • Rest: 2-3 min (NSCA CSCS Max Strength)',
        progression: 'Passare da isometria a 60° a RFESS con carico assiale 85% 1RM (4x5 reps, Velocity Loss <10%) riducendo l’asimmetria inter-arto <10% (Bishop et al.).',
        regression: 'Ridurre ROM a 45°-60° in catena cinetica chiusa o utilizzare BFR (Blood Flow Restriction 80% LOP, 30-15-15-15 reps al 30% 1RM — Linee Guida Aspetar).'
      });
    } else {
      recs.push({
        id: 'nsca_quad_power',
        domain: 'NSCA CSCS & Turner RFD — Strength-Speed & Power Maintenance (Quadricipite OK)',
        triggerContext: `LSI Quadricipite a target (${lsiQuad}% ≥ ${activeTargetConfig.targetLsiQuad}%)`,
        exercise: 'Trap Bar Deadlift / Safety Bar Squat con Encoder VBT + Unilateral Jump Transfer',
        loadParams: 'Intensity: 75-85% 1RM (Target Velocity 0.55-0.65 m/s) • Volume: 4 serie x 4-5 reps • Rest: 2.5-3 min (NSCA CSCS / Turner RFD)',
        progression: 'Contrast Training (French Contrast NSCA / Turner): Heavy Squat 85% 1RM + Hurdle Jump + Drop Jump.',
        regression: 'Mantenere carico costante 80% 1RM a 3x5 reps senza componente balistica se compare affaticamento.'
      });
    }

    // 2. Raccomandazione NSCA / Aspetar Catena Cinetica Posteriore & H:Q Ratio
    if (hasHamOrHqDeficit) {
      recs.push({
        id: 'nsca_ham',
        domain: 'NSCA CSCS & Aspetar (Kyritsis et al.) — Posterior Chain & Eccentric Hamstring Torque',
        triggerContext:
          hqRatio !== null
            ? `H:Q Ratio ${hqRatio} (Target Aspetar ≥${activeTargetConfig.targetHqRatio}) • Innesto ${safePatient.tipo_innesto || 'LCA'}`
            : `Protezione sinergica agonista-LCA (Innesto ${safePatient.tipo_innesto || 'STG'} — Aspetar Protocol)`,
        exercise: 'Nordic Hamstring Eccentric Assistito + Single-Leg RDL (Romanian Deadlift)',
        loadParams: 'Intensity: 75-82% 1RM (Tempo Eccentrico 4-1-1) • Volume: 4 serie x 6-8 reps • Rest: 2 min (NSCA Eccentric Strength)',
        progression: 'Razor Curl / Hip-Extension Slider ad alta velocità eccentrica (Catch phase) 4x5 reps (Turner RFD eccentrico).',
        regression: 'Isometric Hamstring Bridge a lungo braccio di leva (30° flessione ginocchio) 4 serie x 20-30 sec.'
      });
    }

    // 3. Raccomandazione NSCA / Bishop / Aspetar (Kotsifaki & Read) Assorbimento Eccentrico & Decelerazione
    if (hasEccentricOrLandingDeficit || brakingAsym === null) {
      recs.push({
        id: 'nsca_decel',
        domain: 'Bishop Asymmetry & Aspetar (Kotsifaki / Read) — Eccentric Braking & Landing Mechanics',
        triggerContext:
          brakingAsym !== null
            ? `Asimmetria Impulso Frenante CMJ ${brakingAsym}% (Target Bishop <${activeTargetConfig.targetBrakingAsym}%)`
            : 'Rieducazione assorbimento cinetico monopodalico e simmetria di frenata (Bishop / Aspetar)',
        exercise: 'Altitude Drop-to-Stick Monopodalico (Box 20-30cm) + Eccentric Overload Split Squat',
        loadParams: 'Intensity: Peso Corporeo / Sovraccarico 15-20% BM • Volume: 4 serie x 5 atterraggi/lato (Hold 3s) • Rest: 90-120s',
        progression: 'Decelerazione lineare su 5-10m con arresto monopodalico in 2 passi e cambio di direzione a 45° (Aspetar Late Stage COD).',
        regression: 'Drop Squat bipodalico rapido (Snap-Down) con feedback visivo per simmetria di carico 50/50.'
      });
    }

    // 4. Raccomandazione NSCA / Turner Pliometria & Stretch-Shortening Cycle (SSC)
    if (hasPlyoOrRsiDeficit || rsiVal !== null) {
      const isReadyForFastSsc = (lsiQuad ?? 0) >= 80;
      recs.push({
        id: 'nsca_plyo',
        domain: 'Turner SSC Continuum & NSCA CSCS — Plyometric Stiffness & RSImod',
        triggerContext:
          rsiVal !== null
            ? `RSI rilevato ${rsiVal} idx (Target Fase Turner/NSCA ≥${activeTargetConfig.targetRsiMod} idx)`
            : 'Sviluppo rigidità reattiva complesso caviglia-ginocchio (Turner Plyometric Continuum)',
        exercise: isReadyForFastSsc
          ? 'Drop Jump Bipodalico/Monopodalico (Box 30cm, GCT <220ms) + Pogo Jumps Reattivi'
          : 'Sub-Maximal Ankle Hops & Countermovement Jump con pausa isometrica',
        loadParams: isReadyForFastSsc
          ? 'Intensity: Fast SSC (Contatto <220ms, Turner) • Volume: 4 serie x 6 contatti (24 tocchi/sessione) • Rest: 2-3 min (NSCA Work-to-Rest 1:5-1:10)'
          : 'Intensity: Low-Moderate SSC (Turner) • Volume: 3 serie x 8 contatti • Rest: 90s',
        progression: 'Single-Leg Hurdle Hops continui + Depth Jump da 30-40cm con massimizzazione altezza volo e asimmetria SL <10% (Bishop / Kotsifaki).',
        regression: 'Sled Push / Pogo Jump bipodalico assistito con bande elastiche per ridurre vGRF di impatto.'
      });
    }

    return recs;
  }, [
    lsiQuad,
    lsiHam,
    hqRatio,
    brakingAsym,
    rsiVal,
    activeTargetConfig,
    therapistDirectives,
    recordedDeficits,
    safePatient.tipo_innesto
  ]);

  // Alert diagnostici sintetici
  const alerts = useMemo(() => {
    const list = [];
    if (!hasRealTests) {
      list.push({
        type: 'yellow',
        title: 'In Attesa di Rilevazione Test Strumentali',
        metric: 'Stato: Nessuna sessione di test registrata',
        description:
          'Il Copilot NSCA sta operando sulle direttive del terapista e sui deficit segnalati. Inserisci i test nella scheda 2 per attivare lo scoring biometrico.',
        citation: 'NSCA Needs Analysis Protocol'
      });
      return list;
    }

    if (lsiQuad !== null) {
      list.push({
        type: lsiQuad >= activeTargetConfig.targetLsiQuad ? 'green' : lsiQuad >= activeTargetConfig.targetLsiQuad - 10 ? 'yellow' : 'red',
        title: lsiQuad >= activeTargetConfig.targetLsiQuad ? 'Simmetria Estensoria Quadricipite a Target' : 'Deficit Forza Quadricipite (LSI sotto soglia)',
        metric: `LSI Quad: ${lsiQuad}% (Target ≥${activeTargetConfig.targetLsiQuad}%)${lsiQuadTrendDelta !== null ? ` • Trend: ${lsiQuadTrendDelta >= 0 ? `+${lsiQuadTrendDelta}%` : `${lsiQuadTrendDelta}%`}` : ''}`,
        description:
          lsiQuad >= activeTargetConfig.targetLsiQuad
            ? 'Forza isometrica simmetrica. Procedere con progressioni di potenza e pliometria NSCA.'
            : 'Mantenere priorità su reclutamento ad alta soglia (80-85% 1RM / Overcoming Iso) prima di volumi pliometrici intensivi.',
        citation: 'Grindem et al. 2016 • NSCA Guidelines'
      });
    }

    if (rsiVal !== null) {
      list.push({
        type: rsiVal >= activeTargetConfig.targetRsiMod ? 'green' : 'yellow',
        title: rsiVal >= activeTargetConfig.targetRsiMod ? 'Efficienza Reattiva SSC Validata' : 'Indice Reattivo RSI in Costruzione',
        metric: `RSI: ${rsiVal} idx (Target ≥${activeTargetConfig.targetRsiMod} idx)`,
        description:
          rsiVal >= activeTargetConfig.targetRsiMod
            ? 'Ottima rigidità reattiva neuromuscolare nel ciclo allungamento-accorciamento.'
            : 'Integrare Pogo Jumps e Drop Jump a box controllato rispettando il rapporto recupero NSCA 1:5 - 1:10.',
        citation: 'Ebbs et al. 2023 • NSCA Plyometric Progression'
      });
    }

    if (brakingAsym !== null) {
      list.push({
        type: brakingAsym <= activeTargetConfig.targetBrakingAsym ? 'green' : 'red',
        title: brakingAsym <= activeTargetConfig.targetBrakingAsym ? 'Assorbimento Eccentrico Simmetrico' : 'Asimmetria di Frenata Eccentrica (Offloading)',
        metric: `Asimmetria Frenata: ${brakingAsym}% (Target ≤${activeTargetConfig.targetBrakingAsym}%)`,
        description:
          brakingAsym <= activeTargetConfig.targetBrakingAsym
            ? 'Ripartizione simmetrica delle forze di decelerazione tra arto operato e arto sano.'
            : 'Strategia di scarico sull’arto sano in frenata. Prescrivere eccentrica lenta (3-4s) e Altitude Landings monopodalici.',
        citation: 'Read et al. 2020 • NSCA Deceleration Mechanics'
      });
    }

    if (hqRatio !== null) {
      list.push({
        type: hqRatio >= activeTargetConfig.targetHqRatio ? 'green' : 'yellow',
        title: hqRatio >= activeTargetConfig.targetHqRatio ? 'Rapporto Agonista/Antagonista H:Q Ottimale' : 'Squilibrio H:Q Ratio (Protezione LCA)',
        metric: `H:Q Ratio: ${hqRatio} (Target ≥${activeTargetConfig.targetHqRatio})`,
        description:
          hqRatio >= activeTargetConfig.targetHqRatio
            ? 'Adeguata co-contrazione protettiva degli ischiocrurali contro la traslazione tibiale anteriore.'
            : 'Rinforzare selettivamente gli ischiocrurali in allungamento (Nordic / RDL) secondo parametri NSCA.',
        citation: 'Kyritsis et al. 2016 • NSCA'
      });
    }

    return list;
  }, [hasRealTests, lsiQuad, lsiQuadTrendDelta, rsiVal, brakingAsym, hqRatio, activeTargetConfig]);

  return (
    <div className="space-y-6 select-none text-slate-900">

      {/* ========================================================================= */}
      {/* 1. HEADER CLINICAL COPILOT AI + READINESS SCORE + CONTESTO DINAMICO       */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-5 break-inside-avoid">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-1 bg-slate-100 text-slate-600 rounded">
                <Sparkles className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-wider">
                NSCA Certified Clinical Copilot AI
              </span>
              <span className="text-xs text-slate-500 font-mono">
                • Sincronizzato in tempo reale con Test, LSI, Deficit e Direttive
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Analisi Predittiva &amp; Prescrizione Carichi NSCA — {patientName}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>
                Fase Attuale: <strong className="text-emerald-700 font-bold">{activePatientPhase}</strong>
              </span>
              <span>•</span>
              <span>
                Ultima Sessione Test:{' '}
                <strong className="text-slate-900 font-mono">
                  {latestSession ? `${latestSession.session_name || latestSession.label} (${latestSession.dateRange || latestSession.date})` : 'Nessun test'}
                </strong>
              </span>
            </div>
          </div>

          {/* READINESS SCORE (0-100%) GAUGE IN LIGHT MODE */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-4 min-w-[270px] shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    readinessScore === null
                      ? 'text-slate-300'
                      : readinessScore >= 85
                      ? 'text-emerald-600'
                      : readinessScore >= 70
                      ? 'text-amber-500'
                      : 'text-rose-600'
                  }
                  strokeDasharray={`${readinessScore ?? 0}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold font-mono text-slate-900 leading-none">
                  {readinessScore !== null ? `${readinessScore}%` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                READINESS DI FASE (NSCA)
              </span>
              <strong className="text-xs font-bold text-slate-900 block">
                {readinessScore === null
                  ? 'In Attesa del Primo Test'
                  : readinessScore >= 85
                  ? 'Idoneità Fase Validata'
                  : readinessScore >= 70
                  ? 'In Progressione Clinica'
                  : 'Priorità Correzione Deficit'}
              </strong>
              <p className="text-[11px] text-slate-500">
                {readinessScore === null
                  ? 'Rileva un test nella scheda 2.'
                  : `Calcolato sugli ultimi test non-null.`}
              </p>
            </div>
          </div>
        </div>

        {/* CONTESTO DINAMICO LETTO DAL COPILOT (Direttive Terapista + Deficit + Metriche Custom) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <div className="p-1 bg-slate-100 text-slate-600 rounded">
                <Compass className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span>Direttive Terapista in Ingresso</span>
            </div>
            <p className="text-slate-800 font-medium leading-snug line-clamp-3">
              {therapistDirectives || 'Nessuna nota specifica inserita nella Scheda 1.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <div className="p-1 bg-slate-100 text-slate-600 rounded">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span>Deficit Attivi Rilevati ({recordedDeficits.length})</span>
            </div>
            {recordedDeficits.length > 0 ? (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {recordedDeficits.map((d) => (
                  <span
                    key={d.id}
                    className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[10.5px]"
                  >
                    {d.title}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">Nessun deficit attivo segnalato.</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <div className="p-1 bg-slate-100 text-slate-600 rounded">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span>Metriche Personalizzate ({latestCustomMetrics.length})</span>
            </div>
            {latestCustomMetrics.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {latestCustomMetrics.slice(0, 4).map((cm, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10.5px] font-bold"
                  >
                    {cm.name}: {cm.value} {cm.unit}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">Nessuna metrica custom registrata.</p>
            )}
          </div>
        </div>

        {/* Selettore Fase Valutazione Copilot (nascosto in stampa con print:hidden) */}
        <div className="pt-3 border-t border-slate-200 space-y-2 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
              Seleziona Fase Target per Simulazione Linee Guida NSCA:
            </span>
            <span className="text-xs text-emerald-700 font-bold">
              {activeTargetConfig.fullName}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.values(PHASE_TARGET_MATRIX).map((ph) => {
              const isSelected = selectedPhaseKey === ph.id;
              return (
                <button
                  key={ph.id}
                  type="button"
                  onClick={() => setSelectedPhaseKey(ph.id)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-emerald-50/40 border border-slate-200'
                  }`}
                >
                  <span>{ph.shortName}</span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    Target LSI ≥{ph.targetLsiQuad}%
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
            <strong>Focus NSCA di Fase:</strong> {activeTargetConfig.nscaFocus}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PRESCRIZIONI DINAMICHE E LINEE GUIDA NSCA (ESERCIZI, PROGRESSIONI, REGRESSIONI, CARICHI) */}
      {/* ========================================================================= */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4 break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-slate-100 text-slate-600 rounded">
              <Dumbbell className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                PRESCRIZIONE DINAMICA ESERCIZI &amp; PARAMETRI DI CARICO (LINEE GUIDA NSCA)
              </h3>
              <p className="text-xs text-slate-500">
                Generato automaticamente incrociando ultimi test, LSI, deficit attivi e direttive del terapista
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-bold text-[11px] shrink-0">
            Protocollo NSCA Attivo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nscaRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/90 space-y-2.5 break-inside-avoid"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    {rec.domain}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {rec.exercise}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[10px] font-mono font-bold shrink-0">
                  NSCA Rx
                </span>
              </div>

              <div className="text-[11px] text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/80">
                <strong className="text-slate-900">Dato Clinico Rilevato:</strong> {rec.triggerContext}
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs font-mono font-bold text-emerald-900">
                📊 {rec.loadParams}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded-lg bg-white border border-slate-200 space-y-0.5">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Progressione NSCA:
                  </span>
                  <p className="text-slate-600 leading-snug">{rec.progression}</p>
                </div>

                <div className="p-2 rounded-lg bg-white border border-slate-200 space-y-0.5">
                  <span className="font-bold text-amber-700 flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Regressione / Adattamento:
                  </span>
                  <p className="text-slate-600 leading-snug">{rec.regression}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ALERT DIAGNOSTICI & BENCHMARK SCIENTIFICI (ICONE w-4 h-4 IN BADGE)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alert Diagnostici (7/12) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-3.5 break-inside-avoid">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-slate-100 text-slate-600 rounded">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                ANALISI CLINICA AUTOMATICA &amp; ALERT BIOMECCANICI
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {alerts.length} indicatori
            </span>
          </div>

          <div className="space-y-2.5">
            {alerts.map((alt, idx) => {
              const isRed = alt.type === 'red';
              const isYellow = alt.type === 'yellow';
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border space-y-1.5 break-inside-avoid ${
                    isRed
                      ? 'bg-rose-50/60 border-rose-200 text-slate-900'
                      : isYellow
                      ? 'bg-amber-50/60 border-amber-200 text-slate-900'
                      : 'bg-emerald-50/60 border-emerald-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-slate-100 text-slate-600 rounded">
                        {isRed ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                        ) : isYellow ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-slate-900">{alt.title}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isRed
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isYellow
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isRed ? 'ATTENZIONE' : isYellow ? 'IN CORSO' : 'TARGET OK'}
                    </span>
                  </div>

                  <div className="text-xs font-mono font-bold text-slate-900">
                    {alt.metric}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{alt.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Criteri GO / NO-GO e Benchmark (5/12) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4 break-inside-avoid">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-slate-100 text-slate-600 rounded">
                <BookOpen className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                BENCHMARK SCIENTIFICI &amp; CRITERI GO / NO-GO
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setIsBiblioModalOpen(true)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-[11px] rounded-lg flex items-center gap-1 cursor-pointer print:hidden"
            >
              <Search className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fonti DOI</span>
            </button>
          </div>

          {/* 4 Mini Box Benchmark con icone w-4 h-4 dentro p-1 bg-slate-100 text-slate-600 rounded */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 break-inside-avoid">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px] font-bold uppercase">LSI Quadricipite</span>
                <div className="p-1 bg-slate-100 text-slate-600 rounded">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-sm font-bold font-mono text-slate-900">
                {lsiQuad !== null ? `${lsiQuad}%` : 'Non testato'}
              </div>
              <div className="text-[10px] text-slate-500">Target Fase: ≥{activeTargetConfig.targetLsiQuad}%</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 break-inside-avoid">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px] font-bold uppercase">RSI Reattivo</span>
                <div className="p-1 bg-slate-100 text-slate-600 rounded">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-sm font-bold font-mono text-slate-900">
                {rsiVal !== null ? `${rsiVal} idx` : 'Non testato'}
              </div>
              <div className="text-[10px] text-slate-500">Target Fase: ≥{activeTargetConfig.targetRsiMod} idx</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 break-inside-avoid">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px] font-bold uppercase">Asym Frenata</span>
                <div className="p-1 bg-slate-100 text-slate-600 rounded">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-sm font-bold font-mono text-slate-900">
                {brakingAsym !== null ? `${brakingAsym}%` : 'Non testato'}
              </div>
              <div className="text-[10px] text-slate-500">Target Fase: ≤{activeTargetConfig.targetBrakingAsym}%</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 break-inside-avoid">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px] font-bold uppercase">Rapporto H:Q</span>
                <div className="p-1 bg-slate-100 text-slate-600 rounded">
                  <Footprints className="w-4 h-4" />
                </div>
              </div>
              <div className="text-sm font-bold font-mono text-slate-900">
                {hqRatio !== null ? hqRatio : 'Non testato'}
              </div>
              <div className="text-[10px] text-slate-500">Target Fase: ≥{activeTargetConfig.targetHqRatio}</div>
            </div>
          </div>

          {/* Box GO / NO-GO Sintetico */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 break-inside-avoid">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase">
                <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Attività Consentite (GO — Linee Guida NSCA)</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11.5px]">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Rinforzo progressivo NSCA ({activeTargetConfig.shortName}) con controllo simmetria.</span>
                </li>
                {(lsiQuad ?? 0) >= 80 && (
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Running lineare progressivo e decelerazioni sub-massimali pianificate.</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5 break-inside-avoid">
              <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs uppercase">
                <Lock className="w-3.5 h-3.5 text-rose-700" />
                <span>Restrizioni di Sicurezza (NO-GO)</span>
              </div>
              <ul className="space-y-1 text-slate-700 text-[11.5px]">
                {(readinessScore ?? 0) < 90 ? (
                  <>
                    <li className="flex items-start gap-1.5">
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>Cambi di direzione reattivi non pianificati ad angolo &gt;90° o contatto pieno.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span>Depth Jump ad alto impatto (&gt;40cm) finché LSI Quad &lt; 90%.</span>
                    </li>
                  </>
                ) : (
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-emerald-800 font-semibold">Criteri RTS soddisfatti: reintegro graduale al minutaggio gara.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA AZIONI BOTTOM (nascosta in stampa con print:hidden) */}
      <div className="flex justify-end gap-3 pt-1 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Stampa Report Clinico NSCA A4</span>
        </button>
      </div>

      <ModalLibreriaScientifica
        isOpen={isBiblioModalOpen}
        onClose={() => setIsBiblioModalOpen(false)}
      />
    </div>
  );
}

export default function TabCopilotPdf(props) {
  return (
    <CopilotErrorBoundary>
      <CopilotEngineInner {...props} />
    </CopilotErrorBoundary>
  );
}
