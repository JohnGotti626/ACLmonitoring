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
    <div className="min-h-screen bg-stone-200/70 flex flex-col justify-center items-center p-4 relative overflow-hidden text-stone-800">
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-900/10 border border-emerald-300/40 rounded-2xl mb-3 text-emerald-800 shadow-none">
            <Activity className="w-8 h-8 text-emerald-800" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800 tracking-tight">
            ACL-RTS <span className="text-emerald-800">Monitor Pro</span>
          </h1>
          <p className="text-stone-500 font-medium text-xs sm:text-sm mt-1">
            Piattaforma Medicale per la Valutazione Biomeccanica e Return to Sport Post-LCA
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className={`mb-5 p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-none ${
          isSupabaseConfigured 
            ? 'bg-emerald-900/10 border-emerald-300/40 text-emerald-800' 
            : 'bg-amber-900/10 border-amber-300/50 text-amber-800'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            <Database className="w-4 h-4 flex-shrink-0 text-emerald-800" />
            <span>
              {isSupabaseConfigured 
                ? 'Connesso al Database Live Supabase' 
                : 'Modalità Sviluppo Locale'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onOpenSqlModal}
            className="underline hover:text-stone-900 transition-colors flex-shrink-0 font-semibold cursor-pointer"
          >
            Script SQL
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-stone-50 p-7 rounded-xl shadow-none border border-stone-300/70">
          <div className="flex items-center gap-2 mb-5 pb-3.5 border-b border-stone-300/70">
            <div className="p-1 bg-stone-200/60 text-stone-700 rounded">
              <ShieldCheck className="w-4 h-4 text-stone-700" />
            </div>
            <h2 className="text-base font-semibold text-stone-800">Accesso Riservato Staff Medico</h2>
          </div>

          {infoMsg && (
            <div className="mb-5 p-3 bg-emerald-900/10 border border-emerald-300/40 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-800 flex-shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 bg-rose-900/10 border border-rose-300/50 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                Email Operatore
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fisioterapista@clinic.it"
                  className="w-full bg-stone-100 border border-stone-300/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-stone-100 border border-stone-300/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-all"
                />
              </div>
            </div>

            {/* Role Selection (RBAC) */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Ruolo Operativo (RBAC)</span>
                <span className="text-[10px] text-emerald-800 font-semibold">Supabase RBAC</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    role === 'ADMIN'
                      ? 'bg-emerald-900/10 border-emerald-500 text-stone-800'
                      : 'bg-stone-100 border-stone-300/70 text-stone-600 hover:bg-stone-200/50'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 mt-0.5 ${role === 'ADMIN' ? 'text-emerald-800' : 'text-stone-400'}`} />
                  <div>
                    <div className="font-semibold text-xs">ADMIN</div>
                    <div className="text-[10px] text-stone-500">Lead Therapist</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    role === 'STAFF'
                      ? 'bg-emerald-900/10 border-emerald-500 text-stone-800'
                      : 'bg-stone-100 border-stone-300/70 text-stone-600 hover:bg-stone-200/50'
                  }`}
                >
                  <KeyRound className={`w-4 h-4 mt-0.5 ${role === 'STAFF' ? 'text-emerald-800' : 'text-stone-400'}`} />
                  <div>
                    <div className="font-semibold text-xs">STAFF</div>
                    <div className="text-[10px] text-stone-500">Colleghi (Mobile)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Audit Log Notice */}
            <div className="p-3 bg-stone-100 rounded-xl border border-stone-300/70 text-[11px] text-stone-600 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Audit Log Attivo:</strong> Data, ora e ID utente verranno salvati su tabella <code className="text-emerald-800 font-semibold">audit_logs</code> ad ogni accesso.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-900 text-stone-100 font-semibold rounded-xl shadow-none transition-all duration-200 disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
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

        <p className="text-center text-xs text-stone-500 font-medium mt-6">
          Piattaforma di monitoraggio biomeccanico per il Return to Sport post-LCA.
        </p>
      </div>
    </div>
  );
}
