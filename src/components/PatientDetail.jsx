import React, { useState } from 'react';
import { 
  User, 
  Gauge, 
  ClipboardList, 
  Smartphone, 
  Bot, 
  ArrowLeft, 
  Activity, 
  Calendar, 
  Stethoscope,
  ShieldCheck,
  CheckCircle2,
  Plus,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import TabAnagrafica from './tabs/TabAnagrafica';
import TabBatteriaTest from './tabs/TabBatteriaTest';
import TabDirettiveOperative from './tabs/TabDirettiveOperative';
import TabVistaMobile from './tabs/TabVistaMobile';
import TabCopilotPdf from './tabs/TabCopilotPdf';
import ModalNuovaValutazione from './ModalNuovaValutazione';
import ModalIKDC from './ModalIKDC';
import { createTestObject, saveTestToSupabase } from '../utils/testUtils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function PatientDetail({ patient, onBack, onUpdatePatient }) {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('tab2'); // Default to Tab 2 (Batteria Test & Bicchieri)
  const [activePhase, setActivePhase] = useState(() => patient?.fase_riabilitativa || patient?.fase_attuale || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIKDCModalOpen, setIsIKDCModalOpen] = useState(false);

  // Sincronizzazione automatica con i dati reali restituiti da Supabase
  React.useEffect(() => {
    const currentRealPhase = patient?.fase_riabilitativa || patient?.fase_attuale;
    if (currentRealPhase) {
      setActivePhase(currentRealPhase);
    }
  }, [patient?.fase_riabilitativa, patient?.fase_attuale]);

  if (!patient) return null;

  const tabs = [
    { id: 'tab1', label: '1. Anagrafica & Chirurgia', icon: User },
    { id: 'tab4', label: '2. Vista Mobile Colleghi', icon: Smartphone, badge: 'Sola Lettura' },
    { id: 'tab3', label: '3. Direttive Operative', icon: ClipboardList },
    { id: 'tab2', label: '4. Batteria Test & Bicchieri', icon: Gauge },
    { id: 'tab5', label: '5. Copilot IA Engine', icon: Bot }
  ];

  // 3. Persistenza dei Cambiamenti di Fase su Supabase
  const handlePhaseChange = async (newPhase) => {
    if (isSupabaseConfigured && patient?.id) {
      try {
        await supabase
          .from('pazienti')
          .update({ 
            fase_riabilitativa: newPhase, 
            fase_attuale: newPhase,
            updated_at: new Date().toISOString()
          })
          .eq('id', patient.id);
      } catch (err) {
        console.error("Errore aggiornamento fase su Supabase:", err);
      }
    }

    setActivePhase(newPhase);
    onUpdatePatient({ 
      ...patient, 
      fase_riabilitativa: newPhase,
      fase_attuale: newPhase
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Patient Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-cyan-300 border border-slate-700 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Torna al Database Pazienti</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsIKDCModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md border border-cyan-400/50 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#39FF14]" />
              <span>Questionario IKDC iPad</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md border border-emerald-400/50 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#39FF14]" />
              <span>+ Nuova Valutazione Clinica</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-xs text-slate-400 font-semibold">Fase Attuale:</span>
              <span className="px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-black text-xs uppercase tracking-wider">
                {activePhase}
              </span>
            </div>
          </div>
        </div>

        {/* Patient Profile Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-700/80">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white tracking-tight">
                {patient.nome} {patient.cognome}
              </h2>
              <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-black">
                Lato {patient.lato_lesione}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-300 mt-2 font-medium">
              <span>Sport: <strong className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{patient.sport} ({patient.ruolo_sportivo || 'Atleta'})</strong></span>
              <span>Livello: <strong className="text-slate-100">{patient.livello}</strong></span>
              <span>Innesto: <strong className="text-cyan-300 font-bold">{patient.tipo_innesto}</strong></span>
              <span>Data Chirurgia: <strong className="text-slate-100 font-mono">{patient.data_intervento}</strong></span>
              <span>Chirurgo: <strong className="text-slate-100">{patient.chirurgo || 'N/D'}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 text-right hidden sm:block">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">ACL-RSI Iniziale</div>
              <div className="text-2xl font-black text-emerald-400">{patient.aclrsi_score_iniziale}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Tab Navigation Bar (High Contrast Active vs Inactive Tabs) */}
      <div className="p-1.5 bg-slate-900 rounded-2xl border border-slate-700/80 flex items-center gap-2 overflow-x-auto scrollbar-none shadow-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap flex-shrink-0 cursor-pointer
                ${isActive
                  ? 'tab-active shadow-lg'
                  : 'tab-inactive'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-extrabold ${
                  isActive
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="transition-all duration-200">
        {activeTab === 'tab1' && (
          <TabAnagrafica 
            patient={patient} 
            onUpdatePatient={onUpdatePatient} 
          />
        )}

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
              const cleanTests = updatedTests.filter(t => t && typeof t === 'object' && !Array.isArray(t));
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
                  await supabase.from('pazienti').update({
                    note_operative: updatedPatient.note_operative || '',
                    esercizi_prescritti: updatedPatient.esercizi_prescritti || '',
                    ...(directives.fase_riabilitativa ? { fase_riabilitativa: directives.fase_riabilitativa } : {}),
                    ...(directives.alert_compenso ? { alert_compenso: directives.alert_compenso } : {}),
                    ...(directives.deficits_list ? { deficits_list: directives.deficits_list } : {}),
                    ...(directives.exercises_list ? { exercises_list: directives.exercises_list } : {})
                  }).eq('id', patient.id);
                } catch (err) {
                  console.error('Errore aggiornamento direttive su Supabase:', err);
                }
              }
              onUpdatePatient(updatedPatient);
            }}
          />
        )}

        {activeTab === 'tab4' && (
          <TabVistaMobile patient={patient} />
        )}

        {activeTab === 'tab5' && (
          <TabCopilotPdf patient={patient} />
        )}
      </div>

      {/* Modal Nuova Valutazione Clinica LCA */}
      <ModalNuovaValutazione
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patient={patient}
        onSaveEvaluation={async (evalData) => {
          const currentTests = Array.isArray(patient.tests) ? patient.tests : [];
          const newNum = currentTests.length + 1;
          const newTest = createTestObject(evalData, patient.id, newNum);

          console.log("Dati inviati:", newTest);

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
