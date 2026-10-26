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
import { X, Save, AlertTriangle } from 'lucide-react';
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

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

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

  useEffect(() => {
    fetchPatientsFromCloud();

    const channel = supabase
      .channel('public:pazienti')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pazienti' },
        () => {
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

  const handleUpdatePatient = async (updatedPatient) => {
    if (!updatedPatient?.id) return;

    setDbErrorBanner('');
    setPatients(prev => prev.map(p => (p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p)));
    setSelectedPatient(prev => (prev?.id === updatedPatient.id ? { ...prev, ...updatedPatient } : prev));

    const { success, error } = await updatePatientInCloud(updatedPatient);
    if (!success) {
      setDbErrorBanner(
        `Errore salvataggio Supabase (ID: ${updatedPatient.id}): ${
          error?.message || 'Verifica i permessi RLS (FOR UPDATE) sulla tabella pazienti.'
        }`
      );
      await fetchPatientsFromCloud();
      return;
    }

    await fetchPatientsFromCloud();
  };

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

  const handleDeletePatientOnSupabase = async (patientId) => {
    if (!patientId) return;
    setDbErrorBanner('');

    setPatients(prev => prev.filter(p => p.id !== patientId));
    if (selectedPatient && selectedPatient.id === patientId) {
      const remaining = patients.filter(p => p.id !== patientId);
      setSelectedPatient(remaining.length > 0 ? remaining[0] : null);
    }

    const { success, error } = await deletePatientFromCloud(patientId);
    if (!success) {
      setDbErrorBanner(
        `Errore eliminazione Supabase (ID: ${patientId}): ${
          error?.message || 'Verifica i permessi RLS (FOR DELETE) sulla tabella pazienti.'
        }`
      );
      await fetchPatientsFromCloud();
      return;
    }

    await fetchPatientsFromCloud();
  };

  if (currentView === 'client-portal' || role === 'patient') {
    const params = new URLSearchParams(window.location.search);
    let savedPatientId = null;
    try {
      savedPatientId = localStorage.getItem('acl_client_patient_id');
    } catch (_) {}
    const urlPatientId = params.get('patientId') || user?.user_metadata?.patient_id || savedPatientId;
    const urlPatientName = params.get('name');
    const matchedPatient =
      patients.find(p => p.id === urlPatientId) ||
      patients.find(p => user?.email && p.email?.toLowerCase() === user.email.toLowerCase()) ||
      (urlPatientId ? { id: urlPatientId, nome: urlPatientName || 'Atleta', cognome: '' } : null);

    return (
      <ClientPortal
        patient={matchedPatient}
        isSimulation={false}
        onExitSimulation={undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-200/60 text-slate-800 flex flex-col">
      <Header
        onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
        onOpenSqlModal={() => setSqlModalOpen(true)}
        currentView={currentView}
      />

      {dbErrorBanner && (
        <div className="bg-rose-100/80 border border-rose-300/60 px-4 py-3 text-xs text-rose-900 flex items-center justify-between max-w-7xl w-full mx-auto mt-2 rounded-xl shadow-none print:hidden">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            <span>{dbErrorBanner}</span>
          </div>
          <button
            onClick={() => setDbErrorBanner('')}
            className="text-rose-800 hover:text-rose-950 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className={`flex-1 flex max-w-7xl w-full mx-auto ${isPrintModalOpen ? 'app-shell-when-modal-print' : ''}`}>
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

      <SqlViewerModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
      />

      <PrintConfiguratorModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        patient={selectedPatient}
        patients={patients}
      />

      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs print:hidden">
          <div className="w-full max-w-lg bg-stone-50 border border-stone-300/70 rounded-xl p-6 space-y-4 shadow-none text-stone-800">
            <div className="flex items-center justify-between pb-3 border-b border-stone-300/70">
              <h3 className="font-semibold text-stone-800 text-base">Inserimento Nuovo Paziente LCA</h3>
              <button
                onClick={() => setShowNewPatientModal(false)}
                className="text-stone-500 hover:text-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.nome}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, nome: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Cognome</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.cognome}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, cognome: e.target.value })}
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
                    value={newPatientForm.sport}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, sport: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Tipo Innesto</label>
                  <select
                    value={newPatientForm.tipo_innesto}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, tipo_innesto: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
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
                  <label className="block text-stone-500 font-medium mb-1">Data Intervento</label>
                  <input
                    type="date"
                    required
                    value={newPatientForm.data_intervento}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, data_intervento: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-mono font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-500 font-medium mb-1">Chirurgo Ortopedico</label>
                  <input
                    type="text"
                    value={newPatientForm.chirurgo}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, chirurgo: e.target.value })}
                    className="w-full bg-stone-100 border border-stone-300/70 rounded-lg p-2 text-stone-800 font-semibold focus:border-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-300/70 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200/50 text-stone-800 border border-stone-300/70 rounded-xl font-semibold cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-stone-100 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer"
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
