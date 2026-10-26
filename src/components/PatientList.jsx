import React, { useState } from 'react';
import {
  Search,
  UserPlus,
  ArrowRight,
  Filter,
  Trash2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { formatPhaseDisplay } from '../utils/phaseUtils';
import { sortTestsByDate, getLastValidMetricValue } from '../utils/testUtils';

export default function PatientList({
  patients,
  onSelectPatient,
  onAddNewPatient,
  onDeletePatient,
  onRestorePatient,
  onPermanentDeletePatient
}) {
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('Tutti');
  const [viewTrash, setViewTrash] = useState(false);
  const [confirmDeletePatient, setConfirmDeletePatient] = useState(null);

  const activePatients = patients.filter((p) => !p.is_deleted);
  const trashedPatients = patients.filter((p) => p.is_deleted);
  const baseList = viewTrash ? trashedPatients : activePatients;

  const filtered = baseList.filter((p) => {
    const fullName = `${p.nome || ''} ${p.cognome || ''} ${p.chirurgo || ''}`.toLowerCase();
    const matchName = fullName.includes(search.toLowerCase());
    const matchSport = sportFilter === 'Tutti' || p.sport === sportFilter;
    return matchName && matchSport;
  });

  const sports = ['Tutti', ...new Set(activePatients.map((p) => p.sport).filter(Boolean))];

  return (
    <div className="space-y-5 text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            {viewTrash ? 'Cestino Pazienti Archiviati' : 'Elenco Pazienti Riabilitazione LCA'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {viewTrash
              ? 'Ripristina un paziente in archivio attivo oppure eliminalo definitivamente'
              : 'Seleziona un paziente per accedere a Monitoraggio & Diario, Test & Valutazioni e Copilot'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewTrash(!viewTrash)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
              viewTrash
                ? 'bg-rose-100/80 border-rose-300/50 text-rose-900'
                : 'bg-slate-50 border-slate-300/60 text-slate-700 hover:bg-slate-100 shadow-none'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Cestino ({trashedPatients.length})</span>
          </button>

          {!viewTrash && (
            <button
              onClick={onAddNewPatient}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100/80 hover:bg-emerald-200/70 text-emerald-900 border border-emerald-300/50 font-bold text-xs shadow-none transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuovo Paziente LCA</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-300/60 shadow-none flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome, cognome o chirurgo..."
            className="w-full bg-slate-100 border border-slate-300/60 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 font-medium placeholder-slate-500 focus:outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {sports.map((sp) => (
              <button
                key={sp}
                onClick={() => setSportFilter(sp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  sportFilter === sp
                    ? 'bg-sky-100/80 text-sky-900 border border-sky-300/50'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 border border-slate-300/60'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-50 rounded-xl border border-slate-300/60 shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300/60 bg-slate-100 text-[11px] font-mono uppercase text-slate-500">
                <th className="py-3.5 px-4 font-bold">Paziente</th>
                <th className="py-3.5 px-4 font-bold">Sport &amp; Livello</th>
                <th className="py-3.5 px-4 font-bold">Lesione / Innesto</th>
                <th className="py-3.5 px-4 font-bold">Data Intervento</th>
                <th className="py-3.5 px-4 font-bold">Fase Attuale</th>
                <th className="py-3.5 px-4 font-bold text-center">Ultimo LSI Quad</th>
                <th className="py-3.5 px-4 font-bold text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300/60 text-xs">
              {filtered.map((p, idx) => {
                const sorted = sortTestsByDate(p.tests);
                const lsiQ = getLastValidMetricValue(sorted, ['lsiQuad', 'lsi_quad_calculated']);
                return (
                  <tr
                    key={p.id}
                    onClick={() => !viewTrash && onSelectPatient(p)}
                    className={`transition-colors ${
                      idx % 2 === 0 ? 'bg-slate-50' : 'bg-slate-100/70'
                    } ${!viewTrash ? 'hover:bg-slate-200/50 cursor-pointer' : ''}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 text-sm">
                        {p.nome} {p.cognome}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Chirurgo: {p.chirurgo || 'N/D'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{p.sport}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{p.ruolo_sportivo} • {p.livello}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/70 border border-slate-300/60 font-mono text-slate-800 font-bold">
                        Lato {p.lato_lesione} • {p.tipo_innesto}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-bold">
                      {p.data_intervento}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100/80 text-emerald-900 border border-emerald-300/50">
                        {formatPhaseDisplay(p.fase_attuale || p.fase_riabilitativa)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {lsiQ !== null ? (
                        <span
                          className={`px-2.5 py-1 rounded-lg border ${
                            lsiQ >= 90
                              ? 'bg-emerald-100/80 text-emerald-900 border-emerald-300/50'
                              : lsiQ >= 75
                              ? 'bg-sky-100/80 text-sky-900 border-sky-300/50'
                              : 'bg-rose-100/80 text-rose-900 border-rose-300/50'
                          }`}
                        >
                          {lsiQ}%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-200/70 text-slate-500 font-sans text-[11px] font-medium">
                          Non testato
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {viewTrash ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onRestorePatient) onRestorePatient(p.id);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100/80 hover:bg-emerald-200/70 text-emerald-900 border border-emerald-300/50 font-bold text-xs transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Ripristina</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeletePatient({ ...p, permanent: true });
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-100/80 hover:bg-rose-200/70 text-rose-900 border border-rose-300/50 font-bold text-xs transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Elimina</span>
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPatient(p);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100/80 hover:bg-emerald-200/70 text-emerald-900 border border-emerald-300/50 font-bold text-xs shadow-none transition-all cursor-pointer"
                          >
                            <span>Apri</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeletePatient({ ...p, permanent: false });
                            }}
                            title="Elimina Paziente"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100/80 text-slate-500 hover:text-rose-900 border border-slate-300/60 hover:border-rose-300/50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-500 font-medium">
                    {viewTrash
                      ? 'Il cestino è vuoto.'
                      : 'Nessun paziente trovato con i filtri selezionati.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal di conferma eliminazione */}
      {confirmDeletePatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-stone-50 border border-stone-300/70 rounded-xl p-6 space-y-4 shadow-none text-stone-800">
            <div className="flex items-center gap-3 text-rose-800">
              <div className="p-2 rounded-xl bg-rose-900/10 border border-rose-300/50">
                <AlertTriangle className="w-4 h-4 text-rose-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-800 text-base">
                  Eliminare Paziente?
                </h3>
                <p className="text-xs text-stone-500 font-medium">
                  Paziente: <strong className="text-stone-800 font-semibold">{confirmDeletePatient.nome} {confirmDeletePatient.cognome}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 font-medium leading-relaxed">
              Questa operazione rimuoverà il paziente e le relative rilevazioni dal database Supabase.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-300/70">
              <button
                type="button"
                onClick={() => setConfirmDeletePatient(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/50 text-stone-800 border border-stone-300/70 text-xs font-semibold cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDeletePatient.permanent) {
                    if (onPermanentDeletePatient) onPermanentDeletePatient(confirmDeletePatient.id);
                  } else {
                    if (onDeletePatient) onDeletePatient(confirmDeletePatient.id);
                  }
                  setConfirmDeletePatient(null);
                }}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-stone-100 text-xs font-semibold flex items-center gap-1.5 shadow-none cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Conferma Eliminazione</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
