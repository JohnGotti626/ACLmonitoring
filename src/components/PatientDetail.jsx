import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Activity,
  Sparkles,
  FileDown,
  Edit2,
  X,
  Save,
  Smartphone,
  CheckCircle2,
  ClipboardList,
  Compass,
  ChevronDown,
  ChevronUp,
  Layers,
  Check
} from 'lucide-react';
import TabDirettiveOperative from './tabs/TabDirettiveOperative';
import TabBatteriaTest from './tabs/TabBatteriaTest';
import RilevazioniCarichiTab from './tabs/RilevazioniCarichiTab';
import TabCopilotPdf from './tabs/TabCopilotPdf';
import PrintConfiguratorModal from './PrintConfiguratorModal';
import { UIErrorBoundary } from './UIErrorBoundary';
import { CANONICAL_PHASES, normalizePhaseForDb } from '../utils/phaseUtils';
import { sortTestsByDate, getLastValidMetricValue } from '../utils/testUtils';

const FIVE_REHAB_PHASES = [
  {
    id: 'EARLY_STAGE',
    num: 'Fase 1',
    tag: 'EARLY STAGE',
    title: 'Controllo Infiammazione & ROM',
    subtitle: 'Recupero estensione 0°, controllo gonfiore, riattivazione VMO e propriocezione iniziale.',
    dbPhase: 'Early Phase'
  },
  {
    id: 'MID_STAGE',
    num: 'Fase 2',
    tag: 'MID STAGE',
    title: 'Forza, Jump & Landing',
    subtitle: 'Rinforzo muscolare progressivo in catena chiusa/aperta, landing mechanics e primi salti.',
    dbPhase: 'Return to Run'
  },
  {
    id: 'RETURN_TO_RUN',
    num: 'Fase 3',
    tag: 'RETURN TO RUN',
    title: 'Carico, Corsa & RSI',
    subtitle: 'Introduzione alla corsa lineare, drills meccanici, lavoro su RSI e sviluppo potenza.',
    dbPhase: 'Return to Run'
  },
  {
    id: 'LATE_STAGE',
    num: 'Fase 4',
    tag: 'LATE STAGE',
    title: 'CODs, Chaos & Plyo',
    subtitle: 'Cambi di direzione ad alta velocità, ambienti caotici/reattivi e pliometria intensiva.',
    dbPhase: 'Return to Sport'
  },
  {
    id: 'PERFORMANCE',
    num: 'Fase 5',
    tag: 'PERFORMANCE',
    title: 'Return to Sport & Peak Power',
    subtitle: 'Ritorno alla performance massimale: sprint, potenza di picco e idoneità agonistica.',
    dbPhase: 'Return to Play'
  }
];

function getStageIdFromPatient(patient) {
  const raw = String(patient?.fase_attuale || patient?.fase_riabilitativa || '').toLowerCase();
  if (raw.includes('early') || raw.includes('rom') || raw.includes('fase 1')) return 'EARLY_STAGE';
  if (raw.includes('mid') || raw.includes('strength') || raw.includes('fase 2')) return 'MID_STAGE';
  if (raw.includes('run') || raw.includes('drills') || raw.includes('fase 3')) return 'RETURN_TO_RUN';
  if (raw.includes('late') || raw.includes('cod') || raw.includes('sport') || raw.includes('fase 4')) return 'LATE_STAGE';
  if (raw.includes('perf') || raw.includes('play') || raw.includes('rts') || raw.includes('fase 5')) return 'PERFORMANCE';
  return 'RETURN_TO_RUN';
}

export default function PatientDetail({ patient, onBack, onUpdatePatient }) {
  // Struttura a 3 Schede:
  // 'tab1' -> Monitoraggio & Diario
  // 'tab2' -> Test & Valutazioni
  // 'tab3' -> Copilot
  const [activeTab, setActiveTab] = useState('tab1');
  const [showEditAnagrafica, setShowEditAnagrafica] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMobileLink, setToastMobileLink] = useState(false);
  const [showAdvancedDirectives, setShowAdvancedDirectives] = useState(false);

  const [selectedStageId, setSelectedStageId] = useState(() => getStageIdFromPatient(patient));
  const [faseAttualeInput, setFaseAttualeInput] = useState(
    normalizePhaseForDb(patient?.fase_attuale || patient?.fase_riabilitativa)
  );
  const [direttiveTerapistaInput, setDirettiveTerapistaInput] = useState(
    patient?.direttive_terapista || patient?.note_operative || ''
  );
  const [savedDirectivesToast, setSavedDirectivesToast] = useState(false);

  const [editForm, setEditForm] = useState({
    nome: patient?.nome || '',
    cognome: patient?.cognome || '',
    sport: patient?.sport || '',
    ruolo_sportivo: patient?.ruolo_sportivo || '',
    livello: patient?.livello || 'Amatoriale',
    lato_lesione: patient?.lato_lesione || 'Dx',
    data_intervento: patient?.data_intervento || '',
    tipo_innesto: patient?.tipo_innesto || 'STG',
    chirurgo: patient?.chirurgo || '',
    fase_riabilitativa: normalizePhaseForDb(patient?.fase_riabilitativa || patient?.fase_attuale)
  });

  useEffect(() => {
    if (patient) {
      const normP = normalizePhaseForDb(patient.fase_attuale || patient.fase_riabilitativa);
      setFaseAttualeInput(normP);
      setSelectedStageId(getStageIdFromPatient(patient));
      setDirettiveTerapistaInput(patient.direttive_terapista || patient.note_operative || '');
      setEditForm({
        nome: patient.nome || '',
        cognome: patient.cognome || '',
        sport: patient.sport || '',
        ruolo_sportivo: patient.ruolo_sportivo || '',
        livello: patient.livello || 'Amatoriale',
        lato_lesione: patient.lato_lesione || 'Dx',
        data_intervento: patient.data_intervento || '',
        tipo_innesto: patient.tipo_innesto || 'STG',
        chirurgo: patient.chirurgo || '',
        fase_riabilitativa: normP
      });
    }
  }, [patient?.id, patient?.fase_riabilitativa, patient?.fase_attuale, patient?.note_operative, patient?.direttive_terapista]);

  if (!patient) return null;

  const handleSaveAnagrafica = (e) => {
    e.preventDefault();
    if (onUpdatePatient) {
      const normP = normalizePhaseForDb(editForm.fase_riabilitativa);
      onUpdatePatient({
        ...patient,
        ...editForm,
        fase_riabilitativa: normP,
        fase_attuale: normP
      });
    }
    setShowEditAnagrafica(false);
  };

  // Selezione diretta di una delle 5 Fasi Fisse Orizzontali
  const handleSelectPhaseBlock = (phaseObj) => {
    setSelectedStageId(phaseObj.id);
    const normP = normalizePhaseForDb(phaseObj.dbPhase);
    setFaseAttualeInput(normP);
    if (onUpdatePatient) {
      onUpdatePatient({
        ...patient,
        fase_riabilitativa: normP,
        fase_attuale: normP,
        note_operative: direttiveTerapistaInput,
        direttive_terapista: direttiveTerapistaInput
      });
    }
    setSavedDirectivesToast(true);
    setTimeout(() => setSavedDirectivesToast(false), 2500);
  };

  // Salvataggio rapido delle Direttive del Terapista su Supabase
  const handleSaveSyntheticDirectives = (e) => {
    if (e) e.preventDefault();
    if (!onUpdatePatient) return;
    const normP = normalizePhaseForDb(faseAttualeInput);
    onUpdatePatient({
      ...patient,
      fase_riabilitativa: normP,
      fase_attuale: normP,
      note_operative: direttiveTerapistaInput,
      direttive_terapista: direttiveTerapistaInput
    });
    setSavedDirectivesToast(true);
    setTimeout(() => setSavedDirectivesToast(false), 2800);
  };

  const handleSaveDirectivesFromPanel = (partialUpdates) => {
    if (!onUpdatePatient) return;
    onUpdatePatient({
      ...patient,
      ...partialUpdates
    });
  };

  const handleSaveNewTest = (updatedTestsArray) => {
    if (onUpdatePatient) {
      onUpdatePatient({
        ...patient,
        tests: sortTestsByDate(updatedTestsArray)
      });
    }
  };

  const handleCopyClientPortalLink = () => {
    try {
      localStorage.setItem('acl_client_patient_id', String(patient.id));
    } catch (_) {}
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?portal=client&patientId=${encodeURIComponent(patient.id)}&name=${encodeURIComponent(
      `${patient.nome} ${patient.cognome}`
    )}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl);
    }
    setToastMobileLink(true);
    setTimeout(() => setToastMobileLink(false), 3500);
  };

  const surgeryDate = new Date(patient.data_intervento || new Date());
  const today = new Date();
  const diffDays = Math.max(0, Math.floor((today - surgeryDate) / (1000 * 60 * 60 * 24)));
  const months = Math.floor(diffDays / 30);
  const days = diffDays % 30;

  const sortedPatientTests = sortTestsByDate(patient.tests);
  const lastQuadLsi = getLastValidMetricValue(sortedPatientTests, ['lsiQuad', 'lsi_quad_calculated']);
  const lastRsiMod = getLastValidMetricValue(sortedPatientTests, [
    'rsiDropJump',
    'djRSI',
    'dj_rsi',
    'rsiCmj',
    'rsi_cmj'
  ]);
  const activeStageMeta = FIVE_REHAB_PHASES.find((p) => p.id === selectedStageId) || FIVE_REHAB_PHASES[2];
  const currentPhaseDisplay = `${activeStageMeta.num}: ${activeStageMeta.title}`;

  // 3 SCHEDE PRINCIPALI ESATTE: Monitoraggio & Diario | Test & Valutazioni | Copilot
  const tabs = [
    {
      id: 'tab1',
      label: 'Monitoraggio & Diario',
      icon: ClipboardList
    },
    {
      id: 'tab2',
      label: 'Test & Valutazioni',
      icon: Activity
    },
    {
      id: 'tab3',
      label: 'Copilot',
      icon: Sparkles
    }
  ];

  return (
    <div className="space-y-5 text-slate-800">
      {/* Toast conferma copia Link Mobile Paziente */}
      {toastMobileLink && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-100 border border-emerald-300/60 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Link Mobile Paziente copiato negli appunti!</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar (print:hidden) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300/60 shadow-none transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700" />
          <span>Torna all&apos;Elenco Pazienti</span>
        </button>

        {/* Barra pulsanti in alto a destra con print:hidden */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleCopyClientPortalLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-100/80 hover:bg-sky-200/70 text-sky-900 border border-sky-300/50 text-xs font-bold shadow-none transition-all cursor-pointer"
            title="Copia il link diretto al Diario Carichi Mobile del Paziente"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-900" />
            <span>Condividi Link Mobile</span>
          </button>

          <button
            onClick={() => setShowEditAnagrafica(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-300/60 text-xs font-bold shadow-none transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-700" />
            <span>Modifica Anagrafica</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100/80 hover:bg-purple-200/70 text-purple-900 border border-purple-300/50 font-bold text-xs shadow-none transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Stampa / Esporta PDF A4</span>
          </button>
        </div>
      </div>

      {/* Patient Clinical Header Card (Soft Pastel Medical) */}
      <div className="bg-slate-50 p-5 rounded-xl border border-slate-300/60 shadow-none relative overflow-hidden break-inside-avoid">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-100/80 border border-emerald-300/50 flex items-center justify-center font-bold text-xl text-emerald-900 shrink-0">
              {patient.nome?.[0]}{patient.cognome?.[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                  {patient.nome} {patient.cognome}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 border border-slate-300/60 font-bold">
                  Ginocchio {patient.lato_lesione} • {patient.tipo_innesto}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100/80 text-sky-900 border border-sky-300/50 font-bold">
                  {patient.sport} ({patient.ruolo_sportivo || patient.livello})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium mt-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-700" />
                  Intervento: <strong className="text-slate-800 font-mono font-bold">{patient.data_intervento}</strong>
                </span>
                <span>•</span>
                <span>
                  Chirurgo: <strong className="text-slate-800 font-bold">{patient.chirurgo || 'N/D'}</strong>
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 font-bold">
                  {currentPhaseDisplay}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Strip Pastello Opaco */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-300/60">
            <div className="bg-sky-100/80 px-3.5 py-2.5 rounded-xl border border-sky-300/50 text-center">
              <div className="text-[10px] text-sky-900/70 uppercase tracking-wider font-bold">Time Post-Op</div>
              <div className="text-sm sm:text-base font-bold font-mono text-sky-900 mt-0.5">
                {months}m {days}g
              </div>
            </div>
            <div className={`px-3.5 py-2.5 rounded-xl border text-center ${
              lastQuadLsi !== null && lastQuadLsi >= 85
                ? 'bg-emerald-100/80 border-emerald-300/50 text-emerald-900'
                : 'bg-rose-100/80 border-rose-300/50 text-rose-900'
            }`}>
              <div className="text-[10px] opacity-75 uppercase tracking-wider font-bold">LSI Quad</div>
              <div className="text-sm sm:text-base font-bold font-mono mt-0.5">
                {lastQuadLsi !== null ? `${lastQuadLsi}%` : 'Non testato'}
              </div>
            </div>
            <div className="bg-purple-100/80 px-3.5 py-2.5 rounded-xl border border-purple-300/50 text-center">
              <div className="text-[10px] text-purple-900/70 uppercase tracking-wider font-bold">RSImod</div>
              <div className="text-sm sm:text-base font-bold font-mono text-purple-900 mt-0.5">
                {lastRsiMod !== null ? lastRsiMod : 'Non testato'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DI NAVIGAZIONE A 3 SCHEDE (Monitoraggio & Diario | Test & Valutazioni | Copilot) */}
      <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-300/60 shadow-none flex overflow-x-auto gap-2 print:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/50'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 border border-slate-300/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-900' : 'text-slate-600'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENUTO DELLE 3 SCHEDE */}
      <div className="min-h-[420px]">
        {/* ===================================================================== */}
        {/* TAB 1: MONITORAGGIO & DIARIO                                          */}
        {/* ===================================================================== */}
        {activeTab === 'tab1' && (
          <div className="space-y-5">
            {/* 1. LE 5 FASI RIABILITATIVE IN ALTO FISSE E ORIZZONTALI A BLOCCHI */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-300/60 shadow-none space-y-3.5 break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-300/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 rounded shrink-0">
                    <Layers className="w-4 h-4 text-emerald-900" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                      Fasi Riabilitative LCA (Seleziona la Fase Attuale)
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Clicca sul blocco corrispondente per impostare o aggiornare la fase clinica attiva del paziente
                    </p>
                  </div>
                </div>

                {savedDirectivesToast && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100/80 border border-emerald-300/50 text-emerald-900 text-xs font-bold flex items-center gap-1 self-start sm:self-auto print:hidden">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Salvato nel Cloud
                  </span>
                )}
              </div>

              {/* Griglia fissa orizzontale a 5 Blocchi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {FIVE_REHAB_PHASES.map((ph) => {
                  const isSelected = selectedStageId === ph.id;
                  return (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => handleSelectPhaseBlock(ph)}
                      className={`p-3.5 rounded-xl text-left transition-all flex flex-col justify-between space-y-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-100/80 border-2 border-emerald-400 text-emerald-950'
                          : 'bg-slate-100 border border-slate-300/60 hover:bg-slate-200/50 text-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              isSelected
                                ? 'bg-emerald-800 text-emerald-50'
                                : 'bg-slate-200/80 text-slate-700'
                            }`}
                          >
                            {ph.num} • {ph.tag}
                          </span>
                        </div>

                        <h3 className="text-slate-800 font-bold text-xs sm:text-sm leading-snug pt-0.5">
                          {ph.title}
                        </h3>

                        <p className="text-slate-600 font-medium text-[11px] leading-relaxed">
                          {ph.subtitle}
                        </p>
                      </div>

                      <div
                        className={`pt-2 border-t flex items-center justify-between text-[11px] font-bold ${
                          isSelected
                            ? 'border-emerald-300/70 text-emerald-900'
                            : 'border-slate-300/60 text-slate-500'
                        }`}
                      >
                        <span>{isSelected ? 'Fase Attiva' : 'Imposta Fase'}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-900" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SUBITO SOTTO LE 5 FASI: CARD CON LE DIRETTIVE DEL TERAPISTA */}
            <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-300/60 shadow-none space-y-4 break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-300/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-sky-100/80 text-sky-900 border border-sky-300/50 rounded shrink-0">
                    <Compass className="w-4 h-4 text-sky-900" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                      Direttive del Terapista &amp; Priorità Cliniche
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Consegne operative per lo staff e il paziente sincronizzate automaticamente con il Copilot
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedDirectives((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl bg-purple-100/80 hover:bg-purple-200/70 text-purple-900 border border-purple-300/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {showAdvancedDirectives ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Chiudi Gestione Deficit &amp; Focus VBT</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Gestisci Deficit ({(patient.deficits_list || []).length}) &amp; Prescrizioni VBT</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSyntheticDirectives}
                    className="px-4 py-1.5 rounded-xl bg-emerald-100/80 hover:bg-emerald-200/70 text-emerald-900 border border-emerald-300/50 font-bold text-xs flex items-center gap-1.5 shadow-none transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salva Direttive</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Colonna Sinistra (8/12): Note / Direttive del Terapista */}
                <div className="lg:col-span-8 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Direttive Operative del Terapista
                  </label>
                  <textarea
                    rows={3}
                    value={direttiveTerapistaInput}
                    onChange={(e) => setDirettiveTerapistaInput(e.target.value)}
                    placeholder="Inserisci qui le direttive operative per il team e per il paziente (es. Focus recupero estensione attiva 0°, carichi isometrici a 60° di flessione, controllo valgismo dinamico in decelerazione...)"
                    className="w-full bg-slate-100 border border-slate-300/60 rounded-xl p-3 text-xs text-slate-800 font-medium leading-relaxed focus:border-slate-500 focus:outline-none"
                  />
                </div>

                {/* Colonna Destra (4/12): Riepilogo Deficit Attivi */}
                <div className="lg:col-span-4 space-y-2 bg-slate-100 p-3.5 rounded-xl border border-slate-300/60">
                  <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Deficit Biomeccanici Segnalati ({(patient.deficits_list || []).length})
                  </span>
                  {Array.isArray(patient.deficits_list) && patient.deficits_list.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.deficits_list.map((def) => {
                        const sev = String(def.severity || '').toUpperCase();
                        const isHigh = sev === 'ALTA' || sev === 'ROSSO';
                        const isMed = sev === 'MEDIA' || sev === 'GIALLO';
                        return (
                          <span
                            key={def.id}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                              isHigh
                                ? 'bg-rose-100/80 text-rose-900 border-rose-300/50'
                                : isMed
                                ? 'bg-sky-100/80 text-sky-900 border-sky-300/50'
                                : 'bg-emerald-100/80 text-emerald-900 border-emerald-300/50'
                            }`}
                          >
                            {def.title}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium block">
                      Nessun deficit specifico registrato. Usa &quot;Gestisci Deficit&quot; per aggiungerne.
                    </span>
                  )}
                </div>
              </div>

              {/* Pannello espandibile per gestione dettagliata Deficit & Esercizi Prescritti */}
              {showAdvancedDirectives && (
                <div className="pt-4 border-t border-stone-300/70">
                  <UIErrorBoundary title="Modulo Direttive Dettagliate">
                    <TabDirettiveOperative
                      patient={patient}
                      onSaveDirectives={handleSaveDirectivesFromPanel}
                      onChangePhase={(dbP) => {
                        const normP = normalizePhaseForDb(dbP);
                        setFaseAttualeInput(normP);
                      }}
                    />
                  </UIErrorBoundary>
                </div>
              )}
            </div>

            {/* 3. SUBITO SOTTO: SCHEDA DI REGISTRAZIONE CARICHI / ESERCIZI DEL PAZIENTE */}
            <UIErrorBoundary title="Errore nel caricamento del Diario e Rilevazioni Carichi">
              <RilevazioniCarichiTab
                patient={patient}
                onUpdatePatient={onUpdatePatient}
              />
            </UIErrorBoundary>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: TEST & VALUTAZIONI                                             */}
        {/* ===================================================================== */}
        {activeTab === 'tab2' && (
          <UIErrorBoundary title="Errore nel caricamento di Test & Valutazioni">
            <TabBatteriaTest
              patient={patient}
              activePhase={faseAttualeInput}
              onSaveTest={handleSaveNewTest}
            />
          </UIErrorBoundary>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: COPILOT                                                        */}
        {/* ===================================================================== */}
        {activeTab === 'tab3' && (
          <UIErrorBoundary title="Errore nel caricamento del Copilot">
            <TabCopilotPdf patient={patient} />
          </UIErrorBoundary>
        )}
      </div>

      {/* Modal Pre-Print Configurator */}
      <PrintConfiguratorModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        patient={patient}
      />

      {/* Modal Modifica Dati Anagrafici e Clinici Paziente */}
      {showEditAnagrafica && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs print:hidden">
          <div className="w-full max-w-lg bg-stone-50 border border-stone-300/70 rounded-xl p-6 space-y-4 shadow-none text-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-300/70">
              <h3 className="font-semibold text-stone-800 text-base">Modifica Anagrafica Paziente</h3>
              <button
                onClick={() => setShowEditAnagrafica(false)}
                className="text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnagrafica} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Cognome</label>
                  <input
                    type="text"
                    required
                    value={editForm.cognome}
                    onChange={(e) => setEditForm({ ...editForm, cognome: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Sport</label>
                  <input
                    type="text"
                    required
                    value={editForm.sport}
                    onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Ruolo / Disciplina</label>
                  <input
                    type="text"
                    value={editForm.ruolo_sportivo}
                    onChange={(e) => setEditForm({ ...editForm, ruolo_sportivo: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Lato Operato</label>
                  <select
                    value={editForm.lato_lesione}
                    onChange={(e) => setEditForm({ ...editForm, lato_lesione: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  >
                    <option value="Dx">Destro (Dx)</option>
                    <option value="Sx">Sinistro (Sx)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Tipo Innesto</label>
                  <select
                    value={editForm.tipo_innesto}
                    onChange={(e) => setEditForm({ ...editForm, tipo_innesto: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  >
                    <option value="STG">STG</option>
                    <option value="Rotuleo">Rotuleo (BPTB)</option>
                    <option value="Quadricipitale">Quadricipitale</option>
                    <option value="Allograft">Allograft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Data Intervento</label>
                  <input
                    type="date"
                    required
                    value={editForm.data_intervento}
                    onChange={(e) => setEditForm({ ...editForm, data_intervento: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-mono font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Chirurgo Ortopedico</label>
                  <input
                    type="text"
                    value={editForm.chirurgo}
                    onChange={(e) => setEditForm({ ...editForm, chirurgo: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Fase Riabilitativa</label>
                  <select
                    value={editForm.fase_riabilitativa}
                    onChange={(e) => setEditForm({ ...editForm, fase_riabilitativa: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  >
                    {CANONICAL_PHASES.map((ph) => (
                      <option key={ph} value={ph}>{ph}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-300/70 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditAnagrafica(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200/50 text-stone-800 border border-stone-300/70 rounded-xl font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salva Modifiche</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
