import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Activity, ShieldCheck, Lock, Mail, Database, CheckCircle2, AlertTriangle, KeyRound, UserCheck, UserPlus } from 'lucide-react';

export default function Login({ onOpenSqlModal }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('lead.therapist@medical-acl.it');
  const [password, setPassword] = useState('MedicalSecure2026!');
  const [role, setRole] = useState('ADMIN');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    const result = await login(email, password, role);

    if (!result.success) {
      if (isSupabaseConfigured && (result.error.includes('Invalid login credentials') || result.error.includes('User not found'))) {
        try {
          setInfoMsg('Creazione nuovo utente Supabase Auth in corso con ruolo ADMIN...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                nome: 'Lead',
                cognome: 'Therapist',
                ruolo: role
              }
            }
          });

          if (signUpError) {
            throw signUpError;
          }

          if (signUpData.user) {
            const retryLogin = await login(email, password, role);
            if (retryLogin.success) {
              setLoading(false);
              return;
            }
          }
        } catch (errSignUp) {
          setError(`Impossibile registrare l'utente su Supabase: ${errSignUp.message}`);
          setLoading(false);
          return;
        }
      }

      setError(result.error || 'Credenziali non valide o errore Supabase Auth');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-200/60 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-800">
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100/80 border border-emerald-300/50 rounded-2xl mb-3 text-emerald-900 shadow-none">
            <Activity className="w-8 h-8 text-emerald-900" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            ACL-RTS <span className="text-emerald-800">Monitor Pro</span>
          </h1>
          <p className="text-slate-600 font-semibold text-xs sm:text-sm mt-1">
            Piattaforma Medicale per la Valutazione Biomeccanica e Return to Sport Post-LCA
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className={`mb-5 p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-none ${
          isSupabaseConfigured 
            ? 'bg-emerald-100/80 border-emerald-300/50 text-emerald-900' 
            : 'bg-rose-100/80 border-rose-300/50 text-rose-900'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            <Database className="w-4 h-4 flex-shrink-0 text-emerald-900" />
            <span>
              {isSupabaseConfigured 
                ? 'Connesso al Database Live Supabase' 
                : 'Modalità Sviluppo Locale'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onOpenSqlModal}
            className="underline hover:text-slate-900 transition-colors flex-shrink-0 font-bold cursor-pointer"
          >
            Script SQL Supabase
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-slate-50 p-7 rounded-xl shadow-none border border-slate-300/60">
          <div className="flex items-center gap-2 mb-5 pb-3.5 border-b border-slate-300/60">
            <div className="p-1 bg-sky-100/80 text-sky-900 border border-sky-300/50 rounded">
              <ShieldCheck className="w-4 h-4 text-sky-900" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Accesso Riservato Staff Medico</h2>
          </div>

          {infoMsg && (
            <div className="mb-5 p-3 bg-emerald-100/80 border border-emerald-300/50 rounded-xl text-xs text-emerald-900 font-semibold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-900 flex-shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 bg-rose-100/80 border border-rose-300/50 rounded-xl text-xs text-rose-900 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-900 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Email Operatore
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fisioterapista@clinic.it"
                  className="w-full bg-slate-100 border border-slate-300/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-100 border border-slate-300/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-500 transition-all"
                />
              </div>
            </div>

            {/* Role Selection (RBAC) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Ruolo Operativo (RBAC)</span>
                <span className="px-2 py-0.5 rounded bg-purple-100/80 text-purple-900 border border-purple-300/50 text-[10px] font-bold">Supabase RBAC</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    role === 'ADMIN'
                      ? 'bg-emerald-100/80 border-emerald-300/50 text-emerald-900'
                      : 'bg-slate-100 border-slate-300/60 text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 mt-0.5 ${role === 'ADMIN' ? 'text-emerald-900' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-xs">ADMIN</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Lead Therapist</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    role === 'STAFF'
                      ? 'bg-sky-100/80 border-sky-300/50 text-sky-900'
                      : 'bg-slate-100 border-slate-300/60 text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  <KeyRound className={`w-4 h-4 mt-0.5 ${role === 'STAFF' ? 'text-sky-900' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-xs">STAFF</div>
                    <div className="text-[10px] text-slate-500 font-semibold">Colleghi (Mobile)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Audit Log Notice */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300/60 text-[11px] text-slate-700 font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-800 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Audit Log Attivo:</strong> Data, ora e ID utente verranno salvati su tabella <code className="text-emerald-900 font-bold">audit_logs</code> ad ogni accesso.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-100/80 hover:bg-emerald-200/70 text-emerald-900 border border-emerald-300/50 font-bold rounded-xl shadow-none transition-all duration-200 disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Autenticazione in corso...</span>
              ) : (
                <>
                  <span>Accedi al Gestionale LCA</span>
                  <Activity className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 font-semibold mt-6">
          Piattaforma di monitoraggio biomeccanico per il Return to Sport post-LCA.
        </p>
      </div>
    </div>
  );
}
