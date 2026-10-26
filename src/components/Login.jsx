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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-900">
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-50 border border-emerald-200 rounded-2xl mb-3 text-emerald-700 shadow-sm">
            <Activity className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ACL-RTS <span className="text-emerald-600">Monitor Pro</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Piattaforma Medicale per la Valutazione Biomeccanica e Return to Sport Post-LCA
          </p>
        </div>

        {/* Supabase Status Banner */}
        <div className={`mb-5 p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
          isSupabaseConfigured 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            <Database className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>
              {isSupabaseConfigured 
                ? 'Connesso al Database Live Supabase' 
                : 'Modalità Sviluppo Locale'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onOpenSqlModal}
            className="underline hover:text-emerald-950 transition-colors flex-shrink-0 font-bold cursor-pointer"
          >
            Script SQL
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-white p-7 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-5 pb-3.5 border-b border-slate-200">
            <div className="p-1 bg-slate-100 text-slate-600 rounded">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Accesso Riservato Staff Medico</h2>
          </div>

          {infoMsg && (
            <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{infoMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
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
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
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
                  className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
                />
              </div>
            </div>

            {/* Role Selection (RBAC) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Ruolo Operativo (RBAC)</span>
                <span className="text-[10px] text-emerald-700 font-semibold">Supabase RBAC</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    role === 'ADMIN'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 mt-0.5 ${role === 'ADMIN' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-xs">ADMIN</div>
                    <div className="text-[10px] text-slate-500">Lead Therapist</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('STAFF')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                    role === 'STAFF'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-600/30'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <KeyRound className={`w-4 h-4 mt-0.5 ${role === 'STAFF' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="font-bold text-xs">STAFF</div>
                    <div className="text-[10px] text-slate-500">Colleghi (Mobile)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Audit Log Notice */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Audit Log Attivo:</strong> Data, ora e ID utente verranno salvati su tabella <code className="text-emerald-700 font-semibold">audit_logs</code> ad ogni accesso.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer"
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
          Conforme alle linee guida NSCA CSCS, Turner, Bishop &amp; Aspetar per il Return to Sport post-LCA.
        </p>
      </div>
    </div>
  );
}
