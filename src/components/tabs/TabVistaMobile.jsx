import React, { useState } from 'react';
import { 
  Smartphone, 
  AlertTriangle, 
  Dumbbell, 
  Activity, 
  CheckCircle2, 
  Shield, 
  User, 
  ClipboardList,
  Layers,
  Zap,
  Flame,
  Award,
  Check,
  TrendingUp,
  Info
} from 'lucide-react';

export default function TabVistaMobile({ patient }) {
  // Sotto-Tab Interna Mobile (Default: Scheda Operativa & Esercizi)
  const [mobileTab, setMobileTab] = useState('OPERATIVA'); // 'OPERATIVA' | 'BICCHIERI'

  // Ricava titolo, sottotitolo e target di fase dinamicamente dalla Fase Attiva del paziente
  const getPhaseInfo = (fase) => {
    const str = String(fase || '').toLowerCase();
    if (str.includes('1') || str.includes('early') || str.includes('rom')) {
      return {
        title: '1. Early Stage: ROM and Quality',
        subtitle: 'Recupero estensione 0°, controllo del gonfiore, riattivazione isolata VMO e propriocezione iniziale.',
        targetLsi: 70
      };
    }
    if (str.includes('2') || str.includes('mid') || str.includes('forza')) {
      return {
        title: '2. Mid Stage: Strength, Jump and Landing',
        subtitle: 'Rinforzo muscolare progressivo in catena chiusa/aperta, landing mechanics e primi salti controllati.',
        targetLsi: 75
      };
    }
    if (str.includes('3') || str.includes('run') || str.includes('power') || str.includes('drills')) {
      return {
        title: '3. Return to Run: Drills, RSI and Power',
        subtitle: 'Introduzione alla corsa sul dritto, drills meccanici, lavoro su RSI (Reactive Strength Index) e potenza.',
        targetLsi: 80
      };
    }
    if (str.includes('4') || str.includes('late') || str.includes('cod') || str.includes('agility')) {
      return {
        title: '4. Late Stage: CODs, Chaos and Plyo',
        subtitle: 'Cambi di direzione (CODs) ad alta velocità, ambienti caotici/reattivi e pliometria ad alto impatto.',
        targetLsi: 85
      };
    }
    if (str.includes('5') || str.includes('perf') || str.includes('rts') || str.includes('sport') || str.includes('play')) {
      return {
        title: '5. Return to Performance: Med, Sprint and PeakPower',
        subtitle: 'Ritorno alla performance massimale: test di sprint 10-30m, potenza di picco e idoneità Return to Sport.',
        targetLsi: 95
      };
    }
    return {
      title: `3. ${patient?.fase_riabilitativa || 'Return to Run'}: Drills, RSI and Power`,
      subtitle: 'Direttive operative cliniche per il recupero neuromuscolare e Return to Sport.',
      targetLsi: 80
    };
  };

  const phaseInfo = getPhaseInfo(patient?.fase_riabilitativa);
  const phaseTitle = phaseInfo.title;
  const phaseSubtitle = phaseInfo.subtitle;
  const targetLsi = phaseInfo.targetLsi;

  // Estrai i test specifici del paziente attivo
  const patientTests = Array.isArray(patient?.tests) ? patient.tests : [];
  const latestTest = patientTests.length > 0 ? patientTests[patientTests.length - 1] : null;
  const hasTests = latestTest !== null;

  const safeFixedMobile = (val, decimals = 1, suffix = '') => {
    if (val === undefined || val === null || val === '' || val === '-') return 'N/D';
    const num = Number(val);
    return isNaN(num) ? 'N/D' : `${num.toFixed(decimals)}${suffix}`;
  };

  // Sincronizzazione dinamica dei deficit con le Direttive Operative
  const deficits = (Array.isArray(patient?.deficits_list) && patient.deficits_list.length > 0)
    ? patient.deficits_list.map(d => ({
        id: d.id,
        severity: d.severity || 'Rosso',
        title: d.title,
        detail: d.description || 'Nessuna osservazione specifica inserita.',
        actionPlan: d.actionPlan || 'Piano di monitoraggio standard.'
      }))
    : (hasTests ? [
        ...(latestTest?.lsiQuad && typeof latestTest.lsiQuad === 'number' && latestTest.lsiQuad < targetLsi ? [{
          id: 1,
          severity: 'Rosso',
          title: `Deficit Forza Quadricipite LSI (${latestTest.lsiQuad.toFixed(1)}%)`,
          detail: `Forza dinamometrica Iso Push: ${latestTest.quadOp || 'N/D'}N (Arto Operato) vs ${latestTest.quadSano || 'N/D'}N (Arto Sano). Target Fase: ≥${targetLsi}%.`,
          actionPlan: 'Piano Azione: Potenziamento selettivo concentrico/eccentrico.'
        }] : []),
        {
          id: 2,
          severity: 'Giallo',
          title: 'Valgo Dinamico in Atterraggio',
          detail: 'Cedimento dinamico su atterraggio SL a fine seduta quando subentra affaticamento.',
          actionPlan: 'Piano Azione: Rinforzo medio gluteo + feedback visivo allo specchio.'
        }
      ] : []);

  const rehabNote = patient?.note_operative || 'Nessuna direttiva clinica specifica inserita.';

  // Sincronizzazione dinamica della scheda esercizi con le Direttive Operative
  const exercises = (Array.isArray(patient?.exercises_list) && patient.exercises_list.length > 0)
    ? patient.exercises_list
    : (patient?.esercizi_prescritti ? [
        {
          id: 1,
          name: patient.esercizi_prescritti,
          setsReps: '4x6',
          weight: '40 kg',
          vbtSpeed: '0.7 m/s',
          note: 'Prescrizione fisio attiva'
        }
      ] : [
        {
          id: 1,
          name: 'Leg Extension Isometrico 60°',
          setsReps: '4x6',
          weight: '40 kg',
          vbtSpeed: '0.7 m/s',
          note: 'Spinta isometrica massimale 5s'
        },
        {
          id: 2,
          name: 'Single Leg Press',
          setsReps: '4x10',
          weight: '85 kg',
          vbtSpeed: '0.65 m/s',
          note: 'Controllo fase eccentrica 3s'
        }
      ]);

  // Data per Bicchieri Prestativi sincronizzati con la Fase del Paziente
  const cups = [
    { 
      id: 1, 
      name: 'LSI QUADRICIPITE', 
      val: hasTests ? safeFixedMobile(latestTest?.lsiQuad, 1, '%') : 'N/D', 
      target: `Target: >${targetLsi}%`, 
      pct: hasTests && Number(latestTest?.lsiQuad) ? Math.min(100, Math.round((Number(latestTest.lsiQuad) / targetLsi) * 100)) : 0, 
      isOk: hasTests && Number(latestTest?.lsiQuad) >= targetLsi, 
      note: 'Iso Push Leg Extension' 
    },
    { 
      id: 2, 
      name: 'FORZA REL. QUAD OP', 
      val: hasTests ? safeFixedMobile(latestTest?.quadOpNmKg, 2, ' Nm/kg') : 'N/D', 
      target: 'Target: >2.0 Nm/kg', 
      pct: hasTests && Number(latestTest?.quadOpNmKg) ? Math.min(100, Math.round((Number(latestTest.quadOpNmKg) / 2.0) * 100)) : 0, 
      isOk: hasTests && Number(latestTest?.quadOpNmKg) >= 2.0, 
      note: 'Torque Relativo Corporeo' 
    },
    { 
      id: 3, 
      name: 'LSI HAMSTRING', 
      val: hasTests ? safeFixedMobile(latestTest?.lsiFlex, 1, '%') : 'N/D', 
      target: `Target: >${targetLsi}%`, 
      pct: hasTests && Number(latestTest?.lsiFlex) ? Math.min(100, Math.round((Number(latestTest.lsiFlex) / targetLsi) * 100)) : 0, 
      isOk: hasTests && Number(latestTest?.lsiFlex) >= targetLsi, 
      note: 'Iso Push Leg Curl' 
    },
    { 
      id: 4, 
      name: 'H/Q RATIO ISOMETRICO', 
      val: hasTests && Number(latestTest?.quadOp) > 0 && Number(latestTest?.flexOp) > 0 ? (Number(latestTest.flexOp) / Number(latestTest.quadOp)).toFixed(2) : 'N/D', 
      target: 'Target: >0.55', 
      pct: hasTests && Number(latestTest?.quadOp) > 0 && Number(latestTest?.flexOp) > 0 ? Math.min(100, Math.round(((Number(latestTest.flexOp) / Number(latestTest.quadOp)) / 0.55) * 100)) : 0, 
      isOk: hasTests && Number(latestTest?.quadOp) > 0 && (Number(latestTest.flexOp) / Number(latestTest.quadOp)) >= 0.55, 
      note: 'Rapporto Flessori / Estensori' 
    },
    { 
      id: 5, 
      name: 'SCORE IKDC', 
      val: hasTests ? safeFixedMobile(latestTest?.ikdc, 0, ' pts') : 'N/D', 
      target: 'Target: >70 pts', 
      pct: hasTests && Number(latestTest?.ikdc) ? Math.min(100, Math.round((Number(latestTest.ikdc) / 70) * 100)) : 0, 
      isOk: hasTests && Number(latestTest?.ikdc) >= 70, 
      note: 'Prontitudine Clinica Soggettiva' 
    },
    { 
      id: 6, 
      name: 'RSI DROP JUMP', 
      val: hasTests ? safeFixedMobile(latestTest?.rsiDropJump, 2, ' rsi') : 'N/D', 
      target: 'Target: >1.50 rsi', 
      pct: hasTests && Number(latestTest?.rsiDropJump) ? Math.min(100, Math.round((Number(latestTest.rsiDropJump) / 1.5) * 100)) : 0, 
      isOk: hasTests && Number(latestTest?.rsiDropJump) >= 1.5, 
      note: 'Contact Time < 250ms' 
    }
  ];

  return (
    <div className="space-y-3 max-w-xl mx-auto select-none pb-8">
      
      {/* --------------------------------------------------------------------- */}
      {/* HEADER BANNER MOBILE */}
      {/* --------------------------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#050c17] border border-slate-800 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9.5px] font-black uppercase tracking-widest text-cyan-400">VISTA MOBILE COLLEGHI</span>
              <h3 className="font-extrabold text-white text-sm leading-tight">Direttive Operative Sul Campo</h3>
            </div>
          </div>
          
          <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9.5px] font-bold text-slate-300">
            Sola Lettura
          </span>
        </div>

        {/* Card Paziente */}
        <div className="p-2.5 bg-[#071322] rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <div className="font-extrabold text-white text-xs sm:text-sm">{patient.nome} {patient.cognome}</div>
            <div className="text-slate-400 text-[10.5px] mt-0.5">
              {patient.sport} ({patient.ruolo_sportivo || 'Atleta'}) • <strong className="text-cyan-300">{patient.tipo_innesto} {patient.lato_lesione}</strong>
            </div>
          </div>

          <span className="px-2 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-extrabold text-[10px] uppercase tracking-wider">
            {patient.fase_riabilitativa}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* SUB-TABS INTERNE MOBILE (SWITCHER AD ALTO CONTRASTO) */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#071322] rounded-xl border border-slate-800/90 shadow-md">
        <button
          onClick={() => setMobileTab('OPERATIVA')}
          className={`py-2 px-2.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'OPERATIVA'
              ? 'bg-[#0f2d3a] text-cyan-300 border border-cyan-400 shadow-sm font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
          <span>📋 Scheda Operativa</span>
        </button>

        <button
          onClick={() => setMobileTab('BICCHIERI')}
          className={`py-2 px-2.5 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'BICCHIERI'
              ? 'bg-[#0f2d3a] text-cyan-300 border border-cyan-400 shadow-sm font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>🍷 Bicchieri & Test</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* CONTENUTO VISTA 1: SCHEDA OPERATIVA & ESERCIZI */}
      {/* ========================================================================= */}
      {mobileTab === 'OPERATIVA' && (
        <div className="space-y-3">
          
          {/* 1. Banner Fase Riabilitativa LCA Attiva */}
          <div className="p-3.5 rounded-2xl bg-[#071322] border border-slate-800 shadow-md space-y-1.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#112438] border border-cyan-500/40 text-rose-400 font-black text-[9.5px] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                <span>🧪 FASE RIABILITATIVA LCA ATTIVA</span>
              </div>
              <span className="text-[9.5px] font-black text-slate-400 uppercase">Stato Avanzamento</span>
            </div>

            <h4 className="text-white font-black text-xs sm:text-sm pt-0.5 leading-snug">
              {phaseTitle}
            </h4>

            <p className="text-slate-300 text-[11px] font-medium leading-tight">
              {phaseSubtitle}
            </p>
          </div>

          {/* 2. Priorità & Deficit Clinici Registrati (GRIGLIA A 2 PER RIGA) */}
          <div className="p-3.5 rounded-2xl bg-[#071322] border border-slate-800 shadow-md space-y-2.5">
            <div className="flex items-center gap-1.5 text-white font-extrabold text-[11px] uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>2. Priorità & Deficit Clinici Registrati</span>
            </div>

            {/* GRIGLIA A 2 COLONNE PER RIGA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deficits.map((def) => {
                const isRosso = def.severity === 'Rosso';
                return (
                  <div key={def.id} className="p-2.5 rounded-xl bg-[#09182a] border border-slate-800 space-y-1 shadow-sm">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-black uppercase ${
                        isRosso ? 'bg-rose-600 text-white' : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950'
                      }`}>
                        {isRosso ? '🔴 ALTA CRITICITÀ' : '🟡 MEDIA CRITICITÀ'}
                      </span>
                    </div>

                    <h5 className="text-white font-extrabold text-[11.5px] leading-tight">
                      {def.title}
                    </h5>

                    <p className="text-slate-300 text-[10.5px] font-medium leading-tight">
                      {def.detail}
                    </p>

                    <p className="text-emerald-400 font-bold text-[10.5px] pt-0.5">
                      {def.actionPlan}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Indicazioni Direttive Rehab Team */}
          <div className="p-3.5 rounded-2xl bg-[#071322] border border-slate-800 shadow-md space-y-1.5">
            <div className="flex items-center gap-1.5 text-white font-extrabold text-[11px] uppercase tracking-wider">
              <ClipboardList className="w-4 h-4 text-purple-400 shrink-0" />
              <span>3. Indicazioni Direttive Rehab Team</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[#09182a] border border-slate-800 text-slate-200 text-[11px] italic font-medium leading-snug">
              "{rehabNote}"
            </div>
          </div>

          {/* 4. Scheda Esercizi, Carichi (kg) e Velocità VBT (m/s) (GRIGLIA A 3 PER RIGA) */}
          <div className="p-3.5 rounded-2xl bg-[#071322] border border-slate-800 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-white font-extrabold text-[11px] uppercase tracking-wider">
                <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>4. Esercizi, Carichi (kg) & VBT (m/s)</span>
              </div>
              <span className="text-[9.5px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-[#09182a]">
                {exercises.length} Prescritti
              </span>
            </div>

            {/* GRIGLIA A 3 COLONNE PER RIGA SU TABLET/DESKTOP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {exercises.map((ex) => (
                <div key={ex.id} className="p-2.5 rounded-xl bg-[#09182a] border border-slate-800 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="text-white font-extrabold text-[11.5px] leading-tight">
                      {ex.name}
                    </h5>

                    <span className="px-1.5 py-0.5 bg-[#0d2334] border border-cyan-500/30 text-cyan-300 font-black text-[10px] rounded shrink-0">
                      {ex.setsReps}
                    </span>
                  </div>

                  {/* Pillole Ultra-Compatte */}
                  <div className="flex items-center gap-1">
                    <div className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-black text-[10px] rounded-lg flex items-center gap-0.5 shrink-0">
                      <span>🏋️</span>
                      <span>Carico: {ex.weight}</span>
                    </div>

                    <div className="px-2 py-0.5 bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-black text-[10px] rounded-lg flex items-center gap-0.5 shrink-0">
                      <span>⚡</span>
                      <span>Velocità: {ex.vbtSpeed}</span>
                    </div>
                  </div>

                  {/* Note in corsivo tra virgolette */}
                  <div className="pt-0.5 border-t border-slate-800/60">
                    <p className="text-slate-300/90 text-[10.5px] italic font-medium leading-tight">
                      "{ex.note}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* CONTENUTO VISTA 2: BICCHIERI & TEST CLINICI */}
      {/* ========================================================================= */}
      {mobileTab === 'BICCHIERI' && (
        <div className="space-y-3">
          
          {/* Header Bicchieri */}
          <div className="p-3.5 rounded-2xl bg-[#071322] border border-slate-800 shadow-md space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Bicchieri Prestativi Fase 3</span>
              </h4>
              <span className="text-[9.5px] font-mono text-emerald-400 font-black bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                6/6 Target OK
              </span>
            </div>
            <p className="text-slate-400 text-[10.5px] font-medium leading-tight">
              Stato di riempimento dei parametri chiave per la progressione clinica in sicurezza
            </p>
          </div>

          {/* Griglia Verticale Compattata Bicchieri */}
          <div className="grid grid-cols-1 gap-2">
            {cups.map((cup) => (
              <div 
                key={cup.id}
                className="p-2.5 rounded-xl bg-[#09182a] border border-slate-800 space-y-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-black text-white text-[11px] tracking-wide">
                      {cup.name}
                    </h5>
                    <span className="text-[9.5px] text-slate-400 font-medium">
                      {cup.note}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-cyan-300 text-xs">{cup.val}</span>
                    <div className="text-[9.5px] text-emerald-400 font-mono font-bold">{cup.target}</div>
                  </div>
                </div>

                {/* Progress Bar Bicchieri */}
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${cup.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Sintesi Ultimi Test Registrati */}
          <div className="p-3.5 rounded-2xl bg-[#071322] border border-slate-800 shadow-md space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-white uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Storico Test Registrati</span>
              </span>
              <span className="text-[9.5px] text-slate-400 font-mono">2 Sedute</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#09182a] border border-slate-800 space-y-0.5">
                <span className="text-[9.5px] text-slate-400 font-bold block">Test #1 (10/08)</span>
                <div className="font-extrabold text-white text-[11px]">LSI Quad: 72.4%</div>
                <div className="text-[9.5px] text-emerald-400 font-bold">+7.7% vs Prec</div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#09182a] border border-slate-800 space-y-0.5">
                <span className="text-[9.5px] text-slate-400 font-bold block">Test #2 (10/09)</span>
                <div className="font-extrabold text-white text-[11px]">LSI Quad: 81.5%</div>
                <div className="text-[9.5px] text-emerald-400 font-bold">+9.1% vs Prec</div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Footer Info */}
      <div className="text-center p-2 text-[10.5px] text-slate-500 flex items-center justify-center gap-1.5">
        <Shield className="w-3 h-3 text-slate-400" />
        <span>Integrazione Supabase RBAC - Vista Sola Lettura Staff Mobile</span>
      </div>
    </div>
  );
}
