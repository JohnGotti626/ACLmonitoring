import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
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
import {
  FIVE_LCA_PHASES,
  getPhaseMeta,
  normalizePhaseForDb,
  formatPhaseForDisplay
} from '../utils/phaseUtils';
import { sortTestsByDate } from '../utils/testUtils';

const FIVE_REHAB_PHASES = [
  {
    id: 'EARLY_STAGE',
    num: 'Fase 1',
    tag: 'EARLY STAGE',
    title: 'Controllo Infiammazione & ROM',
    subtitle: 'Recupero estensione 0°, controllo gonfiore, riattivazione VMO e propriocezione iniziale.',
    fullLabel: 'Fase 1 (Early Stage)',
    dbPhase: 'Early Phase',
    topBorderCls: 'border-t-4 border-t-[#b91c1c]',
    pillCls: 'bg-red-50 text-[#b91c1c] border border-red-200',
    activeRingCls: 'ring-2 ring-[#b91c1c] bg-red-50/40'
  },
  {
    id: 'MID_STAGE',
    num: 'Fase 2',
    tag: 'MID STAGE',
    title: 'Forza, Jump & Landing',
    subtitle: 'Rinforzo muscolare progressivo in catena chiusa/aperta, landing mechanics e primi salti.',
    fullLabel: 'Fase 2 (Mid Stage)',
    dbPhase: 'Return to Run',
    topBorderCls: 'border-t-4 border-t-[#d97706]',
    pillCls: 'bg-amber-50 text-[#b45309] border border-amber-200',
    activeRingCls: 'ring-2 ring-[#d97706] bg-amber-50/40'
  },
  {
    id: 'RETURN_TO_RUN',
    num: 'Fase 3',
    tag: 'RETURN TO RUN',
    title: 'Carico, Corsa & RSI',
    subtitle: 'Introduzione alla corsa lineare, drills meccanici, lavoro su RSI e sviluppo potenza.',
    fullLabel: 'Fase 3 (Return to Run)',
    dbPhase: 'Return to Run',
    topBorderCls: 'border-t-4 border-t-[#1d4ed8]',
    pillCls: 'bg-blue-50 text-[#1d4ed8] border border-blue-200',
    activeRingCls: 'ring-2 ring-[#1d4ed8] bg-blue-50/40'
  },
  {
    id: 'LATE_STAGE',
    num: 'Fase 4',
    tag: 'LATE STAGE',
    title: 'CODs, Chaos & Plyo',
    subtitle: 'Cambi di direzione ad alta velocità, ambienti caotici/reattivi e pliometria intensiva.',
    fullLabel: 'Fase 4 (Late Stage)',
    dbPhase: 'Return to Sport',
    topBorderCls: 'border-t-4 border-t-[#059669]',
    pillCls: 'bg-emerald-50 text-[#047857] border border-emerald-200',
    activeRingCls: 'ring-2 ring-[#059669] bg-emerald-50/40'
  },
  {
    id: 'PERFORMANCE',
    num: 'Fase 5',
    tag: 'PERFORMANCE',
    title: 'Return to Sport & Peak Power',
    subtitle: 'Ritorno alla performance massimale: sprint, potenza di picco e idoneità agonistica.',
    fullLabel: 'Fase 5 (Return to Play)',
    dbPhase: 'Return to Play',
    topBorderCls: 'border-t-4 border-t-[#0d9488]',
    pillCls: 'bg-teal-50 text-[#0f766e] border border-teal-200',
    activeRingCls: 'ring-2 ring-[#0d9488] bg-teal-50/40'
  }
];

function getStageIdFromPatient(patient) {
  const meta = getPhaseMeta(patient);
  return meta.stageId || 'RETURN_TO_RUN';
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
  const [faseAttualeInput, setFaseAttualeInput] = useState(() => formatPhaseForDisplay(patient));
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
    fase_attuale: formatPhaseForDisplay(patient)
  });

  useEffect(() => {
    if (patient) {
      const displayP = formatPhaseForDisplay(patient);
      setFaseAttualeInput(displayP);
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
        fase_attuale: displayP
      });
    }
  }, [patient?.id, patient?.fase_riabilitativa, patient?.fase_attuale, patient?.note_operative, patient?.direttive_terapista]);

  if (!patient) return null;

  const handleSaveAnagrafica = (e) => {
    e.preventDefault();
    if (onUpdatePatient) {
      const displayP = formatPhaseForDisplay(editForm.fase_attuale);
      const normP = normalizePhaseForDb(editForm.fase_attuale);
      onUpdatePatient({
        ...patient,
        ...editForm,
        fase_riabilitativa: normP,
        fase_attuale: displayP
      });
    }
    setShowEditAnagrafica(false);
  };

  // Selezione diretta di una delle 5 Fasi Fisse Orizzontali
  const handleSelectPhaseBlock = (phaseObj) => {
    setSelectedStageId(phaseObj.id);
    const normP = normalizePhaseForDb(phaseObj.fullLabel);
    setFaseAttualeInput(phaseObj.fullLabel);
    if (onUpdatePatient) {
      onUpdatePatient({
        ...patient,
        fase_riabilitativa: normP,
        fase_attuale: phaseObj.fullLabel,
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
    const displayP = formatPhaseForDisplay(faseAttualeInput);
    const normP = normalizePhaseForDb(faseAttualeInput);
    onUpdatePatient({
      ...patient,
      fase_riabilitativa: normP,
      fase_attuale: displayP,
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
    <div className="space-y-6 text-slate-900">
      {/* Toast conferma copia Link Mobile Paziente */}
      {toastMobileLink && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-xs font-extrabold print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Link Mobile Paziente copiato negli appunti!</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar (print:hidden) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-extrabold text-slate-800 hover:text-slate-900 bg-white hover:bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-200 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-blue-600" />
          <span>Torna all&apos;Elenco Pazienti</span>
        </button>

        {/* Barra pulsanti in alto a destra con print:hidden */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleCopyClientPortalLink}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-extrabold shadow-xs transition-all cursor-pointer"
            title="Copia il link diretto al Diario Carichi Mobile del Paziente"
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Condividi Link Mobile</span>
          </button>

          <button
            onClick={() => setShowEditAnagrafica(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 text-slate-800 hover:text-slate-900 border border-stone-200 text-xs font-extrabold shadow-xs transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-700" />
            <span>Modifica Anagrafica</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Stampa / Esporta PDF A4</span>
          </button>
        </div>
      </div>

      {/* Patient Clinical Header Card (Minimal & Clean: Only Patient Name + Phase Badge) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md relative overflow-hidden break-inside-avoid">
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              {patient.nome?.[0]}{patient.cognome?.[0]}
            </div>
            <div className="flex flex-wrap items-center gap-3.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {patient.nome} {patient.cognome}
              </h1>
              <span className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wider ${activeStageMeta.pillCls}`}>
                {currentPhaseDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DI NAVIGAZIONE A 3 SCHEDE (Monitoraggio & Diario | Test & Valutazioni | Copilot) */}
      <div className="bg-white p-2 rounded-3xl border border-stone-200 shadow-md flex overflow-x-auto gap-2 print:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#faf9f6] text-slate-700 hover:text-slate-900 hover:bg-stone-100 border border-stone-200/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
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
          <div className="space-y-6">
            {/* 1. LE 5 FASI RIABILITATIVE IN ALTO FISSE E ORIZZONTALI A BLOCCHI */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4 break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                      Fasi Riabilitative LCA (Seleziona la Fase Attuale)
                    </h2>
                    <p className="text-xs text-slate-600 font-bold">
                      Clicca sul blocco corrispondente per impostare o aggiornare la fase clinica attiva del paziente
                    </p>
                  </div>
                </div>

                {savedDirectivesToast && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold flex items-center gap-1.5 self-start sm:self-auto print:hidden">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Salvato nel Cloud
                  </span>
                )}
              </div>

              {/* Griglia fissa orizzontale a 5 Blocchi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {FIVE_REHAB_PHASES.map((ph) => {
                  const isSelected = selectedStageId === ph.id;
                  return (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={() => handleSelectPhaseBlock(ph)}
                      className={`p-4 rounded-2xl text-left transition-all flex flex-col justify-between space-y-3 cursor-pointer border border-stone-200 ${ph.topBorderCls} ${
                        isSelected
                          ? `${ph.activeRingCls} shadow-md`
                          : 'bg-white hover:bg-[#faf9f6] shadow-xs hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg ${ph.pillCls}`}>
                            {ph.num} • {ph.tag}
                          </span>
                        </div>

                        <h3 className="text-slate-900 font-black text-xs sm:text-sm leading-snug pt-0.5">
                          {ph.title}
                        </h3>

                        <p className="text-slate-600 font-semibold text-[11px] leading-relaxed">
                          {ph.subtitle}
                        </p>
                      </div>

                      <div
                        className={`pt-2.5 border-t flex items-center justify-between text-[11px] font-extrabold ${
                          isSelected
                            ? 'border-stone-300 text-slate-900'
                            : 'border-stone-200 text-slate-500'
                        }`}
                      >
                        <span>{isSelected ? 'Fase Attiva' : 'Imposta Fase'}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SUBITO SOTTO LE 5 FASI: CARD CON LE DIRETTIVE DEL TERAPISTA */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-4 break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider">
                      Direttive del Terapista &amp; Priorità Cliniche
                    </h2>
                    <p className="text-xs text-slate-600 font-bold">
                      Consegne operative per lo staff e il paziente sincronizzate automaticamente con il Copilot
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedDirectives((prev) => !prev)}
                    className="px-3.5 py-2 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-900 border border-stone-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {showAdvancedDirectives ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        <span>Chiudi Gestione Deficit &amp; Focus VBT</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        <span>Gestisci Deficit ({(patient.deficits_list || []).length}) &amp; Prescrizioni VBT</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSyntheticDirectives}
                    className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salva Direttive</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Colonna Sinistra (8/12): Note / Direttive del Terapista */}
                <div className="lg:col-span-8 space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                    Direttive Operative del Terapista
                  </label>
                  <textarea
                    rows={3}
                    value={direttiveTerapistaInput}
                    onChange={(e) => setDirettiveTerapistaInput(e.target.value)}
                    placeholder="Inserisci qui le direttive operative per il team e per il paziente (es. Focus recupero estensione attiva 0°, carichi isometrici a 60° di flessione, controllo valgismo dinamico in decelerazione...)"
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-2xl p-3.5 text-xs text-slate-900 font-semibold leading-relaxed focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* Colonna Destra (4/12): Riepilogo Deficit Attivi */}
                <div className="lg:col-span-4 space-y-2 bg-[#faf9f6] p-4 rounded-2xl border border-stone-200">
                  <span className="block text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
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
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border ${
                              isHigh
                                ? 'bg-red-50 text-[#b91c1c] border-red-200'
                                : isMed
                                ? 'bg-amber-50 text-[#b45309] border-amber-200'
                                : 'bg-emerald-50 text-[#047857] border-emerald-200'
                            }`}
                          >
                            {def.title}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 font-semibold block">
                      Nessun deficit specifico registrato. Usa &quot;Gestisci Deficit&quot; per aggiungerne.
                    </span>
                  )}
                </div>
              </div>

              {/* Pannello espandibile per gestione dettagliata Deficit & Esercizi Prescritti */}
              {showAdvancedDirectives && (
                <div className="pt-4 border-t border-stone-200">
                  <UIErrorBoundary title="Modulo Direttive Dettagliate">
                    <TabDirettiveOperative
                      patient={patient}
                      onSaveDirectives={handleSaveDirectivesFromPanel}
                      onChangePhase={(newPhaseLabel) => {
                        const displayP = formatPhaseForDisplay(newPhaseLabel);
                        setFaseAttualeInput(displayP);
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
          <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-black text-slate-900 text-base">Modifica Anagrafica Paziente</h3>
              <button
                onClick={() => setShowEditAnagrafica(false)}
                className="text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnagrafica} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cognome</label>
                  <input
                    type="text"
                    required
                    value={editForm.cognome}
                    onChange={(e) => setEditForm({ ...editForm, cognome: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Sport</label>
                  <input
                    type="text"
                    required
                    value={editForm.sport}
                    onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Ruolo / Disciplina</label>
                  <input
                    type="text"
                    value={editForm.ruolo_sportivo}
                    onChange={(e) => setEditForm({ ...editForm, ruolo_sportivo: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Lato Operato</label>
                  <select
                    value={editForm.lato_lesione}
                    onChange={(e) => setEditForm({ ...editForm, lato_lesione: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Dx">Destro (Dx)</option>
                    <option value="Sx">Sinistro (Sx)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Tipo Innesto</label>
                  <select
                    value={editForm.tipo_innesto}
                    onChange={(e) => setEditForm({ ...editForm, tipo_innesto: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  >
                    <option value="STG">STG</option>
                    <option value="Rotuleo">Rotuleo (BPTB)</option>
                    <option value="Quadricipitale">Quadricipitale</option>
                    <option value="Allograft">Allograft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Data Intervento</label>
                  <input
                    type="date"
                    required
                    value={editForm.data_intervento}
                    onChange={(e) => setEditForm({ ...editForm, data_intervento: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-mono font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Chirurgo Ortopedico</label>
                  <input
                    type="text"
                    value={editForm.chirurgo}
                    onChange={(e) => setEditForm({ ...editForm, chirurgo: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fase Riabilitativa (1-5)</label>
                  <select
                    value={editForm.fase_attuale}
                    onChange={(e) => setEditForm({ ...editForm, fase_attuale: e.target.value })}
                    className="w-full bg-[#faf9f6] border border-stone-200 rounded-xl p-2.5 text-slate-900 font-bold focus:border-blue-600 focus:outline-none"
                  >
                    {FIVE_LCA_PHASES.map((ph) => (
                      <option key={ph.id} value={ph.fullLabel}>{ph.fullLabel}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditAnagrafica(false)}
                  className="px-4 py-2.5 bg-[#faf9f6] hover:bg-stone-100 text-slate-800 border border-stone-200 rounded-2xl font-extrabold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
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
