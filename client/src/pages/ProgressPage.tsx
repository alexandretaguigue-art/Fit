// DESIGN: "Coach Nocturne" — Page Progression
// Suivi des mensurations, graphiques de progression, historique des séances

import { useState } from 'react';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { programData } from '../lib/programData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, TrendingUp, Scale, Ruler } from 'lucide-react';
import { toast } from 'sonner';

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{
          background: 'rgba(20, 20, 28, 0.95)',
          border: '1px solid rgba(255, 107, 53, 0.3)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <p className="text-white/60 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: {p.value} {p.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function ProgressPage() {
  const { data, addProgressEntry, getExerciseProgress, getStats } = useFitnessTracker();
  const stats = getStats();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    weight: '',
    bodyFat: '',
    armCircumference: '',
    thighCircumference: '',
    waistCircumference: '',
  });

  const handleSubmit = () => {
    if (!form.weight) {
      toast.error('Le poids est requis');
      return;
    }
    addProgressEntry({
      date: new Date().toISOString(),
      weight: Number(form.weight),
      bodyFat: form.bodyFat ? Number(form.bodyFat) : undefined,
      armCircumference: form.armCircumference ? Number(form.armCircumference) : undefined,
      thighCircumference: form.thighCircumference ? Number(form.thighCircumference) : undefined,
      waistCircumference: form.waistCircumference ? Number(form.waistCircumference) : undefined,
    });
    setForm({ weight: '', bodyFat: '', armCircumference: '', thighCircumference: '', waistCircumference: '' });
    setShowForm(false);
    toast.success('Mesures enregistrées !');
  };

  const weightData = data.progressEntries.map(e => ({
    date: new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    Poids: e.weight,
  }));

  const armData = data.progressEntries
    .filter(e => e.armCircumference)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      Bras: e.armCircumference,
    }));

  const thighData = data.progressEntries
    .filter(e => e.thighCircumference)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      Cuisse: e.thighCircumference,
    }));

  // Progression sur le squat
  const squatProgress = getExerciseProgress('squat');
  const squatData = squatProgress.map(p => ({
    date: new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    'Squat max': p.maxWeight,
  }));

  // Progression sur les tractions
  const pullupProgress = getExerciseProgress('tractions');
  const pullupData = pullupProgress.map(p => ({
    date: new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    'Tractions lest': p.maxWeight,
  }));

  const hasData = data.progressEntries.length > 0;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Progression
            </h1>
            <p className="text-white/50 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Semaine {stats.currentWeek} / 12
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm text-white transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #FF6B35, #FF3366)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Plus size={16} />
            Mesures
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showForm && (
          <div
            className="rounded-2xl p-4 mb-5 animate-slide-up"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255, 107, 53, 0.2)' }}
          >
            <p className="text-white font-semibold text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              Nouvelles mesures
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'weight', label: 'Poids (kg)', required: true },
                { key: 'bodyFat', label: 'Masse grasse (%)', required: false },
                { key: 'armCircumference', label: 'Tour de bras (cm)', required: false },
                { key: 'thighCircumference', label: 'Tour de cuisse (cm)', required: false },
                { key: 'waistCircumference', label: 'Tour de taille (cm)', required: false },
              ].map(({ key, label, required }) => (
                <div key={key} className={key === 'weight' ? 'col-span-2' : ''}>
                  <label className="text-white/50 text-xs mb-1 block" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {label} {required && <span className="text-orange-400">*</span>}
                  </label>
                  <input
                    type="number"
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full text-white text-sm rounded-xl py-2.5 px-3"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                    step="0.1"
                    min="0"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white"
                style={{
                  background: 'linear-gradient(135deg, #FF6B35, #FF3366)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Enregistrer
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-white/60"
                style={{ background: 'rgba(255,255,255,0.06)', fontFamily: 'Inter, sans-serif' }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Stats résumé */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            {
              label: 'Séances totales',
              value: stats.totalSessions,
              unit: '',
              icon: TrendingUp,
              color: '#FF6B35',
            },
            {
              label: 'Volume total',
              value: stats.totalVolume > 0 ? `${Math.round(stats.totalVolume / 1000)}k` : '0',
              unit: 'kg',
              icon: Scale,
              color: '#3b82f6',
            },
            {
              label: 'Gain bras',
              value: stats.armGain > 0 ? `+${stats.armGain.toFixed(1)}` : stats.armGain.toFixed(1),
              unit: 'cm',
              icon: Ruler,
              color: '#22c55e',
            },
            {
              label: 'Gain cuisse',
              value: stats.thighGain > 0 ? `+${stats.thighGain.toFixed(1)}` : stats.thighGain.toFixed(1),
              unit: 'cm',
              icon: Ruler,
              color: '#a855f7',
            },
          ].map(({ label, value, unit, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Icon size={16} className="mb-2" style={{ color }} />
              <div className="flex items-baseline gap-1">
                <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Syne, sans-serif', color }}>
                  {value}
                </span>
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{unit}</span>
              </div>
              <p className="text-white/40 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</p>
            </div>
          ))}
        </div>

        {!hasData ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <TrendingUp size={32} className="mx-auto mb-3 text-white/20" />
            <p className="text-white/60 text-sm mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
              Aucune mesure enregistrée
            </p>
            <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              Ajoute tes premières mesures pour voir ta progression
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Graphique poids */}
            {weightData.length > 1 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-white/70 font-semibold text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Évolution du poids (kg)
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={weightData}>
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Poids" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Graphique bras */}
            {armData.length > 1 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-white/70 font-semibold text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Tour de bras (cm)
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={armData}>
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Bras" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Graphique cuisse */}
            {thighData.length > 1 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-white/70 font-semibold text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Tour de cuisse (cm)
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={thighData}>
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Cuisse" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Progression squat */}
            {squatData.length > 1 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <p className="text-white/70 font-semibold text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Squat — charge max (kg)
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={squatData}>
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Squat max" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Historique des séances */}
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                Historique des séances
              </p>
              <div className="space-y-2">
                {data.sessionLogs.slice().reverse().slice(0, 10).map((log, idx) => {
                  const session = programData.sessions.find(s => s.id === log.sessionId);
                  const date = new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
                  const completedExercises = log.exercises.filter(e => e.sets.some(s => s.completed)).length;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div>
                        <p className="text-white text-sm font-medium" style={{ fontFamily: 'Syne, sans-serif' }}>
                          {session?.name ?? log.sessionId}
                        </p>
                        <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {date} · S{log.weekNumber} · {completedExercises} exercices
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm font-bold"
                          style={{
                            color: log.perceivedDifficulty >= 8 ? '#22c55e' : log.perceivedDifficulty >= 6 ? '#eab308' : '#ef4444',
                            fontFamily: 'Syne, sans-serif',
                          }}
                        >
                          {log.perceivedDifficulty}/10
                        </p>
                        <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>difficulté</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
