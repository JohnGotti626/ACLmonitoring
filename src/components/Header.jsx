import React from 'react';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LogoN from './LogoN';

export default function Header({ onToggleMobileSidebar, currentView }) {
  const { role } = useAuth();
  const isPortal = currentView === 'client-portal' || role === 'patient';

  return (
    <header className="sticky top-0 z-30 bg-[#f4f3ef] border-b border-stone-200 px-4 sm:px-6 py-3.5 flex items-center justify-between print:hidden shadow-xs">
      <div className="flex items-center gap-3.5">
        {!isPortal && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-stone-200/70 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3.5">
          <LogoN className="w-10 h-10 rounded-2xl shadow-sm shrink-0 border border-stone-200/80" />
          <div className="flex flex-col justify-center">
            <span className="font-black text-base sm:text-xl tracking-tight text-slate-900 leading-tight">
              ACL <span className="text-blue-600">RETURN TO SPORT</span>
            </span>
            <p className="text-[11px] text-slate-700 font-bold tracking-wider uppercase mt-0.5">
              Monitoring - Testing - Repeat
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
