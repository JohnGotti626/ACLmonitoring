import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Sliders,
  CheckSquare,
  RotateCcw,
  User,
  Calendar,
  Activity,
  Zap,
  Footprints,
  TrendingDown,
  MessageSquare,
  CheckCircle2,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw
} from 'lucide-react';
import LogoN from './LogoN';
import ModalLibreriaScientifica, { DEFAULT_BIBLIO_SOURCES } from './ModalLibreriaScientifica';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { createTestObject, sortTestsByDate } from '../utils/testUtils';

// ============================================================================
// 1. DATABASE CITAZIONI SCIENTIFICHE & RATIONALE CLINICO (MODIFICABILE DALL'UTENTE)
// ============================================================================
export const EVIDENCE_BASED_CITATIONS = {
  lsiQuad: {
    id: 'lsiQuad',
    name: 'Knee Extension Seated (Quadricipite)',
    authors: 'Kyritsis et al., 2016 / Buckthorpe et al., 2019',
    journal: 'Br J Sports Med / Sports Med',
    title: 'Likelihood of ACL graft rupture after return to sport: Is limb symmetry index predictive of re-injury?',
    rationale: 'Il recupero della simmetria del quadricipite (LSI ≥ 90%) riduce fino al 75% il rischio di re-infortunio sul legamento crociato o sul ginocchio controlaterale.'
  },
  lsiFlex: {
    id: 'lsiFlex',
    name: 'Knee Flexion Prone (Ischiocrurali)',
    authors: 'Kyritsis et al., 2016',
    journal: 'Br J Sports Med',
    title: 'Hamstring strength symmetry and dynamic posterior tibial stability in ACLR athletes',
    rationale: 'Flessori simmetrici garantiscono la stabilizzazione dinamica posteriore della tibia e contrastano la traslazione anteriore nelle accelerazioni e virate.'
  },
  lsiBrakingImpulse: {
    id: 'lsiBrakingImpulse',
    name: 'Drop Jump Landing Force & Impulse',
    authors: 'Read et al., 2020',
    journal: 'Am J Sports Med',
    title: 'Eccentric Braking Impulse Asymmetry and Landing Mechanics Post-ACL Reconstruction',
    rationale: 'L\'asimmetria nell\'impulso di frenata eccentrica rivela deficit di assorbimento del carico in atterraggio monopodalico non rilevabili dai soli test isometrici.'
  },
  slCmjHeight: {
    id: 'slCmjHeight',
    name: 'Single Leg Jump (CMJ Monopodalico)',
    authors: 'Kotsifaki et al., 2021',
    journal: 'Br J Sports Med',
    title: 'Single-Leg Vertical Jump Biomechanics Post-ACL Reconstruction',
    rationale: 'Il CMJ monopodalico isola la capacità di produzione di potenza verticale triple-extension dell\'arto operato eliminando i compensi del sano.'
  },
  djRsi: {
    id: 'djRsi',
    name: 'Single Leg Drop Jump RSI & GCT',
    authors: 'Ebbs et al., 2023 / Lloyd et al., 2012',
    journal: 'J Strength Cond Res',
    title: 'Reactive Strength Index Modified & Tendon Stiffness in Post-ACLR Athletes',
    rationale: 'Rileva la rigidezza muscolo-tendinea (stiffness) e la tolleranza al ciclo allungamento-accorciamento (SSC rapido < 250ms), precondizione per l\'agilità agonistica.'
  },
  cmjRsiMod: {
    id: 'cmjRsiMod',
    name: 'Countermovement Jump Dinamica & RSImod',
    authors: 'Gathercole et al., 2015',
    journal: 'Int J Sports Physiol Perform',
    title: 'Alternative Countermovement Jump Variables to Monitor Neuromuscular Fatigue',
    rationale: 'Il RSImod da CMJ monitora la fatica neuromuscolare e la dinamica temporale di spinta senza compensi nel tempo di contrazione.'
  },
  peakPower: {
    id: 'peakPower',
    name: 'CMJ Potenza, Velocità & RFD',
    authors: 'Cormie et al., 2011',
    journal: 'Sports Med',
    title: 'Developing Maximal Neuromuscular Power: Part 1 and 2',
    rationale: 'La potenza di picco (W o W/kg), la velocità di stacco (m/s) e il RFD (N/s) quantificano l\'esplosività neuromuscolare complessiva.'
  },
  ikdcScore: {
    id: 'ikdcScore',
    name: 'Punteggio IKDC & PROMs',
    authors: 'Irrgang et al., 2001',
    journal: 'Am J Sports Med',
    title: 'Development and Validation of the International Knee Documentation Committee Subjective Knee Form',
    rationale: 'Gold-standard per la quantificazione della percezione di stabilità, dolore e funzionalità quotidiana/sportiva riferita dal paziente.'
  },
  lsiSingleHop: {
    id: 'lsiSingleHop',
    name: 'Single Hop for Distance',
    authors: 'Grindem et al., 2016',
    journal: 'Br J Sports Med',
    title: 'Simple decision rules reduce re-injury risk after anterior cruciate ligament reconstruction',
    rationale: 'Il salto singolo in avanti misura la capacità di proiezione orizzontale e controllo in decelerazione monopodale immediata.'
  },
  imtpForce: {
    id: 'imtpForce',
    name: 'Isometric Mid-Thigh Pull (IMTP)',
    authors: 'Comfort et al., 2019',
    journal: 'Sports Med',
    title: 'Standardizing the Isometric Mid-Thigh Pull: A Systematic Review',
    rationale: 'L\'IMTP valuta la massima forza verticale sviluppabile isometricamente su tutta la catena estensoria degli arti inferiori.'
  }
};

// ============================================================================
// 2. SCHEDE METRICHE CONFIGURABILI CON MAPPING RIGOROSO UNITA' DI MISURA
// ============================================================================
export const DEFAULT_REPORT_CARDS = [
  {
    id: 'card-1',
    title: 'Single Leg Drop Jump',
    icon: TrendingDown,
    citationKey: 'djRsi',
    selectedParam: 'sl_dj_rsi',
    parameters: [
      { id: 'sl_dj_rsi', label: 'Max RSI (m/s o index)' },
      { id: 'sl_dj_ct', label: 'Contact Time / GCT (ms)' },
      { id: 'sl_dj_height', label: 'Jump Height / Displacement (cm)' },
      { id: 'sl_dj_braking', label: 'Braking Force / Landing (N)' }
    ]
  },
  {
    id: 'card-2',
    title: 'Drop Jump Bilaterale',
    icon: TrendingDown,
    citationKey: 'lsiBrakingImpulse',
    selectedParam: 'dj_landing_force',
    parameters: [
      { id: 'dj_landing_force', label: 'Peak Landing Force SX vs DX (N)' },
      { id: 'dj_rsi_mod', label: 'Drop Jump RSI (m/s o index)' },
      { id: 'dj_contact_time', label: 'Contact Time / Time to Takeoff (ms)' },
      { id: 'dj_jump_height', label: 'Jump Height / Displacement (cm)' },
      { id: 'dj_conc_impulse', label: 'Concentric Impulse SX vs DX (N·s)' },
      { id: 'dj_braking_impulse', label: 'Braking Impulse (N·s)' },
      { id: 'dj_ttpf', label: 'Time to Peak Force - TTPF (ms)' }
    ]
  },
  {
    id: 'card-3',
    title: 'Single Leg Jump (SL CMJ)',
    icon: Footprints,
    citationKey: 'slCmjHeight',
    selectedParam: 'sl_cmj_height',
    parameters: [
      { id: 'sl_cmj_height', label: 'Single Leg Jump Height (cm)' },
      { id: 'sl_cmj_power', label: 'Peak Power SX vs DX (W)' },
      { id: 'sl_cmj_rsi', label: 'Single Leg RSI-modified (m/s)' },
      { id: 'sl_cmj_ecc_impulse', label: 'Eccentric Braking Impulse (N·s)' },
      { id: 'sl_cmj_depth', label: 'Countermovement Depth (cm)' },
      { id: 'sl_cmj_ct', label: 'Contraction Time (ms)' }
    ]
  },
  {
    id: 'card-4',
    title: 'Countermovement Jump (Dinamica)',
    icon: Zap,
    citationKey: 'cmjRsiMod',
    selectedParam: 'cmj_rsi_mod',
    parameters: [
      { id: 'cmj_rsi_mod', label: 'Max RSI-modified (m/s)' },
      { id: 'cmj_jump_height', label: 'Jump Height / Displacement (cm)' },
      { id: 'cmj_jump_height_m', label: 'Jump Height / Displacement (m)' },
      { id: 'cmj_contraction_time', label: 'Contraction Time / Time to Takeoff (ms)' },
      { id: 'cmj_contraction_time_s', label: 'Contraction Time / Time to Takeoff (s)' },
      { id: 'cmj_conc_impulse', label: 'Concentric Impulse SX vs DX (N·s)' },
      { id: 'cmj_braking_impulse', label: 'Eccentric Braking Impulse SX vs DX (N·s)' }
    ]
  },
  {
    id: 'card-5',
    title: 'Countermovement Jump (Esplosività)',
    icon: Zap,
    citationKey: 'peakPower',
    selectedParam: 'cmj_peak_power',
    parameters: [
      { id: 'cmj_peak_power', label: 'Max Peak Power (W)' },
      { id: 'cmj_peak_power_bm', label: 'Relative Peak Power (W/kg)' },
      { id: 'cmj_peak_velocity', label: 'Peak Takeoff Velocity (m/s)' },
      { id: 'cmj_rfd_braking', label: 'Eccentric Braking RFD (N/s)' },
      { id: 'cmj_depth', label: 'Countermovement Depth (cm)' }
    ]
  },
  {
    id: 'card-6',
    title: 'Knee Extension Seated (Quadricipite)',
    icon: Activity,
    citationKey: 'lsiQuad',
    selectedParam: 'quad_max_force_lr',
    parameters: [
      { id: 'quad_max_force_lr', label: 'Peak Force - Left vs Right (N)' },
      { id: 'quad_force_rel', label: 'Relative Peak Force (N/kg)' },
      { id: 'quad_lsi_pct', label: 'Limb Symmetry Index - LSI (%)' }
    ]
  },
  {
    id: 'card-7',
    title: 'Knee Flexion Prone (Ischiocrurali)',
    icon: Activity,
    citationKey: 'lsiFlex',
    selectedParam: 'flex_max_force_lr',
    parameters: [
      { id: 'flex_max_force_lr', label: 'Peak Force - Left vs Right (N)' },
      { id: 'flex_force_rel', label: 'Relative Peak Force (N/kg)' },
      { id: 'flex_lsi_pct', label: 'Limb Symmetry Index - LSI (%)' },
      { id: 'hq_ratio_pct', label: 'Hamstring / Quad H:Q Ratio (%)' }
    ]
  },
  {
    id: 'card-8',
    title: 'Isometric Mid-Thigh Pull & Hop Test',
    icon: Zap,
    citationKey: 'imtpForce',
    selectedParam: 'imtp_peak_force',
    parameters: [
      { id: 'imtp_peak_force', label: 'IMTP Peak Vertical Force (N)' },
      { id: 'imtp_force_rel', label: 'IMTP Relative Peak Force (N/kg)' },
      { id: 'single_hop_lsi', label: 'Single Hop LSI (%)' },
      { id: 'triple_hop_lsi', label: 'Triple Hop LSI (%)' }
    ]
  }
];

// ============================================================================
// 3. HELPER DI LETTURA RIGOROSA DALLE COLONNE SUPABASE CON FALLBACK CRONOLOGICO
// ============================================================================
const parseNum = (val) => {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  const cleaned = String(val).replace('%', '').replace(',', '.').trim();
  const n = Number(cleaned);
  return isNaN(n) || n <= 0 ? null : n;
};

const formatNum = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return 'N/D';
  if (decimals === 0) return String(Math.round(val));
  return Number(val).toFixed(decimals);
};

const calcDeltaPct = (curr, prev) => {
  if (curr === null || prev === null || prev <= 0) return null;
  const diff = ((curr - prev) / prev) * 100;
  if (Math.abs(diff) < 0.1) return '0.0%';
  return `${diff > 0 ? '↑ +' : '↓ '}${diff.toFixed(1)}%`;
};

const calcAsymmetryBadge = (leftVal, rightVal) => {
  if (leftVal === null || rightVal === null || (leftVal <= 0 && rightVal <= 0)) return null;
  const maxV = Math.max(leftVal, rightVal);
  const minV = Math.min(leftVal, rightVal);
  if (maxV <= 0) return null;
  const asymPct = ((maxV - minV) / maxV) * 100;
  if (asymPct < 0.5) return '0.0% Simmetrico';
  const dominantSide = leftVal >= rightVal ? 'Left' : 'Right';
  return `${asymPct.toFixed(1)}% ${dominantSide}`;
};

/**
 * Estrae i valori grezzi (Left/Right o Singolo Bilaterale) da un singolo oggetto test Supabase
 * per lo specifico parametro `paramId`, applicando il mapping rigoroso delle Unità di Misura:
 * - Jump Height / Displacement -> cm o m
 * - Peak / Mean Power -> W o W/kg
 * - Concentric / Braking Impulse -> N·s
 * - Peak Force / Landing Force -> N o N/kg
 * - RSI / RSI-modified -> m/s (index)
 * - Contraction Time / Time to Takeoff -> ms o s
 * - Peak Velocity -> m/s
 * - RFD (Rate of Force Development) -> N/s
 */
export function extractParamFromSingleTest(test, paramId, bodyMassKg = 75) {
  if (!test || typeof test !== 'object') return null;
  const bm = bodyMassKg > 0 ? bodyMassKg : 75;

  switch (paramId) {
    // --- CARD 1: SINGLE LEG DROP JUMP ---
    case 'sl_dj_rsi': {
      const l = parseNum(test.slDjRsiSX ?? test.sl_dj_rsi_sx ?? test.slCmjRsiSX ?? test.sl_cmj_rsi_sx);
      const r = parseNum(test.slDjRsiDX ?? test.sl_dj_rsi_dx ?? test.slCmjRsiDX ?? test.sl_cmj_rsi_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'm/s', decimals: 2, yMin: 0, yMax: 2.2 };
    }
    case 'sl_dj_ct': {
      const l = parseNum(test.slDjCtSX ?? test.sl_dj_ct_sx ?? test.slCmjCtSX ?? test.sl_cmj_ct_sx);
      const r = parseNum(test.slDjCtDX ?? test.sl_dj_ct_dx ?? test.slCmjCtDX ?? test.sl_cmj_ct_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'ms', decimals: 0, yMin: 100, yMax: 400 };
    }
    case 'sl_dj_height': {
      const l = parseNum(test.slDjHeightSX ?? test.sl_dj_height_sx ?? test.slCmjHeightSX ?? test.sl_cmj_height_sx);
      const r = parseNum(test.slDjHeightDX ?? test.sl_dj_height_dx ?? test.slCmjHeightDX ?? test.sl_cmj_height_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'cm', decimals: 1, yMin: 0, yMax: 35 };
    }
    case 'sl_dj_braking': {
      const l = parseNum(test.slDjBrakingSX ?? test.sl_dj_braking_sx ?? test.djLandingPeakSX ?? test.dj_landing_peak_sx);
      const r = parseNum(test.slDjBrakingDX ?? test.sl_dj_braking_dx ?? test.djLandingPeakDX ?? test.dj_landing_peak_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'N', decimals: 0, yMin: 0, yMax: 2500 };
    }

    // --- CARD 2: DROP JUMP BILATERALE ---
    case 'dj_landing_force': {
      const l = parseNum(test.djLandingPeakSX ?? test.dj_landing_peak_sx ?? test.slDjBrakingSX ?? test.sl_dj_braking_sx);
      const r = parseNum(test.djLandingPeakDX ?? test.dj_landing_peak_dx ?? test.slDjBrakingDX ?? test.sl_dj_braking_dx);
      if (l !== null || r !== null) {
        return { isDual: true, left: l, right: r, unit: 'N', decimals: 0, yMin: 0, yMax: 2500 };
      }
      const singleF = parseNum(test.djBrakingForce ?? test.dj_braking_force);
      if (singleF !== null) {
        return { isDual: false, single: singleF, unit: 'N', decimals: 0, yMin: 0, yMax: 3500 };
      }
      return null;
    }
    case 'dj_rsi_mod': {
      let rsi = parseNum(test.rsiDropJump ?? test.dj_rsi);
      if (rsi === null) {
        const jh = parseNum(test.djJumpHeight ?? test.dj_jump_height);
        const ct = parseNum(test.djContactTime ?? test.dj_contact_time);
        if (jh !== null && ct !== null && ct > 0) {
          rsi = parseFloat(((jh / 100) / (ct / 1000)).toFixed(2));
        }
      }
      if (rsi === null) return null;
      return { isDual: false, single: rsi, unit: 'm/s', decimals: 2, yMin: 0, yMax: 2.8 };
    }
    case 'dj_contact_time': {
      const ct = parseNum(test.djContactTime ?? test.dj_contact_time);
      if (ct === null) return null;
      return { isDual: false, single: ct, unit: 'ms', decimals: 0, yMin: 100, yMax: 350 };
    }
    case 'dj_jump_height': {
      const jh = parseNum(test.djJumpHeight ?? test.dj_jump_height);
      if (jh === null) return null;
      return { isDual: false, single: jh, unit: 'cm', decimals: 1, yMin: 0, yMax: 55 };
    }
    case 'dj_conc_impulse': {
      const l = parseNum(test.djConcImpulseSX ?? test.dj_conc_impulse_sx ?? test.concImpulseSX ?? test.conc_impulse_sx);
      const r = parseNum(test.djConcImpulseDX ?? test.dj_conc_impulse_dx ?? test.concImpulseDX ?? test.conc_impulse_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'N·s', decimals: 1, yMin: 0, yMax: 200 };
    }
    case 'dj_braking_impulse': {
      const bi = parseNum(test.djBrakingImpulse ?? test.dj_braking_impulse);
      if (bi !== null) {
        return { isDual: false, single: bi, unit: 'N·s', decimals: 1, yMin: 0, yMax: 250 };
      }
      const l = parseNum(test.eccBrakingSX ?? test.ecc_braking_sx);
      const r = parseNum(test.eccBrakingDX ?? test.ecc_braking_dx);
      if (l !== null || r !== null) {
        return { isDual: true, left: l, right: r, unit: 'N·s', decimals: 1, yMin: 0, yMax: 180 };
      }
      return null;
    }
    case 'dj_ttpf': {
      const ttpf = parseNum(test.djTtpfMs ?? test.dj_ttpf_ms);
      if (ttpf === null) return null;
      return { isDual: false, single: ttpf, unit: 'ms', decimals: 0, yMin: 40, yMax: 180 };
    }

    // --- CARD 3: SINGLE LEG JUMP (SL CMJ) ---
    case 'sl_cmj_height': {
      const l = parseNum(test.slCmjHeightSX ?? test.sl_cmj_height_sx);
      const r = parseNum(test.slCmjHeightDX ?? test.sl_cmj_height_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'cm', decimals: 1, yMin: 0, yMax: 30 };
    }
    case 'sl_cmj_power': {
      const l = parseNum(test.slCmjPeakPowerSX ?? test.sl_cmj_peak_power_sx);
      const r = parseNum(test.slCmjPeakPowerDX ?? test.sl_cmj_peak_power_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'W', decimals: 0, yMin: 0, yMax: 3000 };
    }
    case 'sl_cmj_rsi': {
      const l = parseNum(test.slCmjRsiSX ?? test.sl_cmj_rsi_sx);
      const r = parseNum(test.slCmjRsiDX ?? test.sl_cmj_rsi_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'm/s', decimals: 2, yMin: 0, yMax: 1.0 };
    }
    case 'sl_cmj_ecc_impulse': {
      const l = parseNum(test.slCmjEccImpulseSX ?? test.sl_cmj_ecc_impulse_sx ?? test.eccBrakingSX ?? test.ecc_braking_sx);
      const r = parseNum(test.slCmjEccImpulseDX ?? test.sl_cmj_ecc_impulse_dx ?? test.eccBrakingDX ?? test.ecc_braking_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'N·s', decimals: 1, yMin: 0, yMax: 150 };
    }
    case 'sl_cmj_depth': {
      const l = parseNum(test.slCmjDepthSX ?? test.sl_cmj_depth_sx);
      const r = parseNum(test.slCmjDepthDX ?? test.sl_cmj_depth_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'cm', decimals: 1, yMin: 0, yMax: 45 };
    }
    case 'sl_cmj_ct': {
      const l = parseNum(test.slCmjCtSX ?? test.sl_cmj_ct_sx);
      const r = parseNum(test.slCmjCtDX ?? test.sl_cmj_ct_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'ms', decimals: 0, yMin: 200, yMax: 1100 };
    }

    // --- CARD 4: COUNTERMOVEMENT JUMP (DINAMICA) ---
    case 'cmj_rsi_mod': {
      let rsi = parseNum(test.rsiCmj ?? test.rsi_cmj ?? test.rsi_mod);
      if (rsi === null) {
        const jh = parseNum(test.jumpHeight ?? test.jump_height_cm ?? test.altezza_salto);
        const ct = parseNum(test.contractionTime ?? test.contraction_time_ms ?? test.tempo_contrazione);
        if (jh !== null && ct !== null && ct > 0) {
          rsi = parseFloat(((jh / 100) / (ct / 1000)).toFixed(2));
        }
      }
      if (rsi === null) return null;
      return { isDual: false, single: rsi, unit: 'm/s', decimals: 2, yMin: 0, yMax: 1.0 };
    }
    case 'cmj_jump_height': {
      const jh = parseNum(test.jumpHeight ?? test.jump_height_cm ?? test.altezza_salto);
      if (jh === null) return null;
      return { isDual: false, single: jh, unit: 'cm', decimals: 1, yMin: 0, yMax: 60 };
    }
    case 'cmj_jump_height_m': {
      const jh = parseNum(test.jumpHeight ?? test.jump_height_cm ?? test.altezza_salto);
      if (jh === null) return null;
      return { isDual: false, single: parseFloat((jh / 100).toFixed(2)), unit: 'm', decimals: 2, yMin: 0, yMax: 0.7 };
    }
    case 'cmj_contraction_time': {
      const ct = parseNum(test.contractionTime ?? test.contraction_time_ms ?? test.tempo_contrazione);
      if (ct === null) return null;
      return { isDual: false, single: ct, unit: 'ms', decimals: 0, yMin: 300, yMax: 1100 };
    }
    case 'cmj_contraction_time_s': {
      const ct = parseNum(test.contractionTime ?? test.contraction_time_ms ?? test.tempo_contrazione);
      if (ct === null) return null;
      return { isDual: false, single: parseFloat((ct / 1000).toFixed(2)), unit: 's', decimals: 2, yMin: 0.3, yMax: 1.2 };
    }
    case 'cmj_conc_impulse': {
      const l = parseNum(test.concImpulseSX ?? test.conc_impulse_sx ?? test.djConcImpulseSX ?? test.dj_conc_impulse_sx);
      const r = parseNum(test.concImpulseDX ?? test.conc_impulse_dx ?? test.djConcImpulseDX ?? test.dj_conc_impulse_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'N·s', decimals: 1, yMin: 0, yMax: 180 };
    }
    case 'cmj_braking_impulse': {
      const l = parseNum(test.eccBrakingSX ?? test.ecc_braking_sx ?? test.slCmjEccImpulseSX ?? test.sl_cmj_ecc_impulse_sx);
      const r = parseNum(test.eccBrakingDX ?? test.ecc_braking_dx ?? test.slCmjEccImpulseDX ?? test.sl_cmj_ecc_impulse_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'N·s', decimals: 1, yMin: 0, yMax: 160 };
    }

    // --- CARD 5: COUNTERMOVEMENT JUMP (ESPLOSIVITÀ: POWER, VELOCITY, RFD, DEPTH) ---
    case 'cmj_peak_power': {
      const pp = parseNum(test.peakPower ?? test.peak_power_w ?? test.potenza_picco);
      if (pp === null) return null;
      return { isDual: false, single: pp, unit: 'W', decimals: 0, yMin: 1000, yMax: 6000 };
    }
    case 'cmj_peak_power_bm': {
      const pp = parseNum(test.peakPower ?? test.peak_power_w ?? test.potenza_picco);
      if (pp === null) return null;
      return { isDual: false, single: parseFloat((pp / bm).toFixed(1)), unit: 'W/kg', decimals: 1, yMin: 20, yMax: 80 };
    }
    case 'cmj_peak_velocity': {
      const pv = parseNum(test.peakVelocity ?? test.peak_velocity_ms);
      if (pv !== null) {
        return { isDual: false, single: pv, unit: 'm/s', decimals: 2, yMin: 1.0, yMax: 4.0 };
      }
      // Derivazione fisica rigorosa da Jump Height (v = sqrt(2 * g * h)) se non salvata separatamente
      const jh = parseNum(test.jumpHeight ?? test.jump_height_cm ?? test.altezza_salto);
      if (jh !== null && jh > 0) {
        const vel = Math.sqrt(2 * 9.81 * (jh / 100));
        return { isDual: false, single: parseFloat(vel.toFixed(2)), unit: 'm/s', decimals: 2, yMin: 1.0, yMax: 4.0 };
      }
      return null;
    }
    case 'cmj_rfd_braking': {
      const rfd = parseNum(test.eccBrakingRfd ?? test.ecc_braking_rfd ?? test.eccentric_braking_rfd);
      if (rfd === null) return null;
      return { isDual: false, single: rfd, unit: 'N/s', decimals: 0, yMin: 0, yMax: 12000 };
    }
    case 'cmj_depth': {
      const d = parseNum(test.cmjDepth ?? test.cmj_depth ?? test.countermovement_depth);
      if (d === null) return null;
      return { isDual: false, single: d, unit: 'cm', decimals: 1, yMin: 10, yMax: 50 };
    }

    // --- CARD 6: KNEE EXTENSION SEATED (QUADRICIPITE) ---
    case 'quad_max_force_lr': {
      const l = parseNum(test.quadSano ?? test.iso_leg_ext_sx);
      const r = parseNum(test.quadOp ?? test.iso_leg_ext_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'N', decimals: 0, yMin: 0, yMax: 1000 };
    }
    case 'quad_force_rel': {
      const l = parseNum(test.quadSano ?? test.iso_leg_ext_sx);
      const r = parseNum(test.quadOp ?? test.iso_leg_ext_dx);
      if (l === null && r === null) return null;
      return {
        isDual: true,
        left: l !== null ? parseFloat((l / bm).toFixed(2)) : null,
        right: r !== null ? parseFloat((r / bm).toFixed(2)) : null,
        unit: 'N/kg',
        decimals: 2,
        yMin: 0,
        yMax: 14
      };
    }
    case 'quad_lsi_pct': {
      let lsi = parseNum(test.lsiQuad ?? test.lsi_quad_calculated);
      if (lsi === null) {
        const l = parseNum(test.quadSano ?? test.iso_leg_ext_sx);
        const r = parseNum(test.quadOp ?? test.iso_leg_ext_dx);
        if (l !== null && r !== null) {
          lsi = parseFloat(((Math.min(l, r) / Math.max(l, r)) * 100).toFixed(1));
        }
      }
      if (lsi === null) return null;
      return { isDual: false, single: lsi, unit: '%', decimals: 1, yMin: 40, yMax: 105 };
    }

    // --- CARD 7: KNEE FLEXION PRONE (ISCHIOCRURALI) ---
    case 'flex_max_force_lr': {
      const l = parseNum(test.flexSano ?? test.iso_leg_curl_sx);
      const r = parseNum(test.flexOp ?? test.iso_leg_curl_dx);
      if (l === null && r === null) return null;
      return { isDual: true, left: l, right: r, unit: 'N', decimals: 0, yMin: 0, yMax: 500 };
    }
    case 'flex_force_rel': {
      const l = parseNum(test.flexSano ?? test.iso_leg_curl_sx);
      const r = parseNum(test.flexOp ?? test.iso_leg_curl_dx);
      if (l === null && r === null) return null;
      return {
        isDual: true,
        left: l !== null ? parseFloat((l / bm).toFixed(2)) : null,
        right: r !== null ? parseFloat((r / bm).toFixed(2)) : null,
        unit: 'N/kg',
        decimals: 2,
        yMin: 0,
        yMax: 8
      };
    }
    case 'flex_lsi_pct': {
      let lsi = parseNum(test.lsiFlex ?? test.lsi_curl_calculated);
      if (lsi === null) {
        const l = parseNum(test.flexSano ?? test.iso_leg_curl_sx);
        const r = parseNum(test.flexOp ?? test.iso_leg_curl_dx);
        if (l !== null && r !== null) {
          lsi = parseFloat(((Math.min(l, r) / Math.max(l, r)) * 100).toFixed(1));
        }
      }
      if (lsi === null) return null;
      return { isDual: false, single: lsi, unit: '%', decimals: 1, yMin: 40, yMax: 105 };
    }
    case 'hq_ratio_pct': {
      const fOp = parseNum(test.flexOp ?? test.iso_leg_curl_dx);
      const qOp = parseNum(test.quadOp ?? test.iso_leg_ext_dx);
      const fSano = parseNum(test.flexSano ?? test.iso_leg_curl_sx);
      const qSano = parseNum(test.quadSano ?? test.iso_leg_ext_sx);
      const lRatio = fSano !== null && qSano !== null && qSano > 0 ? parseFloat(((fSano / qSano) * 100).toFixed(1)) : null;
      const rRatio = fOp !== null && qOp !== null && qOp > 0 ? parseFloat(((fOp / qOp) * 100).toFixed(1)) : null;
      if (lRatio === null && rRatio === null) return null;
      return { isDual: true, left: lRatio, right: rRatio, unit: '%', decimals: 1, yMin: 30, yMax: 90 };
    }

    // --- CARD 8: IMTP & HOP TEST ---
    case 'imtp_peak_force': {
      const f = parseNum(test.imtpForce ?? test.imtp_peak_force);
      if (f === null) return null;
      return { isDual: false, single: f, unit: 'N', decimals: 0, yMin: 1000, yMax: 4000 };
    }
    case 'imtp_force_rel': {
      const f = parseNum(test.imtpForce ?? test.imtp_peak_force);
      if (f === null) return null;
      return { isDual: false, single: parseFloat((f / bm).toFixed(1)), unit: 'N/kg', decimals: 1, yMin: 15, yMax: 55 };
    }
    case 'single_hop_lsi': {
      const sh = parseNum(test.lsiSingleHop ?? test.lsi_single_hop);
      if (sh === null) return null;
      return { isDual: false, single: sh, unit: '%', decimals: 1, yMin: 50, yMax: 105 };
    }
    case 'triple_hop_lsi': {
      const th = parseNum(test.lsiTripleHop ?? test.lsi_triple_hop);
      if (th === null) return null;
      return { isDual: false, single: th, unit: '%', decimals: 1, yMin: 50, yMax: 105 };
    }

    default:
      return null;
  }
}

/**
 * Risolve i dati reali per una scheda fino alla sessione selezionata (`selectedTest`),
 * applicando il lookback cronologico persistente se la sessione corrente non ha registrato
 * quello specifico parametro, e calcolando il delta % rispetto alla sessione valida precedente.
 */
function resolveCardMetricData(paramId, selectedTest, allSortedTests, bodyMassKg = 75) {
  const validTests = Array.isArray(allSortedTests) ? allSortedTests : [];
  if (validTests.length === 0) {
    // Determina comunque l'unità corretta anche senza dati registrati
    const dummyUnits = {
      sl_dj_rsi: 'm/s',
      sl_dj_ct: 'ms',
      sl_dj_height: 'cm',
      sl_dj_braking: 'N',
      dj_landing_force: 'N',
      dj_rsi_mod: 'm/s',
      dj_contact_time: 'ms',
      dj_jump_height: 'cm',
      dj_conc_impulse: 'N·s',
      dj_braking_impulse: 'N·s',
      dj_ttpf: 'ms',
      sl_cmj_height: 'cm',
      sl_cmj_power: 'W',
      sl_cmj_rsi: 'm/s',
      sl_cmj_ecc_impulse: 'N·s',
      sl_cmj_depth: 'cm',
      sl_cmj_ct: 'ms',
      cmj_rsi_mod: 'm/s',
      cmj_jump_height: 'cm',
      cmj_jump_height_m: 'm',
      cmj_contraction_time: 'ms',
      cmj_contraction_time_s: 's',
      cmj_conc_impulse: 'N·s',
      cmj_braking_impulse: 'N·s',
      cmj_peak_power: 'W',
      cmj_peak_power_bm: 'W/kg',
      cmj_peak_velocity: 'm/s',
      cmj_rfd_braking: 'N/s',
      cmj_depth: 'cm',
      quad_max_force_lr: 'N',
      quad_force_rel: 'N/kg',
      quad_lsi_pct: '%',
      flex_max_force_lr: 'N',
      flex_force_rel: 'N/kg',
      flex_lsi_pct: '%',
      hq_ratio_pct: '%',
      imtp_peak_force: 'N',
      imtp_force_rel: 'N/kg',
      single_hop_lsi: '%',
      triple_hop_lsi: '%'
    };
    return {
      hasData: false,
      isDual: false,
      leftFormatted: 'N/D',
      rightFormatted: 'N/D',
      unit: dummyUnits[paramId] || '',
      leftChange: null,
      rightChange: null,
      asymmetry: null,
      sourceDate: null,
      isHistoricalFallback: false,
      series: [],
      yMin: 0,
      yMax: 100
    };
  }

  // Individua l'indice del test selezionato (o l'ultimo test disponibile)
  const selectedIdx = selectedTest
    ? validTests.findIndex((t) => String(t.id) === String(selectedTest.id))
    : validTests.length - 1;
  const maxIdx = selectedIdx >= 0 ? selectedIdx : validTests.length - 1;

  // Estrai la serie storica di tutti i test in cui la metrica è presente
  const series = [];
  validTests.forEach((t, idx) => {
    const extracted = extractParamFromSingleTest(t, paramId, bodyMassKg);
    if (extracted) {
      series.push({
        testIdx: idx,
        testId: t.id,
        date: t.date || t.data_valutazione || `Test #${idx + 1}`,
        label: t.label || `Test #${idx + 1}`,
        ...extracted
      });
    }
  });

  // Trova l'ultima rilevazione valida <= maxIdx (oppure l'ultima assoluta se registrata dopo)
  const candidatesUpToSelected = series.filter((s) => s.testIdx <= maxIdx);
  const currentEntry =
    candidatesUpToSelected.length > 0
      ? candidatesUpToSelected[candidatesUpToSelected.length - 1]
      : series.length > 0
      ? series[series.length - 1]
      : null;

  if (!currentEntry) {
    return resolveCardMetricData(paramId, null, [], bodyMassKg);
  }

  // Trova la rilevazione immediatamente precedente per il calcolo del delta %
  const currentSeriesPos = series.findIndex((s) => s.testId === currentEntry.testId);
  const prevEntry = currentSeriesPos > 0 ? series[currentSeriesPos - 1] : null;

  if (currentEntry.isDual) {
    const leftChange = prevEntry ? calcDeltaPct(currentEntry.left, prevEntry.left) : null;
    const rightChange = prevEntry ? calcDeltaPct(currentEntry.right, prevEntry.right) : null;
    const asymmetry = calcAsymmetryBadge(currentEntry.left, currentEntry.right);

    return {
      hasData: true,
      isDual: true,
      leftFormatted: formatNum(currentEntry.left, currentEntry.decimals),
      rightFormatted: formatNum(currentEntry.right, currentEntry.decimals),
      unit: currentEntry.unit,
      leftChange,
      rightChange,
      asymmetry,
      sourceDate: currentEntry.date,
      isHistoricalFallback: currentEntry.testIdx !== maxIdx,
      series,
      yMin: currentEntry.yMin,
      yMax: currentEntry.yMax,
      decimals: currentEntry.decimals
    };
  } else {
    const singleChange = prevEntry ? calcDeltaPct(currentEntry.single, prevEntry.single) : null;
    return {
      hasData: true,
      isDual: false,
      leftFormatted: formatNum(currentEntry.single, currentEntry.decimals),
      rightFormatted: null,
      unit: currentEntry.unit,
      leftChange: singleChange,
      rightChange: null,
      asymmetry: null,
      sourceDate: currentEntry.date,
      isHistoricalFallback: currentEntry.testIdx !== maxIdx,
      series,
      yMin: currentEntry.yMin,
      yMax: currentEntry.yMax,
      decimals: currentEntry.decimals
    };
  }
}

// ============================================================================
// 4. MICRO-GRAFICO SVG BASATO ESCLUSIVAMENTE SUI DATI REALI SUPABASE
// ============================================================================
function CardTrendChartSvg({ metricData }) {
  const width = 230;
  const height = 90;
  const paddingLeft = 34;
  const paddingRight = 50;
  const paddingTop = 12;
  const paddingBottom = 16;

  const { hasData, isDual, series = [], yMin = 0, yMax = 100, unit = '', decimals = 1 } = metricData || {};

  if (!hasData || series.length === 0) {
    return (
      <div className="relative w-full h-[90px] bg-slate-50 border border-slate-200 rounded-lg p-2 flex flex-col items-center justify-center text-center font-sans">
        <span className="text-[9px] font-bold text-slate-400">Nessun dato registrato su Supabase</span>
        <span className="text-[7.5px] text-slate-400 mt-0.5">Inserisci una valutazione nella Batteria Test</span>
      </div>
    );
  }

  // Calcola scala Y dinamica sui valori reali del paziente
  const allVals = [];
  series.forEach((s) => {
    if (s.isDual) {
      if (s.left !== null) allVals.push(s.left);
      if (s.right !== null) allVals.push(s.right);
    } else if (s.single !== null) {
      allVals.push(s.single);
    }
  });

  const dataMin = allVals.length > 0 ? Math.min(...allVals) : yMin;
  const dataMax = allVals.length > 0 ? Math.max(...allVals) : yMax;

  const minScale = Math.max(0, Math.min(yMin, dataMin * 0.8));
  const maxScale = Math.max(minScale + 0.1, Math.max(yMax, dataMax * 1.15));
  const range = maxScale - minScale > 0 ? maxScale - minScale : 1;

  const yTicks = [
    minScale,
    minScale + range * 0.33,
    minScale + range * 0.66,
    maxScale
  ].map((v) => (decimals === 0 ? Math.round(v) : Number(v.toFixed(decimals === 2 ? 1 : decimals))));

  const mapPoint = (val, i, total) => {
    const x =
      total > 1
        ? paddingLeft + (i / (total - 1)) * (width - paddingLeft - paddingRight)
        : (width - paddingLeft - paddingRight) / 2 + paddingLeft;
    const clamped = Math.min(maxScale, Math.max(minScale, val ?? minScale));
    const y = height - paddingBottom - ((clamped - minScale) / range) * (height - paddingTop - paddingBottom);
    return { x, y, val };
  };

  const leftPoints = series
    .map((s, i) => {
      const v = s.isDual ? s.left : s.single;
      return v !== null && v !== undefined ? mapPoint(v, i, series.length) : null;
    })
    .filter(Boolean);

  const rightPoints = isDual
    ? series
        .map((s, i) => (s.right !== null && s.right !== undefined ? mapPoint(s.right, i, series.length) : null))
        .filter(Boolean)
    : [];

  const leftPoly = leftPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const rightPoly = rightPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const normY1 = height - paddingBottom - 0.72 * (height - paddingTop - paddingBottom);
  const normY2 = height - paddingBottom - 0.38 * (height - paddingTop - paddingBottom);

  const lastLeft = leftPoints.length > 0 ? leftPoints[leftPoints.length - 1].val : null;
  const lastRight = rightPoints.length > 0 ? rightPoints[rightPoints.length - 1].val : null;

  return (
    <div className="relative w-full h-[90px] bg-[#f8fafc] border border-slate-200 rounded-lg p-1 font-sans">
      <svg width="100%" height="90" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Banda Normativa Target */}
        <rect
          x={paddingLeft}
          y={normY1}
          width={width - paddingLeft - paddingRight}
          height={Math.max(14, normY2 - normY1)}
          fill="#e2e8f0"
          opacity="0.65"
          rx="3"
        />

        {/* Griglia Asse Y */}
        {yTicks.map((tick, idx) => {
          const yPos = height - paddingBottom - ((tick - minScale) / range) * (height - paddingTop - paddingBottom);
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="#cbd5e1"
                strokeWidth="0.75"
                strokeDasharray="2 2"
              />
              <text
                x={paddingLeft - 3}
                y={yPos + 2.5}
                textAnchor="end"
                fontSize="6.5"
                fill="#64748b"
                fontWeight="700"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Linee Dati Reali */}
        {isDual ? (
          <>
            {leftPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={leftPoly}
              />
            )}
            {rightPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={rightPoly}
              />
            )}
            {leftPoints.map((p, i) => (
              <circle key={`l-${i}`} cx={p.x} cy={p.y} r="2.8" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
            ))}
            {rightPoints.map((p, i) => (
              <circle key={`r-${i}`} cx={p.x} cy={p.y} r="2.8" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
            ))}
          </>
        ) : (
          <>
            {leftPoints.length > 1 && (
              <polyline
                fill="none"
                stroke="#0f172a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={leftPoly}
              />
            )}
            {leftPoints.map((p, i) => (
              <circle key={`s-${i}`} cx={p.x} cy={p.y} r="3" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
            ))}
          </>
        )}
      </svg>

      {/* Targhette Valore Finale con Unità di Misura Corretta */}
      <div className="absolute right-1 top-2 flex flex-col gap-1 pointer-events-none">
        {isDual ? (
          <>
            {lastLeft !== null && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-300 font-mono text-[7px] font-extrabold flex items-center gap-0.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                SX {formatNum(lastLeft, decimals)} {unit}
              </span>
            )}
            {lastRight !== null && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-300 font-mono text-[7px] font-extrabold flex items-center gap-0.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                DX {formatNum(lastRight, decimals)} {unit}
              </span>
            )}
          </>
        ) : (
          lastLeft !== null && (
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[7px] font-extrabold shadow-sm">
              {formatNum(lastLeft, decimals)} {unit}
            </span>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 5. SCHEDA METRICA IN STILE VALD / FORCEDECKS CON RATIONALE MODIFICABILE
// ============================================================================
function ValdMetricCard({
  card,
  tests,
  selectedTest,
  bodyMassKg,
  showCitations,
  citationsMap,
  onUpdateCitation,
  onChangeParam,
  onRemoveCard
}) {
  const [isEditingRationale, setIsEditingRationale] = useState(false);
  const IconComp = card.icon || Activity;

  const citation =
    (citationsMap && citationsMap[card.citationKey]) ||
    EVIDENCE_BASED_CITATIONS[card.citationKey] ||
    EVIDENCE_BASED_CITATIONS.lsiQuad;

  const metricData = useMemo(
    () => resolveCardMetricData(card.selectedParam, selectedTest, tests, bodyMassKg),
    [card.selectedParam, selectedTest, tests, bodyMassKg]
  );

  const {
    isDual,
    leftFormatted,
    rightFormatted,
    unit,
    leftChange,
    rightChange,
    asymmetry,
    sourceDate,
    isHistoricalFallback
  } = metricData;

  return (
    <div
      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
      className="print-report-card report-card-vald bg-white border border-slate-300 rounded-xl p-3 shadow-sm space-y-2 flex flex-col justify-between break-inside-avoid text-slate-900 font-sans"
    >
      {/* HEADER CARD */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 border border-slate-300 text-slate-700 shrink-0">
            <IconComp className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-slate-900 leading-tight">{card.title}</h4>
              {isHistoricalFallback && sourceDate && (
                <span
                  className="text-[7px] font-mono font-bold px-1 py-0.2 bg-amber-50 text-amber-800 border border-amber-300 rounded"
                  title="Ultimo dato registrato cronologicamente"
                >
                  Dato del {sourceDate}
                </span>
              )}
            </div>

            {/* PARAMETER SELECTION DROPDOWN */}
            <div className="flex items-center gap-1 mt-0.5">
              <select
                value={card.selectedParam}
                onChange={(e) => onChangeParam(card.id, e.target.value)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[8.5px] font-bold border border-slate-300 rounded px-1 py-0.5 focus:outline-none focus:border-cyan-500 cursor-pointer no-print"
              >
                {card.parameters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="hidden print-only-inline text-[8.5px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                {card.parameters.find((p) => p.id === card.selectedParam)?.label || card.selectedParam}
              </span>
            </div>
          </div>
        </div>

        {onRemoveCard && (
          <button
            onClick={() => onRemoveCard(card.id)}
            title="Rimuovi Scheda"
            className="text-slate-400 hover:text-rose-500 p-0.5 no-print cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* BODY CARD: VALORI REALI SUPABASE + UNITA' DI MISURA A SINISTRA vs GRAFICO A DESTRA */}
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-5 space-y-1">
          {isDual ? (
            <div className="space-y-1">
              <div>
                <span className="text-blue-700 text-[8px] font-extrabold block uppercase tracking-wider">
                  Left (SX)
                </span>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <strong className="text-sm font-black text-slate-900">
                    {leftFormatted}{' '}
                    {leftFormatted !== 'N/D' && (
                      <span className="text-[9px] font-bold text-slate-600">{unit}</span>
                    )}
                  </strong>
                  {leftChange && (
                    <span
                      className={`text-[7.5px] font-extrabold px-1 rounded border ${
                        leftChange.startsWith('↓')
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      {leftChange}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-red-700 text-[8px] font-extrabold block uppercase tracking-wider">
                  Right (DX)
                </span>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <strong className="text-sm font-black text-slate-900">
                    {rightFormatted}{' '}
                    {rightFormatted !== 'N/D' && (
                      <span className="text-[9px] font-bold text-slate-600">{unit}</span>
                    )}
                  </strong>
                  {rightChange && (
                    <span
                      className={`text-[7.5px] font-extrabold px-1 rounded border ${
                        rightChange.startsWith('↓')
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}
                    >
                      {rightChange}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-lg font-black text-slate-900 tracking-tight">
                {leftFormatted}{' '}
                {leftFormatted !== 'N/D' && (
                  <span className="text-xs font-bold text-slate-600">{unit}</span>
                )}
              </div>
              {leftChange && (
                <span
                  className={`inline-block text-[8px] font-extrabold px-1 rounded border mt-0.5 ${
                    leftChange.startsWith('↓')
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {leftChange}
                </span>
              )}
            </div>
          )}

          {/* BADGE ASIMMETRIA CALCOLATA DAI DATI REALI */}
          {asymmetry && (
            <div className="text-[8px] font-extrabold text-blue-800 mt-1">
              Asym. <span className="font-black">{asymmetry}</span>
            </div>
          )}
        </div>

        {/* MICRO-CHART SVG SUI DATI REALI */}
        <div className="col-span-7">
          <CardTrendChartSvg metricData={metricData} />
        </div>
      </div>

      {/* FOOTER CARD: REFERENCE SCIENTIFICA & RATIONALE MODIFICABILE */}
      {showCitations && (
        <div className="pt-1 border-t border-slate-200">
          <div className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-[7.5px] leading-tight text-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-[6.5px] uppercase tracking-wider">
                Scientific Reference: {citation.authors} ({citation.journal})
              </span>
              <button
                type="button"
                onClick={() => setIsEditingRationale((v) => !v)}
                className="text-cyan-700 hover:text-cyan-900 font-bold text-[7px] flex items-center gap-0.5 no-print cursor-pointer"
                title="Modifica il Rationale di questa scheda"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>{isEditingRationale ? 'Chiudi' : 'Modifica Rationale'}</span>
              </button>
            </div>

            {isEditingRationale ? (
              <div className="mt-1 space-y-1 no-print">
                <textarea
                  rows={2}
                  value={citation.rationale || ''}
                  onChange={(e) =>
                    onUpdateCitation &&
                    onUpdateCitation(card.citationKey, { rationale: e.target.value })
                  }
                  className="w-full bg-white border border-cyan-500 rounded p-1 text-[8px] text-slate-900 focus:outline-none"
                  placeholder="Scrivi il Rationale clinico personalizzato..."
                />
              </div>
            ) : null}

            <div className="text-[7px] text-slate-700 italic mt-0.5 leading-snug">
              <strong className="not-italic text-slate-900">Rationale:</strong> {citation.rationale}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. COMPONENTE PRINCIPALE: CONFIGURATORE REPORT STAMPA VALD / FORCEDECKS A4
// ============================================================================
export default function PrintConfiguratorModal({ isOpen, onClose, patient, patients = [] }) {
  const activePatients =
    patients && patients.length > 0
      ? patients.filter(
          (p) => !p.stato || p.stato === 'In Carico' || p.stato === 'Attivo' || p.stato !== 'Archiviato'
        )
      : patient
      ? [patient]
      : [];

  const [selectedPatientId, setSelectedPatientId] = useState(
    patient?.id || activePatients[0]?.id || ''
  );
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [reportCards, setReportCards] = useState(DEFAULT_REPORT_CARDS);

  // Stato test caricati direttamente da Supabase (`evaluations` + `patient.tests`)
  const [supabaseTests, setSupabaseTests] = useState([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);

  // Stato Note / Commento Clinico del Fisioterapista (sincronizzato e modificabile)
  const [showPhysioNotes, setShowPhysioNotes] = useState(true);
  const [physioNotes, setPhysioNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSavedToast, setNotesSavedToast] = useState(false);

  // Stato IKDC & Citazioni Scientifiche Modificabili
  const [showIkdc, setShowIkdc] = useState(true);
  const [ikdcScore, setIkdcScore] = useState('');
  const [showCitations, setShowCitations] = useState(true);
  const [isBiblioModalOpen, setIsBiblioModalOpen] = useState(false);

  // Mappa delle Citazioni e Rationale personalizzabili dall'utente (persistita in localStorage)
  const [citationsMap, setCitationsMap] = useState(() => {
    try {
      const saved = localStorage.getItem('acl_report_citations_v2');
      if (saved) {
        return { ...EVIDENCE_BASED_CITATIONS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn(e);
    }
    return EVIDENCE_BASED_CITATIONS;
  });

  const [biblioSources, setBiblioSources] = useState(() => {
    try {
      const saved = localStorage.getItem('acl_biblio_sources_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_BIBLIO_SOURCES;
  });

  useEffect(() => {
    if (patient?.id) {
      setSelectedPatientId(patient.id);
    } else if (activePatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(activePatients[0].id);
    }
  }, [patient?.id, patients]);

  const activePatientObj =
    activePatients.find((p) => String(p.id) === String(selectedPatientId)) ||
    (patient?.nome ? patient : activePatients[0]);

  // Caricamento diretto e sincronizzazione con la tabella `evaluations` di Supabase
  useEffect(() => {
    let isMounted = true;
    const fetchPatientEvaluations = async () => {
      if (!activePatientObj?.id) {
        setSupabaseTests([]);
        return;
      }

      const localTests = Array.isArray(activePatientObj.tests)
        ? activePatientObj.tests.flat(Infinity).filter((t) => t && typeof t === 'object' && !Array.isArray(t))
        : [];

      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setSupabaseTests(sortTestsByDate(localTests));
        }
        return;
      }

      setIsLoadingTests(true);
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .eq('patient_id', activePatientObj.id)
          .order('data_valutazione', { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          const mappedFromDb = data.map((row, idx) => createTestObject(row, activePatientObj.id, idx + 1));
          // Unisci evitando duplicati per ID o data
          const byId = new Map();
          localTests.forEach((t) => byId.set(String(t.id), t));
          mappedFromDb.forEach((t) => byId.set(String(t.id), t));
          const merged = sortTestsByDate(Array.from(byId.values()));
          if (isMounted) setSupabaseTests(merged);
        } else {
          if (isMounted) setSupabaseTests(sortTestsByDate(localTests));
        }
      } catch (err) {
        console.warn('Errore lettura evaluations da Supabase:', err);
        if (isMounted) setSupabaseTests(sortTestsByDate(localTests));
      } finally {
        if (isMounted) setIsLoadingTests(false);
      }
    };

    fetchPatientEvaluations();
    return () => {
      isMounted = false;
    };
  }, [activePatientObj?.id, activePatientObj?.tests]);

  // Inizializza Note del Fisioterapista dal paziente selezionato (localStorage o campo note_operative Supabase)
  useEffect(() => {
    if (!activePatientObj?.id) return;
    const storageKey = `acl_report_notes_${activePatientObj.id}`;
    const savedCustomNote = localStorage.getItem(storageKey);
    if (savedCustomNote !== null) {
      setPhysioNotes(savedCustomNote);
    } else if (activePatientObj.note_operative) {
      setPhysioNotes(activePatientObj.note_operative);
    } else {
      setPhysioNotes('');
    }
  }, [activePatientObj?.id, activePatientObj?.note_operative]);

  const handleNotesChange = (val) => {
    setPhysioNotes(val);
    if (activePatientObj?.id) {
      try {
        localStorage.setItem(`acl_report_notes_${activePatientObj.id}`, val);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleSaveNotesToSupabase = async () => {
    if (!activePatientObj?.id) return;
    setIsSavingNotes(true);
    try {
      localStorage.setItem(`acl_report_notes_${activePatientObj.id}`, physioNotes);
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('pazienti')
          .update({ note_operative: physioNotes })
          .eq('id', activePatientObj.id);
      }
      setNotesSavedToast(true);
      setTimeout(() => setNotesSavedToast(false), 2500);
    } catch (e) {
      console.warn('Errore salvataggio note:', e);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Seleziona automaticamente l'ultima sessione cronologica
  useEffect(() => {
    if (supabaseTests.length > 0) {
      const exists = supabaseTests.some((t) => String(t.id) === String(selectedSessionId));
      if (!selectedSessionId || !exists) {
        setSelectedSessionId(String(supabaseTests[supabaseTests.length - 1].id));
      }
    } else {
      setSelectedSessionId('');
    }
  }, [supabaseTests]);

  const selectedTest =
    supabaseTests.find((t) => String(t.id) === String(selectedSessionId)) ||
    (supabaseTests.length > 0 ? supabaseTests[supabaseTests.length - 1] : null);

  // Sincronizza punteggio IKDC reale dal test o dal profilo paziente
  useEffect(() => {
    if (activePatientObj) {
      const currentIkdc =
        selectedTest?.ikdc ??
        selectedTest?.ikdc_score ??
        activePatientObj?.ikdc ??
        activePatientObj?.aclrsi_score_iniziale;
      if (currentIkdc !== undefined && currentIkdc !== null && currentIkdc !== '') {
        setIkdcScore(String(currentIkdc));
      } else {
        setIkdcScore('');
      }
    }
  }, [selectedPatientId, selectedSessionId, selectedTest, activePatientObj]);

  if (!isOpen) return null;

  // Aggiornamento Rationale / Citazione
  const handleUpdateCitation = (citationKey, partialUpdate) => {
    setCitationsMap((prev) => {
      const existing = prev[citationKey] || EVIDENCE_BASED_CITATIONS[citationKey] || { id: citationKey };
      const updated = {
        ...prev,
        [citationKey]: {
          ...existing,
          ...partialUpdate
        }
      };
      try {
        localStorage.setItem('acl_report_citations_v2', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  const handleResetCitations = () => {
    setCitationsMap(EVIDENCE_BASED_CITATIONS);
    try {
      localStorage.removeItem('acl_report_citations_v2');
    } catch (e) {
      console.warn(e);
    }
  };

  const formattedPatientName =
    activePatientObj?.nome && activePatientObj?.cognome
      ? `${activePatientObj.nome} ${activePatientObj.cognome}`
      : activePatientObj?.nome || 'Paziente Selezionato';

  const formatDate = (dStr) => {
    if (!dStr) return 'N/D';
    if (dStr.includes('-')) {
      const parts = dStr.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  const formatKnee = (kneeStr) => {
    if (!kneeStr) return 'Destro (Dx)';
    const lower = kneeStr.toLowerCase();
    if (lower.includes('sx') || lower.includes('sinistr')) return 'Sinistro (Sx)';
    if (lower.includes('dx') || lower.includes('destr')) return 'Destro (Dx)';
    return kneeStr;
  };

  const operatedKnee = formatKnee(activePatientObj?.lato_lesione);
  const dataIntervento = formatDate(activePatientObj?.data_intervento);
  const bodyMassKg = parseNum(activePatientObj?.peso_kg ?? activePatientObj?.peso) || 75;

  const handleCardParamChange = (cardId, newParamId) => {
    setReportCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, selectedParam: newParamId } : c))
    );
  };

  const handleRemoveCard = (cardId) => {
    setReportCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  const handleAddCard = () => {
    const newCard = {
      id: `card-${Date.now()}`,
      title: 'Scheda Metrica Personalizzata',
      icon: Activity,
      citationKey: 'lsiQuad',
      selectedParam: 'quad_max_force_lr',
      parameters: DEFAULT_REPORT_CARDS.flatMap((c) => c.parameters)
    };
    setReportCards([...reportCards, newCard]);
  };

  const handleResetCards = () => {
    setReportCards(DEFAULT_REPORT_CARDS);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-sans">
      {/* MODAL WRAPPER CONTAINER */}
      <div className="w-full max-w-7xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print-modal-container">
        
        {/* TOP MODAL HEADER (no-print) */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Report VALD / ForceDecks Dashboard</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono">
                  Dati Reali Supabase • Live A4
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Lettura diretta dalle tabelle Supabase, unità di misura biomeccaniche certificate, commento clinico e Rationale personalizzabile.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsBiblioModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Libreria Fonti & Rationale</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Conferma e Stampa Report A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY: CONTROLLI A SINISTRA vs ANTEPRIMA REPORT A4 A DESTRA */}
        <div className="print-modal-body flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* PANNELLO DI SINISTRA: CONTROLLI CLINICI, NOTE FISIOTERAPISTA & RATIONALE (no-print) */}
          <div className="lg:col-span-4 p-5 bg-slate-900 border-r border-slate-800 overflow-y-auto space-y-4 no-print text-xs">
            
            {/* 1. SELEZIONE PAZIENTE & SESSIONE SUPABASE */}
            <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>1. Paziente in Carico:</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {activePatients.length} Attivi
                  </span>
                </label>

                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full bg-slate-900 text-white font-bold text-xs border border-slate-700 rounded-xl p-2.5 focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  {activePatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} {p.cognome} ({p.lato_lesione || 'Dx'}) — {p.sport || 'Sport'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. Sessione Riferimento (Supabase):</span>
                  </span>
                  {isLoadingTests && (
                    <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                  )}
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full bg-slate-900 text-white font-bold text-xs border border-slate-700 rounded-xl p-2.5 focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  {supabaseTests.length > 0 ? (
                    supabaseTests.map((t, idx) => (
                      <option key={t.id || idx} value={t.id}>
                        {t.label || `Test #${idx + 1}`} — {t.date || t.data_valutazione || ''}
                      </option>
                    ))
                  ) : (
                    <option value="">Nessun test registrato per questo paziente</option>
                  )}
                </select>
              </div>
            </div>

            {/* 2. SEZIONE NOTE / COMMENTO DEL FISIOTERAPISTA */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-500/30 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <label className="font-extrabold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wide cursor-pointer">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Note / Commento del Fisioterapista</span>
                </label>
                <input
                  type="checkbox"
                  checked={showPhysioNotes}
                  onChange={(e) => setShowPhysioNotes(e.target.checked)}
                  title="Mostra/Nascondi nel Report A4"
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <textarea
                rows={4}
                value={physioNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Inserisci qui osservazioni cliniche, indicazioni riabilitative per il medico/preparatore o sintesi sui progressi dell'atleta..."
                className="w-full bg-slate-900 text-slate-100 text-xs border border-slate-700 rounded-xl p-2.5 focus:border-cyan-500 focus:outline-none leading-relaxed resize-y"
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveNotesToSupabase}
                  disabled={isSavingNotes}
                  className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Salvataggio...' : 'Salva su Profilo Paziente'}</span>
                </button>

                {notesSavedToast && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Salvato!
                  </span>
                )}
              </div>
            </div>

            {/* 3. GESTIONE GRIGLIA SCHEDE METRICHE */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-extrabold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Griglia Schede Metriche</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {reportCards.length} Schede
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {reportCards.map((card) => (
                  <div key={card.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{card.title}</span>
                      <button
                        onClick={() => handleRemoveCard(card.id)}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <select
                      value={card.selectedParam}
                      onChange={(e) => handleCardParamChange(card.id, e.target.value)}
                      className="w-full bg-slate-950 text-cyan-300 border border-slate-700 rounded p-1 text-[11px] font-bold"
                    >
                      {card.parameters.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi Scheda</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCards}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* 4. OPZIONI IKDC & LIBRERIA FONTI / RATIONALE */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Includi Questionario IKDC:</span>
                </span>
                <input
                  type="checkbox"
                  checked={showIkdc}
                  onChange={(e) => setShowIkdc(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-bold text-slate-200">Mostra Box Scientific Reference:</span>
                </label>
                <input
                  type="checkbox"
                  checked={showCitations}
                  onChange={(e) => setShowCitations(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsBiblioModalOpen(true)}
                className="w-full py-2 mt-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Personalizza Libreria Fonti & Rationale</span>
              </button>
            </div>

            {/* BUTTON STAMPA */}
            <button
              onClick={handlePrint}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Conferma e Stampa Report A4</span>
            </button>
          </div>

          {/* PANNELLO DI DESTRA: ANTEPRIMA REPORT A4 VALD / FORCEDECKS DASHBOARD */}
          <div className="print-preview-pane lg:col-span-8 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex justify-center items-start">
            
            {/* CANVAS A4 (Target unico isolato di stampa per @media print) */}
            <div
              id="report-a4-container"
              style={{
                pageBreakBefore: 'avoid',
                breakBefore: 'avoid',
                WebkitPrintColorAdjust: 'exact',
                printColorAdjust: 'exact'
              }}
              className="print-report-container printable-report w-full max-w-[780px] bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-300 print:shadow-none print:border-0 print:p-0 print:w-full text-[10px] leading-snug space-y-3.5 font-sans"
            >
              {/* HEADER REPORT INTEGRATO CON SCHEDA PAZIENTE */}
              <div
                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                className="print-report-section break-inside-avoid flex items-center justify-between pb-3 border-b-2 border-slate-300"
              >
                <div className="flex items-center gap-3">
                  <LogoN className="w-12 h-12 rounded-xl shrink-0 border border-slate-300 shadow-sm" />

                  <div>
                    <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
                      {formattedPatientName}
                    </h1>
                    <p className="text-[9.5px] font-bold text-slate-600 tracking-wide mt-1">
                      Chirurgia: <strong>{dataIntervento}</strong> • Ginocchio Operato:{' '}
                      <strong className="text-emerald-800 font-extrabold">{operatedKnee}</strong> • Sport:{' '}
                      <strong>{activePatientObj?.sport || 'N/D'}</strong>
                    </p>
                    {selectedTest && (
                      <p className="text-[8.5px] font-bold text-slate-500 mt-0.5">
                        Sessione di Riferimento: <strong className="text-slate-800">{selectedTest.label || 'Test'}</strong> ({selectedTest.date || selectedTest.data_valutazione}) • Storico Valutazioni: <strong>{supabaseTests.length} sessioni</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* TABBAR STILE DASHBOARD VALD */}
                <div className="text-right flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <span className="px-2 py-1 bg-white font-extrabold text-slate-900 rounded shadow-sm text-[9px]">
                    Overview
                  </span>
                  <span className="px-2 py-1 font-bold text-slate-600 text-[9px]">Timeline</span>
                  <span className="px-2 py-1 font-bold text-slate-600 text-[9px]">Testing</span>
                  <span className="px-2 py-1 font-bold text-slate-600 text-[9px]">Most Recent</span>
                </div>
              </div>

              {/* QUESTIONARIO IKDC (SE ATTIVO E PRESENTE) */}
              {showIkdc && ikdcScore && (
                <div
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="print-report-section break-inside-avoid p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow text-center border border-emerald-500 flex items-center justify-between px-4"
                >
                  <span className="text-[8.5px] font-extrabold uppercase tracking-widest opacity-90">
                    PUNTEGGIO QUESTIONARIO SOGGETTIVO IKDC (SUPABASE)
                  </span>
                  <strong className="text-xs font-black font-mono bg-white/20 px-3 py-1 rounded-lg">
                    IKDC SCORE: {ikdcScore}/100
                  </strong>
                </div>
              )}

              {/* GRIGLIA SCHEDE METRICHE MULTI-CARD CON DATI REALI & UNITA' CORRETTE */}
              <div className="print-cards-grid grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 pt-1">
                {reportCards.map((card) => (
                  <ValdMetricCard
                    key={card.id}
                    card={card}
                    tests={supabaseTests}
                    selectedTest={selectedTest}
                    bodyMassKg={bodyMassKg}
                    showCitations={showCitations}
                    citationsMap={citationsMap}
                    onUpdateCitation={handleUpdateCitation}
                    onChangeParam={handleCardParamChange}
                    onRemoveCard={handleRemoveCard}
                  />
                ))}
              </div>

              {/* BOX NOTE / COMMENTO CLINICO DEL FISIOTERAPISTA STAMPABILE SU A4 */}
              {showPhysioNotes && (
                <div
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="print-report-section break-inside-avoid mt-3 p-3.5 bg-slate-50 border-2 border-slate-300 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Note / Commento Clinico del Fisioterapista</span>
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">
                      Valutazione Funzionale & Indicazioni Operative
                    </span>
                  </div>

                  {/* Textarea modificabile anche direttamente sull'anteprima A4 */}
                  <textarea
                    rows={3}
                    value={physioNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Digita qui le osservazioni cliniche, le indicazioni per il chirurgo/preparatore o la sintesi dei progressi..."
                    className="w-full bg-transparent text-slate-800 text-[9.5px] font-medium leading-relaxed focus:outline-none resize-none no-print"
                  />

                  {/* Testo formattato per la stampa A4 */}
                  <div className="hidden print-only-block text-slate-800 text-[9.5px] font-medium leading-relaxed whitespace-pre-wrap min-h-[32px]">
                    {physioNotes && physioNotes.trim().length > 0
                      ? physioNotes
                      : 'Nessuna nota clinica aggiuntiva inserita per questa sessione.'}
                  </div>
                </div>
              )}

              {/* FOOTER BIBLIOGRAFICO A4 GLOBALE SINCRONIZZATO CON LA LIBRERIA */}
              {showCitations && (
                <div
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  className="print-report-section break-inside-avoid pt-3 border-t border-slate-300 space-y-1 font-sans text-[8px] text-slate-600 leading-tight mt-3"
                >
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[8.5px] flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5 text-slate-700" />
                      <span>NOTE & RIFERIMENTI BIBLIOGRAFICI SCIENTIFICI (EVIDENCE-BASED ACL RTS)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsBiblioModalOpen(true)}
                      className="text-[8px] text-cyan-700 hover:underline font-bold no-print cursor-pointer"
                    >
                      Modifica Libreria & Rationale
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    {biblioSources.slice(0, 6).map((src, i) => (
                      <div key={src.id || i} className="truncate">
                        <sup>{i + 1}</sup> <strong>{src.autori} ({src.anno}):</strong>{' '}
                        <em>{src.titolo}.</em> {src.journal}.
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Gestione Libreria Scientifica, Rationale Modificabile & DOI CrossRef API */}
      <ModalLibreriaScientifica
        isOpen={isBiblioModalOpen}
        onClose={() => setIsBiblioModalOpen(false)}
        citationsMap={citationsMap}
        onUpdateCitation={handleUpdateCitation}
        onResetCitations={handleResetCitations}
        sources={biblioSources}
        onSaveLibrary={(updatedSources) => setBiblioSources(updatedSources)}
      />
    </div>
  );
}
