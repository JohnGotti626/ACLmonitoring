import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Award, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Activity, 
  Flame, 
  Sparkles,
  RotateCcw
} from 'lucide-react';

// DOMANDE STANDARD QUESTIONARIO IKDC SOGGETTIVO (MODULO CLINICO UNIFICATO IKDC-SKF)
export const IKDC_QUESTIONS = [
  // SEZIONE 1: SINTOMI
  {
    id: 'q1_max_activity_pain',
    section: '1. Sintomi',
    question: '1. Max attività senza dolore significativo:',
    type: 'single_choice',
    options: [
      { label: '[4] Molto intense (salti, cambi direzione, calcio)', points: 4 },
      { label: '[3] Intense (lavoro pesante, sci, tennis)', points: 3 },
      { label: '[2] Moderate (jogging, lavoro moderato)', points: 2 },
      { label: '[1] Leggere (camminare, faccende domestiche)', points: 1 },
      { label: '[0] Impossibilitato per dolore', points: 0 }
    ]
  },
  {
    id: 'q2_pain_freq',
    section: '1. Sintomi',
    question: '2. Frequenza del dolore nelle ultime 4 settimane:',
    type: 'scale_0_10',
    options: [
      { label: '10 - Mai (Nessun dolore)', points: 10 },
      { label: '9', points: 9 },
      { label: '8', points: 8 },
      { label: '7', points: 7 },
      { label: '6', points: 6 },
      { label: '5 - Moderato', points: 5 },
      { label: '4', points: 4 },
      { label: '3', points: 3 },
      { label: '2', points: 2 },
      { label: '1', points: 1 },
      { label: '0 - Costantemente (Sempre)', points: 0 }
    ]
  },
  {
    id: 'q3_pain_severity',
    section: '1. Sintomi',
    question: '3. Gravità del dolore nelle ultime 4 settimane:',
    type: 'scale_0_10',
    options: [
      { label: '10 - Nessun dolore', points: 10 },
      { label: '9', points: 9 },
      { label: '8', points: 8 },
      { label: '7', points: 7 },
      { label: '6', points: 6 },
      { label: '5 - Moderato', points: 5 },
      { label: '4', points: 4 },
      { label: '3', points: 3 },
      { label: '2', points: 2 },
      { label: '1', points: 1 },
      { label: '0 - Peggior dolore', points: 0 }
    ]
  },
  {
    id: 'q4_swelling',
    section: '1. Sintomi',
    question: '4. Gonfiore al ginocchio:',
    type: 'single_choice',
    options: [
      { label: '[4] Mai', points: 4 },
      { label: '[3] Solo dopo attività molto intense', points: 3 },
      { label: '[2] Dopo attività moderate', points: 2 },
      { label: '[1] Dopo attività leggere', points: 1 },
      { label: '[0] Costantemente / Sempre gonfio', points: 0 }
    ]
  },
  {
    id: 'q5_locking',
    section: '1. Sintomi',
    question: '5. Blocchi articolari o scatti improvvisi:',
    type: 'single_choice',
    options: [
      { label: '[1] No (Assenti / Nessun blocco)', points: 1 },
      { label: '[0] Sì (Presenti / Si blocca)', points: 0 }
    ]
  },
  {
    id: 'q6_giving_way',
    section: '1. Sintomi',
    question: '6. Max attività senza cedimento/instabilità:',
    type: 'single_choice',
    options: [
      { label: '[4] Molto intense (salti, cambi direzione)', points: 4 },
      { label: '[3] Intense (lavoro pesante, tennis)', points: 3 },
      { label: '[2] Moderate (jogging, corsa lineare)', points: 2 },
      { label: '[1] Leggere (camminare, scale)', points: 1 },
      { label: '[0] Cede anche nelle attività quotidiane', points: 0 }
    ]
  },

  // SEZIONE 2: ATTIVITÀ QUOTIDIANE E SPORTIVE
  {
    id: 'q7a_stairs_up',
    section: '2. Attività Quotidiane e Sportive',
    question: '7a. Salire le scale:',
    type: 'single_choice',
    options: [
      { label: 'Nessuna difficoltà (4 pt)', points: 4 },
      { label: 'Lieve difficoltà (3 pt)', points: 3 },
      { label: 'Moderata difficoltà (2 pt)', points: 2 },
      { label: 'Forte difficoltà (1 pt)', points: 1 },
      { label: 'Impossibile (0 pt)', points: 0 }
    ]
  },
  {
    id: 'q7b_stairs_down',
    section: '2. Attività Quotidiane e Sportive',
    question: '7b. Scendere le scale:',
    type: 'single_choice',
    options: [
      { label: 'Nessuna difficoltà (4 pt)', points: 4 },
      { label: 'Lieve difficoltà (3 pt)', points: 3 },
      { label: 'Moderata difficoltà (2 pt)', points: 2 },
      { label: 'Forte difficoltà (1 pt)', points: 1 },
      { label: 'Impossibile (0 pt)', points: 0 }
    ]
  },
  {
    id: 'q7c_squatting',
    section: '2. Attività Quotidiane e Sportive',
    question: '7c. Accovacciarsi / Piegarsi sulle ginocchia:',
    type: 'single_choice',
    options: [
      { label: 'Nessuna difficoltà (4 pt)', points: 4 },
      { label: 'Lieve difficoltà (3 pt)', points: 3 },
      { label: 'Moderata difficoltà (2 pt)', points: 2 },
      { label: 'Forte difficoltà (1 pt)', points: 1 },
      { label: 'Impossibile (0 pt)', points: 0 }
    ]
  },
  {
    id: 'q7d_kneeling',
    section: '2. Attività Quotidiane e Sportive',
    question: '7d. Inginocchiarsi:',
    type: 'single_choice',
    options: [
      { label: 'Nessuna difficoltà (4 pt)', points: 4 },
      { label: 'Lieve difficoltà (3 pt)', points: 3 },
      { label: 'Moderata difficoltà (2 pt)', points: 2 },
      { label: 'Forte difficoltà (1 pt)', points: 1 },
      { label: 'Impossibile (0 pt)', points: 0 }
    ]
  },
  {
    id: 'q7e_rising_chair',
    section: '2. Attività Quotidiane e Sportive',
    question: '7e. Rialzarsi da una sedia bassa:',
    type: 'single_choice',
    options: [
      { label: 'Nessuna difficoltà (4 pt)', points: 4 },
      { label: 'Lieve difficoltà (3 pt)', points: 3 },
      { label: 'Moderata difficoltà (2 pt)', points: 2 },
      { label: 'Forte difficoltà (1 pt)', points: 1 },
      { label: 'Impossibile (0 pt)', points: 0 }
    ]
  },
  {
    id: 'q7f_running_straight',
    section: '2. Attività Quotidiane e Sportive',
    question: '7f. Correre in linea retta:',
    type: 'single_choice',
    options: [
      { label: 'Nessuna difficoltà (4 pt)', points: 4 },
      { label: 'Lieve difficoltà (3 pt)', points: 3 },
      { label: 'Moderata difficoltà (2 pt)', points: 2 },
      { label: 'Forte difficoltà (1 pt)', points: 1 },
      { label: 'Impossibile (0 pt)', points: 0 }
    ]
  },
  {
    id: 'q7g_jumping',
    section: '2. Attività Quotidiane e Sportive',
    question: '7g. Saltare e ricadere sulla gamba lesionata:',
    type: 'single_choice',
    options: [
      { label: 'Nessuna difficoltà (4 pt)', points: 4 },
      { label: 'Lieve difficoltà (3 pt)', points: 3 },
      { label: 'Moderata difficoltà (2 pt)', points: 2 },
      { label: 'Forte difficoltà (1 pt)', points: 1 },
      { label: 'Impossibile (0 pt)', points: 0 }
    ]
  },
  {
    id: 'q7h_pivoting',
    section: '2. Attività Quotidiane e Sportive',
    question: '7h. Cambiare direzione bruscamente (pivoting):',
    type: 'single_choice',
    options: [
      { label: 'Nessuna difficoltà (4 pt)', points: 4 },
      { label: 'Lieve difficoltà (3 pt)', points: 3 },
      { label: 'Moderata difficoltà (2 pt)', points: 2 },
      { label: 'Forte difficoltà (1 pt)', points: 1 },
      { label: 'Impossibile (0 pt)', points: 0 }
    ]
  },

  // SEZIONE 3: FUNZIONE GENERALE DEL GINOCCHIO
  {
    id: 'q8_overall_function',
    section: '3. Funzione Generale del Ginocchio',
    question: '8. Valuta la funzione attuale del tuo ginocchio (da 0 a 10):',
    type: 'scale_0_10',
    options: [
      { label: '10 - Normale e perfetta', points: 10 },
      { label: '9', points: 9 },
      { label: '8', points: 8 },
      { label: '7', points: 7 },
      { label: '6', points: 6 },
      { label: '5', points: 5 },
      { label: '4', points: 4 },
      { label: '3', points: 3 },
      { label: '2', points: 2 },
      { label: '1', points: 1 },
      { label: '0 - Incapacità totale', points: 0 }
    ]
  }
];

// FUNZIONE ALGORITMO UFFICIALE CALCOLO SCORE IKDC (0-100)
export function calculateIKDCScore(answers) {
  const answeredKeys = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== null);
  const totalQuestions = IKDC_QUESTIONS.length;
  const answeredCount = answeredKeys.length;

  // Validazione: almeno 12 su 15 domande devono essere compilate
  const isValid = answeredCount >= 12;

  let totalPointsObtained = 0;
  let maxTheoreticalPoints = 0;

  IKDC_QUESTIONS.forEach(q => {
    const selectedOptionIndex = answers[q.id];
    if (selectedOptionIndex !== undefined && selectedOptionIndex !== null) {
      const option = q.options[selectedOptionIndex];
      if (option) {
        totalPointsObtained += option.points;
        const maxPointsForQuestion = Math.max(...q.options.map(o => o.points));
        maxTheoreticalPoints += maxPointsForQuestion;
      }
    }
  });

  if (!isValid || maxTheoreticalPoints === 0) {
    return {
      isValid: false,
      answeredCount,
      totalQuestions,
      minRequired: 12,
      score: 0,
      classification: 'Incompleto'
    };
  }

  // Formula Ufficiale IKDC: (Punti Ottenuti / Max Teorico) * 100
  const rawScore = (totalPointsObtained / maxTheoreticalPoints) * 100;
  const ikdcScore = Number(rawScore.toFixed(1));

  let classification = 'Scarso';
  let classColor = 'text-red-400';
  let badgeBg = 'bg-red-950/80 border-red-500/50 text-red-300';

  if (ikdcScore >= 90) {
    classification = 'Eccellente (RTS Ready)';
    classColor = 'text-emerald-400';
    badgeBg = 'bg-emerald-950/80 border-[#39FF14]/50 text-[#39FF14]';
  } else if (ikdcScore >= 75) {
    classification = 'Buono (Fase Avanzata)';
    classColor = 'text-cyan-400';
    badgeBg = 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300';
  } else if (ikdcScore >= 60) {
    classification = 'Discreto (Fase Intermedia)';
    classColor = 'text-amber-400';
    badgeBg = 'bg-amber-950/80 border-amber-500/50 text-amber-300';
  }

  return {
    isValid: true,
    answeredCount,
    totalQuestions,
    minRequired: 12,
    score: ikdcScore,
    totalPointsObtained: Number(totalPointsObtained.toFixed(1)),
    maxTheoreticalPoints: Number(maxTheoreticalPoints.toFixed(1)),
    classification,
    classColor,
    badgeBg
  };
}

export default function ModalIKDC({ isOpen, onClose, patient, onSaveIKDC }) {
  if (!isOpen || !patient) return null;

  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0); // 0, 1, 2 (per le 3 sezioni)
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState(null);

  // Raggruppamento per sezioni trasposte dal modulo clinico unificato
  const sections = ['1. Sintomi', '2. Attività Quotidiane e Sportive', '3. Funzione Generale del Ginocchio'];
  const currentSectionName = sections[currentStep];
  const sectionQuestions = IKDC_QUESTIONS.filter(q => q.section === currentSectionName);

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const answeredTotal = Object.keys(answers).length;
  const progressPct = Math.round((answeredTotal / IKDC_QUESTIONS.length) * 100);

  const handleCalculateScore = () => {
    const res = calculateIKDCScore(answers);
    setResult(res);
    setIsCompleted(true);
  };

  const handleSaveResult = () => {
    if (!result || !result.isValid) return;

    const ikdcEvaluationObject = {
      patient_id: patient.id,
      patientId: patient.id,
      type: 'IKDC',
      label: `Questionario IKDC (${new Date().toLocaleDateString('it-IT')})`,
      date: new Date().toLocaleDateString('it-IT'),
      data_valutazione: new Date().toISOString().split('T')[0],
      ikdc_score: result.score,
      ikdc: result.score,
      classification: result.classification,
      raw_answers: answers
    };

    console.log("Salvataggio Test IKDC:", ikdcEvaluationObject);

    if (onSaveIKDC) {
      onSaveIKDC(ikdcEvaluationObject);
    }
    onClose();
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentStep(0);
    setIsCompleted(false);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0b1329] border border-slate-700/90 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl my-auto max-h-[94vh] overflow-y-auto font-sans">
        
        {/* HEADER MODALE IKDC IPAD */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/30 border border-[#39FF14]/50 flex items-center justify-center shrink-0 shadow-lg shadow-[#39FF14]/10">
              <FileText className="w-6 h-6 text-[#39FF14]" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight flex items-center gap-2">
                Questionario IKDC Soggettivo Digitale
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  iPad Touch Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Paziente: <strong className="text-white">{patient.nome} {patient.cognome}</strong> | Valutazione Ginocchio
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isCompleted ? (
          <>
            {/* PROGRESS BAR TOUCH SU IPAD */}
            <div className="space-y-2 p-4 bg-slate-950/80 rounded-2xl border border-slate-800/90">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#39FF14]" />
                  Avanzamento Compilazione: <strong className="text-[#39FF14]">{answeredTotal} / {IKDC_QUESTIONS.length} Risposte</strong>
                </span>
                <span className="font-mono font-black text-cyan-400">{progressPct}%</span>
              </div>

              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-[#39FF14] rounded-full transition-all duration-300 shadow-sm shadow-[#39FF14]/30"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {/* TABS SEZIONI IPAD */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {sections.map((secName, idx) => {
                  const secQuestions = IKDC_QUESTIONS.filter(q => q.section === secName);
                  const answeredSec = secQuestions.filter(q => answers[q.id] !== undefined).length;
                  const isSecComplete = answeredSec === secQuestions.length;

                  return (
                    <button
                      key={secName}
                      onClick={() => setCurrentStep(idx)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        currentStep === idx 
                          ? 'bg-gradient-to-r from-emerald-950 to-teal-950 border-[#39FF14] shadow-md shadow-[#39FF14]/10' 
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black tracking-tight ${currentStep === idx ? 'text-white' : 'text-slate-400'}`}>
                          {idx + 1}. {secName}
                        </span>
                        {isSecComplete ? (
                          <CheckCircle2 className="w-4 h-4 text-[#39FF14] shrink-0" />
                        ) : (
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {answeredSec}/{secQuestions.length}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LISTA DOMANDE SEZIONE CORRENTE (OTTIMIZZATE TOUCH PER IPAD) */}
            <div className="space-y-6 py-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-extrabold text-[#39FF14] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Sezione {currentStep + 1}: {currentSectionName}
                </h4>
                <span className="text-xs text-slate-400 font-mono">Tocca per selezionare la risposta</span>
              </div>

              <div className="space-y-5">
                {sectionQuestions.map((q) => {
                  const selectedIdx = answers[q.id];

                  return (
                    <div key={q.id} className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3 shadow-lg">
                      <p className="text-xs sm:text-sm font-black text-white leading-snug">
                        {q.question}
                      </p>

                      {/* OPZIONI DI RISPOSTA - CARD AMPIE ED EVIDENTI IPAD TOUCH */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedIdx === optIdx;

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleSelectOption(q.id, optIdx)}
                              className={`p-3.5 sm:p-4 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between text-xs sm:text-xs font-bold leading-relaxed active:scale-[0.99] ${
                                isSelected
                                  ? 'bg-gradient-to-r from-emerald-950 via-teal-900 to-cyan-950 border-[#39FF14] text-white shadow-lg shadow-[#39FF14]/20 ring-1 ring-[#39FF14]'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <span className="pr-2">{opt.label}</span>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-[#39FF14] bg-[#39FF14] text-slate-950' : 'border-slate-700 bg-slate-950'
                              }`}>
                                {isSelected && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CONTROLLI DI NAVIGAZIONE STEP SU IPAD */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-5 py-3 rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 text-xs font-extrabold transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sezione Precedente</span>
              </button>

              {currentStep < sections.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <span>Prossima Sezione</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCalculateScore}
                  className="px-7 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-[#39FF14] hover:from-emerald-400 hover:to-[#39FF14] text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-xl shadow-[#39FF14]/20 transition-all cursor-pointer uppercase tracking-wider"
                >
                  <Award className="w-4 h-4 text-slate-950" />
                  <span>Invia e Calcola Score IKDC</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* SCHERMATA FINALE DI RIEPILOGO & CALCOLO SCORE IKDC */
          <div className="space-y-6 py-4 text-center">
            
            {result?.isValid ? (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/90 border border-[#39FF14]/40 space-y-6 shadow-2xl max-w-xl mx-auto">
                <div className="inline-flex p-3 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/40 shadow-inner">
                  <Award className="w-10 h-10 text-[#39FF14]" />
                </div>

                <div>
                  <span className="text-xs font-black uppercase text-slate-400 tracking-widest block">
                    Punteggio Finale Calcolato (Formula Ufficiale IKDC)
                  </span>
                  <div className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tight mt-2 flex items-center justify-center gap-1">
                    <span className="text-[#39FF14]">{result.score}</span>
                    <span className="text-2xl text-slate-500 font-normal">/ 100</span>
                  </div>
                </div>

                {/* CLASSIFICAZIONE CLINICA */}
                <div className={`p-4 rounded-2xl border font-bold text-xs ${result.badgeBg}`}>
                  <span className="block uppercase text-[10px] tracking-wider text-slate-400 mb-0.5">
                    Classificazione Funzionale
                  </span>
                  <span className="text-sm font-extrabold">{result.classification}</span>
                </div>

                {/* BARRA VISIVA DELLO SCORE */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 font-bold">
                    <span>Punti Ottenuti: {result.totalPointsObtained} / {result.maxTheoreticalPoints} pt</span>
                    <span>{result.score}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#39FF14] rounded-full transition-all duration-700 shadow-md shadow-[#39FF14]/40"
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reimposta</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveResult}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-[#39FF14] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-[#39FF14]/30 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Conferma e Salva nel Profilo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-red-950/60 border border-red-500/50 space-y-4 max-w-lg mx-auto">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Questionario Incompleto</h4>
                <p className="text-xs text-red-200 leading-relaxed">
                  Per garantire la validità scientifica del questionario IKDC Soggettivo, è necessario rispondere ad almeno <strong>12 su 15 domande</strong>.
                  Hai risposto a {result?.answeredCount || 0} domande.
                </p>
                <button
                  type="button"
                  onClick={() => setIsCompleted(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                >
                  Torna alle domande
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
