import React, { useState } from 'react';
import { User, Stethoscope, AlertTriangle, ShieldCheck, Save, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TabAnagrafica({ patient, onUpdatePatient }) {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  const [formData, setFormData] = useState({
    nome: patient.nome || '',
    cognome: patient.cognome || '',
    data_nascita: patient.data_nascita || '',
    codice_fiscale: patient.codice_fiscale || '',
    genere: patient.genere || 'M',
    sport: patient.sport || '',
    ruolo_sportivo: patient.ruolo_sportivo || '',
    livello: patient.livello || 'Professionista',
    lato_lesione: patient.lato_lesione || 'Sx',
    data_intervento: patient.data_intervento || '',
    tipo_innesto: patient.tipo_innesto || 'STG',
    chirurgo: patient.chirurgo || '',
    note_chirurgiche: patient.note_chirurgiche || '',
    complicanze: patient.complicanze || '',
    aclrsi_score_iniziale: patient.aclrsi_score_iniziale || 45.0,
    fase_riabilitativa: patient.fase_riabilitativa || 'Return to Run',
    prossimo_controllo: patient.prossimo_controllo || ''
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    onUpdatePatient({ ...patient, ...formData });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <span>Tab 1: Anagrafica Clinica & Dettagli Chirurgici</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Profilazione completa dell'atleta, tipo di innesto LCA, storicità chirurgo e ACL-RSI Score iniziale.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-1.5 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Modifiche salvate!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Anagrafica & Profilo Sportivo */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>Dati Personali & Disciplina Sportiva</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Nome</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Cognome</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.cognome}
                onChange={(e) => handleChange('cognome', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Data di Nascita</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.data_nascita}
                onChange={(e) => handleChange('data_nascita', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Codice Fiscale</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.codice_fiscale}
                onChange={(e) => handleChange('codice_fiscale', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Sport Praticato</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.sport}
                onChange={(e) => handleChange('sport', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Ruolo Sportivo</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.ruolo_sportivo}
                onChange={(e) => handleChange('ruolo_sportivo', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Livello Agonistico</label>
              <select
                disabled={!isAdmin}
                value={formData.livello}
                onChange={(e) => handleChange('livello', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60"
              >
                <option value="Amatoriale">Amatoriale</option>
                <option value="Semi-Pro">Semi-Pro</option>
                <option value="Professionista">Professionista</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">ACL-RSI Score Iniziale (%)</label>
              <input
                type="number"
                step="0.1"
                disabled={!isAdmin}
                value={formData.aclrsi_score_iniziale}
                onChange={(e) => handleChange('aclrsi_score_iniziale', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Storico Chirurgico LCA */}
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="w-4 h-4" />
            <span>Quadri Chirurgico & Innesto Legamentoso</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Data Intervento</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.data_intervento}
                onChange={(e) => handleChange('data_intervento', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Tipo Innesto Utilizzato</label>
              <select
                disabled={!isAdmin}
                value={formData.tipo_innesto}
                onChange={(e) => handleChange('tipo_innesto', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold disabled:opacity-60"
              >
                <option value="STG">Semitendinoso / Gracile (STG)</option>
                <option value="Rotuleo">Tendine Rotuleo (Bone-Tendon-Bone)</option>
                <option value="Quadricipitale">Tendine Quadricipitale</option>
                <option value="Allograft">Allograft (Da Donatore)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Lato Lesione</label>
              <select
                disabled={!isAdmin}
                value={formData.lato_lesione}
                onChange={(e) => handleChange('lato_lesione', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60 font-bold"
              >
                <option value="Sx">Sinistro (Sx)</option>
                <option value="Dx">Destro (Dx)</option>
                <option value="Bilaterale">Bilaterale</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Chirurgo Ortopedico</label>
              <input
                type="text"
                disabled={!isAdmin}
                value={formData.chirurgo}
                onChange={(e) => handleChange('chirurgo', e.target.value)}
                placeholder="es. Dr. Roberto Mariani"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Prossimo Controllo Ortopedico</label>
              <input
                type="date"
                disabled={!isAdmin}
                value={formData.prossimo_controllo}
                onChange={(e) => handleChange('prossimo_controllo', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-mono disabled:opacity-60"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium">Note Operatorie Chirurgiche</label>
              <textarea
                rows="2"
                disabled={!isAdmin}
                value={formData.note_chirurgiche}
                onChange={(e) => handleChange('note_chirurgiche', e.target.value)}
                placeholder="Tecnica usata, fissaggi, meniscectomia o sutura meniscale associata..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-medium flex items-center gap-1 text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Complicanze o Segnalazioni Peri-operatorie</span>
              </label>
              <textarea
                rows="2"
                disabled={!isAdmin}
                value={formData.complicanze}
                onChange={(e) => handleChange('complicanze', e.target.value)}
                placeholder="Idrarto prolungato, deficit estensione, rigidità o sinovite..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-white disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Submit Button (Only for ADMIN) */}
        {isAdmin && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Salva Modifiche Anagrafiche</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
