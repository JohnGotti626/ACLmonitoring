import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Database,
  X,
  CheckCircle2,
  Printer
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setCurrentView,
  selectedPatient,
  mobileOpen,
  setMobileOpen,
  onOpenSqlModal,
  onOpenPrintConfigurator
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Clinica', icon: LayoutDashboard },
    { id: 'patients', label: 'Elenco Pazienti', icon: Users },
    {
      id: 'patient-detail',
      label: selectedPatient ? `Scheda: ${selectedPatient.cognome}` : 'Scheda Paziente',
      icon: UserCheck,
      disabled: !selectedPatient
    }
  ];

  const handleNav = (id) => {
    setCurrentView(id);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4 bg-[#0B1736] border-r border-[#16295A] w-64 select-none text-white shadow-none">
      <div className="space-y-6">
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-[#1E336A]">
          <span className="font-bold text-sm text-white">Menu Navigazione</span>
          <button onClick={() => setMobileOpen(false)} className="p-1 text-[#9FB2D8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8DA2CE] font-bold">
            Area Clinica &amp; Riabilitativa
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentView === item.id;
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#1D63FE] text-white shadow-sm'
                    : item.disabled
                    ? 'opacity-40 cursor-not-allowed text-[#6C82B0]'
                    : 'text-[#C6D4F0] hover:text-white hover:bg-[#132452]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#8DA2CE]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Tools */}
        <div className="space-y-1.5 pt-4 border-t border-[#1A2E63]">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8DA2CE] font-bold">
            Strumenti &amp; Report
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenSqlModal) onOpenSqlModal();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#C6D4F0] hover:text-white hover:bg-[#132452] transition-all cursor-pointer"
          >
            <Database className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>Script SQL Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenPrintConfigurator) onOpenPrintConfigurator();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#C6D4F0] hover:text-white hover:bg-[#132452] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>Stampa Report A4</span>
          </button>
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-3.5 rounded-xl bg-[#0F2347] border border-[#1E3D73] space-y-1.5">
        <div className="flex items-center gap-2 text-[#34D399] text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#34D399]" />
          <span>Clinical Engine Attivo</span>
        </div>
        <p className="text-[11px] text-[#B8C7E6] font-medium leading-relaxed">
          Calcoli automatici: LSI, Sessioni 14gg, Trend e Red Flags attivi.
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
