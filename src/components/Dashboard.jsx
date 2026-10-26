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

  // I 4 CARD KPI SUPERIORI (Forma arrotondata, colori pastello identici allo screenshot)
  const kpis = [
    {
      title: 'PAZIENTI ATTIVI LCA',
      value: totalPatients,
      sub: 'Monitorati in Cloud',
      icon: Users,
      cardCls: 'bg-[#DCEBFE] border border-[#C5DCFA]',
      iconCircleCls: 'bg-[#1EA1F2] text-white'
    },
    {
      title: 'IDONEI RTS (LSI ≥ 90%)',
      value: `${rtsReadyCount} / ${totalPatients}`,
      sub: 'Criteri clinici soddisfatti',
      icon: CheckCircle2,
      cardCls: 'bg-[#D1F4E2] border border-[#B5E8CE]',
      iconCircleCls: 'bg-[#16A34A] text-white'
    },
    {
      title: 'MEDIA LSI QUADRICIPITE',
      value: avgLsiQuad !== 'N/A' ? `${avgLsiQuad}%` : 'Non testato',
      sub: 'Target Return to Sport: ≥90%',
      icon: Activity,
      cardCls: 'bg-[#FDE2E2] border border-[#F8C9C9]',
      iconCircleCls: 'bg-[#E14D43] text-white'
    },
    {
      title: 'SCORE ACL-RSI MEDIO',
      value: `${avgAclRsi}`,
      sub: 'Prontitudine Psicologica (/100)',
      icon: Award,
      cardCls: 'bg-[#EDE9FE] border border-[#DCD4FD]',
      iconCircleCls: 'bg-[#7C4DFF] text-white'
    }
  ];

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Clinica &amp; Riabilitazione LCA
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Panoramica generale dei pazienti, indicatori LSI e stato di progressione riabilitativa
          </p>
        </div>

        <button
          onClick={onNavigateToPatients}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141E33] hover:bg-[#0B1736] text-white font-bold text-xs shadow-none transition-all cursor-pointer print:hidden"
        >
          <span>Gestisci Elenco Pazienti</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* I 4 CARD KPI SUPERIORI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`${kpi.cardCls} p-5 rounded-2xl shadow-none flex items-start justify-between break-inside-avoid`}
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  {kpi.title}
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 pt-1">
                  {kpi.value}
                </div>
                <p className="text-xs text-slate-700 font-medium pt-0.5">{kpi.sub}</p>
              </div>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${kpi.iconCircleCls}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* STATO CLINICO PAZIENTI IN CARICO - SNELLIMENTO CARDS PAZIENTI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0D6EFD]" />
            <span>Stato Clinico Pazienti in Carico</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Clicca su un paziente per aprire la Scheda Completa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const phaseLabel = formatPhaseDisplay(patient.fase_attuale || patient.fase_riabilitativa);

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="bg-[#F7F6F2] rounded-2xl border border-slate-300/80 shadow-none hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group break-inside-avoid"
              >
                {/* Parte superiore snella: SOLO Nome e Cognome + Badge Ginocchio Dx/Sx */}
                <div className="p-4 flex items-center justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    {patient.nome} {patient.cognome}
                  </h3>
                  <span className="bg-[#DCE3EC] text-slate-800 text-xs font-semibold px-3 py-1 rounded-full shrink-0">
                    Ginocchio {patient.lato_lesione}
                  </span>
                </div>

                {/* Footer verde menta pastello: Fase Riabilitativa a sinistra + Apri Scheda → a destra */}
                <div className="bg-[#D1F4E2] px-4 py-2.5 border-t border-[#BCE8D1] flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-800 text-xs font-semibold truncate">
                    <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">{phaseLabel}</span>
                  </span>

                  <span className="text-[#0D6EFD] font-bold text-xs flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
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
      <div className="bg-[#F7F6F2] p-4 rounded-2xl border border-slate-300/80 shadow-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 break-inside-avoid">
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
