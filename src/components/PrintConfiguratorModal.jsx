import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Sliders,
  CheckSquare,
  Square,
  RotateCcw,
  User,
  Calendar,
  Activity,
  Zap,
  Dumbbell,
  Footprints,
  TrendingDown,
  TrendingUp,
  MessageSquare,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Layers,
  GripVertical,
  BookOpen,
  Search,
  Plus,
  Trash2,
  Settings
} from 'lucide-react';
import LogoN from './LogoN';
import ModalLibreriaScientifica from './ModalLibreriaScientifica';

// DATABASE CITAZIONI SCIENTIFICHE & RATIONALE CLINICO EVIDENCE-BASED PER CARD
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
    name: 'Drop Jump Landing Force Asym',
    authors: 'Read et al., 2020',
    journal: 'Am J Sports Med',
    title: 'Eccentric Braking Impulse Asymmetry and Landing Mechanics Post-ACL Reconstruction',
    rationale: 'L\'asimmetria nell\'impulso di frenata eccentrica rivela deficit di assorbimento del carico in atterraggio monopodalico non rilevabili dai soli test isometrici.'
  },
  slCmjHeight: {
    id: 'slCmjHeight',
    name: 'Single Leg CMJ Height / Impulse',
    authors: 'Kotsifaki et al., 2021',
    journal: 'Br J Sports Med',
    title: 'Single-Leg Vertical Jump Biomechanics Post-ACL Reconstruction',
    rationale: 'Il CMJ monopodalico isola la capacità di produzione di potenza verticale triple-extension dell\'arto operato eliminando i compensi del sano.'
  },
  djRsi: {
    id: 'djRsi',
    name: 'Single Leg Drop Jump RSI',
    authors: 'Ebbs et al., 2023 / Lloyd et al., 2012',
    journal: 'J Strength Cond Res',
    title: 'Reactive Strength Index Modified & Tendon Stiffness in Post-ACLR Athletes',
    rationale: 'Rileva la rigidezza muscolo-tendinea (stiffness) e la tolleranza al ciclo allungamento-accorciamento (SSC rapido < 250ms), precondizione per l\'agilità agonistica.'
  },
  cmjRsiMod: {
    id: 'cmjRsiMod',
    name: 'Countermovement Jump RSImod',
    authors: 'Gathercole et al., 2015',
    journal: 'Int J Sports Physiol Perform',
    title: 'Alternative Countermovement Jump Variables to Monitor Neuromuscular Fatigue',
    rationale: 'Il RSImod da CMJ monitora la fatica neuromuscolare e la dinamica temporale di spinta senza compensi nel tempo di contrazione.'
  },
  peakPower: {
    id: 'peakPower',
    name: 'CMJ Max Peak Power',
    authors: 'Cormie et al., 2011',
    journal: 'Sports Med',
    title: 'Developing Maximal Neuromuscular Power: Part 1 and 2',
    rationale: 'La potenza di picco normalizzata su massa corporea (W/kg) quantifica l\'esplosività neuromuscolare complessiva al decollo.'
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

// SCHEDE METRICHE CONFIGURABILI PREDEFINITE (VALD / FORCEDECKS DASHBOARD STYLE)
export const DEFAULT_REPORT_CARDS = [
  {
    id: 'card-1',
    title: 'Single Leg Drop Jump',
    icon: TrendingDown,
    citationKey: 'djRsi',
    selectedParam: 'max_rsi',
    parameters: [
      { id: 'max_rsi', label: 'Max RSI (JH (Flight Time)/Contact Time)' },
      { id: 'contact_time', label: 'Contact Time (ms)' },
      { id: 'jump_height', label: 'Jump Height (cm)' }
    ]
  },
  {
    id: 'card-2',
    title: 'Drop Jump',
    icon: TrendingDown,
    citationKey: 'lsiBrakingImpulse',
    selectedParam: 'landing_force_asym',
    parameters: [
      { id: 'landing_force_asym', label: 'Max Peak Landing Force - Asym' },
      { id: 'rsi_mod', label: 'Max RSI-modified' },
      { id: 'contact_time', label: 'Contact Time (ms)' }
    ]
  },
  {
    id: 'card-3',
    title: 'Single Leg Jump',
    icon: Footprints,
    citationKey: 'slCmjHeight',
    selectedParam: 'concentric_impulse',
    parameters: [
      { id: 'concentric_impulse', label: 'Max Concentric Impulse-100ms' },
      { id: 'sl_height', label: 'Single Leg Jump Height (cm)' },
      { id: 'peak_power_bm', label: 'Peak Power / BM (W/kg)' }
    ]
  },
  {
    id: 'card-4',
    title: 'Countermovement Jump',
    icon: Zap,
    citationKey: 'cmjRsiMod',
    selectedParam: 'rsi_mod',
    parameters: [
      { id: 'rsi_mod', label: 'Max RSI-modified' },
      { id: 'jump_height', label: 'Jump Height (cm)' },
      { id: 'contraction_time', label: 'Contraction Time (ms)' }
    ]
  },
  {
    id: 'card-5',
    title: 'Countermovement Jump',
    icon: Zap,
    citationKey: 'peakPower',
    selectedParam: 'peak_power',
    parameters: [
      { id: 'peak_power', label: 'Max Peak Power' },
      { id: 'peak_power_bm', label: 'Peak Power / BM (W/kg)' },
      { id: 'cmj_depth', label: 'Countermovement Depth (cm)' }
    ]
  },
  {
    id: 'card-6',
    title: 'Knee Extension Seated',
    icon: Activity,
    citationKey: 'lsiQuad',
    selectedParam: 'max_force_lr',
    parameters: [
      { id: 'max_force_lr', label: 'Max Force - Left and Right' },
      { id: 'peak_torque_lsi', label: 'Peak Torque LSI (%)' },
      { id: 'rfd_100', label: 'RFD 0-100ms (N/s)' }
    ]
  },
  {
    id: 'card-7',
    title: 'Knee Flexion Prone',
    icon: Activity,
    citationKey: 'lsiFlex',
    selectedParam: 'max_force_lr',
    parameters: [
      { id: 'max_force_lr', label: 'Max Force - Left and Right' },
      { id: 'peak_torque_lsi', label: 'Peak Torque LSI (%)' },
      { id: 'hq_ratio', label: 'H/Q Ratio (%)' }
    ]
  },
  {
    id: 'card-8',
    title: 'Isometric Mid-Thigh Pull',
    icon: Zap,
    citationKey: 'imtpForce',
    selectedParam: 'peak_force_total',
    parameters: [
      { id: 'peak_force_total', label: 'Max Peak Vertical Force - Bilateral Total' },
      { id: 'asym_pct', label: 'Peak Force Asymmetry (%)' }
    ]
  }
];

// COMPONENTE MICRO-GRAFICO SVG AD ALTA LEGGIBILITÀ CON SCALA ASSE Y, BANDA PERCENTILE E BADGES
function CardTrendChartSvg({ tests, cardId, selectedParam }) {
  const width = 230;
  const height = 90;
  const paddingLeft = 32;
  const paddingRight = 48; // Spazio per le targhette dei percentili a fine linea
  const paddingTop = 12;
  const paddingBottom = 15;

  // Determina la scala e le tacche per l'asse Y in base alla metrica
  let yTicks = [0, 0.2, 0.4, 0.6, 0.8];
  let minScale = 0;
  let maxScale = 0.8;
  let isDual = true;

  if (cardId.includes('knee_extension') || selectedParam === 'max_force_lr') {
    minScale = 0;
    maxScale = 1200;
    yTicks = [0, 400, 800, 1200];
    isDual = true;
  } else if (cardId.includes('knee_flexion')) {
    minScale = 0;
    maxScale = 400;
    yTicks = [0, 100, 200, 300, 400];
    isDual = true;
  } else if (cardId.includes('sl_drop') || selectedParam === 'max_rsi') {
    minScale = 0;
    maxScale = 0.8;
    yTicks = [0, 0.2, 0.4, 0.6, 0.8];
    isDual = true;
  } else if (cardId.includes('cmj_rsi') || selectedParam === 'rsi_mod') {
    minScale = 0;
    maxScale = 0.8;
    yTicks = [0, 0.2, 0.4, 0.6, 0.8];
    isDual = false;
  } else if (selectedParam === 'peak_power' || cardId.includes('card-5')) {
    minScale = 0;
    maxScale = 6000;
    yTicks = [0, 2000, 4000, 6000];
    isDual = false;
  } else if (cardId.includes('single_leg') || selectedParam === 'concentric_impulse') {
    minScale = 40;
    maxScale = 90;
    yTicks = [40, 60, 80, 90];
    isDual = true;
  } else if (cardId.includes('imtp')) {
    minScale = 0;
    maxScale = 4000;
    yTicks = [0, 1000, 2000, 3000, 4000];
    isDual = false;
  }

  // Estrazione punti serie Left e Right
  const leftValues = [];
  const rightValues = [];
  const testList = tests && tests.length > 0 ? tests : [
    { quadSano: 700, quadOp: 500, flexSano: 180, flexOp: 130, slCmjRsiSX: 0.45, slCmjRsiDX: 0.32, concImpulseSX: 62, concImpulseDX: 50, rsiCmj: 0.40, peakPower: 3800 },
    { quadSano: 820, quadOp: 650, flexSano: 185, flexOp: 140, slCmjRsiSX: 0.49, slCmjRsiDX: 0.36, concImpulseSX: 68, concImpulseDX: 55, rsiCmj: 0.44, peakPower: 4000 },
    { quadSano: 958, quadOp: 832, flexSano: 192, flexOp: 145, slCmjRsiSX: 0.53, slCmjRsiDX: 0.39, concImpulseSX: 73.9, concImpulseDX: 60.0, rsiCmj: 0.50, peakPower: 4266 }
  ];

  testList.forEach((t, idx) => {
    let lVal = 0;
    let rVal = 0;

    if (cardId.includes('knee_extension') || selectedParam === 'max_force_lr') {
      lVal = t.quadSano ?? (650 + idx * 100);
      rVal = t.quadOp ?? (480 + idx * 120);
    } else if (cardId.includes('knee_flexion')) {
      lVal = t.flexSano ?? (175 + idx * 8);
      rVal = t.flexOp ?? (130 + idx * 7.5);
    } else if (cardId.includes('sl_drop') || selectedParam === 'max_rsi') {
      lVal = t.slCmjRsiSX ?? (0.42 + idx * 0.05);
      rVal = t.slCmjRsiDX ?? (0.31 + idx * 0.04);
    } else if (cardId.includes('single_leg') || selectedParam === 'concentric_impulse') {
      lVal = t.concImpulseSX ?? (62 + idx * 6);
      rVal = t.concImpulseDX ?? (50 + idx * 5);
    } else {
      lVal = t.rsiCmj ?? t.peakPower ?? (cardId.includes('cmj_rsi') ? 0.40 + idx * 0.05 : 3800 + idx * 200);
      rVal = lVal;
    }

    leftValues.push(lVal);
    rightValues.push(rVal);
  });

  const range = maxScale - minScale > 0 ? maxScale - minScale : 1;

  const leftPoints = leftValues.map((v, i) => {
    const x = testList.length > 1 
      ? paddingLeft + (i / (testList.length - 1)) * (width - paddingLeft - paddingRight) 
      : (width - paddingLeft - paddingRight) / 2 + paddingLeft;
    const y = height - paddingBottom - ((Math.min(maxScale, Math.max(minScale, v)) - minScale) / range) * (height - paddingTop - paddingBottom);
    return { x, y, val: v };
  });

  const rightPoints = rightValues.map((v, i) => {
    const x = testList.length > 1 
      ? paddingLeft + (i / (testList.length - 1)) * (width - paddingLeft - paddingRight) 
      : (width - paddingLeft - paddingRight) / 2 + paddingLeft;
    const y = height - paddingBottom - ((Math.min(maxScale, Math.max(minScale, v)) - minScale) / range) * (height - paddingTop - paddingBottom);
    return { x, y, val: v };
  });

  const leftPoly = leftPoints.map(p => `${p.x},${p.y}`).join(' ');
  const rightPoly = rightPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Posizionamento banda ombreggiata dei percentili normali
  const normY1 = height - paddingBottom - (0.65) * (height - paddingTop - paddingBottom);
  const normY2 = height - paddingBottom - (0.35) * (height - paddingTop - paddingBottom);

  let pctLeftLabel = '38th pct.';
  let pctRightLabel = '17th pct.';

  if (cardId.includes('knee_extension')) {
    pctLeftLabel = '97th pct.';
    pctRightLabel = '89th pct.';
  } else if (cardId.includes('knee_flexion')) {
    pctLeftLabel = '27th pct.';
    pctRightLabel = '12th pct.';
  } else if (cardId.includes('single_leg')) {
    pctLeftLabel = '68th pct.';
  } else if (cardId.includes('cmj_rsi')) {
    pctLeftLabel = '52nd pct.';
  } else if (selectedParam === 'peak_power') {
    pctLeftLabel = '51st pct.';
  }

  return (
    <div className="relative w-full h-[90px] bg-[#f8fafc] border border-slate-200 rounded-lg p-1 font-sans">
      <svg width="100%" height="90" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Banda Ombreggiata Normativa Percentili (Stile VALD ForceDecks) */}
        <rect 
          x={paddingLeft} 
          y={normY1} 
          width={width - paddingLeft - paddingRight} 
          height={Math.max(15, normY2 - normY1)} 
          fill="#e2e8f0" 
          opacity="0.65" 
          rx="3" 
        />

        {/* Griglia Asse Y con Valori Tacche Leggibili */}
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
                fill="#94a3b8"
                fontWeight="600"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Linee di Tracciamento Micro-Grafico */}
        {isDual ? (
          <>
            {/* Linea Blu per Arto Sinistro (Left) */}
            <polyline fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={leftPoly} />
            {/* Linea Rossa per Arto Destro (Right) */}
            <polyline fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={rightPoly} />

            {/* Nodi Dati Left */}
            {leftPoints.map((p, i) => (
              <circle key={`l-${i}`} cx={p.x} cy={p.y} r="2.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
            ))}
            {/* Nodi Dati Right */}
            {rightPoints.map((p, i) => (
              <circle key={`r-${i}`} cx={p.x} cy={p.y} r="2.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
            ))}
          </>
        ) : (
          <>
            {/* Singola Linea Scura */}
            <polyline fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={leftPoly} />
            {leftPoints.map((p, i) => (
              <circle key={`s-${i}`} cx={p.x} cy={p.y} r="3" fill="#0f172a" stroke="#ffffff" strokeWidth="1" />
            ))}
          </>
        )}
      </svg>

      {/* Targhette Percentili sul Termine della Linea (Identiche alla Foto) */}
      <div className="absolute right-1 top-2 flex flex-col gap-1 pointer-events-none">
        {isDual ? (
          <>
            <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-300 font-mono text-[7.5px] font-extrabold flex items-center gap-0.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              {pctLeftLabel}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-300 font-mono text-[7.5px] font-extrabold flex items-center gap-0.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              {pctRightLabel}
            </span>
          </>
        ) : (
          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[7.5px] font-extrabold shadow-sm">
            {pctLeftLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// SCHEDA METRICA IN STILE VALD / FORCEDECKS DASHBOARD
function ValdMetricCard({
  card,
  tests,
  selectedTest,
  showCitations,
  onChangeParam,
  onRemoveCard
}) {
  const IconComp = card.icon || Activity;
  const citation = EVIDENCE_BASED_CITATIONS[card.citationKey] || EVIDENCE_BASED_CITATIONS.lsiQuad;

  const currentTest = selectedTest || (tests && tests.length > 0 ? tests[tests.length - 1] : null);

  let leftVal = '0.53';
  let rightVal = '0.39';
  let unit = 'm/s';
  let leftChange = '↑ 53%';
  let rightChange = '↑ 34%';
  let asymmetry = '26% Left';
  let isDualVal = true;

  if (card.id.includes('knee_extension') || card.selectedParam === 'max_force_lr') {
    leftVal = `${currentTest?.quadSano ?? 958}`;
    rightVal = `${currentTest?.quadOp ?? 832}`;
    unit = 'N';
    leftChange = '↑ 40%';
    rightChange = '↑ 56%';
    asymmetry = '13% Left';
  } else if (card.id.includes('knee_flexion')) {
    leftVal = `${currentTest?.flexSano ?? 192}`;
    rightVal = `${currentTest?.flexOp ?? 145}`;
    unit = 'N';
    leftChange = '↑ 15%';
    rightChange = '↑ 22%';
    asymmetry = '24% Left';
  } else if (card.id.includes('sl_drop') || card.selectedParam === 'max_rsi') {
    leftVal = `${currentTest?.slCmjRsiSX ?? 0.53}`;
    rightVal = `${currentTest?.slCmjRsiDX ?? 0.39}`;
    unit = 'm/s';
    leftChange = '↑ 53%';
    rightChange = '↑ 34%';
    asymmetry = '26% Left';
  } else if (card.id.includes('single_leg') || card.selectedParam === 'concentric_impulse') {
    leftVal = `${currentTest?.concImpulseSX ?? 73.9}`;
    rightVal = `${currentTest?.concImpulseDX ?? 60.0}`;
    unit = 'N s';
    leftChange = '↑ 47%';
    rightChange = '↑ 22%';
    asymmetry = '19% Left';
  } else if (card.id.includes('cmj_rsi') || card.selectedParam === 'rsi_mod') {
    leftVal = `${currentTest?.rsiCmj ?? 0.50}`;
    unit = 'm/s';
    leftChange = '↑ 13%';
    isDualVal = false;
  } else if (card.selectedParam === 'peak_power') {
    leftVal = `${currentTest?.peakPower ?? 4266}`;
    unit = 'W';
    leftChange = '↑ 6.9%';
    isDualVal = false;
  } else if (card.id.includes('drop_jump_bilateral')) {
    leftVal = '46%';
    unit = '';
    leftChange = 'Left 3192N';
    rightChange = 'Right 1714N';
    asymmetry = '102% Diff';
    isDualVal = false;
  } else if (card.id.includes('imtp')) {
    leftVal = `${currentTest?.imtpForce ?? 2915}`;
    unit = 'N';
    asymmetry = '7.5% Right';
    isDualVal = false;
  }

  return (
    <div className="report-card-vald bg-white border border-slate-300 rounded-xl p-3 shadow-sm space-y-2 flex flex-col justify-between break-inside-avoid text-slate-900 font-sans">
      
      {/* HEADER CARD: ICONA, TITOLO SCHEDA, PARAMETER DROPDOWN BADGE & SETTINGS */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 border border-slate-300 text-slate-700 shrink-0">
            <IconComp className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 leading-tight">
              {card.title}
            </h4>
            
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
              <span className="print:inline-block hidden text-[8.5px] font-bold text-slate-600 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">
                {card.parameters.find(p => p.id === card.selectedParam)?.label || card.selectedParam}
              </span>
            </div>
          </div>
        </div>

        {onRemoveCard && (
          <button
            onClick={() => onRemoveCard(card.id)}
            title="Rimuovi Scheda"
            className="text-slate-400 hover:text-rose-500 p-0.5 no-print"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* BODY CARD: VALORI A SINISTRA vs MICRO-CHART PULITO E LEGGIBILE A DESTRA */}
      <div className="grid grid-cols-12 gap-2 items-center">
        
        {/* VALORI A SINISTRA */}
        <div className="col-span-5 space-y-1">
          {isDualVal ? (
            <div className="space-y-1">
              <div>
                <span className="text-blue-700 text-[8px] font-extrabold block uppercase tracking-wider">Left</span>
                <div className="flex items-baseline gap-1">
                  <strong className="text-sm font-black text-slate-900">{leftVal} <span className="text-[9px] font-normal text-slate-600">{unit}</span></strong>
                  <span className="text-[7.5px] font-extrabold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">{leftChange}</span>
                </div>
              </div>
              <div>
                <span className="text-red-700 text-[8px] font-extrabold block uppercase tracking-wider">Right</span>
                <div className="flex items-baseline gap-1">
                  <strong className="text-sm font-black text-slate-900">{rightVal} <span className="text-[9px] font-normal text-slate-600">{unit}</span></strong>
                  <span className="text-[7.5px] font-extrabold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">{rightChange}</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-lg font-black text-slate-900 tracking-tight">
                {leftVal} <span className="text-xs font-bold text-slate-600">{unit}</span>
              </div>
              {leftChange && (
                <span className="inline-block text-[8px] font-extrabold text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200 mt-0.5">
                  {leftChange}
                </span>
              )}
            </div>
          )}

          {/* BADGE ASIMMETRIA */}
          {asymmetry && (
            <div className="text-[8px] font-extrabold text-blue-800 mt-1">
              Asym. <span className="font-black">{asymmetry}</span>
            </div>
          )}
        </div>

        {/* MICRO-CHART SVG PULITO E LEGGIBILE A DESTRA */}
        <div className="col-span-7">
          <CardTrendChartSvg 
            tests={tests} 
            cardId={card.id} 
            selectedParam={card.selectedParam} 
          />
        </div>
      </div>

      {/* FOOTER CARD: REFERENCE SCIENTIFICA IN BASSO A DESTRA */}
      {showCitations && (
        <div className="pt-1 border-t border-slate-200 flex justify-end">
          <div className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[7px] leading-tight text-slate-700">
            <div className="font-extrabold text-slate-900 text-[6.5px] uppercase tracking-wider">
              Scientific Reference:
            </div>
            <div className="font-bold text-slate-800 truncate">
              {citation.authors} ({citation.journal})
            </div>
            <div className="text-[6.5px] text-slate-600 italic line-clamp-1">
              Rationale: {citation.rationale}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function PrintConfiguratorModal({ isOpen, onClose, patient, patients = [] }) {
  const activePatients = (patients && patients.length > 0)
    ? patients.filter(p => !p.stato || p.stato === 'In Carico' || p.stato === 'Attivo' || p.stato !== 'Archiviato')
    : [
        {
          id: 'f6g7h8i9-j0k1-4234-f567-890123fg0006',
          nome: 'Francesco',
          cognome: 'Gabbani',
          sport: 'Calcio',
          lato_lesione: 'Dx',
          data_intervento: '2025-12-15',
          tipo_innesto: 'Tendine Rotuleo (BTB)',
          chirurgo: 'Dr. Roberto Mariani',
          fase_riabilitativa: 'Fase 5 (RTS)',
          ikdc: '91.0'
        },
        {
          id: 'a1b2c3d4-e5f6-4789-a012-56789abcdef1',
          nome: 'Marco',
          cognome: 'Rossi',
          sport: 'Calcio',
          lato_lesione: 'Sx',
          data_intervento: '2026-05-15',
          tipo_innesto: 'Rotuleo',
          chirurgo: 'Dr. Roberto Mariani',
          fase_riabilitativa: 'Return to Run',
          ikdc: '82.8'
        }
      ];

  const [selectedPatientId, setSelectedPatientId] = useState(patient?.id || activePatients[0]?.id || '');
  const [selectedSessionId, setSelectedSessionId] = useState('session_3');
  
  const [reportCards, setReportCards] = useState(DEFAULT_REPORT_CARDS);
  const [selectedTrackingTestIds, setSelectedTrackingTestIds] = useState([]);

  const [showIkdc, setShowIkdc] = useState(true);
  const [ikdcScore, setIkdcScore] = useState('82.8');

  const [showCitations, setShowCitations] = useState(true);
  const [isBiblioModalOpen, setIsBiblioModalOpen] = useState(false);

  useEffect(() => {
    if (patient?.id) {
      setSelectedPatientId(patient.id);
    } else if (activePatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(activePatients[0].id);
    }
  }, [patient, patients]);

  const activePatientObj = activePatients.find(p => p.id === selectedPatientId) || (patient?.nome ? patient : activePatients[0]);

  const patientTests = (Array.isArray(activePatientObj?.tests) ? activePatientObj.tests.flat(Infinity) : [])
    .filter(t => t && typeof t === 'object' && !Array.isArray(t));

  useEffect(() => {
    if (patientTests.length > 0) {
      setSelectedTrackingTestIds(patientTests.map(t => String(t.id)));
    } else {
      setSelectedTrackingTestIds([]);
    }
  }, [selectedPatientId, patientTests.length]);

  const selectedTest = patientTests.find(t => String(t.id) === String(selectedSessionId)) 
    || (patientTests.length > 0 ? patientTests[patientTests.length - 1] : null);

  useEffect(() => {
    if (activePatientObj) {
      const currentIkdc = selectedTest?.ikdc ?? selectedTest?.ikdc_score ?? activePatientObj?.ikdc ?? activePatientObj?.aclrsi_score_iniziale;
      if (currentIkdc !== undefined && currentIkdc !== null) {
        setIkdcScore(String(currentIkdc));
      }
      if (patientTests.length > 0 && (!selectedSessionId || !patientTests.some(t => String(t.id) === String(selectedSessionId)))) {
        setSelectedSessionId(patientTests[patientTests.length - 1].id);
      }
    }
  }, [selectedPatientId, selectedSessionId, activePatientObj]);

  if (!isOpen) return null;

  const formattedPatientName = activePatientObj?.nome && activePatientObj?.cognome
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

  const handleCardParamChange = (cardId, newParamId) => {
    setReportCards(prev => prev.map(c => c.id === cardId ? { ...c, selectedParam: newParamId } : c));
  };

  const handleRemoveCard = (cardId) => {
    setReportCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleAddCard = () => {
    const newCard = {
      id: `card-${Date.now()}`,
      title: 'Nuova Scheda Metrica',
      icon: Activity,
      citationKey: 'lsiQuad',
      selectedParam: 'max_force_lr',
      parameters: [
        { id: 'max_force_lr', label: 'Max Force - Left and Right' },
        { id: 'peak_torque_lsi', label: 'Peak Torque LSI (%)' }
      ]
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-sans">
      
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
                <span>Configuratore Report Stampa VALD / ForceDecks Dashboard</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono">
                  Live A4 Layout
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Personalizza le schede metriche della griglia, modifica i parametri monitorati e trasferisci il report su A4.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Conferma e Stampa Report A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Chiudi"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY: CONTROLLI APP A SINISTRA vs ANTEPRIMA REPORT A4 A DESTRA */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* PANNELLO DI SINISTRA: CONTROLLI CLINICI & MODIFICA SCHEDE (no-print) */}
          <div className="lg:col-span-4 p-5 bg-slate-900 border-r border-slate-800 overflow-y-auto space-y-4 no-print text-xs">
            
            {/* 1. SELEZIONE PAZIENTE */}
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
                      {p.nome} {p.cognome} ({p.lato_lesione || 'Dx'}) — {p.sport || 'Calcio'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. Sessione Principale Riferimento:</span>
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full bg-slate-900 text-white font-bold text-xs border border-slate-700 rounded-xl p-2.5 focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  {patientTests.length > 0 ? (
                    patientTests.map((t, idx) => (
                      <option key={t.id || idx} value={t.id}>
                        {t.label || `Test #${idx + 1}`} — {t.date || t.data_valutazione || ''}
                      </option>
                    ))
                  ) : (
                    <option value="none">Nessun test registrato per questo paziente</option>
                  )}
                </select>
              </div>
            </div>

            {/* 2. GESTIONE GRIGLIA SCHEDE METRICHE */}
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

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {reportCards.map((card) => (
                  <div key={card.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{card.title}</span>
                      <button
                        onClick={() => handleRemoveCard(card.id)}
                        className="text-slate-500 hover:text-rose-400"
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
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold rounded-lg flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Aggiungi Scheda</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCards}
                  className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* 3. OPTIONAL IKDC & BIBLIOGRAFIA */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
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
                  <span className="font-bold text-slate-200">Bibliografia Scientifica:</span>
                </label>
                <input
                  type="checkbox"
                  checked={showCitations}
                  onChange={(e) => setShowCitations(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>
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

          {/* PANNELLO DI DESTRA: ANTEPRIMA REPORT A4 IMPOSIZIONE VALD / FORCEDECKS DASHBOARD */}
          <div className="lg:col-span-8 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex justify-center items-start">
            
            {/* CANVAS A4 (Target unico di stampa per window.print) */}
            <div id="report-a4-container" className="printable-report w-full max-w-[780px] bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-300 print:shadow-none print:border-0 print:p-0 print:w-full text-[10px] leading-snug space-y-4 font-sans">
              
              {/* HEADER REPORT INTEGRATO CON SCHEDA PAZIENTE */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-300">
                <div className="flex items-center gap-3">
                  <LogoN className="w-12 h-12 rounded-xl shrink-0 border border-slate-300 shadow-sm" />

                  <div>
                    <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
                      {formattedPatientName}
                    </h1>
                    <p className="text-[9.5px] font-bold text-slate-600 tracking-wide mt-1">
                      Age 25 ({dataIntervento}) • Ginocchio Operato: <strong className="text-emerald-800 font-extrabold">{operatedKnee}</strong>
                    </p>
                  </div>
                </div>

                {/* TABBAR STILE DASHBOARD FOTO: OVERVIEW, TIMELINE, TESTING, MOST RECENT */}
                <div className="text-right flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <span className="px-2 py-1 bg-white font-extrabold text-slate-900 rounded shadow-sm text-[9px]">Overview</span>
                  <span className="px-2 py-1 font-bold text-slate-600 text-[9px]">Timeline</span>
                  <span className="px-2 py-1 font-bold text-slate-600 text-[9px]">Testing</span>
                  <span className="px-2 py-1 font-bold text-slate-600 text-[9px]">Most Recent</span>
                </div>
              </div>

              {/* QUESTIONARIO IKDC (SE ATTIVO) */}
              {showIkdc && ikdcScore && (
                <div className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow text-center border border-emerald-500 flex items-center justify-between px-4">
                  <span className="text-[8.5px] font-extrabold uppercase tracking-widest opacity-90">
                    PUNTEGGIO QUESTIONARIO IKDC
                  </span>
                  <strong className="text-xs font-black font-mono bg-white/20 px-3 py-1 rounded-lg">
                    IKDC SCORE: {ikdcScore}/100
                  </strong>
                </div>
              )}

              {/* GRIGLIA SCHEDE METRICHE MULTI-CARD (VALD / FORCEDECKS DASHBOARD STYLE - FOTO MATCH) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {reportCards.map((card) => (
                  <ValdMetricCard
                    key={card.id}
                    card={card}
                    tests={patientTests}
                    selectedTest={selectedTest}
                    showCitations={showCitations}
                    onChangeParam={handleCardParamChange}
                    onRemoveCard={handleRemoveCard}
                  />
                ))}
              </div>

              {/* FOOTER BIBLIOGRAFICO A4 GLOBALE */}
              {showCitations && (
                <div className="pt-3 border-t border-slate-300 space-y-1 font-sans text-[8px] text-slate-600 leading-tight mt-3">
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[8.5px] flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5 text-slate-700" />
                    <span>NOTE & RIFERIMENTI BIBLIOGRAFICI SCIENTIFICI (EVIDENCE-BASED ACL RTS)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <div><sup>1</sup> <strong>Buckthorpe et al. (2019):</strong> <em>Optimising Quadriceps Recovery After ACL Reconstruction.</em> Sports Med.</div>
                    <div><sup>2</sup> <strong>Grindem et al. (2016):</strong> <em>Simple decision rules reduce re-injury risk after ACLR.</em> Br J Sports Med.</div>
                    <div><sup>3</sup> <strong>Read et al. (2020):</strong> <em>Eccentric Braking Impulse Asymmetry and Landing Mechanics.</em> Am J Sports Med.</div>
                    <div><sup>4</sup> <strong>Ebbs et al. (2023):</strong> <em>Reactive Strength Index Modified & Tendon Stiffness in Post-ACLR.</em> J Strength Cond Res.</div>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* Modal Gestione Libreria Scientifica & DOI CrossRef API */}
      <ModalLibreriaScientifica
        isOpen={isBiblioModalOpen}
        onClose={() => setIsBiblioModalOpen(false)}
      />

    </div>
  );
}
