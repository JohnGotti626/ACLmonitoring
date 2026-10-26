import React from 'react';
import {
  Users,
  CheckCircle2,
  Activity,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Award
} from 'lucide-react';
import { formatPhaseDisplay } from '../utils/phaseUtils';
import { sortTestsByDate, getLastValidMetricValue } from '../utils/testUtils';

export default function Dashboard({ patients, onSelectPatient, onNavigateToPatients }) {
  const totalPatients = patients.length;

  const rtsReadyCount = patients.filter((p) => {
    const sorted = sortTestsByDate(p.tests);
    const lsiQuad = getLastValidMetricValue(sorted, ['lsiQuad', 'lsi_quad_calculated']);
    const lsiHop = getLastValidMetricValue(sorted, ['lsiSingleHop', 'lsi_single_hop']);
    return lsiQuad !== null && lsiQuad >= 90 && (lsiHop === null || lsiHop >= 90);
  }).length;

  const avgAclRsi = (
    patients.reduce((acc, p) => {
      const sorted = sortTestsByDate(p.tests);
      const lastRsi = getLastValidMetricValue(sorted, ['aclrsi', 'acl_rsi']);
      return acc + (lastRsi ?? p.aclrsi_score_iniziale ?? 50);
    }, 0) / (totalPatients || 1)
  ).toFixed(1);

  const validQuadPatients = patients
    .map((p) => getLastValidMetricValue(sortTestsByDate(p.tests), ['lsiQuad', 'lsi_quad_calculated']))
    .filter((v) => v !== null);

  const avgLsiQuad =
    validQuadPatients.length > 0
      ? (validQuadPatients.reduce((a, b) => a + b, 0) / validQuadPatients.length).toFixed(1)
      : 'N/A';

  const kpis = [
    {
      title: 'Pazienti Attivi LCA',
      value: totalPatients,
      sub: 'Monitorati in Cloud',
      icon: Users,
      badgeCls: 'bg-sky-100/80 text-sky-900 border border-sky-300/50'
    },
    {
      title: 'Idonei RTS (LSI ≥ 90%)',
      value: `${rtsReadyCount} / ${totalPatients}`,
      sub: 'Criteri clinici soddisfatti',
      icon: CheckCircle2,
      badgeCls: 'bg-emerald-100/80 text-emerald-900 border border-emerald-300/50'
    },
    {
      title: 'Media LSI Quadricipite',
      value: avgLsiQuad !== 'N/A' ? `${avgLsiQuad}%` : 'Non testato',
      sub: 'Target Return to Sport: ≥90%',
      icon: Activity,
      badgeCls: 'bg-rose-100/80 text-rose-900 border border-rose-300/50'
    },
    {
      title: 'Score ACL-RSI Medio',
      value: `${avgAclRsi}`,
      sub: 'Prontitudine Psicologica (/100)',
      icon: Award,
      badgeCls: 'bg-purple-100/80 text-purple-900 border border-purple-300/50'
    }
  ];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
            Dashboard Clinica &amp; Riabilitazione LCA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Panoramica generale dei pazienti, indicatori LSI e stato di progressione riabilitativa
          </p>
        </div>

        <button
          onClick={onNavigateToPatients}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100/80 hover:bg-emerald-200/70 text-emerald-900 border border-emerald-300/50 font-bold text-xs shadow-none transition-all cursor-pointer"
        >
          <span>Gestisci Elenco Pazienti</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-50 p-5 rounded-xl border border-slate-300/60 shadow-none flex items-start justify-between break-inside-avoid"
            >
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {kpi.title}
                </span>
                <div className="text-2xl font-bold font-mono text-slate-800 pt-1">
                  {kpi.value}
                </div>
                <p className="text-[11px] text-slate-500 font-medium pt-0.5">{kpi.sub}</p>
              </div>
              <div className={`p-2 rounded-xl ${kpi.badgeCls}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient Cards Quick Access - SLIMMING DRASTICO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-700" />
            <span>Stato Clinico Pazienti in Carico</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">Clicca su un paziente per aprire la Scheda</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const phaseLabel = formatPhaseDisplay(patient.fase_attuale || patient.fase_riabilitativa);

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="bg-slate-50 p-4 rounded-xl border border-slate-300/60 shadow-none hover:bg-slate-100 hover:border-slate-400/80 transition-all cursor-pointer flex flex-col justify-between gap-3 group break-inside-avoid"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-800 truncate">
                    {patient.nome} {patient.cognome}
                  </h3>
                  <span className="bg-slate-200/70 text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-300/60 shrink-0">
                    Ginocchio {patient.lato_lesione}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 border border-emerald-300/50 text-xs font-bold truncate">
                    <Calendar className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                    <span className="truncate">{phaseLabel}</span>
                  </span>

                  <span className="text-slate-700 font-bold text-xs flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                    <span>Scheda</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Safety Box */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-300/60 shadow-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded bg-sky-100/80 text-sky-900 border border-sky-300/50 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">
              Criterio Return to Sport (Grindem et al., BJSM)
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Il superamento di LSI ≥ 90% su Quadricipite, Ischiocrurali e Hop Test riduce dell&apos;84% il rischio di re-infortunio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
