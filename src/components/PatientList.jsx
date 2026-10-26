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

  const activePatients = patients.filter(p => !p.is_deleted);
  const trashedPatients = patients.filter(p => p.is_deleted);
  const baseList = viewTrash ? trashedPatients : activePatients;

  const filtered = baseList.filter((p) => {
    const fullName = `${p.nome || ''} ${p.cognome || ''} ${p.chirurgo || ''}`.toLowerCase();
    const matchName = fullName.includes(search.toLowerCase());
    const matchSport = sportFilter === 'Tutti' || p.sport === sportFilter;
    return matchName && matchSport;
  });

  const sports = ['Tutti', ...new Set(activePatients.map(p => p.sport).filter(Boolean))];

  return (
    <div className="space-y-5 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {viewTrash ? 'Cestino Pazienti Archiviati' : 'Elenco Pazienti Riabilitazione LCA'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {viewTrash
              ? 'Ripristina un paziente in archivio attivo oppure eliminalo definitivamente'
              : 'Seleziona un paziente per accedere a Monitoraggio & Diario, Test & Valutazioni e Copilot AI'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewTrash(!viewTrash)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
              viewTrash
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 shadow-2xs'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Cestino ({trashedPatients.length})</span>
          </button>

          {!viewTrash && (
            <button
              onClick={onAddNewPatient}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuovo Paziente LCA</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome, cognome o chirurgo..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {sports.map(sp => (
              <button
                key={sp}
                onClick={() => setSportFilter(sp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  sportFilter === sp
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-mono uppercase text-slate-500">
                <th className="py-3.5 px-4 font-bold">Paziente</th>
                <th className="py-3.5 px-4 font-bold">Sport &amp; Livello</th>
                <th className="py-3.5 px-4 font-bold">Lesione / Innesto</th>
                <th className="py-3.5 px-4 font-bold">Data Intervento</th>
                <th className="py-3.5 px-4 font-bold">Fase Attuale</th>
                <th className="py-3.5 px-4 font-bold text-center">Ultimo LSI Quad</th>
                <th className="py-3.5 px-4 font-bold text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-xs">
              {filtered.map((p, idx) => {
                const sorted = sortTestsByDate(p.tests);
                const lsiQ = getLastValidMetricValue(sorted, ['lsiQuad', 'lsi_quad_calculated']);
                return (
                  <tr
                    key={p.id}
                    onClick={() => !viewTrash && onSelectPatient(p)}
                    className={`transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'
                    } ${!viewTrash ? 'hover:bg-emerald-50/30 cursor-pointer' : ''}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {p.nome} {p.cognome}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Chirurgo: {p.chirurgo || 'N/D'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{p.sport}</div>
                      <div className="text-[11px] text-slate-500">{p.ruolo_sportivo} • {p.livello}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-slate-800 font-semibold">
                        Lato {p.lato_lesione} • {p.tipo_innesto}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                      {p.data_intervento}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {formatPhaseDisplay(p.fase_attuale || p.fase_riabilitativa)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold">
                      {lsiQ !== null ? (
                        <span
                          className={`px-2.5 py-1 rounded-lg border ${
                            lsiQ >= 90
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : lsiQ >= 75
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {lsiQ}%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-sans text-[11px]">
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-all cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-all cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer"
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
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
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
                  <td colSpan={7} className="py-8 text-center text-slate-500">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl text-slate-900">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Eliminare Paziente?
                </h3>
                <p className="text-xs text-slate-500">
                  Paziente: <strong className="text-slate-900">{confirmDeletePatient.nome} {confirmDeletePatient.cognome}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Questa operazione rimuoverà il paziente e le relative rilevazioni dal database Supabase.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setConfirmDeletePatient(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
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
