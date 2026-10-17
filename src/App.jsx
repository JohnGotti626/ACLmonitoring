import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import ClientPortal from './components/ClientPortal';
import SqlViewerModal from './components/SqlViewerModal';
import PrintConfiguratorModal from './components/PrintConfiguratorModal';
import { X, Plus, Save, AlertTriangle } from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  fetchPatientsFromCloud as fetchCloudPatientsList,
  savePatientToCloud,
  updatePatientInCloud,
  deletePatientFromCloud
} from './lib/supabaseSync';

function MainApp() {
  const { user, role } = useAuth();
  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    if (
      params.get('portal') === 'client' ||
      hash.includes('access_token=') ||
      hash.includes('type=magiclink') ||
      hash.includes('type=recovery')
    ) {
      return 'client-portal';
    }
    return 'dashboard';
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [dbErrorBanner, setDbErrorBanner] = useState('');

  // Reindirizzamento automatico al ClientPortal se l'utente autenticato ha ruolo 'patient'
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    if (
      role === 'patient' ||
      params.get('portal') === 'client' ||
      hash.includes('access_token=') ||
      hash.includes('type=magiclink')
    ) {
      setCurrentView('client-portal');
    }
  }, [role]);

  // 1. Inizializzazione dello stato SENZA alcun localStorage
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // 2. Fetch Remoto Obbligatorio dal Database Supabase Cloud ('pazienti')
  const fetchPatientsFromCloud = async () => {
    const cloudData = await fetchCloudPatientsList();
    if (cloudData !== null) {
      setPatients(cloudData);
      setSelectedPatient(prevSelected => {
        if (cloudData.length === 0) return null;
        if (prevSelected?.id) {
          const found = cloudData.find(p => p.id === prevSelected.id);
          if (found) return found;
        }
        return cloudData[0];
      });
    }
  };

  // 3. Caricamento al montaggio (useEffect) e Sincronizzazione Realtime Attiva
  useEffect(() => {
    fetchPatientsFromCloud();

    const channel = supabase
      .channel('public:pazienti')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pazienti' },
        () => {
          console.log('⚡ [Realtime Supabase] Modifica sul database pazienti rilevata! Sincronizzazione in corso...');
          fetchPatientsFromCloud();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    nome: '',
    cognome: '',
    data_nascita: '2000-01-01',
    sport: 'Calcio',
    ruolo_sportivo: 'Attaccante',
    livello: 'Amatoriale',
    lato_lesione: 'Dx',
    data_intervento: new Date().toISOString().split('T')[0],
    tipo_innesto: 'STG',
    chirurgo: 'Dr. Rossi',
    aclrsi_score_iniziale: 50.0,
    fase_riabilitativa: 'Early Phase'
  });

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setCurrentView('patient-detail');
  };

  // Modifica Paziente: esegue supabase.from('pazienti').update(...).eq('id', updatedPatient.id)
  const handleUpdatePatient = async (updatedPatient) => {
    if (!updatedPatient?.id) {
      console.error('❌ Errore handleUpdatePatient: ID primario mancante', updatedPatient);
      return;
    }

    setDbErrorBanner('');
    // Aggiornamento ottimistico immediato in UI
    setPatients(prev => prev.map(p => (p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p)));
    setSelectedPatient(prev => (prev?.id === updatedPatient.id ? { ...prev, ...updatedPatient } : prev));

    const { success, error } = await updatePatientInCloud(updatedPatient);
    if (!success) {
      console.error('❌ Errore persistenza modifica su Supabase:', error?.message || error);
      setDbErrorBanner(
        `Errore salvataggio Supabase (ID: ${updatedPatient.id}): ${
          error?.message || 'Verifica i permessi RLS (FOR UPDATE) sulla tabella pazienti.'
        }`
      );
      // Ricarica lo stato reale dal database cloud
      await fetchPatientsFromCloud();
      return;
    }

    await fetchPatientsFromCloud();
  };

  // Creazione Nuovo Paziente su Supabase
  const handleAddPatientSubmit = async (e) => {
    e.preventDefault();
    setDbErrorBanner('');
    const created = {
      ...newPatientForm,
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `pat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tests: [],
      evaluations: [],
      note_operative: 'Nuovo paziente inserito in sistema.',
      esercizi_prescritti: 'Protocollo di valutazione iniziale.',
      alert_compenso: 'Seguire direttive cliniche fisio.'
    };

    setShowNewPatientModal(false);
    const saved = await savePatientToCloud(created, true);
    if (!saved) {
      setDbErrorBanner(
        'Errore creazione paziente su Supabase: verifica le Policy RLS (FOR INSERT) sulla tabella public.pazienti.'
      );
      return;
    }

    await fetchPatientsFromCloud();
    setSelectedPatient(created);

    setNewPatientForm({
      nome: '',
      cognome: '',
      data_nascita: '2000-01-01',
      sport: 'Calcio',
      ruolo_sportivo: 'Attaccante',
      livello: 'Amatoriale',
      lato_lesione: 'Dx',
      data_intervento: new Date().toISOString().split('T')[0],
      tipo_innesto: 'STG',
      chirurgo: 'Dr. Rossi',
      aclrsi_score_iniziale: 50.0,
      fase_riabilitativa: 'Early Phase'
    });
    setCurrentView('patient-detail');
  };

  // Eliminazione Paziente tramite Primary Key `id` direttamente su Supabase: supabase.from('pazienti').delete().eq('id', patientId)
  const handleDeletePatientOnSupabase = async (patientId) => {
    if (!patientId) return;
    setDbErrorBanner('');

    // Aggiornamento ottimistico lista
    setPatients(prev => prev.filter(p => p.id !== patientId));
    if (selectedPatient && selectedPatient.id === patientId) {
      const remaining = patients.filter(p => p.id !== patientId);
      setSelectedPatient(remaining.length > 0 ? remaining[0] : null);
    }

    const { success, error } = await deletePatientFromCloud(patientId);
    if (!success) {
      console.error('❌ Errore eliminazione paziente su Supabase:', error?.message || error);
      setDbErrorBanner(
        `Errore eliminazione Supabase (ID: ${patientId}): ${
          error?.message || 'Verifica i permessi RLS (FOR DELETE) sulla tabella pazienti.'
        }`
      );
      // Ripristina lo stato reale da Supabase se l'eliminazione sul DB è fallita
      await fetchPatientsFromCloud();
      return;
    }

    await fetchPatientsFromCloud();
  };

  // Isolamento totale vista Paziente (Mobile Client Workout Log)
  if (currentView === 'client-portal' || role === 'patient') {
    const params = new URLSearchParams(window.location.search);
    const urlPatientId = params.get('patientId');
    const urlPatientName = params.get('name');
    const matchedPatient =
      patients.find(p => p.id === urlPatientId) ||
      patients.find(p => user?.email && p.email?.toLowerCase() === user.email.toLowerCase()) ||
      (urlPatientId ? { id: urlPatientId, nome: urlPatientName || 'Atleta', cognome: '' } : null);

    return (
      <ClientPortal
        patient={matchedPatient}
        isSimulation={false}
        onExitSimulation={
          role !== 'patient'
            ? () => {
                window.history.replaceState({}, '', window.location.pathname);
                setCurrentView('dashboard');
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* Header Bar */}
      <Header
        onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
        onOpenSqlModal={() => setSqlModalOpen(true)}
        currentView={currentView}
      />

      {/* Eventuale Banner Errore Permessi Database Supabase */}
      {dbErrorBanner && (
        <div className="bg-rose-950/60 border border-rose-500/40 px-4 py-3 text-xs text-rose-200 flex items-center justify-between max-w-7xl w-full mx-auto mt-2 rounded-xl shadow-md">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{dbErrorBanner}</span>
          </div>
          <button
            onClick={() => setDbErrorBanner('')}
            className="text-rose-300 hover:text-white font-black ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          selectedPatient={selectedPatient}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onOpenSqlModal={() => setSqlModalOpen(true)}
          onOpenPrintConfigurator={() => setIsPrintModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {currentView === 'dashboard' && (
            <Dashboard
              patients={patients.filter(p => !p.is_deleted)}
              onSelectPatient={handleSelectPatient}
              onNavigateToPatients={() => setCurrentView('patients')}
            />
          )}

          {currentView === 'patients' && (
            <PatientList
              patients={patients}
              onSelectPatient={handleSelectPatient}
              onAddNewPatient={() => setShowNewPatientModal(true)}
              onDeletePatient={handleDeletePatientOnSupabase}
              onRestorePatient={() => fetchPatientsFromCloud()}
              onPermanentDeletePatient={handleDeletePatientOnSupabase}
            />
          )}

          {currentView === 'patient-detail' && (
            <PatientDetail
              patient={selectedPatient}
              onBack={() => setCurrentView('patients')}
              onUpdatePatient={handleUpdatePatient}
            />
          )}
        </main>
      </div>

      {/* SQL Script Viewer Modal */}
      <SqlViewerModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
      />

      {/* Global Pre-Print Configurator Modal */}
      <PrintConfiguratorModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        patient={selectedPatient}
        patients={patients}
      />

      {/* Modal Inserimento Nuovo Paziente (Solo ADMIN) */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#1E293B] border border-[#334155] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <h3 className="font-extrabold text-white text-base">Inserimento Nuovo Paziente LCA</h3>
              <button
                onClick={() => setShowNewPatientModal(false)}
                className="text-[#94A3B8] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.nome}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, nome: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-2 text-white focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Cognome</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.cognome}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, cognome: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-2 text-white focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Sport</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.sport}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, sport: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-2 text-white focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Tipo Innesto</label>
                  <select
                    value={newPatientForm.tipo_innesto}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, tipo_innesto: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-2 text-white focus:border-[#06B6D4] focus:outline-none"
                  >
                    <option value="STG">STG (Semitendinoso/Gracile)</option>
                    <option value="Rotuleo">Tendine Rotuleo</option>
                    <option value="Quadricipitale">Tendine Quadricipitale</option>
                    <option value="Allograft">Allograft</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Data Intervento</label>
                  <input
                    type="date"
                    required
                    value={newPatientForm.data_intervento}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, data_intervento: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-2 text-white font-mono focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Chirurgo Ortopedico</label>
                  <input
                    type="text"
                    value={newPatientForm.chirurgo}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, chirurgo: e.target.value })}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg p-2 text-white focus:border-[#06B6D4] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#334155] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-700 text-[#94A3B8] hover:text-white border border-[#334155] rounded-xl font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0D9488] hover:bg-teal-500 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salva in Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
