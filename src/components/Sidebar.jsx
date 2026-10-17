import React from 'react';
import LogoN from './LogoN';
import { 
  LayoutDashboard, 
  Users, 
  Printer, 
  Database, 
  X
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  patientsCount = 6, 
  mobileOpen, 
  setMobileOpen,
  onOpenSqlModal,
  onOpenPrintConfigurator
}) {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Generale',
      icon: LayoutDashboard
    },
    {
      id: 'patients',
      label: 'Elenco Gestione Pazienti',
      icon: Users,
      badge: patientsCount || 6
    },
    {
      id: 'print-report',
      label: 'Stampa Report',
      icon: Printer
    },
    {
      id: 'database',
      label: 'Database & Sincronizzazione',
      icon: Database,
      action: onOpenSqlModal
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container - Deep Slate Dark Premium UI */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 z-50
        w-64 h-screen max-h-screen bg-[#0F172A] border-r border-[#334155]
        flex flex-col justify-between overflow-hidden select-none p-3 space-y-2
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        transition-transform duration-200 ease-in-out
      `}>
        
        {/* Top Section */}
        <div className="space-y-3">
          
          {/* HEADER SIDEBAR CON LOGO N PERSONAL FIT LIFE */}
          <div className="p-3 bg-[#1E293B] rounded-2xl border border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoN className="w-10 h-10 shrink-0" />
              <div>
                <div className="font-black text-xs text-white tracking-tight leading-tight">
                  N Personal Fit Life
                </div>
                <div className="text-[10px] font-black text-[#0D9488] uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>
                  RTP Team
                </div>
              </div>
            </div>

            <button 
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-[#94A3B8] hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.id === 'print-report') {
                      if (onOpenPrintConfigurator) {
                        onOpenPrintConfigurator();
                      } else {
                        setCurrentView('patient-detail');
                      }
                    } else {
                      setCurrentView(item.id);
                    }
                    setMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold
                    transition-all duration-150 cursor-pointer
                    ${isActive
                      ? 'bg-[#1E293B] text-white border border-[#06B6D4] font-extrabold shadow-sm'
                      : 'text-[#94A3B8] hover:bg-[#1E293B]/60 hover:text-white border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#06B6D4]' : 'text-[#94A3B8]'}`} />
                    <span className="font-bold text-xs truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="w-5 h-5 rounded-full bg-[#0F172A] border border-[#334155] font-mono text-[10px] font-extrabold text-white flex items-center justify-center shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Footer Minimalist */}
        <div className="p-2 rounded-xl bg-[#1E293B] border border-[#334155] text-[10px] text-[#94A3B8] text-center font-mono font-semibold">
          <span>N Personal Fit Life • Rehab Team</span>
        </div>

      </aside>
    </>
  );
}
