import React, { useState } from 'react';
import {
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  Users
} from 'lucide-react';
import {
  FIVE_LCA_PHASES,
  getPhaseNumber,
  getPhaseMeta,
  formatPhaseDisplay
} from '../utils/phaseUtils';

export default function Dashboard({ patients, onSelectPatient, onNavigateToPatients }) {
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState(null);

  // Calcolo conteggio pazienti per ciascuna delle 5 Fasi Riabilitative LCA
  const phaseCounts = FIVE_LCA_PHASES.map((phase) => {
    const count = patients.filter((p) => getPhaseNumber(p) === phase.number).length;
    return {
      ...phase,
      count
    };
  });

  const filteredPatients =
    selectedPhaseFilter !== null
      ? patients.filter((p) => getPhaseNumber(p) === selectedPhaseFilter)
      : patients;

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Header Card (Crisp White, rounded-3xl, ultra-bold typography) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Dashboard Clinica &amp; Riabilitazione LCA
        </h1>

        <button
          onClick={onNavigateToPatients}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer print:hidden"
        >
          <span>Gestisci Elenco Pazienti</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* BAROMETRO ORIZZONTALE DELLE 5 FASI RIABILITATIVE LCA */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-5 break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Barometro Fasi Riabilitative LCA ({patients.length} Pazienti in Carico)
            </h2>
          </div>

          {selectedPhaseFilter !== null ? (
            <button
              type="button"
              onClick={() => setSelectedPhaseFilter(null)}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-extrabold text-blue-700 transition-colors cursor-pointer self-start sm:self-auto"
            >
              Mostra tutte le fasi ({patients.length})
            </button>
          ) : (
            <span className="text-xs text-slate-700 font-bold">
              Distribuzione pazienti lungo il continuum riabilitativo (Fase 1 → Fase 5)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {phaseCounts.map((phase) => {
            const isSelected = selectedPhaseFilter === phase.number;
            return (
              <div
                key={phase.id}
                onClick={() =>
                  setSelectedPhaseFilter((prev) => (prev === phase.number ? null : phase.number))
                }
                className={`bg-white p-5 rounded-2xl border border-stone-200 ${phase.topBorderCls} shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between gap-4 break-inside-avoid ${
                  isSelected
                    ? 'ring-2 ring-blue-600 scale-[1.02]'
                    : 'hover:-translate-y-0.5 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${phase.pillCls}`}
                    >
                      {phase.shortLabel} • {phase.name}
                    </span>
                    <Users className="w-4 h-4 text-slate-500 shrink-0" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-snug pt-0.5">
                    {phase.subtitle}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-200 flex items-baseline justify-between">
                  <span
                    className={`text-4xl sm:text-5xl font-black font-mono leading-none tracking-tight ${phase.numberColorCls}`}
                  >
                    {phase.count}
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                    {phase.count === 1 ? 'Paziente' : 'Pazienti'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STATO CLINICO PAZIENTI IN CARICO - HIGH-CONTRAST ROUNDED-3XL CARDS */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Stato Clinico Pazienti in Carico
            </h2>
          </div>
          <span className="text-xs text-slate-700 font-bold">
            Clicca su una scheda per aprire il profilo clinico completo del paziente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const phaseMeta = getPhaseMeta(patient);
            const phaseLabel = formatPhaseDisplay(patient.fase_attuale || patient.fase_riabilitativa);
            const isRightSide = String(patient.lato_lesione || '').toLowerCase().includes('dx');

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="bg-white rounded-2xl border-2 border-stone-200 hover:border-blue-600 shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between overflow-hidden group break-inside-avoid"
              >
                {/* Parte superiore: Nome Cognome in grassetto pesante + Badge Ginocchio Dx/Sx */}
                <div className="p-5 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${phaseMeta.dotCls}`} />
                    <h3 className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {patient.nome} {patient.cognome}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-full shrink-0 border ${
                      isRightSide
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    Ginocchio {patient.lato_lesione}
                  </span>
                </div>

                {/* Parte inferiore: Fase Attuale con badge colorato ad alto contrasto */}
                <div className="px-5 py-3.5 bg-[#faf9f6] border-t border-stone-200 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-xl truncate ${phaseMeta.badgeCls}`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{phaseLabel}</span>
                  </span>

                  <span className="text-blue-600 font-extrabold text-xs flex items-center gap-1 shrink-0 group-hover:translate-x-1 transition-transform">
                    <span>Apri Scheda</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Safety Box */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 break-inside-avoid">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">
              Criterio Return to Sport (Grindem et al., BJSM)
            </h4>
            <p className="text-xs text-slate-700 font-bold mt-0.5">
              Il superamento di LSI ≥ 90% su Quadricipite, Ischiocrurali e Hop Test riduce dell&apos;84% il rischio di re-infortunio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
