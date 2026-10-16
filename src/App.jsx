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
import { X, Plus, Save, RotateCcw } from 'lucide-react';
import { supabase } from './lib/supabase';
import { savePatientToCloud } from './lib/supabaseSync';

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

  // 1. Inizializzazione dello stato SENZA localStorage per la lista pazienti
  const [patients, setPatients] = useState([]);

  // 2. Fetch Remoto Obbligatorio dal Database Supabase Cloud ('pazienti')
  const fetchPatientsFromCloud = async () => {
    try {
      const { data, error } = await supabase
        .from('pazienti')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Errore durante il fetch da Supabase:', error.message);
        return;
      }

      if (data) {
        const formattedData = data.map(row => ({
          ...row,
          tests: Array.isArray(row.tests) ? row.tests : (typeof row.tests === 'string' ? JSON.parse(row.tests) : (row.tests || [])),
          deficits_list: Array.isArray(row.deficits_list) ? row.deficits_list : [],
          exercises_list: Array.isArray(row.exercises_list) ? row.exercises_list : []
        }));
        setPatients(formattedData);
      }
    } catch (err) {
      console.error('❌ Eccezione durante il caricamento dei pazienti da Supabase:', err);
    }
  };

  // 3. Caricamento al montaggio (useEffect) e Sincronizzazione Realtime Attiva
  useEffect(() => {
    // Caricamento remoto obbligatorio dei pazienti ad ogni caricamento di pagina
    fetchPatientsFromCloud();

    // Sottoscrizione al canale Realtime per modifiche sulla tabella 'pazienti'
    const channel = supabase
      .channel('public:pazienti')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pazienti' },
        () => {
          console.log('⚡ [Realtime Supabase] Modifica sul database rilevata! Sincronizzazione in corso...');
          fetchPatientsFromCloud();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [selectedPatient, setSelectedPatient] = useState(null);

  // Sincronizza lo stato del paziente selezionato con la lista aggiornata dal cloud
  useEffect(() => {
    if (patients.length > 0) {
      const savedId = localStorage.getItem('acl_selected_patient_id');
      const found = patients.find(p => p.id === (selectedPatient?.id || savedId));
      setSelectedPatient(found || patients[0]);
    }
  }, [patients]);

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
    if (patient?.id) {
      try {
        localStorage.setItem('acl_selected_patient_id', patient.id);
      } catch (e) {}
    }
    setCurrentView('patient-detail');
  };

  const handleUpdatePatient = async (updatedPatient) => {
    const success = await savePatientToCloud(updatedPatient);
    if (success) {
      fetchPatientsFromCloud();
    }
  };

  const handleAddPatientSubmit = async (e) => {
    e.preventDefault();
    const created = {
      ...newPatientForm,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tests: [],
      evaluations: [],
      note_operative: 'Nuovo paziente inserito in sistema.',
      esercizi_prescritti: 'Protocollo di valutazione iniziale.',
      alert_compenso: 'Seguire direttive cliniche fisio.'
    };
    
    setShowNewPatientModal(false);
    await savePatientToCloud(created);
    await fetchPatientsFromCloud();

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

  const handleSoftDeletePatient = (patientId) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          is_deleted: true,
          deleted_at: new Date().toISOString()
        };
      }
      return p;
    }));
    if (selectedPatient && selectedPatient.id === patientId) {
      const remainingActive = patients.filter(p => p.id !== patientId && !p.is_deleted);
      setSelectedPatient(remainingActive.length > 0 ? remainingActive[0] : null);
    }
  };

  const handleRestorePatient = (patientId) => {
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const { is_deleted, deleted_at, ...rest } = p;
        return rest;
      }
      return p;
    }));
  };

  const handlePermanentDeletePatient = (patientId) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
    if (selectedPatient && selectedPatient.id === patientId) {
      const remainingActive = patients.filter(p => p.id !== patientId && !p.is_deleted);
      setSelectedPatient(remainingActive.length > 0 ? remainingActive[0] : null);
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <Header 
        onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)}
        onOpenSqlModal={() => setSqlModalOpen(true)}
        currentView={currentView}
      />

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
              onDeletePatient={handleSoftDeletePatient}
              onRestorePatient={handleRestorePatient}
              onPermanentDeletePatient={handlePermanentDeletePatient}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-white text-base">Inserimento Nuovo Paziente LCA</h3>
              <button 
                onClick={() => setShowNewPatientModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nome</label>
                  <input 
                    type="text" 
                    required 
                    value={newPatientForm.nome}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, nome: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cognome</label>
                  <input 
                    type="text" 
                    required 
                    value={newPatientForm.cognome}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, cognome: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Sport</label>
                  <input 
                    type="text" 
                    required 
                    value={newPatientForm.sport}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, sport: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tipo Innesto</label>
                  <select 
                    value={newPatientForm.tipo_innesto}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, tipo_innesto: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
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
                  <label className="block text-slate-400 mb-1">Data Intervento</label>
                  <input 
                    type="date" 
                    required 
                    value={newPatientForm.data_intervento}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, data_intervento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Chirurgo Ortopedico</label>
                  <input 
                    type="text" 
                    value={newPatientForm.chirurgo}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, chirurgo: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white" 
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-bold flex items-center gap-1.5"
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
