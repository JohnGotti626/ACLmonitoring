import React from 'react';
import { 
  Users, 
  CalendarDays, 
  Activity, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  Award, 
  Zap, 
  ShieldCheck, 
  Flame 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ patients, onSelectPatient, onNavigateToPatients }) {
  const { recentAuditLogs } = useAuth();

  // Milestone Scadenzario Controlli (30, 60, 90, 180 Giorni)
  const milestones = [
    { days: 30, label: '30 Giorni (Early Phase)', color: 'border-blue-500 text-blue-300 bg-slate-950' },
    { days: 60, label: '60 Giorni (Neuro-control)', color: 'border-cyan-500 text-cyan-300 bg-slate-950' },
    { days: 90, label: '90 Giorni (Return to Run)', color: 'border-amber-500 text-amber-300 bg-slate-950' },
    { days: 180, label: '180 Giorni (Return to Sport)', color: 'border-emerald-500 text-emerald-300 bg-slate-950' }
  ];

  // Calcola giorni trascorsi dall'intervento
  const getDaysPostOp = (surgeryDateStr) => {
    const surgery = new Date(surgeryDateStr);
    const today = new Date();
    const diffTime = Math.abs(today - surgery);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Contatori dei Pazienti per le 5 Fasi di RTS (Rehab Stages)
  const countEarlyStage = patients.filter(p => {
    const f = String(p.fase_riabilitativa || '').toLowerCase();
    return f.includes('early') || f.includes('fase 1') || f.includes('1.');
  }).length;

  const countMidStage = patients.filter(p => {
    const f = String(p.fase_riabilitativa || '').toLowerCase();
    return f.includes('mid') || f.includes('fase 2') || f.includes('2.');
  }).length;

  const countReturnToRun = patients.filter(p => {
    const f = String(p.fase_riabilitativa || '').toLowerCase();
    return f.includes('run') || f.includes('fase 3') || f.includes('3.');
  }).length;

  const countLateStage = patients.filter(p => {
    const f = String(p.fase_riabilitativa || '').toLowerCase();
    return f.includes('late') || f.includes('fase 4') || f.includes('4.');
  }).length;

  const countReturnToPerformance = patients.filter(p => {
    const f = String(p.fase_riabilitativa || '').toLowerCase();
    return f.includes('sport') || f.includes('play') || f.includes('perf') || f.includes('fase 5') || f.includes('5.') || f.includes('rts');
  }).length;

  const rtsStages = [
    {
      id: 1,
      name: '1. Early Stage',
      count: countEarlyStage,
      activeStyle: 'border-2 border-red-500 bg-red-950/40 text-red-300 shadow-xl shadow-red-950/60 ring-1 ring-red-500/40',
      numColor: 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]',
      dot: 'bg-red-500'
    },
    {
      id: 2,
      name: '2. Mid Stage',
      count: countMidStage,
      activeStyle: 'border-2 border-amber-500 bg-amber-950/40 text-amber-300 shadow-xl shadow-amber-950/60 ring-1 ring-amber-500/40',
      numColor: 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]',
      dot: 'bg-amber-500'
    },
    {
      id: 3,
      name: '3. Return to Run & Decel',
      count: countReturnToRun,
      activeStyle: 'border-2 border-lime-400 bg-lime-950/40 text-lime-300 shadow-xl shadow-lime-950/60 ring-1 ring-lime-400/40',
      numColor: 'text-lime-300 drop-shadow-[0_0_8px_rgba(163,230,53,0.4)]',
      dot: 'bg-lime-400'
    },
    {
      id: 4,
      name: '4. Late Stage',
      count: countLateStage,
      activeStyle: 'border-2 border-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-xl shadow-emerald-950/60 ring-1 ring-emerald-400/40',
      numColor: 'text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]',
      dot: 'bg-emerald-400'
    },
    {
      id: 5,
      name: '5. Return to Performance',
      count: countReturnToPerformance,
      activeStyle: 'border-2 border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-xl shadow-cyan-950/60 ring-1 ring-cyan-400/40',
      numColor: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]',
      dot: 'bg-cyan-400'
    }
  ];

  return (
    <div className="space-y-5">
      
      {/* Top Banner Overview */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-700 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#39FF14]/15 via-emerald-500/5 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-[#39FF14]/40 text-[#39FF14] text-xs font-black mb-1.5 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-[#39FF14]" />
              <span>N PERSONAL FIT LIFE • REHAB TEAM</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Dashboard Generale Clinica LCA
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-0.5 font-medium">
              Monitoraggio clinico asimmetrie biomeccaniche, test pliometrici e progressione 5 Fasi RTS.
            </p>
          </div>

          <button
            onClick={onNavigateToPatients}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg border border-emerald-400/40 transition-all"
          >
            <span>Elenco Gestione Pazienti</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* REQUISITO 1: CARD FASI RTS IN UNICA RIGA ORIZZONTALE COMPATTA SU MOBILE */}
      <div className="grid grid-cols-5 gap-1 sm:gap-3 lg:grid-cols-5">
        {rtsStages.map((stage) => {
          const hasPatients = stage.count > 0;

          return (
            <div 
              key={stage.id}
              className={`p-1.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all duration-300 flex flex-col justify-between space-y-1 sm:space-y-2 min-w-0 ${
                hasPatients
                  ? `${stage.activeStyle} scale-100`
                  : 'opacity-35 grayscale border border-slate-800/80 bg-slate-950/60 text-slate-500 shadow-none'
              }`}
            >
              <div className="flex items-center justify-between text-[8.5px] sm:text-[11px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-1 sm:gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full ${hasPatients ? stage.dot : 'bg-slate-700'} shrink-0`}></span>
                  <span className="truncate hidden sm:inline">{stage.name}</span>
                  <span className="truncate inline sm:hidden">Fase {stage.id}</span>
                </div>
              </div>

              {/* Numero Pazienti Molto Più Grande ed in Evidenza */}
              <div className="flex items-baseline justify-between pt-1 sm:pt-2 border-t border-slate-800/80">
                <span className="text-[8.5px] sm:text-[11px] text-slate-400 font-bold uppercase hidden sm:inline">Pazienti:</span>
                <span className="text-[7.5px] text-slate-400 font-bold uppercase inline sm:hidden">Paz:</span>
                <span className={`text-xl sm:text-5xl font-black font-mono tracking-tight ${hasPatients ? stage.numColor : 'text-slate-600'}`}>
                  {stage.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Widget Ultimi Pazienti Testati & Scadenzario Controlli */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Column 1 & 2: Widget "Ultimi pazienti testati" */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-700 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#39FF14]" />
              <h3 className="font-black text-white text-base">Ultimi Pazienti Testati</h3>
            </div>
            <span className="text-xs text-slate-300 font-bold">Biometria Recente</span>
          </div>

          <div className="space-y-2.5">
            {patients.map((patient) => {
              const daysPostOp = getDaysPostOp(patient.data_intervento);
              
              return (
                <div 
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-[#39FF14] transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm group-hover:text-[#39FF14] transition-colors">
                        {patient.nome} {patient.cognome}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-cyan-300 font-mono font-bold">
                        {patient.sport} ({patient.ruolo_sportivo || 'Atleta'})
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-300 font-medium">
                      <span>Innesto: <strong className="text-white">{patient.tipo_innesto} ({patient.lato_lesione})</strong></span>
                      <span>Chirurgo: <strong className="text-slate-200">{patient.chirurgo || 'N/D'}</strong></span>
                      <span>Post-Op: <strong className="text-emerald-400 font-mono font-bold">{daysPostOp} gg</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-950 border border-emerald-500/60 text-emerald-300">
                        {patient.fase_riabilitativa}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                        ACL-RSI: <strong className="text-cyan-300 font-mono">{patient.aclrsi_score_iniziale}%</strong>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 group-hover:bg-[#39FF14] group-hover:text-slate-950 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 3: Audit Logs Activity Card */}
        <div className="space-y-5">

          {/* Audit Log Activity Card */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-700 space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">Ultimi Log Accesso</span>
              <span className="text-[9.5px] text-cyan-400 font-mono font-bold">audit_logs</span>
            </div>

            <div className="space-y-1.5 text-[11px] font-semibold">
              {recentAuditLogs.length > 0 ? (
                recentAuditLogs.slice(0, 3).map(log => (
                  <div key={log.id} className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-[10px]">
                    <span className="text-slate-200 truncate max-w-[130px] font-bold">{log.email}</span>
                    <span className="font-mono text-cyan-300 text-[9px] font-bold">{log.timestamp}</span>
                  </div>
                ))
              ) : (
                <div className="p-2 bg-slate-950 rounded-lg text-slate-400 text-center text-[10px]">
                  Tracciamento accessi in ascolto...
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
