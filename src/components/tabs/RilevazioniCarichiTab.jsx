import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  QrCode,
  Send,
  Smartphone,
  Copy,
  CheckCircle2,
  RefreshCw,
  Clock,
  MessageSquare,
  Calendar,
  ExternalLink,
  Mail,
  TrendingUp,
  Search
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getCategoryIcon } from '../ClientPortal';

export default function RilevazioniCarichiTab({
  patient,
  onOpenSimulation
}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Modal / Pannello Generatore Magic Link & QR Code
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [patientEmail, setPatientEmail] = useState(patient?.email || '');
  const [sendingMagicLink, setSendingMagicLink] = useState(false);
  const [magicLinkStatus, setMagicLinkStatus] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // URL diretto al Portale Paziente Mobile per questo specifico paziente
  const clientPortalUrl = `${window.location.origin}/?portal=client&patientId=${patient?.id || ''}`;

  // Caricamento rilevazioni carichi da Supabase ('workout_logs') + Realtime Sync
  const fetchPatientWorkoutLogs = async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('patient_id', patient.id)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          setLogs(data);
          setLoading(false);
          return;
        }
      }

      // Fallback locale o dati pre-caricati di esempio clinico
      const localKey = `acl_workout_logs_${patient.id}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setLogs(JSON.parse(saved));
      } else if (Array.isArray(patient?.workout_logs) && patient.workout_logs.length > 0) {
        setLogs(patient.workout_logs);
      } else {
        // Seed iniziale dimostrativo per mostrare subito la struttura al terapista
        const demoSeed = [
          {
            id: 'seed-1',
            patient_id: patient.id,
            exercise_name: 'Trap Bar Deadlift',
            category_icon: 'press',
            sets: 4,
            reps: 6,
            weight_kg: 95,
            tempo_execution: 'Esplosivo (0.68 m/s)',
            notes_rpe: 'Nessun dolore (0/10) - RPE 7.5/10',
            created_at: new Date(Date.now() - 86400000 * 1).toISOString()
          },
          {
            id: 'seed-2',
            patient_id: patient.id,
            exercise_name: 'Bulgarian Split Squat',
            category_icon: 'lunge',
            sets: 3,
            reps: 8,
            weight_kg: 44,
            tempo_execution: '3-1-1-0',
            notes_rpe: 'Stabilità ottima, zero fastidio rotuleo',
            created_at: new Date(Date.now() - 86400000 * 3).toISOString()
          },
          {
            id: 'seed-3',
            patient_id: patient.id,
            exercise_name: 'Leg Extension Monopodalica',
            category_icon: 'knee',
            sets: 4,
            reps: 10,
            weight_kg: 35,
            tempo_execution: '2-2-1-0',
            notes_rpe: 'Fatica muscolare 8/10, nessun dolore articolare',
            created_at: new Date(Date.now() - 86400000 * 5).toISOString()
          }
        ];
        setLogs(demoSeed);
      }
    } catch (err) {
      console.error('Errore lettura workout_logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientWorkoutLogs();

    if (!isSupabaseConfigured || !patient?.id) return;

    const channel = supabase
      .channel(`workout_logs_${patient.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_logs',
          filter: `patient_id=eq.${patient.id}`
        },
        () => {
          fetchPatientWorkoutLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patient?.id]);

  // Invio Magic Link (OTP via Email) tramite Supabase Auth direttamente dalla scheda Terapista
  const handleSendMagicLinkToPatient = async (e) => {
    e.preventDefault();
    if (!patientEmail.trim()) return;
    setSendingMagicLink(true);
    setMagicLinkStatus('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: patientEmail.trim(),
        options: {
          emailRedirectTo: clientPortalUrl,
          data: {
            role: 'patient',
            patient_id: patient?.id
          }
        }
      });

      if (error) {
        setMagicLinkStatus(`⚠️ Errore Supabase: ${error.message}`);
      } else {
        setMagicLinkStatus(`✅ Magic Link inviato con successo a ${patientEmail}!`);
      }
    } catch (err) {
      setMagicLinkStatus(`⚠️ Eccezione invio: ${err.message}`);
    } finally {
      setSendingMagicLink(false);
    }
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(clientPortalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Ciao ${patient?.nome || ''}! Ecco il tuo link personale per compilare il Diario Allenamento LCA da smartphone: ${clientPortalUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredLogs = logs.filter(l =>
    !searchFilter.trim() ||
    l.exercise_name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    l.notes_rpe?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIORE TERAPISTA: AZIONI RAPIDE (MAGIC LINK / QR CODE & SIMULA VISTA PAZIENTE) */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-700/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white tracking-tight">
              Rilevazioni Carichi Remoti & Diario Paziente
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-extrabold">
              Realtime Cloud Sync
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Monitora i carichi (Kg), le serie, la velocità esecutiva e i feedback sul dolore inseriti da smartphone da <strong>{patient?.nome} {patient?.cognome}</strong>.
          </p>
        </div>

        {/* PULSANTI GENERATORE LINK/QR E TEST RAPIDO TERAPISTA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/40 font-extrabold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Genera Link Invito / Magic Link</span>
          </button>

          <button
            type="button"
            onClick={onOpenSimulation}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Simula Vista Paziente / Test Rapido</span>
          </button>
        </div>
      </div>

      {/* STATISTICHE SINTETICHE DEI CARICHI DEL PAZIENTE */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Sessioni Registrate</span>
            <div className="text-2xl font-black text-white mt-0.5">{logs.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Picco Massimo Registrato</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5 font-mono">
              {logs.length > 0 ? `${Math.max(...logs.map(l => Number(l.weight_kg) || 0))} kg` : 'N/D'}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ultimo Esercizio Inviato</span>
            <div className="text-sm font-black text-white mt-1 truncate max-w-[180px]">
              {logs[0]?.exercise_name || 'Nessun dato'}
            </div>
          </div>
          <button
            type="button"
            onClick={fetchPatientWorkoutLogs}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
            title="Aggiorna ora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* TABELLA CRONOLOGICA RILEVAZIONI CARICHI INSERITE DAL PAZIENTE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span>Registro Cronologico Esercizi & Carichi</span>
          </h4>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtra per esercizio o nota..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px] font-extrabold tracking-wider">
                <th className="py-3 px-4">Data & Ora</th>
                <th className="py-3 px-4">Esercizio</th>
                <th className="py-3 px-4 text-center">Serie × Rip</th>
                <th className="py-3 px-4 text-center">Carico (Kg)</th>
                <th className="py-3 px-4">Velocità / Tempo</th>
                <th className="py-3 px-4">Note Dolore / RPE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 italic">
                    Nessuna rilevazione carico trovata. Usa "Simula Vista Paziente" per fare un test rapido!
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}{' '}
                      <span className="text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString('it-IT', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                          {getCategoryIcon(log.category_icon)}
                        </div>
                        <span className="font-extrabold text-white">{log.exercise_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                      {log.sets} × {log.reps}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-mono font-black text-xs">
                        {log.weight_kg} kg
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {log.tempo_execution || 'Standard'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{log.notes_rpe || 'Nessun dolore'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GENERATORE DI LINK / QR CODE E INVIO MAGIC LINK */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">
                  Invito Portale Mobile — {patient?.nome} {patient?.cognome}
                </h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                Chiudi ✕
              </button>
            </div>

            {/* SEZIONE 1: QR CODE DAL VIVO PER SMARTPHONE */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <div className="bg-white p-2.5 rounded-2xl shrink-0 shadow-md">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(clientPortalUrl)}`}
                  alt="QR Code Portale Paziente"
                  className="w-32 h-32 rounded-lg"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-extrabold uppercase">
                  Scansione Diretta in Studio
                </span>
                <h4 className="text-sm font-extrabold text-white">
                  Fai inquadrare il QR Code al Paziente
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Il paziente apre direttamente la sua vista mobile su smartphone e può salvarla sulla schermata Home.
                </p>
              </div>
            </div>

            {/* SEZIONE 2: COPIA LINK O INVIA SU WHATSAPP */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Link Diretto Portale Paziente:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={clientPortalUrl}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300"
                />
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiato!' : 'Copia'}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Invia su WhatsApp</span>
                </button>
              </div>
            </div>

            {/* SEZIONE 3: INVIA MAGIC LINK OTP VIA EMAIL TRAMITE SUPABASE */}
            <form onSubmit={handleSendMagicLinkToPatient} className="pt-3 border-t border-slate-800 space-y-2.5">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Oppure invia Magic Link ufficiale (OTP via Email):</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="email.paziente@esempio.it"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={sendingMagicLink}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMagicLink ? 'Invio...' : 'Invia Email'}</span>
                </button>
              </div>
              {magicLinkStatus && (
                <p className="text-[11px] font-semibold text-emerald-400 pt-1">
                  {magicLinkStatus}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
