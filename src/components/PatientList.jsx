import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Users, 
  Calendar, 
  Activity, 
  ChevronRight, 
  Filter, 
  UserCheck, 
  Award, 
  AlertCircle,
  Trash2,
  RotateCcw,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PatientList({ 
  patients = [], 
  onSelectPatient, 
  onAddNewPatient, 
  onDeletePatient,
  onRestorePatient,
  onPermanentDeletePatient
}) {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('ALL');
  const [filterGraft, setFilterGraft] = useState('ALL');
  const [viewTab, setViewTab] = useState('active'); // 'active' | 'trash'

  // Calcola i giorni rimanenti ai 30gg per il ripristino
  const getRemainingDays = (deletedAt) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.max(0, now - deletedDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 30 - diffDays;
    return Math.max(0, remaining);
  };

  // Separa Pazienti Attivi vs Cestino
  const activePatients = patients.filter(p => !p.is_deleted);
  const deletedPatients = patients.filter(p => {
    if (!p.is_deleted) return false;
    return getRemainingDays(p.deleted_at) > 0;
  });

  const currentPatientsList = viewTab === 'active' ? activePatients : deletedPatients;

  // Filtra pazienti in base a ricerca rapida e filtri
  const filteredPatients = currentPatientsList.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      patient.nome.toLowerCase().includes(searchLower) ||
      patient.cognome.toLowerCase().includes(searchLower) ||
      patient.sport.toLowerCase().includes(searchLower) ||
      patient.tipo_innesto.toLowerCase().includes(searchLower) ||
      (patient.chirurgo && patient.chirurgo.toLowerCase().includes(searchLower));

    const matchesSport = filterSport === 'ALL' || patient.sport === filterSport;
    const matchesGraft = filterGraft === 'ALL' || patient.tipo_innesto === filterGraft;

    return matchesSearch && matchesSport && matchesGraft;
  });

  const handleSoftDelete = (e, patient) => {
    e.stopPropagation();
    if (window.confirm(`Spostare il paziente ${patient.nome} ${patient.cognome} nel Cestino?\n\nIl paziente rimarrà recuperabile per 30 giorni prima dell'eliminazione definitiva.`)) {
      if (onDeletePatient) onDeletePatient(patient.id);
    }
  };

  const handleRestore = (e, patient) => {
    e.stopPropagation();
    if (onRestorePatient) onRestorePatient(patient.id);
  };

  const handlePermanentDelete = (e, patient) => {
    e.stopPropagation();
    if (window.confirm(`Sei sicuro di voler eliminare DEFINITIVAMENTE il paziente ${patient.nome} ${patient.cognome}?\n\nQuesta azione cancellerà in modo permanente tutti i test e i dati clinici e non potrà essere annullata.`)) {
      if (onPermanentDeletePatient) onPermanentDeletePatient(patient.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Patient Button */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white">Database Pazienti LCA</h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Archivio clinico, storico chirurgico, biometria e stato di progressione Return to Sport.
          </p>
        </div>

        {role === 'ADMIN' && (
          <button
            onClick={onAddNewPatient}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Paziente LCA</span>
          </button>
        )}
      </div>

      {/* Selector Sub-Tabs: Pazienti Attivi vs Cestino (30gg) */}
      <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setViewTab('active')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer ${
            viewTab === 'active'
              ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
          }`}
        >
          <Users className="w-4 h-4 text-cyan-400" />
          <span>Pazienti Attivi</span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono">
            {activePatients.length}
          </span>
        </button>

        <button
          onClick={() => setViewTab('trash')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2.5 cursor-pointer ${
            viewTab === 'trash'
              ? 'bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
          }`}
        >
          <Trash2 className="w-4 h-4 text-amber-400" />
          <span>Cestino / Ripristino (30gg)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            deletedPatients.length > 0 
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold' 
              : 'bg-slate-800 text-slate-500'
          }`}>
            {deletedPatients.length}
          </span>
        </button>
      </div>

      {/* Info Banner for Trash Bin */}
      {viewTab === 'trash' && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3 text-xs">
          <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-200 text-sm">Cestino di Ripristino (Conservazione 30 Giorni)</h4>
            <p className="text-amber-300/80 mt-1 leading-relaxed">
              I pazienti eliminati rimangono in questo archivio temporaneo per 30 giorni prima dell'eliminazione definitiva. Puoi ripristinare qualsiasi paziente in un click mantenendo integri tutti i test di forza, hop test e direttive cliniche.
            </p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        {/* Quick Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ricerca rapida (Nome, Cognome, Innesto, Sport, Chirurgo)..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        {/* Sport Filter */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden xs:inline" />
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tutti gli Sport</option>
            <option value="Calcio">Calcio</option>
            <option value="Basket">Basket</option>
            <option value="Rugby">Rugby</option>
            <option value="Sci">Sci</option>
            <option value="Pallavolo">Pallavolo</option>
          </select>
        </div>

        {/* Graft Filter */}
        <div className="w-full sm:w-auto">
          <select
            value={filterGraft}
            onChange={(e) => setFilterGraft(e.target.value)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tutti i Tipi Innesto</option>
            <option value="STG">Semitendinoso/Gracile (STG)</option>
            <option value="Rotuleo">Tendine Rotuleo</option>
            <option value="Quadricipitale">Tendine Quadricipitale</option>
            <option value="Allograft">Allograft</option>
          </select>
        </div>
      </div>

      {/* Patient Table (Responsive PC Desktop & Mobile Cards) */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <th className="py-3.5 px-4">Paziente / Anagrafica</th>
                <th className="py-3.5 px-4">Sport & Livello</th>
                <th className="py-3.5 px-4">Data Chirurgia</th>
                <th className="py-3.5 px-4">Tipo Innesto & Lato</th>
                {viewTab === 'active' ? (
                  <>
                    <th className="py-3.5 px-4">Chirurgo</th>
                    <th className="py-3.5 px-4">Fase Riabilitativa</th>
                  </>
                ) : (
                  <>
                    <th className="py-3.5 px-4">Data Eliminazione</th>
                    <th className="py-3.5 px-4">Tempo per Ripristino</th>
                  </>
                )}
                <th className="py-3.5 px-4 text-right">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => {
                  const daysLeft = getRemainingDays(patient.deleted_at);
                  const deletedDateFormatted = patient.deleted_at 
                    ? new Date(patient.deleted_at).toLocaleDateString('it-IT')
                    : 'N/D';

                  return (
                    <tr 
                      key={patient.id} 
                      onClick={() => viewTab === 'active' && onSelectPatient(patient)}
                      className={`transition-colors ${viewTab === 'active' ? 'hover:bg-slate-800/60 cursor-pointer group' : 'hover:bg-slate-900/40'}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className={`font-bold ${viewTab === 'active' ? 'text-white group-hover:text-cyan-400' : 'text-slate-200'} transition-colors`}>
                          {patient.nome} {patient.cognome}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Nato il {patient.data_nascita}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{patient.sport}</div>
                        <div className="text-[10px] text-cyan-400">{patient.ruolo_sportivo || 'N/D'} • {patient.livello}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {patient.data_intervento}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-semibold text-cyan-300 text-[11px]">
                          {patient.tipo_innesto}
                        </span>
                        <span className="ml-2 font-bold text-slate-200">({patient.lato_lesione})</span>
                      </td>

                      {viewTab === 'active' ? (
                        <>
                          <td className="py-3.5 px-4 text-slate-300">
                            {patient.chirurgo || 'Non specificato'}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              patient.fase_riabilitativa === 'Return to Sport' 
                                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                                : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                            }`}>
                              {patient.fase_riabilitativa}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectPatient(patient);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-cyan-600 group-hover:text-white transition-all inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 cursor-pointer"
                              >
                                <span>Scheda 5-Tab</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleSoftDelete(e, patient)}
                                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:bg-rose-950 hover:border-rose-500/50 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                                title="Sposta nel Cestino (Ripristinabile per 30 giorni)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {deletedDateFormatted}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 ${
                              daysLeft <= 7 
                                ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300 animate-pulse' 
                                : 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
                            }`}>
                              <Clock className="w-3.5 h-3.5" />
                              {daysLeft} {daysLeft === 1 ? 'giorno rimasto' : 'giorni rimasti'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleRestore(e, patient)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105"
                                title="Ripristina Paziente nel Database Attivo"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Ripristina</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handlePermanentDelete(e, patient)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-rose-900/60 hover:bg-rose-950 hover:border-rose-500/60 text-rose-400 text-xs flex items-center gap-1 transition-all cursor-pointer"
                                title="Elimina Definitivamente (Non reversibile)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Definitivo</span>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500 text-xs">
                    {viewTab === 'active' 
                      ? 'Nessun paziente attivo trovato per i filtri selezionati.' 
                      : 'Il Cestino è vuoto. Nessun paziente cancellato negli ultimi 30 giorni.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="block md:hidden divide-y divide-slate-800">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => {
              const daysLeft = getRemainingDays(patient.deleted_at);

              return (
                <div 
                  key={patient.id} 
                  onClick={() => viewTab === 'active' && onSelectPatient(patient)}
                  className={`p-4 transition-colors space-y-2.5 ${viewTab === 'active' ? 'hover:bg-slate-900 cursor-pointer' : 'bg-slate-900/30'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base">{patient.nome} {patient.cognome}</h4>
                      <div className="text-xs text-cyan-400 font-medium">
                        {patient.sport} ({patient.ruolo_sportivo}) • {patient.livello}
                      </div>
                    </div>
                    
                    {viewTab === 'active' ? (
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          patient.fase_riabilitativa === 'Return to Sport' 
                            ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                        }`}>
                          {patient.fase_riabilitativa}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleSoftDelete(e, patient)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:bg-rose-950 transition-all"
                          title="Sposta nel Cestino"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                        daysLeft <= 7 ? 'bg-rose-950 border border-rose-500/50 text-rose-300' : 'bg-amber-950 border border-amber-500/50 text-amber-300'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {daysLeft}gg per ripristino
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div>Chirurgia: <strong className="text-white">{patient.data_intervento}</strong></div>
                    <div>Innesto: <strong className="text-cyan-300">{patient.tipo_innesto} ({patient.lato_lesione})</strong></div>
                    {viewTab === 'trash' && (
                      <div className="col-span-2 text-amber-300 font-mono text-[11px]">
                        Cancellato il: {patient.deleted_at ? new Date(patient.deleted_at).toLocaleDateString('it-IT') : 'N/D'}
                      </div>
                    )}
                  </div>

                  {viewTab === 'active' ? (
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-400">Tocca per aprire Scheda 5-Tab</span>
                      <ChevronRight className="w-4 h-4 text-cyan-400" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={(e) => handleRestore(e, patient)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Ripristina
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handlePermanentDelete(e, patient)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-rose-900/60 text-rose-400 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Definitivo
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs">
              {viewTab === 'active' ? 'Nessun paziente attivo trovato.' : 'Il Cestino è vuoto.'}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
