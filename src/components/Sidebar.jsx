import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  X,
  CheckCircle2
} from 'lucide-react';
import LogoN from './LogoN';

export default function Sidebar({
  currentView,
  setCurrentView,
  mobileOpen,
  setMobileOpen,
  onOpenPrintConfigurator
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Clinica',
      icon: LayoutDashboard,
      action: () => {
        setCurrentView('dashboard');
        setMobileOpen(false);
      }
    },
    {
      id: 'patients',
      label: 'Elenco Pazienti',
      icon: Users,
      action: () => {
        setCurrentView('patients');
        setMobileOpen(false);
      }
    },
    {
      id: 'create-report',
      label: 'Crea Report',
      icon: FileText,
      action: () => {
        if (onOpenPrintConfigurator) onOpenPrintConfigurator();
        setMobileOpen(false);
      }
    },
    {
      id: 'bibliografia',
      label: 'Bibliografia di Riferimento',
      icon: BookOpen,
      action: () => {
        setCurrentView('bibliografia');
        setMobileOpen(false);
      }
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-[#f4f3ef] border-r border-stone-200 w-64 select-none text-slate-900 shadow-xs">
      <div className="space-y-6">
        {/* HEADER SIDEBAR CON LOGO AZIENDALE CUSTOM (N Personal Fit / Clinica LCA) */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-stone-200 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <LogoN className="h-10 w-10 rounded-xl shrink-0" />
            <div className="min-w-0">
              <div className="font-black text-xs sm:text-sm text-slate-900 tracking-tight leading-tight truncate">
                N Personal Fit
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-extrabold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                <span className="truncate">Clinica LCA • RTP</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
            aria-label="Chiudi menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigazione Principale */}
        <div className="space-y-2">
          <div className="px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-700 font-extrabold">
            Menu Navigazione
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                    : 'bg-transparent text-slate-800 border-transparent hover:text-slate-900 hover:bg-white hover:border-stone-200 hover:shadow-2xs'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-blue-600'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-1.5">
        <div className="flex items-center gap-2 text-emerald-800 text-xs font-extrabold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Clinical Engine Attivo</span>
        </div>
        <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
          Copilot sincronizzato con Bibliografia RTS, LSI, Sessioni 14gg e Trend biomeccanici.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 print:hidden">{sidebarContent}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex print:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
