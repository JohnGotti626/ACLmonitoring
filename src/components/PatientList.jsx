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
import { getPhaseMeta } from '../utils/phaseUtils';

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
    const fullName = `${p.nome || ''} ${p.cognome || ''}`.toLowerCase();
    const matchName = fullName.includes(search.toLowerCase());
    const matchSport = sportFilter === 'Tutti' || p.sport === sportFilter;
    return matchName && matchSport;
  });

  const sports = ['Tutti', ...new Set(activePatients.map((p) => p.sport).filter(Boolean))];

  return (
    <div className="space-y-6 text-slate-900">
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {viewTrash ? 'Cestino Pazienti Archiviati' : 'Elenco Pazienti Riabilitazione LCA'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-bold mt-1">
            {viewTrash
              ? 'Ripristina un paziente in archivio attivo oppure eliminalo definitivamente'
              : 'Seleziona un paziente per accedere a Monitoraggio & Diario, Test & Valutazioni e Copilot'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewTrash(!viewTrash)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-extrabold text-xs border transition-all cursor-pointer ${
              viewTrash
                ? 'bg-red-50 border-red-200 text-[#b91c1c]'
                : 'bg-[#faf9f6] border-stone-200 text-slate-800 hover:bg-stone-100 shadow-2xs'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Cestino ({trashedPatients.length})</span>
          </button>

          {!viewTrash && (
            <button
              onClick={onAddNewPatient}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nuovo Paziente LCA</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-md flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca per nome o cognome..."
            className="w-full bg-[#faf9f6] border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-500 focus:outline-none focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {sports.map((sp) => (
              <button
                key={sp}
                onClick={() => setSportFilter(sp)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap border ${
                  sportFilter === sp
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                    : 'bg-[#faf9f6] text-slate-700 hover:text-slate-900 hover:bg-stone-100 border-stone-200'
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-[#f4f3ef] text-[11px] font-mono uppercase text-slate-700">
                <th className="py-4 px-5 font-extrabold">Paziente</th>
                <th className="py-4 px-5 font-extrabold">Sport</th>
                <th className="py-4 px-5 font-extrabold">Lesione</th>
                <th className="py-4 px-5 font-extrabold">Data Intervento</th>
                <th className="py-4 px-5 font-extrabold">Fase Attuale</th>
                <th className="py-4 px-5 font-extrabold text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-xs">
              {filtered.map((p, idx) => {
                const phaseMeta = getPhaseMeta(p);
                return (
                  <tr
                    key={p.id}
                    onClick={() => !viewTrash && onSelectPatient(p)}
                    className={`transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#faf9f6]'
                    } ${!viewTrash ? 'hover:bg-blue-50/40 cursor-pointer' : ''}`}
                  >
                    <td className="py-4 px-5">
                      <div className="font-black text-slate-900 text-sm">
                        {p.nome} {p.cognome}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-extrabold text-slate-900">{p.sport}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 border border-stone-200 font-mono text-slate-900 font-extrabold">
                        Lato {p.lato_lesione}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-slate-800 font-extrabold">
                      {p.data_intervento}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-3 py-1 rounded-xl text-[11px] font-extrabold inline-block ${phaseMeta.badgeCls}`}>
                        {phaseMeta.fullLabel}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      {viewTrash ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onRestorePatient) onRestorePatient(p.id);
                            }}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#047857] border border-emerald-200 font-extrabold text-xs transition-all cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-red-50 hover:bg-red-100 text-[#b91c1c] border border-red-200 font-extrabold text-xs transition-all cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
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
                            className="p-2 rounded-2xl bg-stone-100 hover:bg-red-50 text-slate-600 hover:text-[#b91c1c] border border-stone-200 hover:border-red-200 transition-all cursor-pointer"
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
                  <td colSpan={6} className="py-8 text-center text-stone-500 font-bold">
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
          <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl p-6 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center gap-3 text-[#b91c1c]">
              <div className="p-2.5 rounded-2xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-5 h-5 text-[#b91c1c]" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Eliminare Paziente?
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  Paziente: <strong className="text-slate-900 font-black">{confirmDeletePatient.nome} {confirmDeletePatient.cognome}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-semibold leading-relaxed">
              Questa operazione rimuoverà il paziente e le relative rilevazioni dal database Supabase.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setConfirmDeletePatient(null)}
                className="px-4 py-2.5 rounded-2xl bg-[#faf9f6] hover:bg-stone-100 text-slate-800 border border-stone-200 text-xs font-extrabold cursor-pointer"
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
                className="px-4 py-2.5 rounded-2xl bg-[#b91c1c] hover:bg-red-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
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
