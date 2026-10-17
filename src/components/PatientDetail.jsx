import React, { useState } from 'react';
import {
  User,
  Info,
  Gauge,
  ClipboardList,
  Smartphone,
  Bot,
  ArrowLeft,
  Dumbbell,
  Plus,
  FileText,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TabAnagrafica from './tabs/TabAnagrafica';
import TabBatteriaTest from './tabs/TabBatteriaTest';
import TabDirettiveOperative from './tabs/TabDirettiveOperative';
import TabVistaMobile from './tabs/TabVistaMobile';
import TabCopilotPdf from './tabs/TabCopilotPdf';
import RilevazioniCarichiTab from './tabs/RilevazioniCarichiTab';
import ClientPortal from './ClientPortal';
import ModalNuovaValutazione from './ModalNuovaValutazione';
import ModalIKDC from './ModalIKDC';
import { createTestObject, saveTestToSupabase, sortTestsByDate } from '../utils/testUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { normalizePhaseForDb } from '../utils/phaseUtils';

export default function PatientDetail({ patient, onBack, onUpdatePatient }) {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('tab2'); // Default: Batteria Test & Bicchieri
  const [activePhase, setActivePhase] = useState(() =>
    normalizePhaseForDb(patient?.fase_riabilitativa || patient?.fase_attuale)
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIKDCModalOpen, setIsIKDCModalOpen] = useState(false);
  const [isAnagraficaModalOpen, setIsAnagraficaModalOpen] = useState(false);
  const [isSimulatingPatientPortal, setIsSimulatingPatientPortal] = useState(false);

  // Sincronizzazione automatica con i dati reali restituiti da Supabase
  React.useEffect(() => {
    const currentRealPhase = patient?.fase_riabilitativa || patient?.fase_attuale;
    if (currentRealPhase) {
      setActivePhase(normalizePhaseForDb(currentRealPhase));
    }
  }, [patient?.fase_riabilitativa, patient?.fase_attuale]);

  if (!patient) return null;

  // Se il terapista ha attivato "Simula Vista Paziente / Test Rapido", mostra il Portale Paziente Mobile
  if (isSimulatingPatientPortal) {
    return (
      <ClientPortal
        patient={patient}
        isSimulationMode={true}
        onExitSimulation={() => {
          setIsSimulatingPatientPortal(false);
          setActiveTab('tab6'); // Ritorna direttamente alla tab Rilevazioni Carichi per vedere i dati inseriti
        }}
        onNewLogSaved={(newEntry, updatedList) => {
          onUpdatePatient({
            ...patient,
            workout_logs: updatedList
          });
        }}
      />
    );
  }

  // Tab principali snellite: rimossa 'Anagrafica & Chirurgia' (spostata nel pulsante Info accanto al nome nell'Header)
  const tabs = [
    { id: 'tab4', label: '1. Vista Mobile Colleghi', icon: Smartphone, badge: 'Sola Lettura' },
    { id: 'tab3', label: '2. Direttive Operative', icon: ClipboardList },
    { id: 'tab2', label: '3. Batteria Test & Bicchieri', icon: Gauge },
    { id: 'tab6', label: '4. Rilevazioni Carichi', icon: Dumbbell, badge: 'Client Log' },
    { id: 'tab5', label: '5. Copilot IA Engine', icon: Bot }
  ];

  // Persistenza dei Cambiamenti di Fase su Supabase
  const handlePhaseChange = async (newPhaseInput) => {
    const normPhase = normalizePhaseForDb(newPhaseInput);

    if (isSupabaseConfigured && patient?.id) {
      try {
        const { error } = await supabase
          .from('pazienti')
          .update({
            fase_riabilitativa: normPhase,
            updated_at: new Date().toISOString()
          })
          .eq('id', patient.id);

        if (error) {
          console.error('⚡ [Supabase Cloud] Errore aggiornamento fase su Supabase:', error.message);
        } else {
          console.log('⚡ [Supabase Cloud] Fase salvata con successo nel DB:', normPhase);
        }
      } catch (err) {
        console.error("Eccezione durante l'aggiornamento fase:", err);
      }
    }

    setActivePhase(normPhase);
    onUpdatePatient({
      ...patient,
      fase_riabilitativa: normPhase,
      fase_attuale: normPhase
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Patient Header Card - Deep Slate (#1E293B) */}
      <div className="bg-[#1E293B] p-6 rounded-2xl border border-[#334155] space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-xs font-bold text-[#94A3B8] hover:text-white border border-[#334155] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#06B6D4]" />
            <span>Torna al Database Pazienti</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSimulatingPatientPortal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 border border-amber-500/40 shadow-sm transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Simula Portale Paziente</span>
            </button>

            <button
              onClick={() => setIsIKDCModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#06B6D4] font-extrabold text-xs flex items-center gap-1.5 border border-[#06B6D4]/40 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#06B6D4]" />
              <span>Questionario IKDC iPad</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 border border-teal-500/40 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Nuova Valutazione Clinica</span>
            </button>

            <div className="flex items-center gap-2 bg-[#0F172A] px-3 py-1.5 rounded-xl border border-[#334155]">
              <span className="text-xs text-[#94A3B8] font-semibold">Fase Attuale:</span>
              <span className="px-3 py-1 rounded-lg bg-[#1E293B] border border-[#06B6D4]/40 text-[#06B6D4] font-black text-xs uppercase tracking-wider">
                {activePhase}
              </span>
            </div>
          </div>
        </div>

        {/* Patient Profile Header Bar con Pulsante Info / Anagrafica accanto al Nome e Cognome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-[#334155]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black text-white tracking-tight">
                {patient.nome} {patient.cognome}
              </h2>

              {/* PULSANTE INFO / ANAGRAFICA & CHIRURGIA ACCANTO AL NOME */}
              <button
                type="button"
                onClick={() => setIsAnagraficaModalOpen(true)}
                title="Visualizza e modifica Anagrafica e Dettagli Chirurgici"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#06B6D4] hover:text-white border border-[#334155] hover:border-[#06B6D4] text-xs font-extrabold transition-all cursor-pointer group"
              >
                <Info className="w-4 h-4 text-[#06B6D4] group-hover:scale-110 transition-transform" />
                <span>Info / Anagrafica</span>
              </button>

              <span className="px-3 py-1 rounded-full bg-[#0F172A] border border-[#334155] text-white font-mono text-xs font-black">
                Lato {patient.lato_lesione}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#94A3B8] mt-2 font-medium">
              <span>
                Sport:{' '}
                <strong className="text-white bg-[#0F172A] px-2 py-0.5 rounded border border-[#334155]">
                  {patient.sport} ({patient.ruolo_sportivo || 'Atleta'})
                </strong>
              </span>
              <span>
                Livello: <strong className="text-white">{patient.livello}</strong>
              </span>
              <span>
                Innesto: <strong className="text-[#06B6D4] font-bold">{patient.tipo_innesto}</strong>
              </span>
              <span>
                Data Chirurgia: <strong className="text-white font-mono">{patient.data_intervento}</strong>
              </span>
              <span>
                Chirurgo: <strong className="text-white">{patient.chirurgo || 'N/D'}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#0F172A] rounded-xl border border-[#334155] text-right hidden sm:block">
              <div className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-bold">
                ACL-RSI Iniziale
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {patient.aclrsi_score_iniziale}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Tab Operational Navigation Bar */}
      <div className="p-1.5 bg-[#1E293B] rounded-2xl border border-[#334155] flex items-center gap-2 overflow-x-auto scrollbar-none shadow-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap flex-shrink-0 cursor-pointer
                ${isActive ? 'tab-active shadow-sm' : 'tab-inactive'}
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-[#0F172A] text-[#06B6D4] border border-[#334155]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="transition-all duration-200">
        {activeTab === 'tab2' && (
          <TabBatteriaTest
            patient={patient}
            activePhase={activePhase}
            onChangePhase={handlePhaseChange}
            onSaveTest={(testData) => {
              const currentTests = Array.isArray(patient?.tests) ? patient.tests.flat(Infinity) : [];
              let updatedTests;
              if (Array.isArray(testData)) {
                updatedTests = testData.flat(Infinity);
              } else {
                updatedTests = [...currentTests, testData];
              }
              const cleanTests = sortTestsByDate(updatedTests);
              onUpdatePatient({ ...patient, tests: cleanTests });
            }}
          />
        )}

        {activeTab === 'tab3' && (
          <TabDirettiveOperative
            patient={patient}
            onChangePhase={handlePhaseChange}
            onSaveDirectives={async (directives) => {
              const updatedPatient = {
                ...patient,
                ...directives
              };
              if (isSupabaseConfigured && patient?.id) {
                try {
                  await supabase
                    .from('pazienti')
                    .update({
                      note_operative: updatedPatient.note_operative || '',
                      esercizi_prescritti: updatedPatient.esercizi_prescritti || '',
                      ...(directives.fase_riabilitativa ? { fase_riabilitativa: directives.fase_riabilitativa } : {}),
                      ...(directives.alert_compenso ? { alert_compenso: directives.alert_compenso } : {}),
                      ...(directives.deficits_list ? { deficits_list: directives.deficits_list } : {}),
                      ...(directives.exercises_list ? { exercises_list: directives.exercises_list } : {})
                    })
                    .eq('id', patient.id);
                } catch (err) {
                  console.error('Errore aggiornamento direttive su Supabase:', err);
                }
              }
              onUpdatePatient(updatedPatient);
            }}
          />
        )}

        {activeTab === 'tab4' && <TabVistaMobile patient={patient} />}

        {activeTab === 'tab6' && (
          <RilevazioniCarichiTab
            patient={patient}
            onOpenSimulation={() => setIsSimulatingPatientPortal(true)}
            onUpdatePatient={onUpdatePatient}
          />
        )}

        {activeTab === 'tab5' && <TabCopilotPdf patient={patient} />}
      </div>

      {/* MODALE A COMPARSA: ANAGRAFICA CLINICA & DETTAGLI CHIRURGICI */}
      {isAnagraficaModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-sm"
          onClick={() => setIsAnagraficaModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1E293B] border border-[#334155] rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#334155] pb-3 sticky top-0 bg-[#1E293B] z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#0F172A] border border-[#334155] text-[#06B6D4]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#06B6D4] block">
                    Scheda Paziente & Dettagli Chirurgici
                  </span>
                  <h3 className="text-lg font-black text-white">
                    {patient.nome} {patient.cognome}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAnagraficaModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-[#94A3B8] hover:text-white border border-[#334155] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Chiudi</span>
              </button>
            </div>

            {/* RIEPILOGO SINTETICO RAPIDO IN TESTA AL MODALE */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0F172A] border border-[#334155] rounded-2xl p-4 text-xs">
              <div>
                <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">Data di Nascita</span>
                <strong className="text-white font-mono">{patient.data_nascita || 'N/D'}</strong>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">Codice Fiscale</span>
                <strong className="text-[#06B6D4] font-mono uppercase">{patient.codice_fiscale || 'N/D'}</strong>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">Sport & Ruolo</span>
                <strong className="text-white">{patient.sport} ({patient.ruolo_sportivo || 'N/D'})</strong>
              </div>
              <div>
                <span className="text-[#94A3B8] block text-[10px] uppercase font-bold">Innesto & Lato</span>
                <strong className="text-[#0D9488]">{patient.tipo_innesto} • Lato {patient.lato_lesione}</strong>
              </div>
            </div>

            {/* FORM COMPLETO DI ANAGRAFICA & CHIRURGIA (VISUALIZZAZIONE E MODIFICA) */}
            <TabAnagrafica
              patient={patient}
              onUpdatePatient={async (updated) => {
                await onUpdatePatient(updated);
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Nuova Valutazione Clinica LCA */}
      <ModalNuovaValutazione
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
        onSaveEvaluation={async (evalData) => {
          const currentTests = Array.isArray(patient.tests) ? patient.tests : [];
          const newNum = currentTests.length + 1;
          const newTest = createTestObject(evalData, patient.id, newNum);

          await saveTestToSupabase(newTest);

          onUpdatePatient({
            ...patient,
            tests: [...currentTests, newTest]
          });
        }}
      />

      {/* Modal Questionario IKDC Soggettivo Digitale (iPad Touch Ready) */}
      <ModalIKDC
        isOpen={isIKDCModalOpen}
        onClose={() => setIsIKDCModalOpen(false)}
        patient={patient}
        onSaveIKDC={async (ikdcData) => {
          const currentTests = Array.isArray(patient?.tests) ? patient.tests.flat(Infinity) : [];
          let updatedTests;

          if (currentTests.length > 0) {
            updatedTests = [...currentTests];
            const lastIdx = updatedTests.length - 1;
            const updatedLastTest = {
              ...updatedTests[lastIdx],
              ikdc: ikdcData.ikdc_score,
              ikdc_score: ikdcData.ikdc_score,
              ikdc_classification: ikdcData.classification
            };
            updatedTests[lastIdx] = updatedLastTest;
            await saveTestToSupabase(updatedLastTest);
          } else {
            const newTest = createTestObject({ ikdc_score: ikdcData.ikdc_score }, patient.id, 1);
            updatedTests = [newTest];
            await saveTestToSupabase(newTest);
          }

          onUpdatePatient({
            ...patient,
            tests: updatedTests
          });
        }}
      />
    </div>
  );
}
