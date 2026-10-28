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
      {/* Top Header Finestra ad Alto Contrasto */}
      <div className="bg-white p-5 rounded-xl border border-slate-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Clinica &amp; Riabilitazione LCA
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Barometro di progressione sulle 5 fasi riabilitative e stato clinico dei pazienti in carico
          </p>
        </div>

        <button
          onClick={onNavigateToPatients}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1736] hover:bg-[#142554] text-white font-bold text-xs shadow-sm transition-all cursor-pointer print:hidden"
        >
          <span>Gestisci Elenco Pazienti</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* BAROMETRO ORIZZONTALE DELLE 5 FASI RIABILITATIVE LCA (Sfumatura Pastello dal Rosso al Verde) */}
      <div className="bg-white p-5 rounded-xl border border-slate-300/80 shadow-sm space-y-3.5 break-inside-avoid">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1D63FE]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Barometro Fasi Riabilitative LCA ({patients.length} Pazienti in Carico)
            </h2>
          </div>

          {selectedPhaseFilter !== null ? (
            <button
              type="button"
              onClick={() => setSelectedPhaseFilter(null)}
              className="text-xs font-bold text-[#1D63FE] hover:underline cursor-pointer self-start sm:self-auto"
            >
              Mostra tutte le fasi ({patients.length})
            </button>
          ) : (
            <span className="text-xs text-slate-500 font-medium">
              Distribuzione pazienti lungo il continuum riabilitativo (Fase 1 → Fase 5)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {phaseCounts.map((phase) => {
            const isSelected = selectedPhaseFilter === phase.number;
            return (
              <div
                key={phase.id}
                onClick={() =>
                  setSelectedPhaseFilter((prev) => (prev === phase.number ? null : phase.number))
                }
                className={`${phase.barometerCls} p-4 rounded-xl shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-3 break-inside-avoid ${
                  isSelected ? 'ring-2 ring-slate-900/40 scale-[1.01]' : 'hover:opacity-95'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                      {phase.shortLabel} • {phase.name}
                    </span>
                    <Users className="w-3.5 h-3.5 opacity-75 shrink-0" />
                  </div>
                  <p className="text-[11px] font-semibold opacity-85 leading-snug">
                    {phase.subtitle}
                  </p>
                </div>

                <div className="pt-2 border-t border-current/15 flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono leading-none">
                    {phase.count}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide opacity-85">
                    {phase.count === 1 ? 'Paziente' : 'Pazienti'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STATO CLINICO PAZIENTI IN CARICO - SLIMMING CARDS PAZIENTI & ALTO CONTRASTO */}
      <div className="bg-white p-5 rounded-xl border border-slate-300/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#1D63FE]" />
            <span>Stato Clinico Pazienti in Carico</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Clicca su una scheda per aprire il profilo clinico completo del paziente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => {
            const phaseMeta = getPhaseMeta(patient);
            const phaseLabel = formatPhaseDisplay(patient.fase_attuale || patient.fase_riabilitativa);

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="bg-stone-50 hover:bg-white rounded-xl border border-slate-300/80 shadow-sm hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group break-inside-avoid"
              >
                {/* Parte superiore: SOLTANTO Nome Cognome in grassetto scuro + Badge Ginocchio Dx/Sx */}
                <div className="p-4 bg-white flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {patient.nome} {patient.cognome}
                  </h3>
                  <span className="bg-slate-100 text-slate-800 border border-slate-300/80 text-xs font-bold px-3 py-1 rounded-full shrink-0">
                    Ginocchio {patient.lato_lesione}
                  </span>
                </div>

                {/* Parte inferiore: Fase Attuale con sfumatura pastello corrispondente */}
                <div className="px-4 py-2.5 bg-stone-50 border-t border-slate-200/90 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg truncate ${phaseMeta.badgeCls}`}
                  >
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{phaseLabel}</span>
                  </span>

                  <span className="text-[#1D63FE] font-bold text-xs flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <span>Apri Scheda</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Safety Box */}
      <div className="bg-white p-4 rounded-xl border border-slate-300/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 break-inside-avoid">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#DCEBFE] text-[#1D63FE] shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Criterio Return to Sport (Grindem et al., BJSM)
            </h4>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Il superamento di LSI ≥ 90% su Quadricipite, Ischiocrurali e Hop Test riduce dell&apos;84% il rischio di re-infortunio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
