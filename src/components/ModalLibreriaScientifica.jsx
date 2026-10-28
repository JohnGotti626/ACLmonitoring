import React, { useState, useEffect } from 'react';
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
  Sliders,
  RotateCcw,
  Save,
  FileText,
  ShieldCheck,
  Sparkles,
  Layers
} from 'lucide-react';
import { FIVE_LCA_PHASES } from '../utils/phaseUtils';

export const DEFAULT_BIBLIO_SOURCES = [
  {
    id: 'ref-1',
    citationKey: 'lsiQuad',
    doi: '10.1007/s40279-019-01103-x',
    autori: 'Buckthorpe et al.',
    anno: '2019',
    titolo: 'Optimising Quadriceps Recovery After ACL Reconstruction',
    journal: 'Sports Medicine',
    metricaAssociata: 'Knee Extension Seated / LSI Quadricipite',
    sogliaCutoff: '≥ 90%',
    rationale: 'Il recupero della simmetria del quadricipite (LSI ≥ 90%) riduce fino al 75% il rischio di re-infortunio sul legamento crociato o sul ginocchio controlaterale.'
  },
  {
    id: 'ref-2',
    citationKey: 'lsiFlex',
    doi: '10.1136/bjsports-2016-096017',
    autori: 'Kyritsis et al.',
    anno: '2016',
    titolo: 'Likelihood of ACL graft rupture after return to sport',
    journal: 'British Journal of Sports Medicine',
    metricaAssociata: 'Knee Flexion Prone / H:Q Ratio',
    sogliaCutoff: 'LSI ≥ 90% | H:Q ≥ 0.60',
    rationale: 'Flessori simmetrici garantiscono la stabilizzazione dinamica posteriore della tibia e contrastano la traslazione anteriore nelle accelerazioni e virate.'
  },
  {
    id: 'ref-3',
    citationKey: 'lsiBrakingImpulse',
    doi: '10.1177/0363546520938760',
    autori: 'Read et al.',
    anno: '2020',
    titolo: 'Eccentric Braking Impulse Asymmetry and Landing Mechanics Post-ACL Reconstruction',
    journal: 'American Journal of Sports Medicine',
    metricaAssociata: 'Drop Jump Landing Force & Braking Impulse',
    sogliaCutoff: 'Asym < 10%',
    rationale: 'L\'asimmetria nell\'impulso di frenata eccentrica rivela deficit di assorbimento del carico in atterraggio monopodalico non rilevabili dai soli test isometrici.'
  },
  {
    id: 'ref-4',
    citationKey: 'slCmjHeight',
    doi: '10.1136/bjsports-2020-103613',
    autori: 'Kotsifaki et al.',
    anno: '2021',
    titolo: 'Single-Leg Vertical Jump Biomechanics Post-ACL Reconstruction',
    journal: 'British Journal of Sports Medicine',
    metricaAssociata: 'Single Leg Jump Height & Concentric Impulse',
    sogliaCutoff: 'LSI ≥ 90%',
    rationale: 'Il CMJ monopodalico isola la capacità di produzione di potenza verticale triple-extension dell\'arto operato eliminando i compensi dell\'arto sano.'
  },
  {
    id: 'ref-5',
    citationKey: 'djRsi',
    doi: '10.1519/JSC.0000000000004410',
    autori: 'Ebbs et al. / Lloyd et al.',
    anno: '2023',
    titolo: 'Reactive Strength Index Modified & Tendon Stiffness in Post-ACLR Athletes',
    journal: 'Journal of Strength and Conditioning Research',
    metricaAssociata: 'Single Leg Drop Jump RSI & GCT',
    sogliaCutoff: 'RSI > 1.50 | GCT < 250 ms',
    rationale: 'Rileva la rigidezza muscolo-tendinea (stiffness) e la tolleranza al ciclo allungamento-accorciamento (SSC rapido < 250ms), precondizione per l\'agilità agonistica.'
  },
  {
    id: 'ref-6',
    citationKey: 'cmjRsiMod',
    doi: '10.1123/ijspp.2014-0085',
    autori: 'Gathercole et al.',
    anno: '2015',
    titolo: 'Alternative Countermovement Jump Variables to Monitor Neuromuscular Fatigue',
    journal: 'Int J Sports Physiol Perform',
    metricaAssociata: 'Countermovement Jump RSI-modified',
    sogliaCutoff: '≥ 0.45 m/s',
    rationale: 'Il RSImod da CMJ monitora la fatica neuromuscolare e la dinamica temporale di spinta senza compensi nel tempo di contrazione.'
  },
  {
    id: 'ref-7',
    citationKey: 'peakPower',
    doi: '10.2165/11537690-000000000-00000',
    autori: 'Cormie et al.',
    anno: '2011',
    titolo: 'Developing Maximal Neuromuscular Power: Part 1 and 2',
    journal: 'Sports Medicine',
    metricaAssociata: 'CMJ Max Peak Power (W & W/kg)',
    sogliaCutoff: '≥ 50 W/kg',
    rationale: 'La potenza di picco normalizzata su massa corporea (W/kg) quantifica l\'esplosività neuromuscolare complessiva al decollo.'
  },
  {
    id: 'ref-8',
    citationKey: 'imtpForce',
    doi: '10.1007/s40279-019-01063-3',
    autori: 'Comfort et al.',
    anno: '2019',
    titolo: 'Standardizing the Isometric Mid-Thigh Pull: A Systematic Review',
    journal: 'Sports Medicine',
    metricaAssociata: 'Isometric Mid-Thigh Pull (IMTP)',
    sogliaCutoff: '≥ 35 N/kg | Asym < 10%',
    rationale: 'L\'IMTP valuta la massima forza verticale sviluppabile isometricamente su tutta la catena estensoria degli arti inferiori.'
  },
  {
    id: 'ref-9',
    citationKey: 'lsiSingleHop',
    doi: '10.1136/bjsports-2016-096274',
    autori: 'Grindem et al.',
    anno: '2016',
    titolo: 'Simple decision rules reduce re-injury risk after ACL reconstruction',
    journal: 'British Journal of Sports Medicine',
    metricaAssociata: 'Single Hop for Distance LSI',
    sogliaCutoff: '≥ 90%',
    rationale: 'Il salto singolo in avanti misura la capacità di proiezione orizzontale e controllo in decelerazione monopodale immediata.'
  },
  {
    id: 'ref-10',
    citationKey: 'ikdcScore',
    doi: '10.1177/03635465010290051301',
    autori: 'Irrgang et al.',
    anno: '2001',
    titolo: 'Development and Validation of the International Knee Documentation Committee Subjective Knee Form',
    journal: 'American Journal of Sports Medicine',
    metricaAssociata: 'Punteggio IKDC & PROMs',
    sogliaCutoff: '≥ 90/100',
    rationale: 'Gold-standard per la quantificazione della percezione di stabilità, dolore e funzionalità quotidiana/sportiva riferita dal paziente.'
  }
];

export const RTS_CLINICAL_GUIDELINES = [
  {
    phaseNum: 1,
    phaseTitle: 'Fase 1 • Early Stage (0-6 Settimane)',
    lsiQuadTarget: '≥ 60%',
    lsiHamTarget: '≥ 65%',
    asymBrakingTarget: '≤ 25%',
    rsiTarget: '≥ 0.80 idx',
    clinicalCriteria: 'Estensione completa 0°, assenza di versamento (Sweep test 0/1+), riattivazione VMO contro inibizione artrogenica (AMI) e carico bipodalico simmetrico.',
    referenceAuthors: 'Buckthorpe et al. (2019)'
  },
  {
    phaseNum: 2,
    phaseTitle: 'Fase 2 • Mid Stage (6-12 Settimane)',
    lsiQuadTarget: '≥ 70%',
    lsiHamTarget: '≥ 75%',
    asymBrakingTarget: '≤ 20%',
    rsiTarget: '≥ 1.00 idx',
    clinicalCriteria: 'Forza base in catena cinetica chiusa e aperta, controllo del valgismo dinamico in Single-Leg Squat e atterraggio bipodalico/monopodalico controllato.',
    referenceAuthors: 'Read et al. (2020) • Comfort et al. (2019)'
  },
  {
    phaseNum: 3,
    phaseTitle: 'Fase 3 • Return to Run (3-5 Mesi)',
    lsiQuadTarget: '≥ 80%',
    lsiHamTarget: '≥ 80%',
    asymBrakingTarget: '≤ 15%',
    rsiTarget: '≥ 1.25 idx',
    clinicalCriteria: 'Idoneità alla corsa lineare: LSI Quad ≥ 80%, assenza di dolore/gonfiore post-carico a 24h, capacità di assorbimento eccentrico e introduzione SSC lento.',
    referenceAuthors: 'Kotsifaki et al. (2021) • Gathercole et al. (2015)'
  },
  {
    phaseNum: 4,
    phaseTitle: 'Fase 4 • Late Stage & CODs (5-7 Mesi)',
    lsiQuadTarget: '≥ 85%',
    lsiHamTarget: '≥ 85%',
    asymBrakingTarget: '≤ 12%',
    rsiTarget: '≥ 1.40 idx',
    clinicalCriteria: 'Cambi di direzione (COD) pianificati e reattivi, pliometria rapida (GCT < 250ms), H:Q Ratio ≥ 0.60 e simmetria di frenata eccentrica in decelerazione.',
    referenceAuthors: 'Kyritsis et al. (2016) • Ebbs et al. (2023)'
  },
  {
    phaseNum: 5,
    phaseTitle: 'Fase 5 • Return to Sport & Performance (>7-9 Mesi)',
    lsiQuadTarget: '≥ 90%',
    lsiHamTarget: '≥ 90%',
    asymBrakingTarget: '< 10%',
    rsiTarget: '≥ 1.50 idx',
    clinicalCriteria: 'Tutti i test isometrici e di salto con LSI ≥ 90%, ACL-RSI & IKDC ≥ 90/100, picco di potenza ≥ 50 W/kg e riatletizzazione sport-specifica completata.',
    referenceAuthors: 'Grindem et al. (2016) • Irrgang et al. (2001)'
  }
];

export function getActiveBiblioSources() {
  try {
    const saved = localStorage.getItem('acl_biblio_sources_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_BIBLIO_SOURCES;
}

/**
 * VISTA DEDICATA "BIBLIOGRAFIA DI RIFERIMENTO" (Accessibile dal menu laterale)
 */
export function BibliografiaView() {
  const [sources, setSources] = useState(() => getActiveBiblioSources());
  const [searchQuery, setSearchQuery] = useState('');
  const [doiInput, setDoiInput] = useState('');
  const [isFetchingDoi, setIsFetchingDoi] = useState(false);
  const [doiFetchError, setDoiFetchError] = useState('');
  const [doiFetchSuccess, setDoiFetchSuccess] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formSource, setFormSource] = useState({
    id: null,
    citationKey: 'lsiQuad',
    doi: '',
    autori: '',
    anno: '',
    titolo: '',
    journal: '',
    metricaAssociata: 'Knee Extension Seated / LSI Quadricipite',
    sogliaCutoff: '≥ 90%',
    rationale: ''
  });

  const persistSources = (updatedList) => {
    setSources(updatedList);
    try {
      localStorage.setItem('acl_biblio_sources_v2', JSON.stringify(updatedList));
    } catch (err) {
      console.warn(err);
    }
  };

  const handleFetchDoi = async () => {
    setDoiFetchError('');
    setDoiFetchSuccess(false);

    const rawDoi = doiInput.trim();
    if (!rawDoi) {
      setDoiFetchError('Inserisci un DOI valido (es. 10.1136/bjsports-2016-096274)');
      return;
    }

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

      const title = work.title && work.title.length > 0 ? work.title[0] : '';
      const journal = work['container-title'] && work['container-title'].length > 0 ? work['container-title'][0] : '';

      let year = '';
      const dateParts = work['published-print']?.['date-parts'] || work.issued?.['date-parts'] || work.created?.['date-parts'];
      if (dateParts && dateParts[0] && dateParts[0][0]) {
        year = String(dateParts[0][0]);
      }

      let authorShort = '';
      if (work.author && Array.isArray(work.author) && work.author.length > 0) {
        const firstAuthor = work.author[0].family || work.author[0].name || 'Autore';
        if (work.author.length === 1) {
          authorShort = `${firstAuthor}`;
        } else if (work.author.length === 2) {
          const secondAuthor = work.author[1].family || work.author[1].name || '';
          authorShort = `${firstAuthor} & ${secondAuthor}`;
        } else {
          authorShort = `${firstAuthor} et al.`;
        }
      }

      setFormSource((prev) => ({
        ...prev,
        doi: cleanDoi,
        autori: authorShort || prev.autori,
        anno: year || prev.anno,
        titolo: title || prev.titolo,
        journal: journal || prev.journal,
        rationale:
          prev.rationale ||
          `Evidenza scientifica (${authorShort || 'Studio'}, ${year || 'RTS'}) utilizzata dal Copilot per il monitoraggio biomeccanico LCA.`
      }));
      setDoiFetchSuccess(true);
    } catch (err) {
      setDoiFetchError(err.message || 'Errore durante il recupero metadati dal DOI.');
    } finally {
      setIsFetchingDoi(false);
    }
  };

  const handleSaveSource = (e) => {
    e.preventDefault();
    if (!formSource.autori || !formSource.titolo) return;

    let updatedList;
    if (formSource.id) {
      updatedList = sources.map((item) => (item.id === formSource.id ? { ...formSource } : item));
    } else {
      const newEntry = {
        ...formSource,
        id: `ref-${Date.now()}`
      };
      updatedList = [newEntry, ...sources];
    }

    persistSources(updatedList);
    setFormSource({
      id: null,
      citationKey: 'lsiQuad',
      doi: '',
      autori: '',
      anno: '',
      titolo: '',
      journal: '',
      metricaAssociata: 'Knee Extension Seated / LSI Quadricipite',
      sogliaCutoff: '≥ 90%',
      rationale: ''
    });
    setDoiInput('');
    setDoiFetchSuccess(false);
    setShowAddForm(false);
  };

  const handleInlineRationaleChange = (id, newRationale) => {
    const updated = sources.map((item) =>
      item.id === id ? { ...item, rationale: newRationale } : item
    );
    persistSources(updated);
  };

  const handleResetDefaults = () => {
    persistSources(DEFAULT_BIBLIO_SOURCES);
  };

  const filteredSources = sources.filter((src) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      src.autori?.toLowerCase().includes(q) ||
      src.titolo?.toLowerCase().includes(q) ||
      src.metricaAssociata?.toLowerCase().includes(q) ||
      src.journal?.toLowerCase().includes(q) ||
      src.rationale?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header Finestra Bibliografia di Riferimento */}
      <div className="bg-white p-5 rounded-xl border border-slate-300/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#DCEBFE] text-[#1D63FE] border border-[#C5DCFA] text-[10px] font-mono uppercase font-bold">
              Knowledge Base &amp; Linee Guida RTS
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-300/60 text-[10px] font-mono uppercase font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Sincronizzata in Background con Copilot</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Bibliografia di Riferimento &amp; Criteri Clinici Return to Sport
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            Linee guida internazionali, soglie di cut-off biomeccaniche e letteratura scientifica utilizzata dal motore Copilot per le prescrizioni nella scheda paziente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="px-4 py-2 rounded-xl bg-[#0B1736] hover:bg-[#142554] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Chiudi Inserimento Fonte' : 'Aggiungi Studio / DOI'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-stone-50 hover:bg-slate-100 text-slate-700 border border-slate-300/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Ripristina la bibliografia predefinita"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ripristina Default</span>
          </button>
        </div>
      </div>

      {/* Form opzionale per aggiunta nuova fonte via DOI CrossRef */}
      {showAddForm && (
        <div className="bg-white p-5 rounded-xl border border-slate-300/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#1D63FE]" />
              <span>Importazione Rapida Studio Scientifico tramite DOI (CrossRef)</span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={doiInput}
              onChange={(e) => setDoiInput(e.target.value)}
              placeholder="Incolla DOI (es. 10.1136/bjsports-2016-096274)"
              className="flex-1 bg-stone-50 border border-slate-300/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#1D63FE]"
            />
            <button
              type="button"
              onClick={handleFetchDoi}
              disabled={isFetchingDoi}
              className="px-4 py-2 bg-[#1D63FE] hover:bg-[#1652D8] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              {isFetchingDoi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Estrai Metadati DOI</span>
            </button>
          </div>

          {doiFetchError && (
            <div className="p-2.5 rounded-lg bg-rose-100/80 border border-rose-300/60 text-rose-900 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{doiFetchError}</span>
            </div>
          )}

          {doiFetchSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-100/80 border border-emerald-300/60 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Metadati estratti da CrossRef. Verifica i campi e salva per aggiornare il Copilot.</span>
            </div>
          )}

          <form onSubmit={handleSaveSource} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Autori</label>
              <input
                type="text"
                required
                value={formSource.autori}
                onChange={(e) => setFormSource({ ...formSource, autori: e.target.value })}
                placeholder="es. Grindem et al."
                className="w-full bg-stone-50 border border-slate-300/80 rounded-lg p-2 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Anno</label>
              <input
                type="text"
                required
                value={formSource.anno}
                onChange={(e) => setFormSource({ ...formSource, anno: e.target.value })}
                placeholder="2016"
                className="w-full bg-stone-50 border border-slate-300/80 rounded-lg p-2 text-slate-900 font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Rivista (Journal)</label>
              <input
                type="text"
                value={formSource.journal}
                onChange={(e) => setFormSource({ ...formSource, journal: e.target.value })}
                placeholder="British Journal of Sports Medicine"
                className="w-full bg-stone-50 border border-slate-300/80 rounded-lg p-2 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Dominio Copilot Associato</label>
              <select
                value={formSource.citationKey}
                onChange={(e) => setFormSource({ ...formSource, citationKey: e.target.value })}
                className="w-full bg-stone-50 border border-slate-300/80 rounded-lg p-2 text-slate-900 font-bold"
              >
                <option value="lsiQuad">Forza Estensoria Quadricipite (lsiQuad)</option>
                <option value="lsiFlex">Flessori &amp; H:Q Ratio (lsiFlex)</option>
                <option value="lsiBrakingImpulse">Frenata Eccentrica &amp; Landing (lsiBrakingImpulse)</option>
                <option value="djRsi">Drop Jump RSI &amp; Stiffness (djRsi)</option>
                <option value="slCmjHeight">Single-Leg CMJ (slCmjHeight)</option>
                <option value="cmjRsiMod">CMJ RSI-modified (cmjRsiMod)</option>
                <option value="peakPower">CMJ Peak Power (peakPower)</option>
                <option value="imtpForce">IMTP Forza Isometrica (imtpForce)</option>
                <option value="lsiSingleHop">Single Hop for Distance (lsiSingleHop)</option>
                <option value="ikdcScore">IKDC &amp; PROMs (ikdcScore)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-600 font-bold mb-1">Titolo Studio</label>
              <input
                type="text"
                required
                value={formSource.titolo}
                onChange={(e) => setFormSource({ ...formSource, titolo: e.target.value })}
                placeholder="Titolo completo della pubblicazione"
                className="w-full bg-stone-50 border border-slate-300/80 rounded-lg p-2 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Metrica Associata</label>
              <input
                type="text"
                value={formSource.metricaAssociata}
                onChange={(e) => setFormSource({ ...formSource, metricaAssociata: e.target.value })}
                className="w-full bg-stone-50 border border-slate-300/80 rounded-lg p-2 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-bold mb-1">Soglia Cut-Off RTS</label>
              <input
                type="text"
                value={formSource.sogliaCutoff}
                onChange={(e) => setFormSource({ ...formSource, sogliaCutoff: e.target.value })}
                className="w-full bg-stone-50 border border-slate-300/80 rounded-lg p-2 text-slate-900 font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-slate-600 font-bold mb-1">
                Rationale Clinico &amp; Indicazione per il Copilot
              </label>
              <textarea
                rows={2}
                value={formSource.rationale}
                onChange={(e) => setFormSource({ ...formSource, rationale: e.target.value })}
                className="w-full bg-stone-50 border border-slate-300/80 rounded-lg p-2 text-slate-900 font-medium"
              />
            </div>
            <div className="sm:col-span-4 flex justify-end gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salva nella Bibliografia Clinica</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEZIONE 1: MATRICE DEI CRITERI CLINICI & LINEE GUIDA RTS SULLE 5 FASI */}
      <div className="bg-white p-5 rounded-xl border border-slate-300/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1D63FE]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Criteri Clinici &amp; Soglie di Progressione per le 5 Fasi Riabilitative LCA
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Parametri utilizzati dal motore Copilot per il calcolo del Readiness Score
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {RTS_CLINICAL_GUIDELINES.map((guide) => {
            const phaseStyle =
              FIVE_LCA_PHASES.find((p) => p.number === guide.phaseNum) || FIVE_LCA_PHASES[2];
            return (
              <div
                key={guide.phaseNum}
                className="bg-stone-50 rounded-xl border border-slate-300/80 shadow-sm p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <span
                    className={`inline-block text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-lg ${phaseStyle.badgeCls}`}
                  >
                    {guide.phaseTitle}
                  </span>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">LSI Quad</span>
                      <strong className="text-slate-900">{guide.lsiQuadTarget}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">LSI Flex</span>
                      <strong className="text-slate-900">{guide.lsiHamTarget}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Asym Frenata</span>
                      <strong className="text-slate-900">{guide.asymBrakingTarget}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <span className="text-slate-500 block text-[10px]">Target RSI</span>
                      <strong className="text-slate-900">{guide.rsiTarget}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {guide.clinicalCriteria}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200 text-[10px] font-mono font-bold text-slate-500">
                  Ref: {guide.referenceAuthors}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEZIONE 2: LETTERATURA SCIENTIFICA PEER-REVIEWED & RATIONALE CLINICO */}
      <div className="bg-white p-5 rounded-xl border border-slate-300/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1D63FE]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Evidenze Scientifiche Peer-Reviewed &amp; Rationale Clinici ({filteredSources.length})
            </h2>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca autore, metrica o rivista..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-50 border border-slate-300/80 text-xs text-slate-900 focus:outline-none focus:border-[#1D63FE]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSources.map((src, idx) => (
            <div
              key={src.id}
              className="bg-stone-50 rounded-xl border border-slate-300/80 shadow-sm p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {src.autori} ({src.anno})
                    </span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCEBFE] text-[#1D63FE] border border-[#C5DCFA]">
                      {src.metricaAssociata}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100/80 text-emerald-900 border border-emerald-300/60 shrink-0">
                    Cut-off: {src.sogliaCutoff}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                  {src.titolo}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="italic">{src.journal}</span>
                  {src.doi && (
                    <a
                      href={`https://doi.org/${src.doi}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1D63FE] hover:underline font-mono font-bold inline-flex items-center gap-1"
                    >
                      <span>DOI: {src.doi}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/90 space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Rationale Clinico (Sincronizzato con Copilot &amp; Report):
                </label>
                <textarea
                  rows={2}
                  value={src.rationale || ''}
                  onChange={(e) => handleInlineRationaleChange(src.id, e.target.value)}
                  className="w-full bg-white border border-slate-300/80 rounded-lg p-2 text-xs text-slate-800 font-medium leading-relaxed focus:outline-none focus:border-[#1D63FE]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ModalLibreriaScientifica({
  isOpen,
  onClose,
  citationsMap = {},
  onUpdateCitation,
  onResetCitations,
  sources: externalSources,
  onSaveLibrary
}) {
  const [activeTab, setActiveTab] = useState('rationale_cards'); // 'rationale_cards' | 'archivio_doi'
  const [sources, setSources] = useState(() => {
    if (externalSources && externalSources.length > 0) return externalSources;
    return getActiveBiblioSources();
  });

  // Form State Fonte
  const [doiInput, setDoiInput] = useState('');
  const [isFetchingDoi, setIsFetchingDoi] = useState(false);
  const [doiFetchError, setDoiFetchError] = useState('');
  const [doiFetchSuccess, setDoiFetchSuccess] = useState(false);

  const [formSource, setFormSource] = useState({
    id: null,
    citationKey: 'lsiQuad',
    doi: '',
    autori: '',
    anno: '',
    titolo: '',
    journal: '',
    metricaAssociata: 'Knee Extension Seated / LSI Quadricipite',
    sogliaCutoff: '≥ 90%',
    rationale: ''
  });

  useEffect(() => {
    if (externalSources && externalSources.length > 0) {
      setSources(externalSources);
    }
  }, [externalSources]);

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

      const title = work.title && work.title.length > 0 ? work.title[0] : '';
      const journal = work['container-title'] && work['container-title'].length > 0 ? work['container-title'][0] : '';

      let year = '';
      const dateParts = work['published-print']?.['date-parts'] || work.issued?.['date-parts'] || work.created?.['date-parts'];
      if (dateParts && dateParts[0] && dateParts[0][0]) {
        year = String(dateParts[0][0]);
      }

      let authorShort = '';
      if (work.author && Array.isArray(work.author) && work.author.length > 0) {
        const firstAuthor = work.author[0].family || work.author[0].name || 'Autore';
        if (work.author.length === 1) {
          authorShort = `${firstAuthor}`;
        } else if (work.author.length === 2) {
          const secondAuthor = work.author[1].family || work.author[1].name || '';
          authorShort = `${firstAuthor} & ${secondAuthor}`;
        } else {
          authorShort = `${firstAuthor} et al.`;
        }
      }

      setFormSource((prev) => ({
        ...prev,
        doi: cleanDoi,
        autori: authorShort || prev.autori,
        anno: year || prev.anno,
        titolo: title || prev.titolo,
        journal: journal || prev.journal,
        rationale: prev.rationale || `Evidenza scientifica (${authorShort || 'Studio'}, ${year || 'RTS'}) a supporto del monitoraggio biomeccanico per ridurre il rischio di re-infortunio.`
      }));

      setDoiFetchSuccess(true);
    } catch (err) {
      setDoiFetchError(err.message || 'Errore durante il recupero metadati dal DOI.');
    } finally {
      setIsFetchingDoi(false);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. SALVATAGGIO / MODIFICA FONTE IN ARCHIVIO + SYNC CON RATIONALE CARD
  // ---------------------------------------------------------------------------
  const handleSaveSource = (e) => {
    e.preventDefault();
    if (!formSource.autori || !formSource.titolo) return;

    let updatedList;
    if (formSource.id) {
      updatedList = sources.map((item) => (item.id === formSource.id ? { ...formSource } : item));
    } else {
      const newEntry = {
        ...formSource,
        id: `ref-${Date.now()}`
      };
      updatedList = [newEntry, ...sources];
    }

    setSources(updatedList);
    try {
      localStorage.setItem('acl_biblio_sources_v2', JSON.stringify(updatedList));
    } catch (err) {
      console.warn(err);
    }

    // Se la fonte è associata a una citationKey del report, aggiorna anche la card del report!
    if (formSource.citationKey && onUpdateCitation) {
      onUpdateCitation(formSource.citationKey, {
        authors: `${formSource.autori}${formSource.anno ? `, ${formSource.anno}` : ''}`,
        journal: formSource.journal || 'Peer-Reviewed Journal',
        title: formSource.titolo,
        rationale: formSource.rationale
      });
    }

    if (onSaveLibrary) {
      onSaveLibrary(updatedList);
    }

    setFormSource({
      id: null,
      citationKey: 'lsiQuad',
      doi: '',
      autori: '',
      anno: '',
      titolo: '',
      journal: '',
      metricaAssociata: 'Knee Extension Seated / LSI Quadricipite',
      sogliaCutoff: '≥ 90%',
      rationale: ''
    });
    setDoiInput('');
    setDoiFetchSuccess(false);
  };

  const handleEditSource = (src) => {
    setFormSource({
      ...src,
      citationKey: src.citationKey || 'lsiQuad',
      rationale: src.rationale || ''
    });
    setDoiInput(src.doi || '');
    setDoiFetchError('');
    setDoiFetchSuccess(false);
    setActiveTab('archivio_doi');
  };

  const handleDeleteSource = (id) => {
    const updated = sources.filter((item) => item.id !== id);
    setSources(updated);
    try {
      localStorage.setItem('acl_biblio_sources_v2', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
    if (onSaveLibrary) onSaveLibrary(updated);
  };

  const handleInlineSourceRationaleChange = (src, newRationale) => {
    const updated = sources.map((item) =>
      item.id === src.id ? { ...item, rationale: newRationale } : item
    );
    setSources(updated);
    try {
      localStorage.setItem('acl_biblio_sources_v2', JSON.stringify(updated));
    } catch (err) {
      console.warn(err);
    }
    if (src.citationKey && onUpdateCitation) {
      onUpdateCitation(src.citationKey, { rationale: newRationale });
    }
    if (onSaveLibrary) onSaveLibrary(updated);
  };

  const citationEntries = Object.values(citationsMap || {});

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto no-print font-sans">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Libreria Fonti Scientifiche &amp; Rationale Clinico Modificabile</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono">
                  Live Sync con Report A4
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Personalizza la motivazione clinica (Rationale) e i riferimenti bibliografici stampati sotto ogni scheda metrica del Report VALD / ForceDecks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onResetCitations && (
              <button
                type="button"
                onClick={onResetCitations}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                title="Ripristina i Rationale predefiniti"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ripristina Default</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/70 border-b border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('rationale_cards')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rationale_cards'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Rationale Schede Report (Modifica Rapida Testi Stampa)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('archivio_doi')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'archivio_doi'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>2. Ricerca Automatica DOI CrossRef &amp; Archivio Bibliografico ({sources.length})</span>
          </button>
        </div>

        {/* MODAL CONTENT */}
        {activeTab === 'rationale_cards' ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900">
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
              <div className="text-xs text-slate-200">
                <strong className="text-cyan-400 font-extrabold uppercase tracking-wider block mb-0.5">
                  Personalizzazione Libera del Rationale Clinico per il Paziente / Medico
                </strong>
                Ogni modifica effettuata nei campi sottostanti aggiorna in tempo reale il riquadro <em>Scientific Reference &amp; Rationale</em> posto in calce alle rispettive schede nel Report A4.
              </div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 shrink-0">
                Salvataggio Automatico Attivo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {citationEntries.map((cit) => (
                <div
                  key={cit.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-extrabold text-cyan-400 uppercase tracking-wide">
                        {cit.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        ID: {cit.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Autori &amp; Anno
                        </label>
                        <input
                          type="text"
                          value={cit.authors || ''}
                          onChange={(e) =>
                            onUpdateCitation &&
                            onUpdateCitation(cit.id, { authors: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-semibold focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Rivista Scientifica (Journal)
                        </label>
                        <input
                          type="text"
                          value={cit.journal || ''}
                          onChange={(e) =>
                            onUpdateCitation &&
                            onUpdateCitation(cit.id, { journal: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white font-semibold focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Rationale Clinico (Spiegazione stampata nella Card A4)
                      </label>
                      <textarea
                        rows={3}
                        value={cit.rationale || ''}
                        onChange={(e) =>
                          onUpdateCitation &&
                          onUpdateCitation(cit.id, { rationale: e.target.value })
                        }
                        placeholder="Inserisci la motivazione clinica o il commento scientifico per questa metrica..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 leading-relaxed focus:border-cyan-500 focus:outline-none resize-y"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate italic max-w-[75%]">{cit.title}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Sincronizzato
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* COLONNA SINISTRA: RICERCA DOI & FORM INSERIMENTO (5 Colonne) */}
            <div className="lg:col-span-5 p-6 bg-slate-900 border-r border-slate-800 overflow-y-auto space-y-5">
              {/* BOX RICERCA AUTOMATICA DOI */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3 shadow-inner">
                <label className="block text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" />
                  <span>1. Ricerca Automatica tramite DOI (CrossRef API)</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={doiInput}
                    onChange={(e) => setDoiInput(e.target.value)}
                    placeholder="Incolla DOI (es. 10.1136/bjsports-2016-096274)"
                    className="flex-1 bg-slate-900 text-white text-xs font-mono border border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={handleFetchDoi}
                    disabled={isFetchingDoi}
                    className="px-3.5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    {isFetchingDoi ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Estrai Dati</span>
                  </button>
                </div>

                {doiFetchError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{doiFetchError}</span>
                  </div>
                )}

                {doiFetchSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Metadati estratti con successo da CrossRef! Personalizza il Rationale qui sotto.</span>
                  </div>
                )}
              </div>

              {/* FORM COMPILAZIONE / ASSOCIAZIONE CLINICA & RATIONALE */}
              <form onSubmit={handleSaveSource} className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      {formSource.id ? 'Modifica Fonte & Rationale' : '2. Dettagli Fonte & Rationale Clinico'}
                    </span>
                  </span>
                  {formSource.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormSource({
                          id: null,
                          citationKey: 'lsiQuad',
                          doi: '',
                          autori: '',
                          anno: '',
                          titolo: '',
                          journal: '',
                          metricaAssociata: 'Knee Extension Seated / LSI Quadricipite',
                          sogliaCutoff: '≥ 90%',
                          rationale: ''
                        })
                      }
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Annulla Modifica
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="col-span-2">
                    <label className="block text-slate-400 font-semibold mb-1">Autori (Citazione Breve)</label>
                    <input
                      type="text"
                      required
                      value={formSource.autori}
                      onChange={(e) => setFormSource({ ...formSource, autori: e.target.value })}
                      placeholder="es. Buckthorpe et al."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Anno</label>
                    <input
                      type="text"
                      required
                      value={formSource.anno}
                      onChange={(e) => setFormSource({ ...formSource, anno: e.target.value })}
                      placeholder="2019"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Titolo Studio Scientifico</label>
                  <input
                    type="text"
                    required
                    value={formSource.titolo}
                    onChange={(e) => setFormSource({ ...formSource, titolo: e.target.value })}
                    placeholder="Titolo completo della pubblicazione"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Rivista Scientifica (Journal)</label>
                    <input
                      type="text"
                      value={formSource.journal}
                      onChange={(e) => setFormSource({ ...formSource, journal: e.target.value })}
                      placeholder="es. British Journal of Sports Medicine"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Scheda Report Associata</label>
                    <select
                      value={formSource.citationKey || 'lsiQuad'}
                      onChange={(e) => setFormSource({ ...formSource, citationKey: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-bold focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="lsiQuad">Knee Extension Seated (Quad)</option>
                      <option value="lsiFlex">Knee Flexion Prone (Flex)</option>
                      <option value="djRsi">Single Leg Drop Jump RSI</option>
                      <option value="lsiBrakingImpulse">Drop Jump Landing / Braking Asym</option>
                      <option value="slCmjHeight">Single Leg Jump (CMJ SL)</option>
                      <option value="cmjRsiMod">CMJ RSI-modified</option>
                      <option value="peakPower">CMJ Peak Power</option>
                      <option value="imtpForce">Isometric Mid-Thigh Pull (IMTP)</option>
                      <option value="lsiSingleHop">Single Hop for Distance</option>
                      <option value="ikdcScore">Punteggio IKDC</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-cyan-400 font-extrabold mb-1">
                    Rationale Clinico (Spiegazione modificabile per il Report)
                  </label>
                  <textarea
                    rows={3}
                    value={formSource.rationale}
                    onChange={(e) => setFormSource({ ...formSource, rationale: e.target.value })}
                    placeholder="Descrivi in modo chiaro perché questa metrica è importante per il paziente..."
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg p-2 text-white leading-relaxed focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {formSource.id ? 'Aggiorna Fonte & Sincronizza Report' : 'Salva Fonte & Aggiorna Report'}
                  </span>
                </button>
              </form>
            </div>

            {/* COLONNA DESTRA: ELENCO VOCI IN ARCHIVIO CON RATIONALE MODIFICABILE INLINE (7 Colonne) */}
            <div className="lg:col-span-7 p-6 bg-slate-950 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Voci Bibliografiche &amp; Rationale Attivi</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono text-[11px]">
                    {sources.length} Studi
                  </span>
                </h4>
              </div>

              <div className="space-y-3">
                {sources.map((src, index) => (
                  <div
                    key={src.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            [{index + 1}]
                          </span>
                          <span className="text-xs font-extrabold text-white">
                            {src.autori} ({src.anno})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                            {src.metricaAssociata}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-bold">
                            Target: {src.sogliaCutoff}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 font-medium leading-snug">{src.titolo}</p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="italic text-slate-400">{src.journal}</span>
                          {src.doi && (
                            <a
                              href={`https://doi.org/${src.doi}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-400 hover:underline font-mono flex items-center gap-1"
                            >
                              <span>DOI: {src.doi}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditSource(src)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                          title="Modifica nel form"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSource(src.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Rimuovi fonte"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* RATIONALE MODIFICABILE DIRETTAMENTE INLINE */}
                    <div className="pt-1.5 border-t border-slate-800/80">
                      <label className="block text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider mb-1">
                        Rationale Clinico (Modificabile direttamente):
                      </label>
                      <textarea
                        rows={2}
                        value={src.rationale || ''}
                        onChange={(e) => handleInlineSourceRationaleChange(src, e.target.value)}
                        placeholder="Inserisci il Rationale clinico associato a questa fonte..."
                        className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-xs text-slate-200 leading-relaxed focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FOOTER MODAL */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Le modifiche ai Rationale e alle fonti vengono applicate istantaneamente al Report A4 prima della stampa.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-extrabold rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Applica e Torna al Report A4</span>
          </button>
        </div>

      </div>
    </div>
  );
}
