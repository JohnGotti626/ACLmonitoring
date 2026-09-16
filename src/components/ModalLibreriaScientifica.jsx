import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Edit3,
  Sliders
} from 'lucide-react';

const DEFAULT_BIBLIO_SOURCES = [
  {
    id: 'ref-1',
    doi: '10.1007/s40279-019-01103-x',
    autori: 'Buckthorpe et al.',
    anno: '2019',
    titolo: 'Optimising Quadriceps Recovery After ACL Reconstruction',
    journal: 'Sports Medicine',
    metricaAssociata: 'LSI Quadricipite',
    sogliaCutoff: '≥ 90%'
  },
  {
    id: 'ref-2',
    doi: '10.1136/bjsports-2016-096274',
    autori: 'Grindem et al.',
    anno: '2016',
    titolo: 'Simple decision rules reduce re-injury risk after ACL reconstruction',
    journal: 'British Journal of Sports Medicine',
    metricaAssociata: 'LSI Quadricipite',
    sogliaCutoff: '≥ 90%'
  },
  {
    id: 'ref-3',
    doi: '10.1136/bjsports-2017-098474',
    autori: 'Rambaud et al.',
    anno: '2018',
    titolo: 'Criteria for Return to Running After ACL Reconstruction',
    journal: 'British Journal of Sports Medicine',
    metricaAssociata: 'Single Hop LSI',
    sogliaCutoff: '≥ 85%'
  },
  {
    id: 'ref-4',
    doi: '10.1519/JSC.0000000000004410',
    autori: 'Ebbs et al.',
    anno: '2023',
    titolo: 'Reactive Strength Index Modified & Tendon Stiffness in Post-ACLR',
    journal: 'Journal of Strength and Conditioning Research',
    metricaAssociata: 'RSImod (Drop Jump / CMJ)',
    sogliaCutoff: '> 1.50 idx'
  },
  {
    id: 'ref-5',
    doi: '10.1177/0363546520938760',
    autori: 'Read et al.',
    anno: '2020',
    titolo: 'Eccentric Braking Impulse Asymmetry and Landing Mechanics',
    journal: 'American Journal of Sports Medicine',
    metricaAssociata: 'Asimmetria Impulso Frenata',
    sogliaCutoff: '< 10%'
  },
  {
    id: 'ref-6',
    doi: '10.1136/bjsports-2016-096017',
    autori: 'Kyritsis et al.',
    anno: '2016',
    titolo: 'Likelihood of ACL graft rupture after return to sport',
    journal: 'British Journal of Sports Medicine',
    metricaAssociata: 'H:Q Ratio Isocinetico',
    sogliaCutoff: '≥ 0.60'
  }
];

export default function ModalLibreriaScientifica({ isOpen, onClose, onSaveLibrary }) {
  const [sources, setSources] = useState(DEFAULT_BIBLIO_SOURCES);

  // Form State Fonte
  const [doiInput, setDoiInput] = useState('');
  const [isFetchingDoi, setIsFetchingDoi] = useState(false);
  const [doiFetchError, setDoiFetchError] = useState('');
  const [doiFetchSuccess, setDoiFetchSuccess] = useState(false);

  const [formSource, setFormSource] = useState({
    id: null,
    doi: '',
    autori: '',
    anno: '',
    titolo: '',
    journal: '',
    metricaAssociata: 'LSI Quadricipite',
    sogliaCutoff: '≥ 90%'
  });

  if (!isOpen) return null;

  // ---------------------------------------------------------------------------
  // 1. AUTO-FETCH METADATI DA DOI (CrossRef API)
  // ---------------------------------------------------------------------------
  const handleFetchDoi = async () => {
    setDoiFetchError('');
    setDoiFetchSuccess(false);

    const rawDoi = doiInput.trim();
    if (!rawDoi) {
      setDoiFetchError('Inserisci un DOI valido (es. 10.1136/bjsports-2016-096274)');
      return;
    }

    // Pulisci stringa DOI da prefissi URL
    const cleanDoi = rawDoi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:/i, '');

    setIsFetchingDoi(true);

    try {
      const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}`);
      if (!response.ok) {
        throw new Error(`Articolo non trovato su CrossRef (${response.status})`);
      }

      const json = await response.json();
      const work = json?.message;

      if (!work) {
        throw new Error('Metadati non disponibili per questo DOI.');
      }

      // Estrai Titolo Articolo
      const title = work.title && work.title.length > 0 ? work.title[0] : '';

      // Estrai Rivista (Journal)
      const journal = work['container-title'] && work['container-title'].length > 0 ? work['container-title'][0] : '';

      // Estrai Anno
      let year = '';
      const dateParts = work['published-print']?.['date-parts'] || work.issued?.['date-parts'] || work.created?.['date-parts'];
      if (dateParts && dateParts[0] && dateParts[0][0]) {
        year = String(dateParts[0][0]);
      }

      // Estrai Autori formattati ("Buckthorpe et al." o "Buckthorpe & Grindem")
      let authorShort = '';
      if (work.author && Array.isArray(work.author) && work.author.length > 0) {
        const firstAuthor = work.author[0].family || work.author[0].name || 'Autore';
        if (work.author.length === 1) {
          authorShort = `${firstAuthor} et al.`;
        } else if (work.author.length === 2) {
          const secondAuthor = work.author[1].family || work.author[1].name || '';
          authorShort = `${firstAuthor} & ${secondAuthor}`;
        } else {
          authorShort = `${firstAuthor} et al.`;
        }
      }

      setFormSource(prev => ({
        ...prev,
        doi: cleanDoi,
        autori: authorShort || prev.autori,
        anno: year || prev.anno,
        titolo: title || prev.titolo,
        journal: journal || prev.journal
      }));

      setDoiFetchSuccess(true);
      setTimeout(() => setDoiFetchSuccess(false), 3000);
    } catch (err) {
      console.warn('Errore CrossRef API DOI:', err);
      setDoiFetchError(err.message || 'Errore durante l\'importazione da CrossRef. Compila manualmente i campi.');
    } finally {
      setIsFetchingDoi(false);
    }
  };

  const handleAddOrUpdateSource = (e) => {
    if (e) e.preventDefault();
    if (!formSource.autori.trim() || !formSource.titolo.trim()) {
      setDoiFetchError('Compila almeno gli Autori e il Titolo dell\'articolo.');
      return;
    }

    if (formSource.id) {
      // Aggiorna esistente
      const updated = sources.map(s => s.id === formSource.id ? { ...formSource } : s);
      setSources(updated);
      if (onSaveLibrary) onSaveLibrary(updated);
    } else {
      // Nuovo inserimento
      const newSrc = {
        ...formSource,
        id: `ref-${Date.now()}`
      };
      const updated = [newSrc, ...sources];
      setSources(updated);
      if (onSaveLibrary) onSaveLibrary(updated);
    }

    // Reset Form
    setFormSource({
      id: null,
      doi: '',
      autori: '',
      anno: '',
      titolo: '',
      journal: '',
      metricaAssociata: 'LSI Quadricipite',
      sogliaCutoff: '≥ 90%'
    });
    setDoiInput('');
  };

  const handleEditSource = (src) => {
    setFormSource({ ...src });
    setDoiInput(src.doi || '');
  };

  const handleRemoveSource = (id) => {
    const updated = sources.filter(s => s.id !== id);
    setSources(updated);
    if (onSaveLibrary) onSaveLibrary(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-sans">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER MODALE */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Gestione Libreria Scientifica & DOI (CrossRef API)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40 font-mono">
                  Auto-Fetch DOI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inserisci il DOI per auto-compilare i metadati oppure compila manualmente i dati della fonte.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY MODALE */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-slate-900 text-slate-200 text-xs">
          
          {/* ========================================================================= */}
          {/* 1. SEZIONE AUTO-FETCH DOI DA CROSSREF */}
          {/* ========================================================================= */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>1. Auto-Fetch Metadati da DOI Article (CrossRef Free API)</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">Es: 10.1136/bjsports-2016-096274</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={doiInput}
                onChange={(e) => setDoiInput(e.target.value)}
                placeholder="Inserisci DOI (es. 10.1136/bjsports-2016-096274 o URL doi.org)..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />

              <button
                type="button"
                onClick={handleFetchDoi}
                disabled={isFetchingDoi}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isFetchingDoi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Connessione a CrossRef...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>🔍 Importa Dati da DOI</span>
                  </>
                )}
              </button>
            </div>

            {/* Notification Feedback Fetch */}
            {doiFetchSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Metadati recuperati con successo da CrossRef! I campi sottostanti sono stati pre-compilati.</span>
              </div>
            )}

            {doiFetchError && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{doiFetchError}</span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 2. FORM COMPILAZIONE MANUALE (FALLBACK & CUSTOM) + MAPPATURA CLINICA */}
          {/* ========================================================================= */}
          <form onSubmit={handleAddOrUpdateSource} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>2. Dati Articolo Scientifico & Mappatura Clinica</span>
              {formSource.id && (
                <span className="text-[10px] text-amber-400 font-mono">Modifica Fonte Esistente</span>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4 space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Autori (es. Buckthorpe et al.) *</label>
                <input
                  type="text"
                  required
                  value={formSource.autori}
                  onChange={(e) => setFormSource({ ...formSource, autori: e.target.value })}
                  placeholder="Es. Buckthorpe et al."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Anno *</label>
                <input
                  type="text"
                  required
                  value={formSource.anno}
                  onChange={(e) => setFormSource({ ...formSource, anno: e.target.value })}
                  placeholder="Es. 2019"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-center"
                />
              </div>

              <div className="sm:col-span-6 space-y-1">
                <label className="block text-[11px] font-bold text-slate-300">Nome Rivista (Journal)</label>
                <input
                  type="text"
                  value={formSource.journal}
                  onChange={(e) => setFormSource({ ...formSource, journal: e.target.value })}
                  placeholder="Es. Sports Medicine / Br J Sports Med"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-300">Titolo dell'Articolo *</label>
              <input
                type="text"
                required
                value={formSource.titolo}
                onChange={(e) => setFormSource({ ...formSource, titolo: e.target.value })}
                placeholder="Es. Optimising Quadriceps Recovery After ACL Reconstruction"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* MAPPATURA CLINICA RAPIDA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-cyan-400">Metrica Clinica Associata *</label>
                <select
                  value={formSource.metricaAssociata}
                  onChange={(e) => setFormSource({ ...formSource, metricaAssociata: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-lg p-2 focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <option value="LSI Quadricipite">LSI Quadricipite (Forza Iso Push Ext)</option>
                  <option value="RSImod (Drop Jump / CMJ)">RSImod & Stiffness Tendinea</option>
                  <option value="Asimmetria Impulso Frenata">Asimmetria Impulso Frenata Eccentrica</option>
                  <option value="H:Q Ratio Isocinetico">H:Q Ratio (Agonista/Antagonista)</option>
                  <option value="Single Hop LSI">Single Hop LSI & Test Pliometrici</option>
                  <option value="Punteggio Questionario IKDC">Questionario IKDC / ACL-RSI</option>
                  <option value="Deficit ROM & AMI">ROM 0° Estensione & Controllo AMI</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-emerald-400">Soglia / Cut-off Target RTS *</label>
                <input
                  type="text"
                  value={formSource.sogliaCutoff}
                  onChange={(e) => setFormSource({ ...formSource, sogliaCutoff: e.target.value })}
                  placeholder="Es. ≥ 90% o > 1.50 idx"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {formSource.id && (
                <button
                  type="button"
                  onClick={() => {
                    setFormSource({
                      id: null,
                      doi: '',
                      autori: '',
                      anno: '',
                      titolo: '',
                      journal: '',
                      metricaAssociata: 'LSI Quadricipite',
                      sogliaCutoff: '≥ 90%'
                    });
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg font-bold"
                >
                  Annulla Modifica
                </button>
              )}

              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{formSource.id ? 'Salva Modifiche Fonte' : '+ Aggiungi Fonte a Libreria'}</span>
              </button>
            </div>
          </form>

          {/* ========================================================================= */}
          {/* 3. ELENCO FONTI IN LIBRERIA SCIENTIFICA ({sources.length}) */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-300 uppercase tracking-wider pb-1 border-b border-slate-800">
              <span>Fonti Inserite in Libreria ({sources.length})</span>
              <span className="text-[10.5px] text-cyan-400 font-mono">Disponibili per Report & Copilot</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <strong className="text-white font-extrabold text-xs leading-tight block">
                        {src.autori} ({src.anno})
                      </strong>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditSource(src)}
                          className="p-1 text-slate-400 hover:text-cyan-300 rounded"
                          title="Modifica fonte"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSource(src.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          title="Rimuovi fonte"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-300 text-[11px] italic font-medium leading-snug">
                      "{src.titolo}"
                    </p>

                    <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400">
                      <span>{src.journal}</span>
                      {src.doi && (
                        <a
                          href={`https://doi.org/${src.doi}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-400 hover:underline font-mono inline-flex items-center gap-0.5"
                        >
                          <span>doi:{src.doi}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Badges Mappatura Clinica */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                      {src.metricaAssociata}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-black">
                      Target: {src.sogliaCutoff}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* FOOTER MODALE */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">
            {sources.length} fonti bibliografiche sincronizzate con CrossRef API
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
          >
            Conferma e Salva Libreria
          </button>
        </div>

      </div>
    </div>
  );
}
