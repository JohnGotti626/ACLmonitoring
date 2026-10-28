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
    <div className="flex flex-col h-full justify-between p-4 bg-[#0B1736] border-r border-[#16295A] w-64 select-none text-white shadow-none">
      <div className="space-y-6">
        {/* HEADER SIDEBAR CON LOGO AZIENDALE CUSTOM (N Personal Fit / Clinica LCA) */}
        <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#11224D] border border-[#1E3A7A]">
          <div className="flex items-center gap-3 min-w-0">
            <LogoN className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <div className="font-extrabold text-xs sm:text-sm text-white tracking-tight leading-tight truncate">
                N Personal Fit
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#34D399] font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34D399] shrink-0"></span>
                <span className="truncate">Clinica LCA • RTP</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 text-[#9FB2D8] hover:text-white cursor-pointer"
            aria-label="Chiudi menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Navigazione Principale (Esclusivamente le 4 voci richieste) */}
        <div className="space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8DA2CE] font-bold">
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1D63FE] text-white shadow-sm'
                    : 'text-[#C6D4F0] hover:text-white hover:bg-[#132452]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#8DA2CE]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-3.5 rounded-xl bg-[#0F2347] border border-[#1E3D73] space-y-1.5">
        <div className="flex items-center gap-2 text-[#34D399] text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34D399]" />
          <span>Clinical Engine Attivo</span>
        </div>
        <p className="text-[11px] text-[#B8C7E6] font-medium leading-relaxed">
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
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
