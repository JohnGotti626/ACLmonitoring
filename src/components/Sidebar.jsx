import React from 'react';
import { useAuth } from '../context/AuthContext';
import LogoN from './LogoN';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Printer, 
  Database, 
  X, 
  AlertTriangle, 
  Clock, 
  Flame, 
  BookmarkCheck 
} from 'lucide-react';

export default function Sidebar({ 
  currentView, 
  setCurrentView, 
  patientsCount = 6, 
  mobileOpen, 
  setMobileOpen,
  onOpenSqlModal,
  onAddNewPatient,
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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container - Light/Clean Clinical Layout */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 z-50
        w-64 h-screen max-h-screen bg-white border-r border-slate-200 shadow-xs
        flex flex-col justify-between overflow-hidden select-none p-3 space-y-2
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        transition-transform duration-200 ease-in-out
      `}>
        
        {/* Top Section */}
        <div className="space-y-3">
          
          {/* HEADER SIDEBAR CON LOGO N PERSONAL FIT LIFE */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogoN className="w-10 h-10 shrink-0" />
              <div>
                <div className="font-black text-xs text-slate-900 tracking-tight leading-tight">
                  N Personal Fit Life
                </div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  RTP Team
                </div>
              </div>
            </div>

            <button 
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-700 p-1 rounded-lg"
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
                      ? 'bg-sky-50 text-sky-700 border border-sky-200 font-extrabold shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="font-bold text-xs truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 font-mono text-[10px] font-extrabold text-slate-700 flex items-center justify-center shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Footer Minimalist */}
        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 text-center font-mono font-semibold">
          <span>N Personal Fit Life • Rehab Team</span>
        </div>

      </aside>
    </>
  );
}

