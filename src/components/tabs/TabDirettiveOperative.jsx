import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Save, 
  CheckCircle2, 
  Plus,
  Trash2,
  Check,
  Zap,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TabDirettiveOperative({ patient, onSaveDirectives, onChangePhase }) {
  const { role } = useAuth();
  const isAdmin = role === 'ADMIN';

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
      onSaveDirectives({ fase_riabilitativa: dbPhase, fase_attuale: dbPhase });
    }

    showSuccessFeedback(`Fase salvata su Supabase Cloud: ${dbPhase}`);
  };

  const [deficitsList, setDeficitsList] = useState(
    Array.isArray(patient?.deficits_list) && patient.deficits_list.length > 0
      ? patient.deficits_list
      : [
          {
            id: 1,
            severity: 'Rosso',
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
        ]
  );

  const [deficitForm, setDeficitForm] = useState({
    title: '',
    severity: 'Rosso',
    description: '',
    actionPlan: ''
  });

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

  const [rehabComment, setRehabComment] = useState(
    patient?.direttive_terapista || patient?.note_operative || 'Progressione della forza quadricipitale. Continua lavoro su Leg Extension unipedale ed isometrica a 60°.'
  );

  useEffect(() => {
    if (patient?.direttive_terapista !== undefined || patient?.note_operative !== undefined) {
      setRehabComment(patient.direttive_terapista || patient.note_operative || '');
    }
  }, [patient?.direttive_terapista, patient?.note_operative]);

  const handleRehabCommentChange = (val) => {
    setRehabComment(val);
    if (onSaveDirectives) {
      onSaveDirectives({ note_operative: val, direttive_terapista: val });
    }
  };

  const handleSaveRehabComment = () => {
    if (onSaveDirectives) {
      onSaveDirectives({ note_operative: rehabComment, direttive_terapista: rehabComment });
    }
    showSuccessFeedback('Commento Rehab Team salvato!');
  };

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

  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    weight: '',
    vbtSpeed: '',
    setsReps: '',
    note: ''
  });

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

  const showSuccessFeedback = (msg) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => setSavedSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-4 select-none w-full max-w-7xl mx-auto">
      {savedSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{savedSuccessMsg}</span>
        </div>
      )}

      {/* BLOCCO 1: FASE RIABILITATIVA */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-100 text-slate-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-sm">
              1. Dettaglio Fasi Riabilitative LCA (5 Step NSCA)
            </h3>
            <p className="text-slate-500 text-xs">
              Seleziona lo stadio specifico per aggiornare la fase clinica del paziente
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {phasesList.map((ph) => {
            const isSelected = selectedPhaseId === ph.id;
            return (
              <div
                key={ph.id}
                onClick={() => handleSelectPhase(ph)}
                className={`p-3 rounded-xl cursor-pointer transition-all flex flex-col justify-between space-y-2 relative ${
                  isSelected
                    ? 'bg-emerald-50 border-2 border-emerald-600 shadow-sm'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ph.num}. {ph.tag}
                    </span>
                  </div>

                  <h4 className="text-slate-900 font-bold text-xs mt-1 leading-tight">
                    {ph.title}
                  </h4>

                  <p className="text-slate-500 text-[11px] leading-tight mt-1.5">
                    {ph.subtitle}
                  </p>
                </div>

                {isSelected && (
                  <div className="pt-1.5 border-t border-emerald-200 flex items-center gap-1 text-emerald-700 text-[10.5px] font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Fase Attiva</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* BLOCCO 2: PRIORITÀ E DEFICIT CLINICI REGISTRATI */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-slate-900 font-bold text-sm">
              2. Priorità e Deficit Clinici Registrati (Rosso, Giallo, Verde)
            </h3>
            <p className="text-slate-500 text-xs">
              I deficit inseriti vengono letti automaticamente dal Copilot AI NSCA
            </p>
          </div>
          <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-bold text-xs shrink-0">
            {deficitsList.length} Deficit
          </div>
        </div>

        {/* Preset Rapidi Deficit */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
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
                cls: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
              },
              { 
                label: '+ Deficit Forza Quadricipite LSI < 80%', 
                title: 'Deficit Forza Quadricipite LSI < 80%', 
                severity: 'Rosso', 
                description: 'Forza dinamometrica Iso Push con deficit dell\'arto operato.',
                actionPlan: 'Potenziamento selettivo concentrico/eccentrico su Leg Extension.',
                cls: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
              },
              { 
                label: '+ Valgo Dinamico in Atterraggio', 
                title: 'Valgo Dinamico in Atterraggio', 
                severity: 'Giallo', 
                description: 'Cedimento in valgo su atterraggio monopodalico a fine seduta.',
                actionPlan: 'Rinforzo medio gluteo + drills di feedback allo specchio.',
                cls: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              },
              { 
                label: '+ Kinesiofobia / Paura Re-infortunio', 
                title: 'Kinesiofobia / Paura Re-infortunio', 
                severity: 'Giallo', 
                description: 'Esitazione nei cambi di direzione ad alta velocità.',
                actionPlan: 'Desensibilizzazione con percorsi di agilità progressiva.',
                cls: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              },
              { 
                label: '+ Mobilità 0° Raggiunta', 
                title: 'Recupero Mobilità 0° Raggiunto', 
                severity: 'Verde', 
                description: 'Estensione completa paritaria 0° conseguita.',
                actionPlan: 'Mantenimento con mobilizzazioni attive di riscaldamento.',
                cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              },
              { 
                label: '+ Simmetria Salto LSI >= 90%', 
                title: 'Simmetria Salto Raggiunta LSI >= 90%', 
                severity: 'Verde', 
                description: 'LSI Salto monopodalico superato > 90%.',
                actionPlan: 'Transizione a pliometria ad alto impatto.',
                cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
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

        {/* Form Inserimento Deficit */}
        <form onSubmit={handleAddDeficit} className="space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
            <div className="md:col-span-7 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Titolo Deficit / Area di Lavoro *
              </label>
              <input
                type="text"
                value={deficitForm.title}
                onChange={(e) => setDeficitForm({ ...deficitForm, title: e.target.value })}
                placeholder="Es. Deficit Estensione Passiva (-3°)"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="md:col-span-5 space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Livello Criticità di Lavoro *
              </label>
              <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-300">
                {[
                  { id: 'Rosso', label: 'Rosso', cls: 'bg-rose-600 text-white font-bold' },
                  { id: 'Giallo', label: 'Giallo', cls: 'bg-amber-500 text-white font-bold' },
                  { id: 'Verde', label: 'Verde', cls: 'bg-emerald-600 text-white font-bold' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDeficitForm({ ...deficitForm, severity: opt.id })}
                    className={`flex-1 py-1.5 px-1.5 rounded-md text-xs font-bold transition-all cursor-pointer text-center ${
                      deficitForm.severity === opt.id
                        ? opt.cls
                        : 'text-slate-600 hover:bg-slate-100'
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
              <label className="block text-[11px] font-bold text-slate-700">
                Descrizione / Osservazione Clinica
              </label>
              <input
                type="text"
                value={deficitForm.description}
                onChange={(e) => setDeficitForm({ ...deficitForm, description: e.target.value })}
                placeholder="Dettagli sulla limitazione..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Piano di Azione / Raccomandazione
              </label>
              <input
                type="text"
                value={deficitForm.actionPlan}
                onChange={(e) => setDeficitForm({ ...deficitForm, actionPlan: e.target.value })}
                placeholder="Intervento riabilitativo mirato..."
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Inserisci Deficit Registrato</span>
          </button>
        </form>

        {/* Lista Card Deficit Salvati */}
        {deficitsList.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Deficit Registrati & Criticità ({deficitsList.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {deficitsList.map((def) => {
                const isRosso = def.severity === 'Rosso';
                const isGiallo = def.severity === 'Giallo';

                return (
                  <div
                    key={def.id}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-2 shadow-sm relative"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] tracking-wider uppercase text-center shrink-0 ${
                          isRosso 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : isGiallo 
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isRosso ? 'ALTA CRITICITÀ' : isGiallo ? 'MEDIA CRITICITÀ' : 'BASSA / RAGGIUNTO'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveDeficit(def.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4 className="text-slate-900 font-bold text-xs leading-snug">
                        {def.title}
                      </h4>

                      <p className="text-slate-600 text-[11px] leading-tight">
                        {def.description}
                      </p>

                      <p className="text-emerald-700 font-semibold text-[10.5px] pt-0.5">
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

      {/* BLOCCO 3: ESERCIZI E CARICHI VBT */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div>
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-slate-100 text-slate-600">
              <Dumbbell className="w-4 h-4" />
            </div>
            <h3 className="text-slate-900 font-bold text-sm">
              3. Prescrizione Esercizi e Carichi VBT (kg e m/s)
            </h3>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Seleziona e registra gli esercizi prescritti con i relativi kg e le velocità target m/s
          </p>
        </div>

        {/* Preset Esercizi Rapidi */}
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
          <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider">
            <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
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
                className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 font-bold text-[10.5px] transition-all cursor-pointer"
              >
                {pName}
              </button>
            ))}
          </div>
        </div>

        {/* Form Inserimento Esercizio */}
        <form onSubmit={handleAddExercise} className="space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Nome Esercizio *
              </label>
              <input
                type="text"
                value={exerciseForm.name}
                onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                placeholder="Es. Leg Extension Uni"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Carico (kg)
              </label>
              <input
                type="text"
                value={exerciseForm.weight}
                onChange={(e) => setExerciseForm({ ...exerciseForm, weight: e.target.value })}
                placeholder="Es. 45"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Velocità (m/s)
              </label>
              <input
                type="text"
                value={exerciseForm.vbtSpeed}
                onChange={(e) => setExerciseForm({ ...exerciseForm, vbtSpeed: e.target.value })}
                placeholder="Es. 0.8"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Serie x Reps
              </label>
              <input
                type="text"
                value={exerciseForm.setsReps}
                onChange={(e) => setExerciseForm({ ...exerciseForm, setsReps: e.target.value })}
                placeholder="Es. 4x8"
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-mono"
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
                className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-4">
              <button
                type="submit"
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Aggiungi Esercizio</span>
              </button>
            </div>
          </div>
        </form>

        {/* Cards Esercizi Registrati */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            ESERCIZI REGISTRATI PER LA SCHEDA ({exercisesList.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {exercisesList.map((ex) => (
              <div 
                key={ex.id}
                className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-2 shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-900 font-bold text-xs leading-tight">
                      {ex.name}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded font-mono">
                        {ex.setsReps}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(ex.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-500 text-[10.5px] leading-tight">
                    {ex.note}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100">
                  <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                      CARICO KG
                    </div>
                    <div className="text-slate-900 font-extrabold text-xs font-mono mt-0.5">
                      {ex.weight} <span className="text-[10px] font-normal text-slate-500">kg</span>
                    </div>
                  </div>

                  <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-center">
                    <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                      SPEED M/S
                    </div>
                    <div className="text-emerald-700 font-extrabold text-xs font-mono mt-0.5">
                      {ex.vbtSpeed} <span className="text-[10px] font-normal text-slate-500">m/s</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
