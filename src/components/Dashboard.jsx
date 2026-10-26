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
      icon: Users
    },
    {
      title: 'Idonei RTS (LSI ≥ 90%)',
      value: `${rtsReadyCount} / ${totalPatients}`,
      sub: 'Criteri clinici soddisfatti',
      icon: CheckCircle2
    },
    {
      title: 'Media LSI Quadricipite',
      value: avgLsiQuad !== 'N/A' ? `${avgLsiQuad}%` : 'Non testato',
      sub: 'Target Return to Sport: ≥90%',
      icon: Activity
    },
    {
      title: 'Score ACL-RSI Medio',
      value: `${avgAclRsi}`,
      sub: 'Prontitudine Psicologica (/100)',
      icon: Award
    }
  ];

  return (
    <div className="space-y-6 text-stone-800">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-stone-800 tracking-tight">
            Dashboard Clinica &amp; Riabilitazione LCA
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium mt-0.5">
            Panoramica generale dei pazienti, indicatori LSI e stato di progressione riabilitativa
          </p>
        </div>

        <button
          onClick={onNavigateToPatients}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-stone-100 font-semibold text-xs shadow-none transition-all cursor-pointer"
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
              className="bg-stone-50 p-5 rounded-xl border border-stone-300/70 shadow-none flex items-start justify-between break-inside-avoid"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {kpi.title}
                </span>
                <div className="text-2xl font-semibold font-mono text-stone-800 pt-1">
                  {kpi.value}
                </div>
                <p className="text-[11px] text-stone-500 font-medium pt-0.5">{kpi.sub}</p>
              </div>
              <div className="p-2 rounded-xl bg-stone-200/60 border border-stone-300/70 text-stone-700">
                <Icon className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient Cards Quick Access */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-stone-700" />
            <span>Stato Clinico Pazienti in Carico</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium">Clicca su un paziente per aprire la Scheda</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {patients.map((patient) => {
            const sortedTests = sortTestsByDate(patient.tests);
            const lsiQ = getLastValidMetricValue(sortedTests, ['lsiQuad', 'lsi_quad_calculated']);
            const lsiF = getLastValidMetricValue(sortedTests, ['lsiFlex', 'lsi_curl_calculated']);
            const rsiVal = getLastValidMetricValue(sortedTests, ['rsiDropJump', 'djRSI', 'dj_rsi', 'rsiCmj', 'rsi_cmj']);
            const isGreen = lsiQ !== null && lsiQ >= 90;
            const isAmber = lsiQ !== null && lsiQ >= 75 && lsiQ < 90;

            return (
              <div
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className="bg-stone-50 p-5 rounded-xl border border-stone-300/70 shadow-none hover:bg-stone-100 hover:border-stone-400 transition-all cursor-pointer flex flex-col justify-between space-y-4 group break-inside-avoid"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base text-stone-800">
                          {patient.nome} {patient.cognome}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200/60 text-stone-700 border border-stone-300/70 font-semibold">
                          Ginocchio {patient.lato_lesione}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 font-medium mt-0.5">
                        {patient.sport} ({patient.ruolo_sportivo}) • Innesto:{' '}
                        <strong className="text-stone-800 font-semibold">{patient.tipo_innesto}</strong>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${
                        lsiQ === null
                          ? 'bg-stone-100 text-stone-500 border-stone-300/70'
                          : isGreen
                          ? 'bg-emerald-900/10 text-emerald-800 border-emerald-300/40'
                          : isAmber
                          ? 'bg-amber-900/10 text-amber-800 border-amber-300/50'
                          : 'bg-rose-900/10 text-rose-800 border-rose-300/50'
                      }`}
                    >
                      {lsiQ !== null ? `LSI ${lsiQ}%` : 'NON TESTATO'}
                    </span>
                  </div>

                  {/* Mini Progress Bar LSI Quadricipite */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-stone-500 font-medium">Simmetria Quadricipite (LSI)</span>
                      <span className="font-mono font-semibold text-stone-800">
                        {lsiQ !== null ? `${lsiQ}% / 90%` : 'Non testato'}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-stone-200/70 rounded-full overflow-hidden border border-stone-300/70">
                      <div
                        className={`h-full rounded-full ${
                          lsiQ === null
                            ? 'bg-stone-300'
                            : isGreen
                            ? 'bg-emerald-700'
                            : isAmber
                            ? 'bg-amber-600'
                            : 'bg-rose-600'
                        }`}
                        style={{ width: `${lsiQ !== null ? Math.min(100, lsiQ) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-lg bg-stone-100 border border-stone-300/70">
                      <div className="text-[10px] text-stone-500 font-medium">LSI Flex</div>
                      <div className="text-xs font-mono font-semibold text-stone-800">
                        {lsiF !== null ? `${lsiF}%` : 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-100 border border-stone-300/70">
                      <div className="text-[10px] text-stone-500 font-medium">RSImod</div>
                      <div className="text-xs font-mono font-semibold text-emerald-800">
                        {rsiVal !== null ? rsiVal : 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-100 border border-stone-300/70">
                      <div className="text-[10px] text-stone-500 font-medium">ACL-RSI</div>
                      <div className="text-xs font-mono font-semibold text-stone-800">
                        {getLastValidMetricValue(sortedTests, ['aclrsi', 'acl_rsi']) ?? patient.aclrsi_score_iniziale ?? 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-300/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-stone-500">
                    <Calendar className="w-3.5 h-3.5 text-stone-700" />
                    <span className="truncate max-w-[180px] font-medium text-stone-700">
                      {formatPhaseDisplay(patient.fase_attuale || patient.fase_riabilitativa)}
                    </span>
                  </div>
                  <span className="text-stone-800 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Apri Scheda <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clinical Safety Box */}
      <div className="bg-stone-50 p-4 rounded-xl border border-stone-300/70 shadow-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded bg-stone-200/60 text-stone-700 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-stone-800">
              Criterio Return to Sport (Grindem et al., BJSM)
            </h4>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Il superamento di LSI ≥ 90% su Quadricipite, Ischiocrurali e Hop Test riduce dell&apos;84% il rischio di re-infortunio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
