// WorkoutPage.tsx — Onglet Séances FitPro
// Programme complet depuis generateSportPlan (IA), journal de séance interactif

import { useState, useRef, useCallback } from 'react';
import { Dumbbell, ChevronRight, ChevronDown, ChevronUp, Clock, Target, Check, Plus, Minus, RefreshCw, Sparkles, X, RotateCcw } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAgent } from '../hooks/useAgent';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AiExercise {
  id?: string;
  name: string;
  sets: number;
  reps: string;
  weight_kg?: number;
  rest_sec?: number;
  progression?: string;
  notes?: string;
}

interface AiDay {
  day: string;
  type: string;
  name: string;
  duration_min: number;
  exercises: AiExercise[];
}

interface AiWeek {
  week_number: number;
  theme: string;
  days: AiDay[];
}

interface SetLog {
  reps: number;
  weight: number;
  done: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTypeColor(type: string): { bg: string; border: string; text: string; badge: string } {
  const map: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    strength: { bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.25)', text: '#FF6B35', badge: 'rgba(255,107,53,0.15)' },
    cardio:   { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  text: '#3B82F6', badge: 'rgba(59,130,246,0.15)' },
    hiit:     { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444', badge: 'rgba(239,68,68,0.15)' },
    rest:     { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.4)', badge: 'rgba(255,255,255,0.06)' },
    yoga:     { bg: 'rgba(168,85,247,0.08)',  border: 'rgba(168,85,247,0.25)',  text: '#a855f7', badge: 'rgba(168,85,247,0.15)' },
    sport:    { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   text: '#22C55E', badge: 'rgba(34,197,94,0.15)' },
  };
  return map[type] ?? map.strength;
}

const TYPE_LABELS: Record<string, string> = {
  strength: 'Musculation', cardio: 'Cardio', hiit: 'HIIT',
  rest: 'Repos', yoga: 'Yoga', sport: 'Sport',
};

// ─── Composant ExerciseCard ───────────────────────────────────────────────────

function ExerciseCard({ exercise, expanded, onToggle }: {
  exercise: AiExercise;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [sets, setSets] = useState<SetLog[]>(() =>
    Array.from({ length: exercise.sets }, () => ({
      reps: parseInt(exercise.reps) || 10,
      weight: exercise.weight_kg ?? 0,
      done: false,
    }))
  );

  const toggleSet = (idx: number) => {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, done: !s.done } : s));
  };

  const updateSet = (idx: number, field: 'reps' | 'weight', delta: number) => {
    setSets(prev => prev.map((s, i) => i === idx ? {
      ...s,
      [field]: Math.max(0, (s[field] as number) + delta),
    } : s));
  };

  const doneCount = sets.filter(s => s.done).length;
  const allDone = doneCount === sets.length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={onToggle}
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: allDone ? 'rgba(34,197,94,0.2)' : 'rgba(255,107,53,0.12)' }}>
          {allDone
            ? <Check size={16} style={{ color: '#22C55E' }} />
            : <Dumbbell size={16} style={{ color: '#FF6B35' }} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
            {exercise.name}
          </p>
          <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
            {exercise.sets} × {exercise.reps}
            {exercise.weight_kg ? ` · ${exercise.weight_kg} kg` : ''}
            {exercise.rest_sec ? ` · ${exercise.rest_sec}s repos` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
            {doneCount}/{sets.length}
          </span>
          {expanded ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {exercise.notes && (
            <p className="text-white/40 text-xs italic mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              {exercise.notes}
            </p>
          )}
          {sets.map((set, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: set.done ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${set.done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}` }}
            >
              <span className="text-white/40 text-xs w-12 flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                Série {idx + 1}
              </span>
              {/* Reps */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => updateSet(idx, 'reps', -1)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Minus size={10} className="text-white/60" />
                </button>
                <span className="text-white text-sm font-bold w-8 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>{set.reps}</span>
                <button onClick={() => updateSet(idx, 'reps', 1)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Plus size={10} className="text-white/60" />
                </button>
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>reps</span>
              </div>
              {/* Poids */}
              {exercise.weight_kg !== undefined && exercise.weight_kg > 0 && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateSet(idx, 'weight', -2.5)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Minus size={10} className="text-white/60" />
                  </button>
                  <span className="text-white text-sm font-bold w-10 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>{set.weight}</span>
                  <button onClick={() => updateSet(idx, 'weight', 2.5)} className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <Plus size={10} className="text-white/60" />
                  </button>
                  <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>kg</span>
                </div>
              )}
              <div className="flex-1" />
              <button
                onClick={() => toggleSet(idx)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                style={{ background: set.done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${set.done ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}` }}
              >
                <Check size={14} style={{ color: set.done ? '#22C55E' : 'rgba(255,255,255,0.3)' }} />
              </button>
            </div>
          ))}
          {exercise.progression && (
            <p className="text-white/30 text-xs mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              📈 Progression : {exercise.progression}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Composant SessionView ────────────────────────────────────────────────────

function SessionView({ day, onClose }: { day: AiDay; onClose: () => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const colors = getTypeColor(day.type);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      {/* Header */}
      <div className="relative p-5 pt-8" style={{ background: `linear-gradient(135deg, ${colors.bg.replace('0.08', '0.15')}, transparent)`, borderBottom: `1px solid ${colors.border}` }}>
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X size={16} className="text-white/60" />
        </button>
        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: colors.text, fontFamily: 'Inter, sans-serif' }}>
          {day.day} · {TYPE_LABELS[day.type] ?? day.type}
        </p>
        <h2 className="text-white text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
          {day.name}
        </h2>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-white/40" />
            <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>~{day.duration_min} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Dumbbell size={13} className="text-white/40" />
            <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{day.exercises.length} exercices</span>
          </div>
        </div>
      </div>

      {/* Exercices */}
      <div className="px-4 pt-4 space-y-3">
        {day.type === 'rest' ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white/50 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              Journée de repos — récupération active, étirements légers, hydratation.
            </p>
          </div>
        ) : (
          day.exercises.map((ex, idx) => (
            <ExerciseCard
              key={idx}
              exercise={ex}
              expanded={expandedIdx === idx}
              onToggle={() => setExpandedIdx(prev => prev === idx ? null : idx)}
            />
          ))
        )}
      </div>

      {/* Bouton terminer */}
      {day.type !== 'rest' && day.exercises.length > 0 && (
        <div className="px-4 mt-6">
          <button
            onClick={() => { toast.success('Séance terminée ! 💪'); onClose(); }}
            className="w-full py-4 rounded-2xl font-bold text-white text-base"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)', fontFamily: 'Syne, sans-serif', boxShadow: '0 8px 30px rgba(255,107,53,0.25)' }}
          >
            Terminer la séance
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function WorkoutPage() {
  const { profile, aiSportPlan, setAiSportPlan } = useUserProfile();
  const { generateSportPlan } = useAgent();
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<AiDay | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number>(0);

  const handleGenerate = async () => {
    if (!profile) {
      toast.error('Complète l\'onboarding d\'abord pour générer un programme');
      return;
    }
    setGenerating(true);
    toast.loading('Claude génère ton programme sport…', { id: 'gen-sport' });
    try {
      const plan = await generateSportPlan.mutateAsync(profile);
      setAiSportPlan({
        program_name: (plan as { program_name?: string }).program_name ?? 'Mon Programme IA',
        goal_statement: (plan as { goal_statement?: string }).goal_statement ?? '',
        weeks: (plan as { weeks: unknown[] }).weeks,
      });
      toast.success('Programme généré !', { id: 'gen-sport' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error('Erreur : ' + msg, { id: 'gen-sport' });
    } finally {
      setGenerating(false);
    }
  };

  if (selectedDay) {
    return <SessionView day={selectedDay} onClose={() => setSelectedDay(null)} />;
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      {/* Header */}
      <div className="p-5 pt-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Séances</h1>
          {aiSportPlan && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
            >
              {generating ? <RefreshCw size={12} className="animate-spin" /> : <RotateCcw size={12} />}
              Recréer
            </button>
          )}
        </div>
        {aiSportPlan && (
          <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {aiSportPlan.program_name}
          </p>
        )}
      </div>

      <div className="px-4 space-y-4">
        {/* Pas de plan */}
        {!aiSportPlan && !generating && (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)' }}>
              <Sparkles size={24} className="text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
              Aucun programme généré
            </h3>
            <p className="text-white/50 text-sm mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
              {profile
                ? 'Génère ton programme sport personnalisé par Claude.'
                : 'Complète l\'onboarding pour générer un programme personnalisé.'}
            </p>
            {profile && (
              <button
                onClick={handleGenerate}
                className="px-6 py-3 rounded-2xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)', fontFamily: 'Syne, sans-serif' }}
              >
                Générer mon programme
              </button>
            )}
          </div>
        )}

        {/* Génération en cours */}
        {generating && (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)' }}>
            <RefreshCw size={28} className="animate-spin mx-auto mb-3" style={{ color: '#FF6B35' }} />
            <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Claude génère ton programme…</p>
            <p className="text-white/40 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Quelques secondes</p>
          </div>
        )}

        {/* Plan IA */}
        {aiSportPlan && !generating && (
          <>
            {/* Objectif */}
            {aiSportPlan.goal_statement && (
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)' }}>
                <div className="flex items-center gap-2">
                  <Target size={14} style={{ color: '#FF6B35' }} />
                  <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {aiSportPlan.goal_statement}
                  </p>
                </div>
              </div>
            )}

            {/* Semaines */}
            {(aiSportPlan.weeks as AiWeek[]).map((week, wIdx) => (
              <div key={wIdx} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* Header semaine */}
                <button
                  className="w-full flex items-center justify-between p-4"
                  onClick={() => setExpandedWeek(prev => prev === wIdx ? -1 : wIdx)}
                >
                  <div>
                    <p className="text-white font-bold text-sm text-left" style={{ fontFamily: 'Syne, sans-serif' }}>
                      Semaine {week.week_number}
                    </p>
                    <p className="text-white/40 text-xs text-left" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {week.theme}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>
                      {week.days.filter(d => d.type !== 'rest').length} séances
                    </span>
                    {expandedWeek === wIdx ? <ChevronUp size={14} className="text-white/40" /> : <ChevronDown size={14} className="text-white/40" />}
                  </div>
                </button>

                {/* Jours */}
                {expandedWeek === wIdx && (
                  <div className="px-4 pb-4 space-y-2">
                    {week.days.map((day, dIdx) => {
                      const c = getTypeColor(day.type);
                      return (
                        <button
                          key={dIdx}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:scale-98"
                          style={{ background: c.bg, border: `1px solid ${c.border}` }}
                          onClick={() => day.type !== 'rest' ? setSelectedDay(day) : toast('Jour de repos — pas de séance')}
                        >
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: c.badge }}>
                            <Dumbbell size={14} style={{ color: c.text }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {day.day} — {day.name}
                            </p>
                            <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                              {TYPE_LABELS[day.type] ?? day.type} · {day.duration_min} min
                              {day.exercises.length > 0 ? ` · ${day.exercises.length} exercices` : ''}
                            </p>
                          </div>
                          {day.type !== 'rest' && (
                            <ChevronRight size={14} style={{ color: c.text }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
