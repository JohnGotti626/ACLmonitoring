import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Activity, ShieldCheck, Lock, Mail, Database, CheckCircle2, AlertTriangle, KeyRound, UserCheck, UserPlus } from 'lucide-react';

export default function Login({ onOpenSqlModal }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('lead.therapist@medical-acl.it');
  const [password, setPassword] = useState('MedicalSecure2026!');
  const [role, setRole] = useState('ADMIN'); // ADMIN (Lead Therapist) vs STAFF (Colleghi)
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
      // Se l'utente non esiste in Supabase Auth, tenta la registrazione automatica come ADMIN
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
            // Riprova il login subito dopo il signup
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl mb-4 text-cyan-400 shadow-lg shadow-cyan-500/5">
            <Activity className="w-9 h-9 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            ACL-RTS <span className="text-cyan-400">Monitor Pro</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Piattaforma Medicale per la Valutazione Biomeccanica e Return to Sport Post-LCA
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className={`mb-6 p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          isSupabaseConfigured 
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 flex-shrink-0" />
            <span>
              {isSupabaseConfigured 
                ? 'Connesso al Database Live Supabase' 
                : 'Modalità Sviluppo Locale'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onOpenSqlModal}
            className="underline hover:text-white transition-colors flex-shrink-0 font-semibold"
          >
            Script SQL
          </button>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Accesso Riservato Staff Medico</h2>
          </div>

          {infoMsg && (
            <div className="mb-6 p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Operatore
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fisioterapista@clinic.it"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            {/* Role Selection (RBAC) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Ruolo Operativo (RBAC)</span>
                <span className="text-[10px] text-cyan-400 font-normal">Supabase RBAC</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    role === 'ADMIN'
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 mt-0.5 ${role === 'ADMIN' ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs">ADMIN</div>
                    <div className="text-[10px] opacity-75">Lead Therapist</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    role === 'STAFF'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <KeyRound className={`w-4 h-4 mt-0.5 ${role === 'STAFF' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-xs">STAFF</div>
                    <div className="text-[10px] opacity-75">Colleghi (Mobile)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Audit Log Notice */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Audit Log Attivo:</strong> Data, ora e ID utente verranno salvati su tabella <code className="text-cyan-300">audit_logs</code> ad ogni accesso.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-200 disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
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

        <p className="text-center text-xs text-slate-500 mt-6">
          Conforme alle linee guida di monitoraggio biomeccanico e profilazione Return to Sport post-LCA.
        </p>
      </div>
    </div>
  );
}
