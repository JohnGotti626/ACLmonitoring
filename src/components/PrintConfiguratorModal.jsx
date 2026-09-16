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
  BarChart3,
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
  Lightbulb,
  GripVertical,
  BookOpen,
  Search
} from 'lucide-react';
import LogoN from './LogoN';
import ModalLibreriaScientifica from './ModalLibreriaScientifica';

const DEFAULT_METRIC_MODULES = [
  {
    id: 'sintesi_lca',
    title: 'Sintesi Fase Riabilitativa LCA',
    subtitle: 'Obiettivi Fase & Esito Simmetria LSI Globali',
    icon: Layers,
    category: 'Clinica',
    enabled: true,
  },
  {
    id: 'dinamometria',
    title: 'Forza Quadricipite (Iso Push Ext) & Ischiocrurali...',
    subtitle: 'Valutazione Dinamometrica & Peak Torque (Nm)',
    icon: Activity,
    category: 'Forza',
    enabled: true,
  },
  {
    id: 'forza_specifica',
    title: 'Dominio della Forza Specifica (Iso Push, Bulgarian, Soleo...)',
    subtitle: 'Iso Push Leg Ext/Curl, Bulgarian 6RM, Soleo',
    icon: Zap,
    category: 'Forza',
    enabled: true,
  },
  {
    id: 'esercizi_vbt',
    title: 'Esercizi, Carichi (kg) e Velocità VBT (m/s)',
    subtitle: 'Scheda carichi prescritti & Velocità target VBT',
    icon: Dumbbell,
    category: 'Scheda VBT',
    enabled: true,
  },
  {
    id: 'hop_tests',
    title: 'Functional Hop Tests (Salto in Lunghezza)',
    subtitle: 'Single Hop, Triple Hop & Crossover Hop LSI%',
    icon: Footprints,
    category: 'Pliometria',
    enabled: true,
  },
  {
    id: 'cmj_bilaterale',
    title: 'CMJ Bilaterale (Pedana di Forza)',
    subtitle: 'Altezza Salto & Impulsi di Frenata/Concentrico',
    icon: Zap,
    category: 'ForceDecks',
    enabled: true,
  },
  {
    id: 'cmj_mono',
    title: 'CMJ Monopodalico (Pedana di Forza)',
    subtitle: 'Single Leg CMJ Height & Stacco Sx vs Dx',
    icon: Footprints,
    category: 'ForceDecks',
    enabled: true,
  },
  {
    id: 'drop_jump',
    title: 'Drop Jump Bilaterale (30/45/60cm)',
    subtitle: 'Indice RSI Modificato & Tempi di Contatto',
    icon: TrendingDown,
    category: 'ForceDecks',
    enabled: true,
  },
  {
    id: 'grafici_longitudinali',
    title: 'Grafici Longitudinali & Trend di Recupero',
    subtitle: 'Progressione LSI storica su 3 test consecutivi',
    icon: TrendingUp,
    category: 'Analytics',
    enabled: true,
  },
  {
    id: 'indicazioni_rehab',
    title: 'Note',
    subtitle: 'Note e direttive cliniche',
    icon: MessageSquare,
    category: 'Clinica',
    enabled: true,
  },
];

export default function PrintConfiguratorModal({ isOpen, onClose, patient, patients = [] }) {
  // Filtra SOLTANTO i pazienti attivi/in carico dal DB
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
        },
        {
          id: 'b2c3d4e5-f6a7-4890-b123-6789abcdef02',
          nome: 'Giulia',
          cognome: 'Bianchi',
          sport: 'Basket',
          lato_lesione: 'Dx',
          data_intervento: '2026-02-10',
          tipo_innesto: 'STG',
          chirurgo: 'Dr. Stefano Zaffagnini',
          fase_riabilitativa: 'Return to Sport',
          ikdc: '86.5'
        },
        {
          id: 'c3d4e5f6-a7b8-4901-c234-789abcdef003',
          nome: 'Alessandro',
          cognome: 'Verdi',
          sport: 'Rugby',
          lato_lesione: 'Dx',
          data_intervento: '2026-01-20',
          tipo_innesto: 'Quadricipitale',
          chirurgo: 'Dr. Stefano Zaffagnini',
          fase_riabilitativa: 'Mid Stage',
          ikdc: '74.2'
        }
      ];

  const [selectedPatientId, setSelectedPatientId] = useState(patient?.id || activePatients[0]?.id || '');
  const [selectedSessionId, setSelectedSessionId] = useState('session_3');
  const [modules, setModules] = useState(DEFAULT_METRIC_MODULES);
  
  // Questionario IKDC Facoltativo
  const [showIkdc, setShowIkdc] = useState(true);
  const [ikdcScore, setIkdcScore] = useState('82.8');

  // Bibliografia Scientifica Automatica (Toggle)
  const [showCitations, setShowCitations] = useState(true);
  const [isBiblioModalOpen, setIsBiblioModalOpen] = useState(false);

  // Drag State per riordinamento dinamico
  const [draggedIdx, setDraggedIdx] = useState(null);

  // Sincronizza il paziente selezionato se cambia il prop patient
  useEffect(() => {
    if (patient?.id) {
      setSelectedPatientId(patient.id);
    } else if (activePatients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(activePatients[0].id);
    }
  }, [patient, patients]);

  // Paziente Attivo Risolto
  const activePatientObj = activePatients.find(p => p.id === selectedPatientId) || (patient?.nome ? patient : activePatients[0]);

  // Sincronizza IKDC score quando cambia il paziente selezionato
  useEffect(() => {
    if (activePatientObj) {
      if (activePatientObj.ikdc) {
        setIkdcScore(String(activePatientObj.ikdc));
      } else if (activePatientObj.aclrsi_score_iniziale) {
        setIkdcScore(String(activePatientObj.aclrsi_score_iniziale));
      }
    }
  }, [selectedPatientId]);

  if (!isOpen) return null;

  const formattedPatientName = activePatientObj?.nome && activePatientObj?.cognome
    ? `${activePatientObj.nome} ${activePatientObj.cognome}`
    : activePatientObj?.nome || 'Francesco Gabbani';

  const formatDate = (dStr) => {
    if (!dStr) return '15/12/2025';
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

  // Helper riordinamento tramite bottoni
  const moveModule = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;
    const updated = [...modules];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(newIndex, 0, movedItem);
    setModules(updated);
  };

  const toggleModule = (id) => {
    setModules(modules.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const toggleAll = (enable) => {
    setModules(modules.map(m => ({ ...m, enabled: enable })));
  };

  const resetModules = () => {
    setModules(DEFAULT_METRIC_MODULES);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-sans">
      
      {/* MODAL WRAPPER CONTAINER */}
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print-modal-container">
        
        {/* TOP MODAL HEADER (no-print) */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Configuratore Pre-Stampa Report A4</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono">
                  Real-Time Preview
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Seleziona i pazienti, attiva le citazioni scientifiche automatiche e personalizza l'ordine delle sezioni.
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

        {/* MODAL BODY: LEFT CONTROLS vs RIGHT REAL-TIME A4 PREVIEW */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* PANNELLO DI SINISTRA: SELETTORE PAZIENTE, QUESTIONARIO IKDC & BIBLIOGRAFIA (no-print) */}
          <div className="lg:col-span-5 p-5 bg-slate-900 border-r border-slate-800 overflow-y-auto space-y-4 no-print">
            
            {/* 1. SELEZIONE PAZIENTE (SOLO IN CARICO DINETICI DA SUPABASE) */}
            <div className="space-y-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center justify-between">
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
                      {p.nome} {p.cognome} ({p.lato_lesione || 'Dx'}) — {p.sport || 'Calcio'} [{p.fase_riabilitativa || 'In Carico'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>2. Sessione Valutazione:</span>
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full bg-slate-900 text-white font-bold text-xs border border-slate-700 rounded-xl p-2.5 focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <option value="session_3">Ultimo Test — {dataIntervento} (LSI Quad: &gt;85%)</option>
                  <option value="session_2">Test Precedente — Fase 2 (LSI Quad: 72.4%)</option>
                  <option value="session_1">Test Iniziale — Fase 1 Post-Op (LSI Quad: 52.1%)</option>
                </select>
              </div>
            </div>

            {/* 2. OPTIONAL QUESTIONARIO IKDC (FACOLTATIVO) */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
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

              {showIkdc && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400">Punteggio IKDC (0-100):</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={ikdcScore}
                      onChange={(e) => setIkdcScore(e.target.value)}
                      placeholder="es. 82.8"
                      className="w-20 bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs rounded-lg p-1 px-2 focus:border-cyan-500 focus:outline-none text-right"
                    />
                    <span className="text-[10px] text-slate-400 font-mono font-bold">/100</span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. TOGGLE ATTIVAZIONE BIBLIOGRAFIA SCIENTIFICA AUTOMATICA */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">Includi Bibliografia Automatica:</span>
                </label>
                <input
                  type="checkbox"
                  checked={showCitations}
                  onChange={(e) => setShowCitations(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400 leading-tight">
                  Citazioni nei commenti e note in calce A4.
                </p>
                <button
                  type="button"
                  onClick={() => setIsBiblioModalOpen(true)}
                  className="px-2.5 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-500/40 text-purple-300 font-extrabold text-[10.5px] rounded-lg flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition-all"
                >
                  <Search className="w-3 h-3 text-purple-400" />
                  <span>Gestisci Fonti & DOI</span>
                </button>
              </div>
            </div>

            {/* 4. REORDINAMENTO MODULI CLINICI (DRAG & DROP / BOTTONI SLIDE) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-purple-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>SEZIONI STAMPA & ORDINE (DRAG / ▲▼):</span>
                </span>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleAll(true)}
                    title="Attiva tutti"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleAll(false)}
                    title="Disattiva tutti"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={resetModules}
                    title="Ripristina ordine"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* LISTA TRASCINABILE CON DRAG & DROP E PULSANTI SU/GIÙ */}
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {modules.map((mod, idx) => {
                  const IconComp = mod.icon;
                  const isDraggingThis = draggedIdx === idx;
                  return (
                    <div
                      key={mod.id}
                      draggable
                      onDragStart={() => setDraggedIdx(idx)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIdx === null || draggedIdx === idx) return;
                        const updated = [...modules];
                        const [movedItem] = updated.splice(draggedIdx, 1);
                        updated.splice(idx, 0, movedItem);
                        setModules(updated);
                        setDraggedIdx(null);
                      }}
                      onDragEnd={() => setDraggedIdx(null)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                        isDraggingThis ? 'opacity-40 border-cyan-500 scale-[0.98] bg-cyan-950/40' : ''
                      } ${
                        mod.enabled
                          ? 'bg-slate-950 border-slate-700/90 hover:border-cyan-500/50 shadow-sm'
                          : 'bg-slate-950/40 border-slate-900 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Drag Handle Icon */}
                        <div className="text-slate-500 hover:text-cyan-400 p-0.5 cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </div>

                        <div className={`p-1.5 rounded-lg shrink-0 ${mod.enabled ? 'bg-cyan-500/10 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>

                        <div className="min-w-0">
                          <span className={`text-[11.5px] font-bold block truncate ${mod.enabled ? 'text-white' : 'text-slate-500'}`}>
                            {mod.title}
                          </span>
                        </div>
                      </div>

                      {/* Pulsanti Rapidi SPOSTA [▲ / ▼] & Toggle Active */}
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          onClick={() => moveModule(idx, 'up')}
                          disabled={idx === 0}
                          title="Sposta Su"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveModule(idx, 'down')}
                          disabled={idx === modules.length - 1}
                          title="Sposta Giù"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => toggleModule(mod.id)}
                          title={mod.enabled ? 'Disattiva Sezione' : 'Attiva Sezione'}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ml-1 ${
                            mod.enabled
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-600'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                onClick={handlePrint}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Conferma e Stampa Report A4</span>
              </button>
            </div>

          </div>

          {/* PANNELLO DI DESTRA: ANTEPRIMA A4 IN TEMPO REALE */}
          <div className="lg:col-span-7 bg-slate-950 p-4 sm:p-6 overflow-y-auto flex justify-center items-start">
            
            {/* CANVAS A4 (Target di stampa per window.print) */}
            <div className="w-full max-w-[750px] bg-white text-slate-900 p-7 sm:p-9 rounded-xl shadow-2xl border border-slate-300 print:shadow-none print:border-0 print:p-0 print:w-full text-[10px] leading-snug space-y-4 font-sans">
              
              {/* INTESTAZIONE ESCLUSIVA STAMPA (@media print) */}
              <div className="print-header">
                <h1>VALUTAZIONE CLINICO-FUNZIONALE LCA</h1>
              </div>

              {/* HEADER REPORT CENTRO */}
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-300">
                <div className="flex items-center gap-3">
                  <LogoN className="w-12 h-12 rounded-xl shrink-0 border border-slate-300 shadow-sm" />

                  <div>
                    <h1 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">
                      VALUTAZIONE CLINICO-FUNZIONALE LCA
                    </h1>
                    <p className="text-[9px] font-bold text-emerald-800 tracking-wide mt-1">
                      N REHAB TEAM • PROTOCOLLO RIABILITATIVO E MONITORAGGIO SIMMETRIA
                    </p>
                  </div>
                </div>

                <div className="text-right text-[9.5px]">
                  <div className="text-slate-600">Data Report: <strong className="text-slate-900">{new Date().toLocaleDateString('it-IT')}</strong></div>
                </div>
              </div>

              {/* DATI ANAGRAFICI & QUADRO CHIRURGICO ESSENZIALI (SUBITO SOTTO L'INTESTAZIONE) */}
              <div className="space-y-1.5 pt-0.5">
                <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-0.5">
                  DATI ANAGRAFICI & QUADRO CHIRURGICO ESSENZIALI
                </div>
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-[10px]">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Paziente (Nome e Cognome):</span>
                    <strong className="text-slate-900 text-xs">{formattedPatientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Data Intervento:</span>
                    <strong className="text-slate-900">{dataIntervento}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Ginocchio Operato:</span>
                    <strong className="text-emerald-800 font-black">{operatedKnee}</strong>
                  </div>
                </div>
              </div>

              {/* QUESTIONARIO IKDC (FACOLTATIVO) */}
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

              {/* MODULI ATTIVI DINAMICI REORDINATI SECONDO L'ORDINE IMPOSTATO A SINISTRA */}
              {modules.filter(m => m.enabled).map((mod) => {
                switch (mod.id) {
                  
                  case 'sintesi_lca':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-emerald-700" />
                            <span>Sintesi Fase Riabilitativa LCA & Target Bicchieri LSI</span>
                          </span>
                          <span className="text-[8.5px] text-emerald-800 font-bold">Target Minimo RTS: ≥90.0%</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-[9.5px]">
                          <div className="p-1.5 bg-emerald-50 border border-emerald-300 rounded">
                            <span className="text-slate-600 block text-[8.5px]">LSI Quadricipite</span>
                            <strong className="text-emerald-900 font-black text-xs">97.8%</strong>
                            <span className="text-[7.5px] text-emerald-700 font-bold block">TARGET OK</span>
                          </div>
                          <div className="p-1.5 bg-emerald-50 border border-emerald-300 rounded">
                            <span className="text-slate-600 block text-[8.5px]">LSI Ischiocrurali</span>
                            <strong className="text-emerald-900 font-black text-xs">96.5%</strong>
                            <span className="text-[7.5px] text-emerald-700 font-bold block">TARGET OK</span>
                          </div>
                          <div className="p-1.5 bg-emerald-50 border border-emerald-300 rounded">
                            <span className="text-slate-600 block text-[8.5px]">LSI Single Hop</span>
                            <strong className="text-emerald-900 font-black text-xs">96.8%</strong>
                            <span className="text-[7.5px] text-emerald-700 font-bold block">TARGET OK</span>
                          </div>
                          <div className="p-1.5 bg-cyan-50 border border-cyan-300 rounded">
                            <span className="text-slate-600 block text-[8.5px]">RSImod (DVJ 30cm)</span>
                            <strong className="text-cyan-900 font-black text-xs">2.18</strong>
                            <span className="text-[7.5px] text-cyan-800 font-bold block">ECCELLENTE (&gt;2.0)</span>
                          </div>
                        </div>
                      </div>
                    );

                  case 'dinamometria':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-700" />
                          <span>VALUTAZIONE DINAMOMETRICA FORZA & SIMMETRIA (LSI %)</span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-300 text-[9.5px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                              <th className="p-1 border-r border-slate-300">Parametro di Forza</th>
                              <th className="p-1 border-r border-slate-300">Arto Operato ({operatedKnee})</th>
                              <th className="p-1 border-r border-slate-300">Arto Sano</th>
                              <th className="p-1 border-r border-slate-300">LSI (%)</th>
                              <th className="p-1">Valutazione Clinica</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-800">
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">
                                Iso Push Leg Ext (Quadricipite)
                                {showCitations && <span className="text-[7.5px] font-mono font-bold text-cyan-700 ml-1">[Ref: 1,2,3]</span>}
                              </td>
                              <td className="p-1 border-r border-slate-200 font-bold text-slate-900">452 N</td>
                              <td className="p-1 border-r border-slate-200">462 N</td>
                              <td className="p-1 font-extrabold text-emerald-700 border-r border-slate-200">97.8%</td>
                              <td className="p-1 font-bold text-emerald-700 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Piena Simmetria
                              </td>
                            </tr>
                            <tr>
                              <td className="p-1 font-bold border-r border-slate-200">
                                Iso Push Leg Curl (Ischiocrurali)
                                {showCitations && <span className="text-[7.5px] font-mono font-bold text-cyan-700 ml-1">[Ref: 6]</span>}
                              </td>
                              <td className="p-1 border-r border-slate-200 font-bold text-slate-900">217 N</td>
                              <td className="p-1 border-r border-slate-200">225 N</td>
                              <td className="p-1 font-extrabold text-emerald-700 border-r border-slate-200">96.5%</td>
                              <td className="p-1 font-bold text-emerald-700 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-600"></span> Piena Simmetria
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );

                  case 'forza_specifica':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-700" />
                          <span>DOMINIO DELLA FORZA SPECIFICA (DINAMOMETRIA & CARICHI)</span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-300 text-[9.5px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                              <th className="p-1 border-r border-slate-300">Test Forza</th>
                              <th className="p-1 border-r border-slate-300">Sinistra (Left)</th>
                              <th className="p-1 border-r border-slate-300">Destra (Right)</th>
                              <th className="p-1">Asimmetria / LSI (%)</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-800">
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">Iso Push Leg Ext (N)</td>
                              <td className="p-1 border-r border-slate-200 font-bold text-slate-900">452 N</td>
                              <td className="p-1 border-r border-slate-200">462 N</td>
                              <td className="p-1 font-extrabold text-emerald-700">97.8%</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">Iso Push Leg Curl (N)</td>
                              <td className="p-1 border-r border-slate-200 font-bold text-slate-900">217 N</td>
                              <td className="p-1 border-r border-slate-200">225 N</td>
                              <td className="p-1 font-extrabold text-emerald-700">96.5%</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">Bulgarian Squat 6RM (kg)</td>
                              <td className="p-1 border-r border-slate-200 font-bold text-slate-900">54 kg</td>
                              <td className="p-1 border-r border-slate-200">52 kg</td>
                              <td className="p-1 font-extrabold text-emerald-700">96.3%</td>
                            </tr>
                            <tr>
                              <td className="p-1 font-bold border-r border-slate-200">Soleo (kg)</td>
                              <td className="p-1 border-r border-slate-200 font-bold text-slate-900">45 kg</td>
                              <td className="p-1 border-r border-slate-200">44 kg</td>
                              <td className="p-1 font-extrabold text-emerald-700">97.8%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );

                  case 'esercizi_vbt':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <Dumbbell className="w-3 h-3 text-emerald-700" />
                          <span>ESERCIZI, CARICHI (KG) E VELOCITÀ VBT (M/S)</span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-300 text-[9px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                              <th className="p-1 border-r border-slate-300">Esercizio Prescritto</th>
                              <th className="p-1 border-r border-slate-300">Serie x Reps</th>
                              <th className="p-1 border-r border-slate-300">Carico (kg)</th>
                              <th className="p-1 border-r border-slate-300">Target VBT (m/s)</th>
                              <th className="p-1">Velocity Loss Max</th>
                            </tr>
                          </thead>
                          <tbody className="text-slate-800">
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">Trap Bar Deadlift (ECC-CON)</td>
                              <td className="p-1 border-r border-slate-200">4 x 6 reps</td>
                              <td className="p-1 font-bold text-emerald-800 border-r border-slate-200">110 kg</td>
                              <td className="p-1 font-bold text-cyan-900 border-r border-slate-200">0.75 m/s</td>
                              <td className="p-1 text-slate-700">10% max</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">Leg Press Monopodalica Sx</td>
                              <td className="p-1 border-r border-slate-200">3 x 6 reps</td>
                              <td className="p-1 font-bold text-emerald-800 border-r border-slate-200">85 kg</td>
                              <td className="p-1 font-bold text-cyan-900 border-r border-slate-200">0.58 m/s</td>
                              <td className="p-1 text-slate-700">10% max</td>
                            </tr>
                            <tr>
                              <td className="p-1 font-bold border-r border-slate-200">Bulgarian Split Squat Manubri</td>
                              <td className="p-1 border-r border-slate-200">3 x 8 reps</td>
                              <td className="p-1 font-bold text-emerald-800 border-r border-slate-200">24+24 kg</td>
                              <td className="p-1 font-bold text-cyan-900 border-r border-slate-200">0.68 m/s</td>
                              <td className="p-1 text-slate-700">10% max</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );

                  case 'hop_tests':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <Footprints className="w-3 h-3 text-emerald-700" />
                          <span>FUNCTIONAL HOP TESTS (SALTO IN LUNGHEZZA)</span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-300 text-[9px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                              <th className="p-1 border-r border-slate-300">Test Pliometrico</th>
                              <th className="p-1 border-r border-slate-300">Arto Operato ({operatedKnee})</th>
                              <th className="p-1 border-r border-slate-300">Arto Sano</th>
                              <th className="p-1 border-r border-slate-300">LSI (%)</th>
                              <th className="p-1">Stato Clinico</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">Single Hop for Distance</td>
                              <td className="p-1 border-r border-slate-200 font-bold">182 cm</td>
                              <td className="p-1 border-r border-slate-200">188 cm</td>
                              <td className="p-1 font-bold text-emerald-700 border-r border-slate-200">96.8%</td>
                              <td className="p-1 text-emerald-800 font-bold">Target OK</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">Triple Hop for Distance</td>
                              <td className="p-1 border-r border-slate-200 font-bold">520 cm</td>
                              <td className="p-1 border-r border-slate-200">535 cm</td>
                              <td className="p-1 font-bold text-emerald-700 border-r border-slate-200">97.2%</td>
                              <td className="p-1 text-emerald-800 font-bold">Target OK</td>
                            </tr>
                            <tr>
                              <td className="p-1 font-bold border-r border-slate-200">Crossover Hop for Distance</td>
                              <td className="p-1 border-r border-slate-200 font-bold">485 cm</td>
                              <td className="p-1 border-r border-slate-200">500 cm</td>
                              <td className="p-1 font-bold text-emerald-700 border-r border-slate-200">97.0%</td>
                              <td className="p-1 text-emerald-800 font-bold">Target OK</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );

                  case 'cmj_bilaterale':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-700" />
                          <span>CMJ BILATERALE (PEDANA DI FORZA FORCEDECKS)</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[9px] text-center">
                          <div className="p-1 bg-slate-50 border border-slate-300 rounded">
                            <span className="text-slate-500 block">Altezza Salto</span>
                            <strong className="text-slate-900 text-xs">39.5 cm</strong>
                          </div>
                          <div className="p-1 bg-slate-50 border border-slate-300 rounded">
                            <span className="text-slate-500 block">Impulso Frenata {showCitations && <span className="text-[7.5px] text-cyan-700 font-mono">[5]</span>}</span>
                            <strong className="text-emerald-700 text-xs font-bold">Asim. 1.9%</strong>
                          </div>
                          <div className="p-1 bg-slate-50 border border-slate-300 rounded">
                            <span className="text-slate-500 block">Impulso Concentrico</span>
                            <strong className="text-emerald-700 text-xs font-bold">Asim. 2.0%</strong>
                          </div>
                          <div className="p-1 bg-slate-50 border border-slate-300 rounded">
                            <span className="text-slate-500 block">Peak Power / kg</span>
                            <strong className="text-slate-900 text-xs">58.8 W/kg</strong>
                          </div>
                        </div>
                      </div>
                    );

                  case 'cmj_mono':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <Footprints className="w-3 h-3 text-emerald-700" />
                          <span>CMJ MONOPODALICO (PEDANA DI FORZA)</span>
                        </div>
                        <table className="w-full text-left border-collapse border border-slate-300 text-[9px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                              <th className="p-1 border-r border-slate-300">Parametro Pedana</th>
                              <th className="p-1 border-r border-slate-300">Arto Operato ({operatedKnee})</th>
                              <th className="p-1 border-r border-slate-300">Arto Sano</th>
                              <th className="p-1">LSI %</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-200">
                              <td className="p-1 font-bold border-r border-slate-200">Altezza Salto (cm)</td>
                              <td className="p-1 border-r border-slate-200 font-bold text-slate-900">20.8 cm</td>
                              <td className="p-1 border-r border-slate-200">20.2 cm</td>
                              <td className="p-1 font-bold text-emerald-700">102.9%</td>
                            </tr>
                            <tr>
                              <td className="p-1 font-bold border-r border-slate-200">Forza di Stacco (N/kg)</td>
                              <td className="p-1 border-r border-slate-200 font-bold text-slate-900">24.5 N/kg</td>
                              <td className="p-1 border-r border-slate-200">24.8 N/kg</td>
                              <td className="p-1 font-bold text-emerald-700">98.7%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );

                  case 'drop_jump':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-emerald-700" />
                          <span>DROP JUMP BILATERALE (30/45/60CM)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[9px] text-center">
                          <div className="p-1.5 border border-slate-300 rounded bg-slate-50">
                            <span className="text-slate-500 block">RSI Modificato (DVJ 30cm) {showCitations && <span className="text-[7.5px] text-cyan-700 font-mono">[4]</span>}</span>
                            <strong className="text-slate-900 text-xs font-bold">2.18</strong>
                            <span className="text-[8px] text-emerald-700 block font-bold">Eccellente Rigidità</span>
                          </div>
                          <div className="p-1.5 border border-slate-300 rounded bg-slate-50">
                            <span className="text-slate-500 block">Tempo Contatto Suolo</span>
                            <strong className="text-slate-900 text-xs font-bold">180 ms</strong>
                            <span className="text-[8px] text-emerald-700 block font-bold">Target &lt; 200 ms</span>
                          </div>
                          <div className="p-1.5 border border-slate-300 rounded bg-slate-50">
                            <span className="text-slate-500 block">Asimmetria Impulso Drop</span>
                            <strong className="text-emerald-700 text-xs font-bold">1.9%</strong>
                            <span className="text-[8px] text-emerald-700 block font-bold">Controllo Eccentrico OK</span>
                          </div>
                        </div>
                      </div>
                    );

                  case 'grafici_longitudinali':
                    return (
                      <div key={mod.id} className="space-y-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-700" />
                          <span>GRAFICI LONGITUDINALI & TREND DI RECUPERO LSI</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between text-[8.5px] text-slate-700">
                            <span>Progressione Storica LSI Quadricipite:</span>
                            <span className="font-bold text-emerald-700">+25.4% in 6 Mesi</span>
                          </div>
                          <div className="space-y-1 text-[8.5px]">
                            <div>
                              <div className="flex justify-between text-[7.5px] text-slate-600 mb-0.5">
                                <span>Test #1 (Mese 4)</span>
                                <span>72.4%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full" style={{ width: '72.4%' }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[7.5px] text-slate-600 mb-0.5">
                                <span>Test #3 (Mese 6)</span>
                                <span>88.5%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-400 h-full rounded-full" style={{ width: '88.5%' }}></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[7.5px] font-bold text-slate-800 mb-0.5">
                                <span>Test #6 Attuale (Mese 9)</span>
                                <span className="text-emerald-700 font-extrabold">97.8%</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full" style={{ width: '97.8%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                  case 'indicazioni_rehab':
                    return (
                      <div key={mod.id} className="space-y-1 pt-1">
                        <div className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider border-b border-emerald-200 pb-0.5 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-emerald-700" />
                          <span>NOTE</span>
                        </div>
                        <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-[9px] text-slate-800 space-y-1">
                          <p className="leading-relaxed">
                            <strong>Note:</strong> Atleta <strong>{formattedPatientName}</strong>. LSI Quadricipite pari al {activePatientObj.lsiQuad || '97.8'}% con eccellente simmetria neuromuscolare{showCitations ? " [Ref: Rambaud et al. 2018 / Buckthorpe et al. 2019]" : ""}. Tutti i criteri clinici, pliometrici e psicologici (IKDC {showIkdc ? `${ikdcScore}/100` : 'Sbloccato'}) risultano superati per l'idoneità al Return to Sport / Return to Performance{showCitations ? " [Ref: Grindem et al. 2016 / Kyritsis et al. 2016]" : ""}.
                          </p>
                        </div>
                      </div>
                    );

                  default:
                    return null;
                }
              })}

              {/* FOOTER BIBLIOGRAFICO A4 (NOTE IN CALCE ACADEMICHE) */}
              {showCitations && (
                <div className="pt-3 border-t border-slate-300 space-y-1 font-sans text-[8px] text-slate-600 leading-tight mt-3">
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider text-[8.5px] flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5 text-slate-700" />
                    <span>NOTE & RIFERIMENTI BIBLIOGRAFICI SCIENTIFICI (EVIDENCE-BASED ACL RTS)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                    <div><sup>1</sup> <strong>Buckthorpe et al. (2019):</strong> <em>Optimising Quadriceps Recovery After ACL Reconstruction.</em> Sports Med.</div>
                    <div><sup>2</sup> <strong>Grindem et al. (2016):</strong> <em>Simple decision rules reduce re-injury risk after ACLR.</em> Br J Sports Med.</div>
                    <div><sup>3</sup> <strong>Rambaud et al. (2018):</strong> <em>Criteria for Return to Running After ACL Reconstruction.</em> Br J Sports Med.</div>
                    <div><sup>4</sup> <strong>Ebbs et al. (2023):</strong> <em>Reactive Strength Index Modified & Tendon Stiffness in Post-ACLR.</em> J Strength Cond Res.</div>
                    <div><sup>5</sup> <strong>Read et al. (2020):</strong> <em>Eccentric Braking Impulse Asymmetry and Landing Mechanics.</em> Am J Sports Med.</div>
                    <div><sup>6</sup> <strong>Kyritsis et al. (2016):</strong> <em>Likelihood of ACL graft rupture after return to sport.</em> Br J Sports Med.</div>
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
