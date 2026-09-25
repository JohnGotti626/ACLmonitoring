import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Dumbbell, 
  AlertTriangle, 
  Save, 
  CheckCircle2, 
  Activity,
  Plus,
  Trash2,
  Check,
  Zap,
  Flame,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TabDirettiveOperative({ patient, onSaveDirectives, onChangePhase }) {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

  // State Feedback Salvataggio
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  const phasesList = [
    {
      id: 'EARLY_STAGE',
      num: '1',
      tag: 'EARLY STAGE',
      title: 'Restore ROM and Quality',
      subtitle: 'Recupero estensione 0°, controllo del gonfiore, riattivazione isolata VMO e propriocezione iniziale.'
    },
    {
      id: 'MID_STAGE',
      num: '2',
      tag: 'MID STAGE',
      title: 'Strength, Jump and Landing',
      subtitle: 'Rinforzo muscolare progressivo in catena chiusa/aperta, landing mechanics e primi salti controllati.'
    },
    {
      id: 'RETURN_TO_RUN',
      num: '3',
      tag: 'RETURN TO RUN',
      title: 'Drills, RSI and Power',
      subtitle: 'Introduzione alla corsa sul dritto, drills meccanici, lavoro su RSI (Reactive Strength Index) e potenza.'
    },
    {
      id: 'LATE_STAGE',
      num: '4',
      tag: 'LATE STAGE',
      title: 'CODs, Chaos and Plyo',
      subtitle: 'Cambi di direzione (CODs) ad alta velocità, ambienti caotici/reattivi e pliometria ad alto impatto.'
    },
    {
      id: 'PERFORMANCE',
      num: '5',
      tag: 'PERFORMANCE',
      title: 'Med, Sprint and PeakPower',
      subtitle: 'Ritorno alla performance massimale: test di sprint 10-30m, potenza di picco e idoneità Return to Sport.'
    }
  ];

  // Helper per ricavare la fase iniziale dal paziente
  const getPhaseIdFromPatient = (fase) => {
    if (!fase) return 'RETURN_TO_RUN';
    const str = String(fase).toLowerCase();
    if (str.includes('early') || str.includes('rom') || str === 'fase 1') return 'EARLY_STAGE';
    if (str.includes('mid') || str.includes('strength') || str === 'fase 2') return 'MID_STAGE';
    if (str.includes('run') || str.includes('drills') || str === 'fase 3') return 'RETURN_TO_RUN';
    if (str.includes('late') || str.includes('cod') || str.includes('agility') || str === 'fase 4') return 'LATE_STAGE';
    if (str.includes('perf') || str.includes('play') || str.includes('sport') || str.includes('rts') || str === 'fase 5') return 'PERFORMANCE';
    return 'RETURN_TO_RUN';
  };

  // ---------------------------------------------------------------------------
  // BLOCCO 1: SELEZIONE FASE RIABILITATIVA LCA ATTIVATA
  // ---------------------------------------------------------------------------
  const [selectedPhaseId, setSelectedPhaseId] = useState(() => getPhaseIdFromPatient(patient?.fase_riabilitativa));

  useEffect(() => {
    if (patient?.fase_riabilitativa) {
      setSelectedPhaseId(getPhaseIdFromPatient(patient.fase_riabilitativa));
    }
  }, [patient?.fase_riabilitativa]);

  const handleSelectPhase = (ph) => {
    setSelectedPhaseId(ph.id);
    let dbPhase = 'Return to Run';
    if (ph.id === 'EARLY_STAGE') dbPhase = 'Early Phase';
    if (ph.id === 'MID_STAGE') dbPhase = 'Return to Run';
    if (ph.id === 'RETURN_TO_RUN') dbPhase = 'Return to Run';
    if (ph.id === 'LATE_STAGE') dbPhase = 'Return to Sport';
    if (ph.id === 'PERFORMANCE') dbPhase = 'Return to Play';
    
    if (onChangePhase) {
      onChangePhase(dbPhase);
    }
    if (onSaveDirectives) {
      onSaveDirectives({ fase_riabilitativa: dbPhase });
    }

    showSuccessFeedback(`Fase salvata su Supabase Cloud: ${dbPhase}`);
  };

  // ---------------------------------------------------------------------------
  // BLOCCO 2: PRIORITÀ & DEFICIT CLINICI REGISTRATI
  // ---------------------------------------------------------------------------
  const [deficitsList, setDeficitsList] = useState([
    {
      id: 1,
      severity: 'Rosso', // 'Rosso', 'Giallo', 'Verde'
      title: 'Deficit Forza Quadricipite LSI (72.4%)',
      description: 'Forza dinamometrica Iso Push SX 393N vs DX 543N.',
      actionPlan: 'Piano Azione: Potenziamento selettivo concentrico/eccentrico.'
    },
    {
      id: 2,
      severity: 'Giallo',
      title: 'Valgo Dinamico in Atterraggio',
      description: 'Cedimento in valgo su atterraggio monopodalico a fine seduta.',
      actionPlan: 'Piano Azione: Rinforzo medio gluteo + feedback allo specchio.'
    }
  ]);

  // Form State Deficit
  const [deficitForm, setDeficitForm] = useState({
    title: '',
    severity: 'Rosso',
    description: '',
    actionPlan: ''
  });

  // Preset Deficit Rapidi
  const applyDeficitPreset = (preset) => {
    setDeficitForm({
      title: preset.title,
      severity: preset.severity,
      description: preset.description,
      actionPlan: preset.actionPlan
    });
  };

  const handleAddDeficit = (e) => {
    if (e) e.preventDefault();
    if (!deficitForm.title.trim()) return;

    const newDeficit = {
      id: Date.now(),
      title: deficitForm.title,
      severity: deficitForm.severity,
      description: deficitForm.description || 'Nessuna osservazione specifica inserita.',
      actionPlan: deficitForm.actionPlan || 'Piano di monitoraggio standard.'
    };

    const updatedDeficits = [newDeficit, ...deficitsList];
    setDeficitsList(updatedDeficits);
    setDeficitForm({
      title: '',
      severity: 'Rosso',
      description: '',
      actionPlan: ''
    });

    if (onSaveDirectives) {
      onSaveDirectives({
        deficits_list: updatedDeficits,
        alert_compenso: updatedDeficits.map(d => `[${d.severity}] ${d.title}`).join('; ')
      });
    }

    showSuccessFeedback('Deficit inserito e salvato automaticamente!');
  };

  const handleRemoveDeficit = (id) => {
    const updatedDeficits = deficitsList.filter(d => d.id !== id);
    setDeficitsList(updatedDeficits);

    if (onSaveDirectives) {
      onSaveDirectives({
        deficits_list: updatedDeficits,
        alert_compenso: updatedDeficits.map(d => `[${d.severity}] ${d.title}`).join('; ')
      });
    }

    showSuccessFeedback('Deficit rimosso e salvato automaticamente!');
  };

  // ---------------------------------------------------------------------------
  // BLOCCO 3: INDICAZIONI REHAB TEAM (CON SALVATAGGIO AUTOMATICO SU SCRITTURA)
  // ---------------------------------------------------------------------------
  const [rehabComment, setRehabComment] = useState(
    patient?.note_operative || 'Progressione della forza quadricipitale. LSI ISOpush 72.4%. Continua lavoro su Leg Extension unipedale ed isometrica a 60°.'
  );

  useEffect(() => {
    if (patient?.note_operative !== undefined) {
      setRehabComment(patient.note_operative);
    }
  }, [patient?.note_operative]);

  const handleRehabCommentChange = (val) => {
    setRehabComment(val);
    if (onSaveDirectives) {
      onSaveDirectives({ note_operative: val });
    }
  };

  const handleSaveRehabComment = () => {
    if (onSaveDirectives) {
      onSaveDirectives({ note_operative: rehabComment });
    }
    showSuccessFeedback('Commento Rehab Team salvato!');
  };

  // ---------------------------------------------------------------------------
  // BLOCCO 4: SCHEDA ESERCIZI & CARICHI VBT (SALVATAGGIO AUTOMATICO)
  // ---------------------------------------------------------------------------
  const [exercisesList, setExercisesList] = useState(
    patient?.exercises_list || [
      {
        id: 1,
        name: 'Leg Extension Isometrico 60°',
        setsReps: '4x6',
        weight: '40',
        vbtSpeed: '0.7',
        note: 'Spinta isometrica massimale 5s'
      },
      {
        id: 2,
        name: 'Single Leg Press',
        setsReps: '4x10',
        weight: '85',
        vbtSpeed: '0.65',
        note: 'Controllo fase eccentrica 3s'
      },
      {
        id: 3,
        name: 'Drop Jump SL Box 30cm',
        setsReps: '3x5',
        weight: 'BW',
        vbtSpeed: '0.85',
        note: 'Focus tempo contatto suolo < 200ms'
      }
    ]
  );

  // Form State Esercizio
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    weight: '',
    vbtSpeed: '',
    setsReps: '',
    note: ''
  });

  // Preset Esercizi Rapidi
  const applyExercisePreset = (nameDefault) => {
    setExerciseForm(prev => ({
      ...prev,
      name: nameDefault
    }));
  };

  const handleAddExercise = (e) => {
    if (e) e.preventDefault();
    if (!exerciseForm.name.trim()) return;

    const newEx = {
      id: Date.now(),
      name: exerciseForm.name,
      weight: exerciseForm.weight || '40',
      vbtSpeed: exerciseForm.vbtSpeed || '0.7',
      setsReps: exerciseForm.setsReps || '4x8',
      note: exerciseForm.note || 'Esecuzione controllata'
    };

    const updatedExercises = [...exercisesList, newEx];
    setExercisesList(updatedExercises);
    setExerciseForm({
      name: '',
      weight: '',
      vbtSpeed: '',
      setsReps: '',
      note: ''
    });

    if (onSaveDirectives) {
      onSaveDirectives({
        exercises_list: updatedExercises,
        esercizi_prescritti: updatedExercises.map(ex => `${ex.name} (${ex.setsReps}, ${ex.weight}kg, ${ex.vbtSpeed}m/s)`).join('. ')
      });
    }

    showSuccessFeedback('Esercizio aggiunto e salvato automaticamente!');
  };

  const handleRemoveExercise = (id) => {
    const updatedExercises = exercisesList.filter(ex => ex.id !== id);
    setExercisesList(updatedExercises);

    if (onSaveDirectives) {
      onSaveDirectives({
        exercises_list: updatedExercises,
        esercizi_prescritti: updatedExercises.map(ex => `${ex.name} (${ex.setsReps}, ${ex.weight}kg, ${ex.vbtSpeed}m/s)`).join('. ')
      });
    }

  };

  // Helper feedback
  const showSuccessFeedback = (msg) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-4 select-none w-full max-w-7xl mx-auto pb-8">
      
      {/* Toast Feedback Salvataggio */}
      {savedSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 px-3.5 py-2 rounded-xl bg-emerald-950/95 border border-emerald-500/60 text-emerald-300 font-extrabold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BLOCCO 1: 1. SELEZIONA LA FASE RIABILITATIVA LCA ATTUALE DEL SOGGETTO */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#071322] border border-slate-800/90 shadow-xl space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white font-black text-sm sm:text-base">
              1. Seleziona la Fase Riabilitativa LCA Attuale del Soggetto
            </h3>
            <p className="text-slate-400 text-[11px] font-medium leading-tight">
              Seleziona la fase di lavoro clinico in cui si trova attualmente il paziente per guidare il protocollo
            </p>
          </div>
        </div>

        {/* Griglia Orizzontale a 5 Card Fasi RTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {phasesList.map((ph) => {
            const isSelected = selectedPhaseId === ph.id;
            return (
              <div
                key={ph.id}
                onClick={() => handleSelectPhase(ph)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-2 relative ${
                  isSelected
                    ? 'bg-[#0e2c38] border-2 border-emerald-400 shadow-lg ring-1 ring-emerald-400/30'
                    : 'bg-[#09182a] border border-slate-800/90 hover:border-slate-700 hover:bg-[#0b1c31]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-emerald-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {ph.num}. {ph.tag}
                    </span>

                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    )}
                  </div>

                  <h4 className="text-white font-extrabold text-xs mt-1 leading-tight">
                    {ph.title}
                  </h4>

                  <p className="text-slate-300 text-[10.5px] font-medium leading-tight mt-1.5">
                    {ph.subtitle}
                  </p>
                </div>

                {isSelected && (
                  <div className="pt-1.5 border-t border-emerald-500/30 flex items-center gap-1 text-emerald-300 text-[10.5px] font-extrabold">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-300">✓ Fase Attiva</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BLOCCO 2: 2. PRIORITÀ E DEFICIT CLINICI REGISTRATI (ROSSO, GIALLO, VERDE) */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#071322] border border-slate-800/90 shadow-xl space-y-3">
        
        {/* Header Sezione con Contatore Deficit */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-base">⚠️</span>
            <div>
              <h3 className="text-white font-black text-sm sm:text-base flex items-center gap-1.5">
                <span>2. Priorità e Deficit Clinici Registrati (Rosso 🔴, Giallo 🟡, Verde 🟢)</span>
              </h3>
              <p className="text-slate-400 text-[11px] font-medium leading-tight">
                Segnala ed aggiorna i deficit personalizzati del paziente in base alla criticità di lavoro riabilitativo
              </p>
            </div>
          </div>

          <div className="px-2.5 py-1 bg-[#09182a] border border-slate-800 rounded-lg text-slate-300 font-extrabold text-[11px] shrink-0">
            {deficitsList.length} Deficit
          </div>
        </div>

        {/* Sub 2.1: Preset Rapidi Deficit */}
        <div className="p-2.5 rounded-xl bg-[#09182a] border border-slate-800/80 space-y-1.5">
          <div className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1 uppercase tracking-wider">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Preset Rapidi Deficit:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              { 
                label: '+ Deficit Estensione Passiva (-3°)', 
                title: 'Deficit Estensione Passiva (-3°)', 
                severity: 'Rosso', 
                description: 'Limiting deficit sul raggiungimento estensione paritaria 0°.',
                actionPlan: 'Mobilizzazione passiva sul lettino + reclutamento VMO isometrico.',
                cls: 'border-rose-500/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
              },
              { 
                label: '+ Deficit Forza Quadricipite LSI < 80%', 
                title: 'Deficit Forza Quadricipite LSI < 80%', 
                severity: 'Rosso', 
                description: 'Forza dinamometrica Iso Push con deficit dell\'arto operato.',
                actionPlan: 'Potenziamento selettivo concentrico/eccentrico su Leg Extension.',
                cls: 'border-rose-500/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
              },
              { 
                label: '+ Valgo Dinamico in Atterraggio', 
                title: 'Valgo Dinamico in Atterraggio', 
                severity: 'Giallo', 
                description: 'Cedimento in valgo su atterraggio monopodalico a fine seduta.',
                actionPlan: 'Rinforzo medio gluteo + drills di feedback allo specchio.',
                cls: 'border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60'
              },
              { 
                label: '+ Kinesiofobia / Paura Re-infortunio', 
                title: 'Kinesiofobia / Paura Re-infortunio', 
                severity: 'Giallo', 
                description: 'Esitazione nei cambi di direzione ad alta velocità.',
                actionPlan: 'Desensibilizzazione con percorsi di agilità progressiva.',
                cls: 'border-amber-500/50 bg-amber-950/40 text-amber-300 hover:bg-amber-900/60'
              },
              { 
                label: '+ Mobilità 0° Raggiunta', 
                title: 'Recupero Mobilità 0° Raggiunto', 
                severity: 'Verde', 
                description: 'Estensione completa paritaria 0° conseguita.',
                actionPlan: 'Mantenimento con mobilizzazioni attive di riscaldamento.',
                cls: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
              },
              { 
                label: '+ Simmetria Salto LSI >= 90%', 
                title: 'Simmetria Salto Raggiunta LSI >= 90%', 
                severity: 'Verde', 
                description: 'LSI Salto monopodalico superato > 90%.',
                actionPlan: 'Transizione a pliometria ad alto impatto.',
                cls: 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
              }
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyDeficitPreset(p)}
                className={`px-2.5 py-1 rounded-lg border font-bold text-[10.5px] transition-all cursor-pointer ${p.cls}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub 2.2: Form Inserimento Deficit */}
        <form onSubmit={handleAddDeficit} className="space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            <div className="md:col-span-7 space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                Titolo Deficit / Area di Lavoro *
              </label>
              <input
                type="text"
                value={deficitForm.title}
                onChange={(e) => setDeficitForm({ ...deficitForm, title: e.target.value })}
                placeholder="Es. Deficit Estensione Passiva (-3°)"
                className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="md:col-span-5 space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                Livello Criticità di Lavoro *
              </label>
              <div className="flex items-center gap-1 p-1 bg-[#050c17] rounded-xl border border-slate-700/80">
                {[
                  { id: 'Rosso', label: '🔴 Rosso', cls: 'bg-rose-600 text-white font-black' },
                  { id: 'Giallo', label: '🟡 Giallo', cls: 'bg-amber-400 text-slate-950 font-black' },
                  { id: 'Verde', label: '🟢 Verde', cls: 'bg-emerald-400 text-slate-950 font-black' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDeficitForm({ ...deficitForm, severity: opt.id })}
                    className={`flex-1 py-1.5 px-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                      deficitForm.severity === opt.id
                        ? `${opt.cls} shadow-md border border-white/20`
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                Descrizione / Osservazione Clinica
              </label>
              <input
                type="text"
                value={deficitForm.description}
                onChange={(e) => setDeficitForm({ ...deficitForm, description: e.target.value })}
                placeholder="Dettagli sulla limitazione..."
                className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                Piano di Azione / Raccomandazione
              </label>
              <input
                type="text"
                value={deficitForm.actionPlan}
                onChange={(e) => setDeficitForm({ ...deficitForm, actionPlan: e.target.value })}
                placeholder="Intervento riabilitativo mirato..."
                className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Inserisci Deficit Registrato</span>
          </button>
        </form>

        {/* Lista Card Deficit Salvati (GRIGLIA A 2 PER RIGA) */}
        {deficitsList.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
              Deficit Registrati & Criticità ({deficitsList.length})
            </h4>

            {/* GRIGLIA A 2 COLONNE PER RIGA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {deficitsList.map((def) => {
                const isRosso = def.severity === 'Rosso';
                const isGiallo = def.severity === 'Giallo';

                return (
                  <div
                    key={def.id}
                    className="p-3 rounded-2xl bg-[#09182a] border border-slate-800 flex flex-col justify-between space-y-2 shadow-md hover:border-slate-700 transition-all relative"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] tracking-wider uppercase text-center shrink-0 ${
                          isRosso 
                            ? 'bg-rose-600 text-white shadow-sm'
                            : isGiallo 
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-sm'
                              : 'bg-emerald-400 text-slate-950 shadow-sm'
                        }`}>
                          {isRosso ? '🔴 ALTA CRITICITÀ' : isGiallo ? '🟡 MEDIA CRITICITÀ' : '🟢 BASSA / RAGGIUNTO'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveDeficit(def.id)}
                          className="p-1 text-slate-500 hover:text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-white font-extrabold text-xs leading-snug">
                        {def.title}
                      </h4>

                      <p className="text-slate-300 text-[11px] font-medium leading-tight">
                        {def.description}
                      </p>

                      <p className="text-emerald-400 font-bold text-[10.5px] pt-0.5">
                        {def.actionPlan}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* BLOCCO 3: 3. INDICAZIONI REHAB TEAM */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#071322] border border-slate-800/90 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400 text-base">📑</span>
            <div>
              <h3 className="text-white font-black text-sm sm:text-base">
                3. Indicazioni Rehab Team
              </h3>
              <p className="text-slate-400 text-[11px] font-medium leading-tight">
                Scrivi liberamente il commento direttivo su come continuare il lavoro riabilitativo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveRehabComment}
            className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#059669] text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-md transition-all cursor-pointer shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salva Commento</span>
          </button>
        </div>

        <textarea
          rows="2"
          value={rehabComment}
          onChange={(e) => handleRehabCommentChange(e.target.value)}
          placeholder="Scrivi qui le note operative e le indicazioni cliniche per lo Staff sul campo..."
          className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed font-medium"
        />
      </div>

      {/* ========================================================================= */}
      {/* BLOCCO 4: 4. ESERCIZI E CARICHI (KG E M/S PER ACCELEROMETRI / PEDANE) */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#071322] border border-slate-800/90 shadow-xl space-y-3">
        
        {/* Header Sezione */}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 text-base">🏋️</span>
            <h3 className="text-white font-black text-sm sm:text-base">
              4. Esercizi e Carichi (kg e m/s per accelerometri / pedane)
            </h3>
          </div>
          <p className="text-slate-400 text-[11px] font-medium leading-tight mt-0.5">
            Seleziona e registra gli esercizi in esecuzione con i relativi kg sollevati e le velocità m/s di riferimento
          </p>
        </div>

        {/* Sub 4.1: Preset Esercizi Rapidi */}
        <div className="p-2.5 rounded-xl bg-[#09182a] border border-slate-800/80 space-y-1.5">
          <div className="text-[11px] font-extrabold text-cyan-400 flex items-center gap-1 uppercase tracking-wider">
            <Dumbbell className="w-3 h-3 text-cyan-400" />
            <span>Preset Esercizi Rapidi:</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {[
              '+ Leg Extension Unipedale',
              '+ Single Leg Press 45°',
              '+ Back Squat Bilanciere',
              '+ Nordic Hamstring Curl',
              '+ Drop Jump (Pedana)',
              '+ Trap Bar Deadlift'
            ].map((pName, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyExercisePreset(pName.replace('+ ', ''))}
                className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 font-bold text-[10.5px] transition-all cursor-pointer"
              >
                {pName}
              </button>
            ))}
          </div>
        </div>

        {/* Sub 4.2: Form Inserimento Esercizio */}
        <form onSubmit={handleAddExercise} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                Nome Esercizio *
              </label>
              <input
                type="text"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                placeholder="Es. Leg Extension Uni"
                className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                ⚖️ Carico (kg)
              </label>
              <input
                type="text"
                value={exerciseForm.weight}
                onChange={(e) => setExerciseForm({ ...exerciseForm, weight: e.target.value })}
                placeholder="Es. 45"
                className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                ⏱️ Velocità (m/s)
              </label>
              <input
                type="text"
                value={exerciseForm.vbtSpeed}
                onChange={(e) => setExerciseForm({ ...exerciseForm, vbtSpeed: e.target.value })}
                placeholder="Es. 0.8"
                className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">
                Serie x Reps
              </label>
              <input
                type="text"
                value={exerciseForm.setsReps}
                onChange={(e) => setExerciseForm({ ...exerciseForm, setsReps: e.target.value })}
                placeholder="Es. 4x8"
                className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-8 space-y-1">
              <input
                type="text"
                value={exerciseForm.note}
                onChange={(e) => setExerciseForm({ ...exerciseForm, note: e.target.value })}
                placeholder="Note sull'esecuzione (es. VBT e spinta isometrica massimale)..."
                className="w-full bg-[#050c17] border border-slate-700/80 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="sm:col-span-4">
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Aggiungi Esercizio</span>
              </button>
            </div>
          </div>
        </form>

        {/* Sub 4.3: Cards Esercizi Registrati (GRIGLIA A 3 PER RIGA) */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            ESERCIZI REGISTRATI PER LA SCHEDA ({exercisesList.length})
          </h4>

          {/* GRIGLIA A 3 COLONNE PER RIGA SU TABLET/DESKTOP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {exercisesList.map((ex) => (
              <div 
                key={ex.id}
                className="p-3 rounded-2xl bg-[#09182a] border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md"
              >
                {/* Header Card: Titolo + Tag Sets/Reps + Trash Icon */}
                <div className="flex items-start justify-between gap-1.5">
                  <h4 className="font-black text-white text-xs leading-snug">
                    {ex.name}
                  </h4>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="px-2 py-0.5 bg-[#0d2334] border border-cyan-500/30 text-cyan-300 font-black text-[10.5px] rounded-md">
                      {ex.setsReps}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(ex.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded-md transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2 Pillole Dati Ultra-Compatte */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {/* Pillola Verde Carico */}
                  <div className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-extrabold text-[10.5px] rounded-lg flex items-center gap-1 shrink-0">
                    <span>🏋️</span>
                    <span>Carico: {ex.weight} kg</span>
                  </div>

                  {/* Pillola Ciano Velocità VBT */}
                  <div className="px-2 py-0.5 bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-extrabold text-[10.5px] rounded-lg flex items-center gap-1 shrink-0">
                    <span>⚡</span>
                    <span>Velocità: {ex.vbtSpeed} m/s</span>
                  </div>
                </div>

                {/* Note in corsivo tra virgolette */}
                <div className="pt-1 border-t border-slate-800/60">
                  <p className="text-slate-300/90 text-[10.5px] italic font-medium leading-tight">
                    {ex.note.startsWith('"') ? ex.note : `"${ex.note}"`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
