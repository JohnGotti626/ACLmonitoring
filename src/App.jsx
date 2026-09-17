import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import SqlViewerModal from './components/SqlViewerModal';
import PrintConfiguratorModal from './components/PrintConfiguratorModal';
import { X, Plus, Save } from 'lucide-react';

function MainApp() {
  const { user, role } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'patients', 'patient-detail'
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Initial Patients Data (Pazienti Reali pronti per test immediato)
  const [patients, setPatients] = useState([
    {
      id: 'f6g7h8i9-j0k1-4234-f567-890123fg0006',
      nome: 'Francesco',
      cognome: 'Gabbani',
      data_nascita: '1995-09-09',
      codice_fiscale: 'GBNFNC95P09H501Z',
      genere: 'M',
      sport: 'Calcio',
      ruolo_sportivo: 'Centrocampista',
      livello: 'Professionista',
      lato_lesione: 'Dx',
      data_intervento: '2025-12-15', // 9° Mese Post-Op
      tipo_innesto: 'Tendine Rotuleo (BTB)',
      chirurgo: 'Dr. Roberto Mariani',
      note_chirurgiche: 'Ricostruzione LCA con tendine rotuleo autologo (BTB) e vite ad interferenza in titanio. Nessuna lesione meniscale associata.',
      complicanze: 'Nessuna complicanza peri-operatoria. Eccellente recupero estensione 0° e controllo artrogeno.',
      aclrsi_score_iniziale: 55.0,
      fase_riabilitativa: 'Fase 5 (RTS)',
      prossimo_controllo: '2026-09-25',
      note_operative: 'Paziente al 9° mese post-op. Effettuati 6 test longitudinali completi (Test #1 - Test #6). Tutti i criteri di Return to Sport e Return to Performance superati con simmetria LSI >97%.',
      esercizi_prescritti: 'High Velocity Agility Drills con viraggi a 180°, Sprint al 100% VBT, Plyometrics reattiva su box 40cm, Small Sided Games 5v5 con contatto.',
      alert_compenso: 'Nessun compenso cinematica/dinamica. Piena simmetria neuromuscolare (LSI Quad 97.8%, Hop Test 96.8%, ACL-RSI 95/100).',
      tests: [
        { id: 'test-1', patientId: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', patient_id: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', num: 1, label: 'Test #1 (Mese 2)', date: '15/02/2026', lsiQuad: 62.5, lsiQuadDelta: '-', lsiFlex: 68.0, lsiFlexDelta: '-', lsiSingleHop: 60.0, lsiTripleHop: 62.0, quadOpNmKg: 1.85, quadSano: 360, quadOp: 225, flexSano: 180, flexOp: 122, ikdc: 58, brakingAsym: 19.5, cmjImpulseLsi: 68.5, slCmjHeightLsi: 72.0, rsiCmj: 0.32, jumpHeight: 21.0, contractionTime: 680, peakPower: 35.2, eccBrakingSX: 165, eccBrakingDX: 140, rsiDropJump: 0.72, djBoxHeight: '30 cm', djJumpHeight: 21.0, djContactTime: 290, djTtpfMs: 55, djTakeoffAsymMs: 22, djLandingPeakSX: 2200, djLandingPeakDX: 1750, djLandingPeakLsi: 79.5, djConcImpulseSX: 190, djConcImpulseDX: 155, djConcImpulseLsi: 81.6, djValidationStatus: 'FAILED', djFailReason: 'FAILED - Contact Time > 250ms (Non Pliometrico)', aclrsi: 55 },
        { id: 'test-2', patientId: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', patient_id: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', num: 2, label: 'Test #2 (Mese 3.5)', date: '30/03/2026', lsiQuad: 72.4, lsiQuadDelta: '+9.9%', lsiFlex: 75.5, lsiFlexDelta: '+7.5%', lsiSingleHop: 73.9, lsiTripleHop: 75.0, quadOpNmKg: 2.15, quadSano: 393, quadOp: 285, flexSano: 185, flexOp: 140, ikdc: 68, brakingAsym: 15.2, cmjImpulseLsi: 76.5, slCmjHeightLsi: 80.0, rsiCmj: 0.43, jumpHeight: 25.5, contractionTime: 640, peakPower: 41.5, eccBrakingSX: 195, eccBrakingDX: 168, rsiDropJump: 0.94, djBoxHeight: '30 cm', djJumpHeight: 25.5, djContactTime: 270, djTtpfMs: 68, djTakeoffAsymMs: 18, djLandingPeakSX: 2350, djLandingPeakDX: 1980, djLandingPeakLsi: 84.3, djConcImpulseSX: 205, djConcImpulseDX: 178, djConcImpulseLsi: 86.8, djValidationStatus: 'FAILED', djFailReason: 'FAILED - Contact Time > 250ms (Non Pliometrico)', aclrsi: 68 },
        { id: 'test-3', patientId: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', patient_id: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', num: 3, label: 'Test #3 (Mese 5)', date: '15/05/2026', lsiQuad: 81.5, lsiQuadDelta: '+9.1%', lsiFlex: 82.0, lsiFlexDelta: '+6.5%', lsiSingleHop: 80.5, lsiTripleHop: 82.0, quadOpNmKg: 2.45, quadSano: 420, quadOp: 342, flexSano: 200, flexOp: 164, ikdc: 76, brakingAsym: 11.8, cmjImpulseLsi: 82.5, slCmjHeightLsi: 87.0, rsiCmj: 0.52, jumpHeight: 29.0, contractionTime: 610, peakPower: 47.0, eccBrakingSX: 220, eccBrakingDX: 195, rsiDropJump: 1.14, djBoxHeight: '30 cm', djJumpHeight: 29.0, djContactTime: 255, djTtpfMs: 78, djTakeoffAsymMs: 14, djLandingPeakSX: 2400, djLandingPeakDX: 2150, djLandingPeakLsi: 89.6, djConcImpulseSX: 215, djConcImpulseDX: 198, djConcImpulseLsi: 92.1, djValidationStatus: 'FAILED', djFailReason: 'FAILED - Contact Time > 250ms (Non Pliometrico)', aclrsi: 78 },
        { id: 'test-4', patientId: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', patient_id: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', num: 4, label: 'Test #4 (Mese 6.5)', date: '30/06/2026', lsiQuad: 88.5, lsiQuadDelta: '+7.0%', lsiFlex: 88.0, lsiFlexDelta: '+6.0%', lsiSingleHop: 87.0, lsiTripleHop: 88.0, quadOpNmKg: 2.70, quadSano: 440, quadOp: 389, flexSano: 210, flexOp: 185, ikdc: 84, brakingAsym: 8.5, cmjImpulseLsi: 89.0, slCmjHeightLsi: 91.5, rsiCmj: 0.61, jumpHeight: 32.5, contractionTime: 590, peakPower: 52.0, eccBrakingSX: 238, eccBrakingDX: 218, rsiDropJump: 1.35, djBoxHeight: '30 cm', djJumpHeight: 32.5, djContactTime: 240, djTtpfMs: 88, djTakeoffAsymMs: 9, djLandingPeakSX: 2480, djLandingPeakDX: 2320, djLandingPeakLsi: 93.5, djConcImpulseSX: 225, djConcImpulseDX: 215, djConcImpulseLsi: 95.6, djValidationStatus: 'FAILED', djFailReason: 'FAILED - Indice Reattivo RSI < 1.8', aclrsi: 86 },
        { id: 'test-5', patientId: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', patient_id: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', num: 5, label: 'Test #5 (Mese 8)', date: '10/08/2026', lsiQuad: 94.2, lsiQuadDelta: '+5.7%', lsiFlex: 93.5, lsiFlexDelta: '+5.5%', lsiSingleHop: 93.0, lsiTripleHop: 94.0, quadOpNmKg: 2.92, quadSano: 460, quadOp: 433, flexSano: 220, flexOp: 206, ikdc: 90, brakingAsym: 4.8, cmjImpulseLsi: 94.5, slCmjHeightLsi: 95.0, rsiCmj: 0.68, jumpHeight: 35.8, contractionTime: 560, peakPower: 56.5, eccBrakingSX: 252, eccBrakingDX: 240, rsiDropJump: 1.85, djBoxHeight: '30 cm', djJumpHeight: 35.8, djContactTime: 225, djTtpfMs: 98, djTakeoffAsymMs: 6, djLandingPeakSX: 2550, djLandingPeakDX: 2480, djLandingPeakLsi: 97.3, djConcImpulseSX: 235, djConcImpulseDX: 228, djConcImpulseLsi: 97.0, djValidationStatus: 'PASSED', djFailReason: 'PASSED - Tutti i Requisiti Clinici Soddisfatti', aclrsi: 92 },
        { id: 'test-6', patientId: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', patient_id: 'f6g7h8i9-j0k1-4234-f567-890123fg0006', num: 6, label: 'Test #6 (Mese 9 - RTS)', date: '05/09/2026', lsiQuad: 97.8, lsiQuadDelta: '+3.6%', lsiFlex: 96.5, lsiFlexDelta: '+3.0%', lsiSingleHop: 96.8, lsiTripleHop: 97.5, quadOpNmKg: 3.12, quadSano: 475, quadOp: 465, flexSano: 228, flexOp: 220, ikdc: 95, brakingAsym: 2.1, cmjImpulseLsi: 98.2, slCmjHeightLsi: 98.0, rsiCmj: 0.74, jumpHeight: 38.2, contractionTime: 535, peakPower: 60.5, eccBrakingSX: 265, eccBrakingDX: 260, rsiDropJump: 2.15, djBoxHeight: '30 cm', djJumpHeight: 38.2, djContactTime: 210, djTtpfMs: 105, djTakeoffAsymMs: 3, djLandingPeakSX: 2600, djLandingPeakDX: 2560, djLandingPeakLsi: 98.5, djConcImpulseSX: 240, djConcImpulseDX: 238, djConcImpulseLsi: 99.2, djValidationStatus: 'PASSED', djFailReason: 'PASSED - Tutti i Requisiti Clinici Soddisfatti', aclrsi: 95 }
      ]
    },
    {
      id: 'a1b2c3d4-e5f6-4789-a012-56789abcdef1',
      nome: 'Marco',
      cognome: 'Rossi',
      data_nascita: '1998-05-14',
      codice_fiscale: 'RSSMRC98E14F205Z',
      genere: 'M',
      sport: 'Calcio',
      ruolo_sportivo: 'Ala Sinistra',
      livello: 'Professionista',
      lato_lesione: 'Sx',
      data_intervento: '2026-05-15',
      tipo_innesto: 'Rotuleo',
      chirurgo: 'Dr. Roberto Mariani',
      note_chirurgiche: 'Ricostruzione LCA con tendine rotuleo autologo. Sintesi a interferenza.',
      complicanze: 'Nessuna complicanza peri-operatoria. Idrarto lieve risolto.',
      aclrsi_score_iniziale: 42.5,
      fase_riabilitativa: 'Return to Run',
      prossimo_controllo: '2026-09-30',
      note_operative: 'Deficit residuo peak torque Quadricipite a 90° del 13.5%. Valutare incremento carico su Trap Bar Deadlift.',
      esercizi_prescritti: '4x6 Trap Bar Deadlift al 75% 1RM (Target VBT: 0.65 m/s). 3x5 Drop Jump da box 30cm.',
      alert_compenso: 'Attenzione a valgo dinamico residuo in atterraggio monopodalico a stanchezza elevata.',
      tests: []
    },
    {
      id: 'b2c3d4e5-f6a7-4890-b123-6789abcdef02',
      nome: 'Giulia',
      cognome: 'Bianchi',
      data_nascita: '2001-11-22',
      codice_fiscale: 'BNCGLI01S62H501Y',
      genere: 'F',
      sport: 'Basket',
      ruolo_sportivo: 'Playmaker',
      livello: 'Semi-Pro',
      lato_lesione: 'Dx',
      data_intervento: '2026-02-10',
      tipo_innesto: 'STG',
      chirurgo: 'Dr. Stefano Zaffagnini',
      note_chirurgiche: 'Ricostruzione LCA con Semitendinoso e Gracile duplicato.',
      complicanze: 'Lieve rigidità iniziale in flessione risolta con mobilizzazione precoce.',
      aclrsi_score_iniziale: 68.0,
      fase_riabilitativa: 'Return to Sport',
      prossimo_controllo: '2026-10-15',
      note_operative: 'Criteri RTS quasi totalmente sbloccati. Eccellente controllo neuromuscolare.',
      esercizi_prescritti: 'Cambio di direzione reattivo con stimoli visivi. Plyometrics ad alta intensità.',
      alert_compenso: 'Nessun alert critico. Mantenere monitoraggio fatica VBT con Velocity Loss < 10%.',
      tests: []
    },
    {
      id: 'c3d4e5f6-a7b8-4901-c234-789abcdef003',
      nome: 'Alessandro',
      cognome: 'Verdi',
      data_nascita: '2003-03-08',
      codice_fiscale: 'VRDLSN03C08L219X',
      genere: 'M',
      sport: 'Rugby',
      ruolo_sportivo: 'Terza Linea',
      livello: 'Amatoriale',
      lato_lesione: 'Dx',
      data_intervento: '2026-08-01',
      tipo_innesto: 'Quadricipitale',
      chirurgo: 'Dr. Massimo Berruto',
      note_chirurgiche: 'Innesto di tendine quadricipitale con zaffetto osseo.',
      complicanze: 'Piccolo ematoma post-chirurgico riassorbito.',
      aclrsi_score_iniziale: 35.0,
      fase_riabilitativa: 'Early Phase',
      prossimo_controllo: '2026-09-20',
      note_operative: 'Fase precoce: focus su estensione completa (0°) e reclutamento isometrico VMO.',
      esercizi_prescritti: 'Leg Extension isometrica a 60°, Elettrostimolazione NMES, mobilità rotula.',
      alert_compenso: 'Evitare flessione oltre i 90° sotto carico per altre 2 settimane.',
      tests: []
    }
  ]);

  const [selectedPatient, setSelectedPatient] = useState(patients[0]);
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

  const handleUpdatePatient = (updatedPatient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
    if (selectedPatient && selectedPatient.id === updatedPatient.id) {
      setSelectedPatient(updatedPatient);
    }
  };

  const handleAddPatientSubmit = (e) => {
    e.preventDefault();
    const created = {
      ...newPatientForm,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tests: [], // Array di test completamente nuovo e vuoto
      evaluations: [],
      note_operative: 'Nuovo paziente inserito in sistema.',
      esercizi_prescritti: 'Protocollo di valutazione iniziale.',
      alert_compenso: 'Seguire direttive cliniche fisio.'
    };
    setPatients(prev => [created, ...prev]);
    setSelectedPatient(created);
    setShowNewPatientModal(false);
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
