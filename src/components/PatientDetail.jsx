import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Activity,
  ShieldAlert,
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
  ChevronUp
} from 'lucide-react';
import TabDirettiveOperative from './tabs/TabDirettiveOperative';
import TabBatteriaTest from './tabs/TabBatteriaTest';
import RilevazioniCarichiTab from './tabs/RilevazioniCarichiTab';
import TabCopilotPdf from './tabs/TabCopilotPdf';
import PrintConfiguratorModal from './PrintConfiguratorModal';
import { UIErrorBoundary } from './UIErrorBoundary';
import { CANONICAL_PHASES, normalizePhaseForDb } from '../utils/phaseUtils';
import { sortTestsByDate, getLastValidMetricValue } from '../utils/testUtils';

export default function PatientDetail({ patient, onBack, onUpdatePatient }) {
  // Struttura a 3 Schede:
  // 'tab1' -> 1. Monitoraggio & Diario
  // 'tab2' -> 2. Test & Valutazioni
  // 'tab3' -> 3. Copilot AI & Analytics
  const [activeTab, setActiveTab] = useState('tab1');
  const [showEditAnagrafica, setShowEditAnagrafica] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMobileLink, setToastMobileLink] = useState(false);
  const [showAdvancedDirectives, setShowAdvancedDirectives] = useState(false);

  // Stato per il riquadro sintetico "Fase Riabilitativa & Direttive" in cima alla Tab 1
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
  }, [patient]);

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

  // Salvataggio rapido del riquadro sintetico "Fase Riabilitativa & Direttive" su Supabase
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

  const handleQuickPhaseSwitch = (newPhaseValue) => {
    const normP = normalizePhaseForDb(newPhaseValue);
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
  const currentPhaseDisplay = normalizePhaseForDb(patient.fase_attuale || patient.fase_riabilitativa);

  // SOLO 3 SCHEDE PRINCIPALI COME RICHIESTO
  const tabs = [
    {
      id: 'tab1',
      label: '1. Monitoraggio & Diario',
      icon: ClipboardList
    },
    {
      id: 'tab2',
      label: '2. Test & Valutazioni',
      icon: Activity
    },
    {
      id: 'tab3',
      label: '3. Copilot AI & Analytics',
      icon: Sparkles
    }
  ];

  return (
    <div className="space-y-5">
      {/* Toast conferma copia Link Mobile Paziente */}
      {toastMobileLink && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-700 border border-emerald-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-bold print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>Link Mobile Paziente copiato negli appunti!</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar (print:hidden fa sparire completamente i controlli in stampa PDF) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Torna all&apos;Elenco Pazienti</span>
        </button>

        {/* Barra pulsanti in alto a destra con print:hidden */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleCopyClientPortalLink}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 border border-slate-200/80 text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Copia il link diretto al Diario Carichi Mobile del Paziente"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Condividi Link Mobile</span>
          </button>

          <button
            onClick={() => setShowEditAnagrafica(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200/80 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Modifica Anagrafica</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Stampa / Esporta PDF A4</span>
          </button>
        </div>
      </div>

      {/* Patient Clinical Header Card (Light Mode) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm relative overflow-hidden break-inside-avoid">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-xl text-emerald-700 shadow-2xs shrink-0">
              {patient.nome?.[0]}{patient.cognome?.[0]}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {patient.nome} {patient.cognome}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Ginocchio {patient.lato_lesione} • {patient.tipo_innesto}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  {patient.sport} ({patient.ruolo_sportivo || patient.livello})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Intervento: <strong className="text-slate-900 font-mono">{patient.data_intervento}</strong>
                </span>
                <span>•</span>
                <span>
                  Chirurgo: <strong className="text-slate-900">{patient.chirurgo || 'N/D'}</strong>
                </span>
                <span>•</span>
                <span>
                  Fase Attuale: <strong className="text-emerald-700 font-bold">{currentPhaseDisplay}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Time Post-Op</div>
              <div className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-0.5">
                {months}m {days}g
              </div>
            </div>
            <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">LSI Quad</div>
              <div className={`text-sm sm:text-base font-bold font-mono mt-0.5 ${lastQuadLsi !== null && lastQuadLsi >= 85 ? 'text-emerald-700' : 'text-amber-600'}`}>
                {lastQuadLsi !== null ? `${lastQuadLsi}%` : 'Non testato'}
              </div>
            </div>
            <div className="bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">RSImod</div>
              <div className="text-sm sm:text-base font-bold font-mono text-emerald-700 mt-0.5">
                {lastRsiMod !== null ? lastRsiMod : 'Non testato'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DI NAVIGAZIONE A 3 SCHEDE (1. Monitoraggio & Diario | 2. Test & Valutazioni | 3. Copilot AI & Analytics) */}
      <div className="bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-sm flex overflow-x-auto gap-2 print:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-emerald-50/40 border border-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENUTO DELLE 3 SCHEDE */}
      <div className="min-h-[420px]">
        {/* ===================================================================== */}
        {/* TAB 1: 1. MONITORAGGIO & DIARIO                                       */}
        {/* ===================================================================== */}
        {activeTab === 'tab1' && (
          <div className="space-y-6">
            {/* RIQUADRO SINTETICO IN CIMA: "FASE RIABILITATIVA & DIRETTIVE" (collegato a fase_attuale e direttive_terapista su pazienti) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm space-y-4 break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 bg-slate-100 text-slate-600 rounded shrink-0">
                    <Compass className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wide">
                      Fase Riabilitativa &amp; Direttive Terapista
                    </h2>
                    <p className="text-xs text-slate-500">
                      Sincronizzato su Supabase (<code className="text-emerald-700 font-mono">fase_attuale</code> &amp; <code className="text-emerald-700 font-mono">direttive_terapista</code>) e utilizzato dal Copilot AI
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                  {savedDirectivesToast && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Salvato nel Cloud
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowAdvancedDirectives(prev => !prev)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {showAdvancedDirectives ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Chiudi Deficit &amp; Focus VBT</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Gestisci Deficit ({(patient.deficits_list || []).length}) &amp; Focus Esercizi</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSyntheticDirectives}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salva Direttive</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                {/* Colonna Sinistra (4/12): Selettore Fase Riabilitativa Attuale */}
                <div className="lg:col-span-4 space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Fase Riabilitativa Attuale
                  </label>
                  <select
                    value={faseAttualeInput}
                    onChange={(e) => handleQuickPhaseSwitch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
                  >
                    {CANONICAL_PHASES.map(ph => (
                      <option key={ph} value={ph}>{ph}</option>
                    ))}
                  </select>

                  {/* Riepilogo rapido Deficit Attivi */}
                  <div className="pt-1">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Deficit Biomeccanici Segnalati:
                    </span>
                    {Array.isArray(patient.deficits_list) && patient.deficits_list.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {patient.deficits_list.map(def => (
                          <span
                            key={def.id}
                            className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold border ${
                              def.severity === 'ALTA'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : def.severity === 'MEDIA'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {def.title} ({def.severity})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Nessun deficit registrato (clicca &quot;Gestisci Deficit&quot; per aggiungerne)
                      </span>
                    )}
                  </div>
                </div>

                {/* Colonna Destra (8/12): Direttive Operative del Terapista */}
                <div className="lg:col-span-8 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Direttive Operative &amp; Consegne Cliniche del Terapista
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Inviate automaticamente al Copilot AI (Linee Guida NSCA)
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={direttiveTerapistaInput}
                    onChange={(e) => setDirettiveTerapistaInput(e.target.value)}
                    placeholder="Inserisci qui le direttive operative per il team e per il paziente (es. Focus recupero estensione attiva 0°, carichi isometrici a 60° di flessione, evitare valgismo dinamico in decelerazione...)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium leading-relaxed focus:border-emerald-600 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Pannello espandibile per gestione dettagliata Deficit & Esercizi Prescritti */}
              {showAdvancedDirectives && (
                <div className="pt-4 border-t border-slate-200">
                  <UIErrorBoundary title="Modulo Direttive Dettagliate">
                    <TabDirettiveOperative
                      patient={patient}
                      onUpdatePatient={onUpdatePatient}
                    />
                  </UIErrorBoundary>
                </div>
              )}
            </div>

            {/* SUBITO SOTTO: DIARIO E RILEVAZIONI CARICHI DI LAVORO */}
            <UIErrorBoundary title="Errore nel caricamento del Diario e Rilevazioni Carichi">
              <RilevazioniCarichiTab
                patient={patient}
                onUpdatePatient={onUpdatePatient}
              />
            </UIErrorBoundary>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: 2. TEST & VALUTAZIONI                                          */}
        {/* ===================================================================== */}
        {activeTab === 'tab2' && (
          <UIErrorBoundary title="Errore nel caricamento di Test & Valutazioni">
            <TabBatteriaTest
              patient={patient}
              activePhase={currentPhaseDisplay}
              onSaveTest={handleSaveNewTest}
            />
          </UIErrorBoundary>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: 3. COPILOT AI & ANALYTICS                                      */}
        {/* ===================================================================== */}
        {activeTab === 'tab3' && (
          <UIErrorBoundary title="Errore nel caricamento del Copilot AI & Analytics">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base">Modifica Anagrafica Paziente</h3>
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
                  <label className="block text-slate-500 font-semibold mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={editForm.nome}
                    onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Cognome</label>
                  <input
                    type="text"
                    required
                    value={editForm.cognome}
                    onChange={(e) => setEditForm({ ...editForm, cognome: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Sport</label>
                  <input
                    type="text"
                    required
                    value={editForm.sport}
                    onChange={(e) => setEditForm({ ...editForm, sport: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Ruolo / Disciplina</label>
                  <input
                    type="text"
                    value={editForm.ruolo_sportivo}
                    onChange={(e) => setEditForm({ ...editForm, ruolo_sportivo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Lato Operato</label>
                  <select
                    value={editForm.lato_lesione}
                    onChange={(e) => setEditForm({ ...editForm, lato_lesione: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="Dx">Destro (Dx)</option>
                    <option value="Sx">Sinistro (Sx)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Tipo Innesto</label>
                  <select
                    value={editForm.tipo_innesto}
                    onChange={(e) => setEditForm({ ...editForm, tipo_innesto: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="STG">STG</option>
                    <option value="Rotuleo">Rotuleo (BPTB)</option>
                    <option value="Quadricipitale">Quadricipitale</option>
                    <option value="Allograft">Allograft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Data Intervento</label>
                  <input
                    type="date"
                    required
                    value={editForm.data_intervento}
                    onChange={(e) => setEditForm({ ...editForm, data_intervento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-mono font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Chirurgo Ortopedico</label>
                  <input
                    type="text"
                    value={editForm.chirurgo}
                    onChange={(e) => setEditForm({ ...editForm, chirurgo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Fase Riabilitativa</label>
                  <select
                    value={editForm.fase_riabilitativa}
                    onChange={(e) => setEditForm({ ...editForm, fase_riabilitativa: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold focus:border-emerald-600 focus:outline-none"
                  >
                    {CANONICAL_PHASES.map(ph => (
                      <option key={ph} value={ph}>{ph}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditAnagrafica(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
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
