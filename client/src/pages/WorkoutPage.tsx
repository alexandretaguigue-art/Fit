// DESIGN: "Coach Nocturne" — Dark Mode Premium Fitness
// Journal interactif avec scoring, jugement des charges, alternatives
// Cycle 14 jours : musculation, football, course, vélo, repos

import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { ChevronDown, ChevronUp, Check, ArrowUp, ArrowRight, ArrowDown, Dumbbell, Clock, Zap, Bike, Flame, Target } from 'lucide-react';
import { programData, cycle14Days, getCycleDayForDate, getSessionForCycleDay, getSessionForPhase } from '../lib/programData';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import ScoreRing from '../components/ScoreRing';
import SessionTimeline from '../components/SessionTimeline';
import type { SessionLog, WorkoutSession, Exercise, FootballDrill } from '../lib/programData';
import { toast } from 'sonner';

const ARMS_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/arms-workout-2RWQ6DDsWG2NyCDojBoRnV.webp";
const LEGS_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/legs-workout-FPHHWKCXVWXNSCVHGWmz2h.webp";
const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/hero-fitness-5h7p34NBzccTy9ggEni2uM.webp";

const SESSION_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  gym:      { bg: 'rgba(255,107,53,0.08)',  border: 'rgba(255,107,53,0.25)',  text: '#FF6B35', badge: 'rgba(255,107,53,0.15)' },
  football: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   text: '#22C55E', badge: 'rgba(34,197,94,0.15)' },
  running:  { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  text: '#3B82F6', badge: 'rgba(59,130,246,0.15)' },
  cycling:  { bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.25)',  text: '#14B8A6', badge: 'rgba(20,184,166,0.15)' },
  rest:     { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.4)', badge: 'rgba(255,255,255,0.06)' },
};

// ============================================================
// SESSION LIST (liste simple — pas de carousel)
// ============================================================

function SessionList({
  cycleDayToday,
  sessionImages,
  onSelectSession,
  data,
}: {
  cycleDayToday: number;
  sessionImages: Record<string, string>;
  onSelectSession: (s: WorkoutSession) => void;
  data: { startDate?: string | null };
}) {
  const validDays = cycle14Days.filter(d => getSessionForCycleDay(d.dayNumber));

  const sessionImgMap: Record<string, string> = {
    gym: sessionImages.upper_a,
    football: sessionImages.football,
    running: sessionImages.running_endurance,
    cycling: sessionImages.cycling,
    rest: sessionImages.rest,
  };

  return (
    <div>
      <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Toutes les séances</p>
      <div className="space-y-3">
        {validDays.map((cycleDay) => {
          const session = getSessionForCycleDay(cycleDay.dayNumber)!;
          const colors = SESSION_TYPE_COLORS[cycleDay.type];
          const isToday = data.startDate && cycleDay.dayNumber === cycleDayToday;
          const img = sessionImgMap[cycleDay.type] || sessionImages.rest;
          return (
            <div
              key={cycleDay.dayNumber}
              onClick={() => onSelectSession(session)}
              className="rounded-2xl overflow-hidden cursor-pointer active:scale-98 transition-all duration-200"
              style={{
                border: isToday ? `2px solid ${colors.text}60` : '1px solid rgba(255,255,255,0.08)',
                background: '#16161E',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {/* Miniature photo à gauche */}
                <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0, overflow: 'hidden', borderRadius: '16px 0 0 16px' }}>
                  <img src={img} alt={session.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${colors.text}30, transparent)` }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22 }}>{cycleDay.icon}</span>
                  </div>
                </div>
                {/* Contenu texte */}
                <div style={{ flex: 1, padding: '12px 14px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: colors.text, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>J{cycleDay.dayNumber}</span>
                    {isToday && (
                      <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: `${colors.text}20`, color: colors.text, fontFamily: 'Inter, sans-serif', fontWeight: 700 }}>Aujourd'hui</span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{session.focus} · {session.durationMin} min</div>
                </div>
                {/* Flèche droite */}
                <div style={{ paddingRight: 14, color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// EXERCISE CARD (Musculation)
// ============================================================

interface SetData { weight: number; reps: number; completed: boolean; }
interface ExerciseLog { exerciseId: string; sets: SetData[]; alternativeUsed?: string; notes?: string; }

function ExerciseCard({ exercise, onLog, lastLog, adaptation, draftSets, onDraftChange }: {
  exercise: Exercise;
  onLog: (log: ExerciseLog) => void;
  lastLog?: ExerciseLog;
  adaptation?: import('../lib/adaptationEngine').AdaptationResult | null;
  draftSets?: SetData[] | null;
  onDraftChange?: (exerciseId: string, sets: SetData[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAlt, setShowAlt] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  // Minuteur de repos
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTotal, setRestTotal] = useState(90);
  const restIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const startRestTimer = useCallback((seconds: number) => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTotal(seconds);
    setRestTimer(seconds);
    // Vibration si disponible
    if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    restIntervalRef.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(restIntervalRef.current!);
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200, 100, 200]);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopRestTimer = useCallback(() => {
    if (restIntervalRef.current) clearInterval(restIntervalRef.current);
    setRestTimer(null);
  }, []);

  useEffect(() => () => { if (restIntervalRef.current) clearInterval(restIntervalRef.current); }, []);
  const baseWeight = adaptation?.suggestedWeight ?? lastLog?.sets[0]?.weight ?? exercise.defaultWeight ?? 0;
  const suggestedRepsMin = adaptation?.suggestedRepsMin ?? exercise.repsMin;

  // Initialise les séries depuis le draft persisté, sinon depuis le setScheme/adaptation
  const [sets, setSets] = useState<SetData[]>(() => {
    if (draftSets && draftSets.length > 0) return draftSets;
    if (exercise.setScheme && exercise.setScheme.length > 0) {
      return exercise.setScheme.map(s => ({
        weight: s.weightMultiplier === 0 ? 0 : Math.round((baseWeight * s.weightMultiplier) / 2.5) * 2.5,
        reps: s.reps,
        completed: false,
      }));
    }
    return Array.from({ length: adaptation?.suggestedSets ?? exercise.sets }, () => ({
      weight: baseWeight, reps: suggestedRepsMin, completed: false,
    }));
  });

  const displayScore = selectedAlt
    ? exercise.alternatives.find(a => a.name === selectedAlt)?.relevanceScore ?? exercise.relevanceScore
    : exercise.relevanceScore;
  const allCompleted = sets.every(s => s.completed);
  const completedCount = sets.filter(s => s.completed).length;

  // Sauvegarde immédiate dans le draft à chaque modification
  const persistSets = useCallback((newSets: SetData[]) => {
    onDraftChange?.(exercise.id, newSets);
  }, [exercise.id, onDraftChange]);

  const updateSet = (idx: number, field: 'weight' | 'reps', value: number) => {
    setSets(prev => {
      const next = prev.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      persistSets(next);
      return next;
    });
  };
  const toggleSet = (idx: number) => {
    setSets(prev => {
      const next = prev.map((s, i) => i === idx ? { ...s, completed: !s.completed } : s);
      persistSets(next);
      // Démarrer le minuteur de repos si on vient de cocher une série
      const wasCompleted = prev[idx]?.completed;
      if (!wasCompleted) {
        // Durée selon le type d'exercice
        const restSeconds = exercise.repsMax !== null && exercise.repsMin <= 6 ? 120
          : exercise.repsMax !== null && exercise.repsMin <= 10 ? 90
          : 60;
        startRestTimer(restSeconds);
      } else {
        stopRestTimer();
      }
      return next;
    });
  };
  const handleSave = () => {
    onLog({ exerciseId: exercise.id, sets, alternativeUsed: selectedAlt ?? undefined });
    toast.success(`${selectedAlt ?? exercise.name} enregistré !`);
  };

  const repsLabel = exercise.repsMax === null
    ? `${exercise.repsMin}s`
    : exercise.repsMin === exercise.repsMax ? `${exercise.repsMin}` : `${exercise.repsMin}-${exercise.repsMax}`;

  const adaptBadge = adaptation
    ? adaptation.direction === 'increase_weight' ? { icon: <ArrowUp size={10} />, color: '#22c55e', label: `↑ ${adaptation.suggestedWeight}kg` }
    : adaptation.direction === 'increase_reps' ? { icon: <ArrowUp size={10} />, color: '#84cc16', label: `↑ reps` }
    : adaptation.direction === 'decrease' ? { icon: <ArrowDown size={10} />, color: '#ef4444', label: `↓ ${adaptation.suggestedWeight}kg` }
    : { icon: <ArrowRight size={10} />, color: '#eab308', label: 'Maintien' }
    : null;

  const hasMedia = !!(exercise.imageUrl || exercise.videoUrl);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Minuteur de repos */}
      {restTimer !== null && (
        <div style={{
          borderRadius: 16, padding: '12px 14px',
          background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
            <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,107,53,0.15)" strokeWidth="3.5" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#FF6B35" strokeWidth="3.5"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - restTimer / restTotal)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FF6B35', fontWeight: 700, fontSize: 13, fontFamily: 'Syne, sans-serif'
            }}>{restTimer}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#FF6B35', fontWeight: 600, fontSize: 13, fontFamily: 'Syne, sans-serif', margin: 0 }}>Repos en cours</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontFamily: 'Inter, sans-serif', margin: 0 }}>Prochaine série dans {restTimer}s</p>
          </div>
          <button onClick={stopRestTimer} style={{
            color: 'rgba(255,255,255,0.4)', fontSize: 11, padding: '5px 10px', borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', cursor: 'pointer'
          }}>Passer</button>
        </div>
      )}

      {/* Séries — layout 2 lignes clair */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sets.map((set, idx) => {
          const labelColor = exercise.setScheme?.[idx]?.label
            ? (idx === 0 ? '#94a3b8' : idx === (exercise.setScheme?.length ?? 0) - 1 ? '#fb923c' : '#FF6B35')
            : 'rgba(255,255,255,0.35)';
          const label = exercise.setScheme?.[idx]?.label ?? `Série ${idx + 1}`;
          const note = exercise.setScheme?.[idx]?.note;

          return (
            <div
              key={idx}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                border: set.completed ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.07)',
                background: set.completed ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
              }}
            >
              {/* Ligne 1 : label + note + bouton check */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px 6px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: labelColor,
                    fontFamily: 'Syne, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}>{label}</span>
                  {note && !set.completed && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>— {note}</span>
                  )}
                </div>
                <button
                  onClick={() => toggleSet(idx)}
                  style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: set.completed ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)',
                    border: set.completed ? '2px solid rgba(34,197,94,0.6)' : '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {set.completed
                    ? <Check size={14} color="#22C55E" />
                    : <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>{idx + 1}</span>
                  }
                </button>
              </div>

              {/* Ligne 2 : poids + reps */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                padding: '4px 14px 12px 14px',
              }}>
                {/* Poids */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <button
                    onClick={() => updateSet(idx, 'weight', Math.max(0, set.weight - 2.5))}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none',
                      background: 'rgba(255,255,255,0.09)', color: '#fff',
                      fontSize: 20, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}
                  >−</button>
                  <div style={{ textAlign: 'center', minWidth: 52 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>{set.weight}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', marginLeft: 2 }}>kg</span>
                  </div>
                  <button
                    onClick={() => updateSet(idx, 'weight', set.weight + 2.5)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none',
                      background: 'rgba(255,255,255,0.09)', color: '#fff',
                      fontSize: 20, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}
                  >+</button>
                </div>

                {/* Diviseur */}
                <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', margin: '0 12px', flexShrink: 0 }} />

                {/* Répétitions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => updateSet(idx, 'reps', Math.max(1, set.reps - 1))}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none',
                      background: 'rgba(255,255,255,0.09)', color: '#fff',
                      fontSize: 20, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}
                  >−</button>
                  <div style={{ textAlign: 'center', minWidth: 44 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>{set.reps}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', marginLeft: 2 }}>reps</span>
                  </div>
                  <button
                    onClick={() => updateSet(idx, 'reps', set.reps + 1)}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none',
                      background: 'rgba(255,255,255,0.09)', color: '#fff',
                      fontSize: 20, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}
                  >+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conseils d'exécution */}
      {exercise.tips.length > 0 && (
        <div style={{ borderRadius: 12, padding: '10px 14px', background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.1)' }}>
          {exercise.tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < exercise.tips.length - 1 ? 6 : 0 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF6B35', flexShrink: 0, marginTop: 6 }} />
              <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: 'Inter, sans-serif', lineHeight: 1.5, margin: 0 }}>{tip}</p>
            </div>
          ))}
        </div>
      )}

      {/* Alternatives */}
      <button
        onClick={() => setShowAlt(!showAlt)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ArrowRight size={11} />Machine indisponible ? Alternatives
      </button>
      {showAlt && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setSelectedAlt(null)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
            background: !selectedAlt ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
            border: !selectedAlt ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.08)'
          }}>
            <span style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{exercise.name} (original)</span>
            <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>{exercise.relevanceScore}/100</span>
          </button>
          {exercise.alternatives.map(alt => (
            <button key={alt.name} onClick={() => setSelectedAlt(alt.name)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
              background: selectedAlt === alt.name ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
              border: selectedAlt === alt.name ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.08)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{alt.name}</span>
              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: alt.relevanceScore >= 90 ? '#22c55e' : alt.relevanceScore >= 75 ? '#84cc16' : '#eab308' }}>{alt.relevanceScore}/100</span>
            </button>
          ))}
        </div>
      )}

      {/* Bouton enregistrer */}
      <button
        onClick={handleSave}
        style={{
          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
          background: allCompleted ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #FF6B35, #FF3366)',
          color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif',
          cursor: 'pointer', transition: 'opacity 0.2s',
        }}
      >
        {allCompleted ? '✓ Exercice terminé' : 'Enregistrer les séries'}
      </button>
    </div>
  );
}

// ============================================================
// VUE FOOTBALL
// ============================================================

function FootballView({ session }: { session: WorkoutSession }) {
  const [scores, setScores] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [feeling, setFeeling] = useState(7);
  const [notes, setNotes] = useState('');
  const drills = session.cardioDetails?.footballDrills ?? [];
  const scoreFields = session.cardioDetails?.scores ?? [];
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);

  const phaseColors: Record<string, string> = {
    'Échauffement': '#FF6B35',
    'Appuis': '#3B82F6',
    'Accélération': '#22C55E',
    'Ballon': '#A855F7',
  };

  if (submitted) {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <div className="text-4xl mb-2">⚽</div>
          <div className="text-white text-xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Séance Football enregistrée !</div>
          <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Ressenti : {feeling}/10</p>
          {Object.entries(scores).map(([id, val]) => {
            const field = scoreFields.find(s => s.id === id);
            if (!field || !val) return null;
            return (
              <div key={id} className="flex items-center justify-between mt-2 px-4">
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{field.name}</span>
                <span className="text-green-400 font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{val} {field.unit}</span>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
          <p className="text-green-400 font-semibold text-sm mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Objectifs cibles</p>
          {scoreFields.map(f => (
            <div key={f.id} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{f.name}</span>
              <span className="text-green-400 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Cible : {f.target}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setSubmitted(false)} className="w-full py-3 rounded-xl text-white/60 text-sm border" style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }}>
          Revoir les exercices
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Note du coach */}
      <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
        <p className="text-green-400/80 text-xs font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Note du coach</p>
        <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{session.coachNote}</p>
      </div>

      {/* Structure de la séance */}
      {session.cardioDetails && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Structure</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>
              Échauffement {session.cardioDetails.warmupMin}min
            </span>
            {session.cardioDetails.mainBlocks.map((b, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
                {b.name} {b.durationMin}min
              </span>
            ))}
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(20,184,166,0.1)', color: '#14B8A6', fontFamily: 'Inter, sans-serif' }}>
              Retour calme {session.cardioDetails.cooldownMin}min
            </span>
          </div>
        </div>
      )}

      {/* Exercices football */}
      <p className="text-white/50 text-xs uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>Exercices détaillés</p>
      {drills.map(drill => {
        const phaseColor = phaseColors[drill.phase] || '#FF6B35';
        const isExpanded = expandedDrill === drill.id;
        return (
          <div key={drill.id} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="p-4 cursor-pointer" onClick={() => setExpandedDrill(isExpanded ? null : drill.id)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${phaseColor}15`, color: phaseColor, fontFamily: 'Inter, sans-serif' }}>
                      {drill.phase}
                    </span>
                    <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>~{drill.durationMin}min</span>
                    {drill.reps && <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>× {drill.reps}</span>}
                  </div>
                  <h4 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{drill.name}</h4>
                  <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>Matériel : {drill.equipment}</p>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-white/30 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-white/30 flex-shrink-0 mt-1" />}
              </div>
            </div>
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3">
                {/* Vidéo YouTube de démonstration */}
                {drill.videoUrl && (
                  <div className="rounded-xl overflow-hidden" style={{ aspectRatio: '16/9', background: '#000' }}>
                    <iframe
                      src={`${drill.videoUrl}?autoplay=0&rel=0&modestbranding=1`}
                      title={drill.name}
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      style={{ border: 'none' }}
                    />
                  </div>
                )}
                <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{drill.description}</p>
                <div className="p-3 rounded-xl" style={{ background: `${phaseColor}10`, border: `1px solid ${phaseColor}20` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: phaseColor, fontFamily: 'Inter, sans-serif' }}>💡 Conseil coach</p>
                  <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{drill.coachTip}</p>
                </div>
                {drill.progressionPhase2 && (
                  <div className="space-y-1">
                    <p className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Phase 2 : {drill.progressionPhase2}</p>
                    {drill.progressionPhase3 && <p className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Phase 3 : {drill.progressionPhase3}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Scores à noter */}
      {scoreFields.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white/70 font-semibold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Scores à noter</p>
          <div className="space-y-3">
            {scoreFields.map(field => (
              <div key={field.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{field.name}</span>
                  <span className="text-green-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Cible : {field.target}</span>
                </div>
                <input
                  type="text"
                  placeholder={`Entrer ${field.unit}...`}
                  value={scores[field.id] ?? ''}
                  onChange={e => setScores(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full text-white text-sm rounded-xl px-3 py-2"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }}
                />
                <p className="text-white/30 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{field.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ressenti */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex justify-between mb-2">
          <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Ressenti global</span>
          <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{feeling}/10</span>
        </div>
        <input type="range" min="1" max="10" value={feeling} onChange={e => setFeeling(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#22C55E' }} />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, sensations, points à améliorer..." className="w-full text-white/80 text-xs rounded-xl p-3 resize-none mt-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif', minHeight: '70px' }} />
      </div>

      <button
        onClick={() => { setSubmitted(true); toast.success('Séance football enregistrée !'); }}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:opacity-90 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', fontFamily: 'Syne, sans-serif', boxShadow: '0 8px 30px rgba(34,197,94,0.25)' }}
      >
        ⚽ Terminer la séance football
      </button>
    </div>
  );
}

// ============================================================
// ============================================================
// VUE CARDIO (Course + Vélo) — Journal complet avec adaptation
// ============================================================

function CardioView({ session }: { session: WorkoutSession }) {
  const { logCardioSession, getCardioAdaptation } = useFitnessTracker();
  const [duration, setDuration] = useState(session.durationMin);
  const [distanceKm, setDistanceKm] = useState('');
  const [avgHR, setAvgHR] = useState('');
  const [maxHR, setMaxHR] = useState('');
  const [paceMin, setPaceMin] = useState('');
  const [paceSec, setPaceSec] = useState('');
  const [feeling, setFeeling] = useState(7);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showBlocks, setShowBlocks] = useState(false);
  const cardio = session.cardioDetails;
  const colors = SESSION_TYPE_COLORS[session.type];
  const isRunning = session.type === 'running';
  const adaptation = getCardioAdaptation(session.id);

  const handleSubmit = () => {
    const avgPaceSeconds = paceMin && paceSec ? parseInt(paceMin) * 60 + parseInt(paceSec) : undefined;
    logCardioSession({
      sessionId: session.id,
      date: new Date().toISOString(),
      type: isRunning ? 'running' : 'cycling',
      durationMin: duration,
      distanceKm: distanceKm ? parseFloat(distanceKm) : undefined,
      avgHeartRate: avgHR ? parseInt(avgHR) : undefined,
      maxHeartRate: maxHR ? parseInt(maxHR) : undefined,
      avgPaceMinPerKm: avgPaceSeconds,
      feeling,
      notes: notes || undefined,
    });
    setSubmitted(true);
    toast.success(`${session.name} enregistré !`);
  };

  if (submitted) {
    const newAdaptation = getCardioAdaptation(session.id);
    const verdictColors = { progress: '#22c55e', maintain: '#eab308', recover: '#ef4444' };
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: `${colors.bg}`, border: `1px solid ${colors.border}` }}>
          <div className="text-4xl mb-2">{isRunning ? '🏃' : '🚴'}</div>
          <div className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Séance enregistrée !</div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>{duration} min</span>
            {distanceKm && <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>{distanceKm} km</span>}
            {avgHR && <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>FC {avgHR} bpm</span>}
            {paceMin && <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>{paceMin}'{paceSec || '00'}"/km</span>}
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: `${verdictColors[newAdaptation.verdict]}10`, border: `1px solid ${verdictColors[newAdaptation.verdict]}30` }}>
          <p className="font-semibold text-sm mb-2" style={{ color: verdictColors[newAdaptation.verdict], fontFamily: 'Syne, sans-serif' }}>
            {newAdaptation.verdict === 'progress' ? '↗️ Progression recommandée' : newAdaptation.verdict === 'recover' ? '⚠️ Récupération conseillée' : '✅ Continue comme ça'}
          </p>
          <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{newAdaptation.message}</p>
          {newAdaptation.nextTarget.distanceKm && (
            <div className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Prochaine séance : vise <strong className="text-white">{newAdaptation.nextTarget.distanceKm} km</strong></p>
            </div>
          )}
        </div>
        <button onClick={() => setSubmitted(false)} className="w-full py-3 rounded-xl text-white/60 text-sm border" style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }}>
          Revoir la séance
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Adaptation de la dernière séance */}
      <div className="p-3 rounded-xl" style={{ background: `${{ progress: '#22c55e', maintain: '#eab308', recover: '#ef4444' }[adaptation.verdict]}10`, border: `1px solid ${{ progress: '#22c55e', maintain: '#eab308', recover: '#ef4444' }[adaptation.verdict]}25` }}>
        <p className="text-xs font-semibold mb-1" style={{ color: colors.text, fontFamily: 'Inter, sans-serif' }}>Objectif du coach</p>
        <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{adaptation.message}</p>
        {adaptation.nextTarget.distanceKm && (
          <p className="text-white/40 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Cible : <strong className="text-white/70">{adaptation.nextTarget.distanceKm} km</strong></p>
        )}
      </div>

      {/* Note du coach */}
      <div className="p-3 rounded-xl" style={{ background: `${colors.bg}`, border: `1px solid ${colors.border}` }}>
        <p className="text-xs font-semibold mb-1" style={{ color: colors.text, fontFamily: 'Inter, sans-serif' }}>Note du coach</p>
        <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{session.coachNote}</p>
      </div>

      {/* Blocs de la séance (dépliables) */}
      {cardio && (
        <div>
          <button
            onClick={() => setShowBlocks(!showBlocks)}
            className="w-full flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span className="text-white/60 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Voir le détail de la séance</span>
            {showBlocks ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
          </button>
          {showBlocks && (
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#FF6B35' }} />
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Échauffement : {cardio.warmupMin} min</span>
              </div>
              {cardio.mainBlocks.map((block, i) => {
                const intensityColor = { low: '#14B8A6', medium: '#eab308', high: '#FF6B35', maximal: '#ef4444' }[block.intensity];
                return (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-white font-bold text-xs" style={{ fontFamily: 'Syne, sans-serif' }}>{block.name}</h4>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${intensityColor}15`, color: intensityColor, fontFamily: 'Inter, sans-serif' }}>
                        {block.intensity === 'maximal' ? 'Max' : block.intensity === 'high' ? 'Haute' : block.intensity === 'medium' ? 'Modérée' : 'Légère'}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{block.description}</p>
                    <p className="text-xs mt-1" style={{ color: intensityColor, fontFamily: 'Inter, sans-serif' }}>💡 {block.coachTip}</p>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 px-1">
                <div className="w-2 h-2 rounded-full" style={{ background: '#14B8A6' }} />
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Retour au calme : {cardio.cooldownMin} min</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* JOURNAL DE SÉANCE */}
      <div className="rounded-2xl p-4 space-y-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Enregistrer ma séance</p>

        {/* Durée */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Durée réelle</span>
            <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{duration} min</span>
          </div>
          <input type="range" min="10" max="120" step="5" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: colors.text }} />
        </div>

        {/* Distance (course seulement) */}
        {isRunning && (
          <div>
            <p className="text-white/60 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Distance parcourue (km)</p>
            <input
              type="number" step="0.1" min="0" max="50"
              value={distanceKm}
              onChange={e => setDistanceKm(e.target.value)}
              placeholder="Ex : 5.2"
              className="w-full text-white text-sm rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        )}

        {/* Allure (course seulement) */}
        {isRunning && (
          <div>
            <p className="text-white/60 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Allure moyenne (min:sec / km)</p>
            <div className="flex gap-2 items-center">
              <input
                type="number" min="0" max="20"
                value={paceMin}
                onChange={e => setPaceMin(e.target.value)}
                placeholder="Min"
                className="flex-1 text-white text-sm rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Inter, sans-serif' }}
              />
              <span className="text-white/40 font-bold">:</span>
              <input
                type="number" min="0" max="59"
                value={paceSec}
                onChange={e => setPaceSec(e.target.value)}
                placeholder="Sec"
                className="flex-1 text-white text-sm rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Inter, sans-serif' }}
              />
              <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>/km</span>
            </div>
          </div>
        )}

        {/* Fréquence cardiaque */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-white/60 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>FC moyenne (bpm)</p>
            <input
              type="number" min="50" max="220"
              value={avgHR}
              onChange={e => setAvgHR(e.target.value)}
              placeholder="Ex : 145"
              className="w-full text-white text-sm rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <div>
            <p className="text-white/60 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>FC max (bpm)</p>
            <input
              type="number" min="50" max="220"
              value={maxHR}
              onChange={e => setMaxHR(e.target.value)}
              placeholder="Ex : 178"
              className="w-full text-white text-sm rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>

        {/* Ressenti */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Ressenti global</span>
            <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{feeling}/10</span>
          </div>
          <input type="range" min="1" max="10" value={feeling} onChange={e => setFeeling(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: colors.text }} />
          <div className="flex justify-between mt-1">
            <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Facile</span>
            <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Très dur</span>
          </div>
        </div>

        {/* Notes libres */}
        <div>
          <p className="text-white/60 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Notes (optionnel)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Sensations, conditions météo, douleurs..."
            className="w-full text-white/80 text-xs rounded-xl p-3 resize-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif', minHeight: '60px' }}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:opacity-90 active:scale-95"
        style={{ background: `linear-gradient(135deg, ${colors.text}, ${colors.text}CC)`, fontFamily: 'Syne, sans-serif', boxShadow: `0 8px 30px ${colors.text}30` }}
      >
        {isRunning ? '🏃 Enregistrer la course' : '🚴 Enregistrer le vélo'}
      </button>
    </div>
  );
}

// ============================================================
// EXERCISE LIST — liste verticale pleine largeur, tout ouvert
// ============================================================

function ExerciseCarousel({
  exercises, exerciseLogs, getExerciseAdaptation, draft, handleExerciseLog, handleDraftChange,
}: {
  exercises: Exercise[];
  exerciseLogs: ExerciseLog[];
  getExerciseAdaptation: (id: string) => import('../lib/adaptationEngine').AdaptationResult | null;
  draft: { exercises: Record<string, SetData[]> } | null;
  handleExerciseLog: (log: ExerciseLog) => void;
  handleDraftChange: (exerciseId: string, sets: SetData[]) => void;
}) {
  // Vue : 'list' (verticale) ou 'carousel' (horizontal)
  const [viewMode, setViewMode] = useState<'list' | 'carousel'>(() => {
    return (localStorage.getItem('exercise_view_mode') as 'list' | 'carousel') ?? 'list';
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const swipeX = useRef<number | null>(null);
  const swipeY = useRef<number | null>(null);

  const switchView = (mode: 'list' | 'carousel') => {
    setViewMode(mode);
    localStorage.setItem('exercise_view_mode', mode);
    setActiveIdx(0);
  };

  // Mapping exercice → image selon le groupe musculaire
  const getExerciseImage = (exercise: Exercise): string => {
    const legsKeywords = ['squat', 'leg', 'lunge', 'calf', 'romanian', 'hip_thrust', 'deadlift', 'hamstring', 'quad', 'glute'];
    const isLegs = legsKeywords.some(k =>
      exercise.id.toLowerCase().includes(k) ||
      exercise.muscleGroups.some(m =>
        m.toLowerCase().includes('jambe') ||
        m.toLowerCase().includes('quad') ||
        m.toLowerCase().includes('fessier') ||
        m.toLowerCase().includes('mollet') ||
        m.toLowerCase().includes('ischios')
      )
    );
    return isLegs ? LEGS_IMAGE : ARMS_IMAGE;
  };

  const completedCount = exercises.filter(ex => {
    const log = exerciseLogs.find(l => l.exerciseId === ex.id);
    return log && log.sets.every(s => s.completed);
  }).length;

  // Swipe handlers pour le carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    swipeX.current = e.touches[0].clientX;
    swipeY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeX.current === null || swipeY.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - swipeY.current);
    if (Math.abs(dx) > 40 && Math.abs(dx) > dy * 1.2) {
      if (dx < 0 && activeIdx < exercises.length - 1) setActiveIdx(i => i + 1);
      else if (dx > 0 && activeIdx > 0) setActiveIdx(i => i - 1);
    }
    swipeX.current = null;
    swipeY.current = null;
  };

  // Card commune (photo + contenu)
  const renderExerciseCard = (exercise: Exercise, i: number, isCarousel = false) => {
    const img = getExerciseImage(exercise);
    const log = exerciseLogs.find(l => l.exerciseId === exercise.id);
    const done = log && log.sets.every(s => s.completed);
    const repsLabel = exercise.repsMax === null
      ? `${exercise.repsMin}s`
      : exercise.repsMin === exercise.repsMax
      ? `${exercise.repsMin}`
      : `${exercise.repsMin}-${exercise.repsMax}`;
    const isActive = !isCarousel || i === activeIdx;

    return (
      <div
        key={exercise.id}
        onClick={() => isCarousel && !isActive && setActiveIdx(i)}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          width: '100%',
          border: done
            ? '2px solid rgba(34,197,94,0.45)'
            : isCarousel && isActive ? '1px solid rgba(255,107,53,0.25)' : '1px solid rgba(255,255,255,0.09)',
          background: done ? 'rgba(34,197,94,0.04)' : '#16161E',
          boxShadow: isCarousel && isActive ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.3)',
          transform: isCarousel ? (isActive ? 'scale(1)' : 'scale(0.93)') : 'none',
          opacity: isCarousel ? (isActive ? 1 : 0.45) : 1,
          transition: 'transform 0.35s ease, opacity 0.35s ease',
          cursor: isCarousel && !isActive ? 'pointer' : 'default',
          flexShrink: 0,
          ...(isCarousel ? { minWidth: '88%' } : {}),
        }}
      >
        {/* Photo avec overlay */}
        <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
          <img src={img} alt={exercise.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.38)' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(15,15,20,0.0) 0%, rgba(15,15,20,0.55) 50%, rgba(15,15,20,0.98) 100%)'
          }} />
          {done && (
            <div style={{
              position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(34,197,94,0.3)', border: '2px solid rgba(34,197,94,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Check size={17} color="#22C55E" />
            </div>
          )}
          <div style={{
            position: 'absolute', top: 12, left: 12, fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif',
            background: 'rgba(0,0,0,0.4)', padding: '3px 9px', borderRadius: 20,
          }}>
            {i + 1} / {exercises.length}
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px' }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#FF6B35', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4
            }}>
              {Array.isArray(exercise.muscleGroups) ? exercise.muscleGroups.slice(0, 2).join(' · ') : exercise.muscleGroups}
            </div>
            <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', lineHeight: 1.15, marginBottom: 6 }}>
              {exercise.name}
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter, sans-serif', fontWeight: 600, background: 'rgba(255,107,53,0.2)', padding: '3px 11px', borderRadius: 20 }}>
                {exercise.sets} × {repsLabel}
              </span>
              {exercise.defaultWeight && exercise.defaultWeight > 0 && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', background: 'rgba(255,255,255,0.1)', padding: '3px 11px', borderRadius: 20 }}>
                  ~{exercise.defaultWeight} kg
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Contenu ExerciseCard — visible sur toutes les cards en liste, seulement la active en carousel */}
        {isActive && (
          <ExerciseCard
            exercise={exercise}
            onLog={handleExerciseLog}
            lastLog={log}
            adaptation={getExerciseAdaptation(exercise.id)}
            draftSets={draft?.exercises[exercise.id] ?? null}
            onDraftChange={handleDraftChange}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* En-tête : progression + boutons de vue */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
          <span style={{ color: completedCount === exercises.length ? '#22C55E' : '#FF6B35', fontWeight: 700 }}>
            {completedCount}/{exercises.length}
          </span>{' '}terminés
        </span>

        {/* Boutons de bascule vue */}
        <div style={{
          display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)'
        }}>
          <button
            onClick={() => switchView('list')}
            style={{
              padding: '7px 14px', border: 'none', cursor: 'pointer',
              background: viewMode === 'list' ? 'rgba(255,107,53,0.25)' : 'transparent',
              color: viewMode === 'list' ? '#FF6B35' : 'rgba(255,255,255,0.35)',
              fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Icône liste */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0" y="1" width="14" height="2.5" rx="1.25" fill="currentColor"/>
              <rect x="0" y="5.75" width="14" height="2.5" rx="1.25" fill="currentColor"/>
              <rect x="0" y="10.5" width="14" height="2.5" rx="1.25" fill="currentColor"/>
            </svg>
            Liste
          </button>
          <button
            onClick={() => switchView('carousel')}
            style={{
              padding: '7px 14px', border: 'none', cursor: 'pointer',
              background: viewMode === 'carousel' ? 'rgba(255,107,53,0.25)' : 'transparent',
              color: viewMode === 'carousel' ? '#FF6B35' : 'rgba(255,255,255,0.35)',
              fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {/* Icône carousel */}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="1" width="10" height="12" rx="2" fill="currentColor" opacity="0.9"/>
              <rect x="0" y="3" width="2" height="8" rx="1" fill="currentColor" opacity="0.4"/>
              <rect x="12" y="3" width="2" height="8" rx="1" fill="currentColor" opacity="0.4"/>
            </svg>
            Carousel
          </button>
        </div>
      </div>

      {/* VUE LISTE */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {exercises.map((exercise, i) => renderExerciseCard(exercise, i, false))}
        </div>
      )}

      {/* VUE CAROUSEL */}
      {viewMode === 'carousel' && (
        <div>
          {/* Pastilles de navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 12 }}>
            {exercises.map((ex, i) => {
              const log = exerciseLogs.find(l => l.exerciseId === ex.id);
              const done = log && log.sets.every(s => s.completed);
              return (
                <button key={ex.id} onClick={() => setActiveIdx(i)} style={{
                  width: i === activeIdx ? 20 : 6, height: 6, borderRadius: 3,
                  background: done ? '#22C55E' : i === activeIdx ? '#FF6B35' : 'rgba(255,255,255,0.18)',
                  transition: 'all 0.3s ease', border: 'none', cursor: 'pointer', padding: 0,
                }} />
              );
            })}
          </div>

          {/* Piste carousel */}
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ overflow: 'hidden', margin: '0 -4px' }}
          >
            <div style={{
              display: 'flex', gap: 12,
              transition: 'transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94)',
              transform: `translateX(calc(${-activeIdx * 88}% - ${activeIdx * 12}px + 6%))`,
              willChange: 'transform',
            }}>
              {exercises.map((exercise, i) => renderExerciseCard(exercise, i, true))}
            </div>
          </div>

          {/* Boutons navigation bas */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {activeIdx > 0 && (
              <button onClick={() => setActiveIdx(i => i - 1)} style={{
                flex: 1, padding: '13px', borderRadius: 16,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              }}>← Précédent</button>
            )}
            {activeIdx < exercises.length - 1 && (
              <button onClick={() => setActiveIdx(i => i + 1)} style={{
                flex: 1, padding: '13px', borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(255,107,53,0.25), rgba(255,51,102,0.25))',
                border: '1px solid rgba(255,107,53,0.35)', color: '#FF6B35',
                fontSize: 13, fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              }}>Suivant →</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SESSION VIEW (Musculation)
// ============================================================

function GymSessionView({ session }: { session: WorkoutSession }) {
  const { logSession, analyzeSession, getSuggestedWeight, getCurrentWeek, getExerciseAdaptation, getFatigueScore, updateDraftExercise, updateDraftMeta, clearWorkoutDraft, getWorkoutDraft } = useFitnessTracker();
  const fatigueScore = getFatigueScore();
  const currentWeek = getCurrentWeek();

  // Restaurer le draft persisté au montage
  const draft = getWorkoutDraft(session.id);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>(() => {
    if (!draft) return [];
    return Object.entries(draft.exercises).map(([exerciseId, sets]) => ({ exerciseId, sets }));
  });
  const [difficulty, setDifficulty] = useState(draft?.feeling ?? 7);
  const [energy, setEnergy] = useState(7);
  const [notes, setNotes] = useState(draft?.notes ?? '');
  const [submitted, setSubmitted] = useState(false);

  // Sync difficulty/notes dans le draft
  useEffect(() => {
    updateDraftMeta(session.id, difficulty, notes);
  }, [difficulty, notes, session.id, updateDraftMeta]);

  const handleExerciseLog = (log: ExerciseLog) => {
    setExerciseLogs(prev => {
      const existing = prev.findIndex(l => l.exerciseId === log.exerciseId);
      if (existing >= 0) { const updated = [...prev]; updated[existing] = log; return updated; }
      return [...prev, log];
    });
  };

  // Sauvegarde immédiate dans le draft à chaque modification de série
  const handleDraftChange = useCallback((exerciseId: string, sets: SetData[]) => {
    updateDraftExercise(session.id, exerciseId, sets);
  }, [session.id, updateDraftExercise]);

  const handleSubmitSession = () => {
    const sessionLog: SessionLog = {
      sessionId: session.id, date: new Date().toISOString(), weekNumber: currentWeek,
      exercises: exerciseLogs, perceivedDifficulty: difficulty, energyLevel: energy, overallNotes: notes,
    };
    logSession(sessionLog);
    clearWorkoutDraft(); // Efface le draft après soumission
    const analysis = analyzeSession(sessionLog);
    setSubmitted(true);
    toast.success(`Séance enregistrée ! Score : ${analysis.score}/100`);
  };

  if (submitted) {
    const tempLog: SessionLog = {
      sessionId: session.id, date: new Date().toISOString(), weekNumber: currentWeek,
      exercises: exerciseLogs, perceivedDifficulty: difficulty, energyLevel: energy,
    };
    const analysis = analyzeSession(tempLog);
    const verdictColor = { excellent: '#22c55e', good: '#84cc16', average: '#eab308', poor: '#ef4444' }[analysis.verdict];
    const verdictLabel = { excellent: 'Excellent', good: 'Bien', average: 'Moyen', poor: 'Difficile' }[analysis.verdict];
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-5xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: verdictColor }}>{analysis.score}/100</div>
          <div className="text-white font-semibold text-lg mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>{verdictLabel}</div>
          {analysis.feedback.map((f, i) => <p key={i} className="text-white/70 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{f}</p>)}
        </div>
        {analysis.suggestions.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)' }}>
            <p className="text-orange-400 font-semibold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Conseils pour la prochaine séance</p>
            {analysis.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <ArrowRight size={12} className="text-orange-400 flex-shrink-0 mt-1" />
                <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{s}</p>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white/70 font-semibold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Charges suggérées — prochaine séance</p>
          {exerciseLogs.map(exLog => {
            const ex = session.exercises.find(e => e.id === exLog.exerciseId);
            if (!ex) return null;
            const maxWeight = Math.max(...exLog.sets.map(s => s.weight), 0);
            const allDone = exLog.sets.every(s => s.completed);
            const suggestion = getSuggestedWeight(exLog.exerciseId, maxWeight, allDone, difficulty);
            const dirIcon = suggestion.direction === 'up' ? <ArrowUp size={12} className="text-green-400" /> : suggestion.direction === 'down' ? <ArrowDown size={12} className="text-red-400" /> : <ArrowRight size={12} className="text-yellow-400" />;
            return (
              <div key={exLog.exerciseId} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{ex.name.length > 25 ? ex.name.substring(0, 25) + '…' : ex.name}</span>
                <div className="flex items-center gap-1.5">{dirIcon}<span className="text-white text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{suggestion.suggestedWeight} kg</span></div>
              </div>
            );
          })}
        </div>
        <button onClick={() => setSubmitted(false)} className="w-full py-3 rounded-xl text-white/60 text-sm border" style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }}>Voir les exercices</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.15)' }}>
        <p className="text-orange-400/80 text-xs font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Note du coach</p>
        <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{session.coachNote}</p>
      </div>
      {fatigueScore.shouldRest && (
        <div className="p-3 rounded-2xl flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <span className="text-red-400 text-sm flex-shrink-0">⚠️</span>
          <p className="text-red-300/80 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{fatigueScore.recommendation}</p>
        </div>
      )}
      <ExerciseCarousel
        exercises={session.exercises}
        exerciseLogs={exerciseLogs}
        getExerciseAdaptation={getExerciseAdaptation}
        draft={draft}
        handleExerciseLog={handleExerciseLog}
        handleDraftChange={handleDraftChange}
      />
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/70 font-semibold text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Évaluation de la séance</p>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Difficulté perçue</span>
              <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{difficulty}/10</span>
            </div>
            <input type="range" min="1" max="10" value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#FF6B35' }} />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Niveau d'énergie</span>
              <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{energy}/10</span>
            </div>
            <input type="range" min="1" max="10" value={energy} onChange={e => setEnergy(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#FF6B35' }} />
          </div>
          <div>
            <p className="text-white/60 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Notes (optionnel)</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Douleurs, sensations, remarques..." className="w-full text-white/80 text-xs rounded-xl p-3 resize-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif', minHeight: '80px' }} />
          </div>
        </div>
      </div>
      <button onClick={handleSubmitSession} className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)', fontFamily: 'Syne, sans-serif', boxShadow: '0 8px 30px rgba(255,107,53,0.25)' }}>
        Terminer et analyser la séance
      </button>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================

export default function WorkoutPage() {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const { data } = useFitnessTracker();

  const sessionImages: Record<string, string> = {
    upper_a: ARMS_IMAGE, upper_b: ARMS_IMAGE,
    lower_a: LEGS_IMAGE, lower_b: LEGS_IMAGE,
    football: HERO_IMAGE, running_endurance: HERO_IMAGE,
    running_intervals: HERO_IMAGE, cycling: HERO_IMAGE, rest: HERO_IMAGE,
  };

  const today = new Date();
  const programStart = data.startDate ? new Date(data.startDate) : today;
  // Calcul de la semaine courante pour la variation des exercices par phase
  const weekNumberForPhase = data.startDate
    ? Math.max(1, Math.ceil((today.getTime() - programStart.getTime()) / (7 * 24 * 3600 * 1000)))
    : 1;

  // Séance du jour selon le cycle
  const cycleDayToday = data.startDate ? getCycleDayForDate(today, programStart) : 1;
  const rawTodaySession = data.startDate ? getSessionForCycleDay(cycleDayToday) : null;
  // Applique la variation d'exercices selon la phase (sem. 1-4 = P1, 5-8 = P2, 9-12 = P3)
  const todaySession = rawTodaySession ? (getSessionForPhase(rawTodaySession.id, weekNumberForPhase) || rawTodaySession) : null;

  if (selectedSession) {
    const colors = SESSION_TYPE_COLORS[selectedSession.type];
    const headerImage = sessionImages[selectedSession.id] || HERO_IMAGE;
    return (
      <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
        <div className="relative h-48 overflow-hidden">
          <img src={headerImage} alt={selectedSession.name} className="w-full h-full object-cover" style={{ filter: 'brightness(0.45)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(15,15,20,0.5), rgba(15,15,20,1))' }} />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <button onClick={() => setSelectedSession(null)} className="absolute top-5 left-5 text-white/60 text-sm flex items-center gap-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              ← Retour
            </button>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: colors.text, fontFamily: 'Inter, sans-serif' }}>{selectedSession.focus}</span>
            </div>
            <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{selectedSession.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {selectedSession.exercises.length > 0 && <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{selectedSession.exercises.length} exercices</span>}
              <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>~{selectedSession.durationMin} min</span>
              {selectedSession.cardioDetails && <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>~{selectedSession.cardioDetails.totalCaloriesBurned} kcal</span>}
            </div>
          </div>
        </div>
        {selectedSession.type === 'gym' && (
          <>
            <GymSessionView session={selectedSession} />
            <div className="px-4 pb-6">
              <SessionTimeline session={selectedSession} domain="gym" />
            </div>
          </>
        )}
        {selectedSession.type === 'football' && (
          <>
            <FootballView session={selectedSession} />
            <div className="px-4 pb-6">
              <SessionTimeline session={selectedSession} domain="football" />
            </div>
          </>
        )}
        {(selectedSession.type === 'running') && (
          <>
            <CardioView session={selectedSession} />
            <div className="px-4 pb-6">
              <SessionTimeline session={selectedSession} domain="running" />
            </div>
          </>
        )}
        {(selectedSession.type === 'cycling') && (
          <>
            <CardioView session={selectedSession} />
            <div className="px-4 pb-6">
              <SessionTimeline session={selectedSession} domain="cycling" />
            </div>
          </>
        )}
        {selectedSession.type === 'rest' && (
          <div className="p-4">
            <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-5xl mb-3">😴</div>
              <h2 className="text-white text-xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Repos total</h2>
              <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{selectedSession.coachNote}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      <div className="p-5">
        <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Séances</h1>
        <p className="text-white/50 text-sm mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          Cycle 14 jours · 8 musculation · 2 football · 2 course · 1 vélo · 1 repos
        </p>

        {/* Séance du jour */}
        {todaySession && (
          <div className="mb-5">
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Aujourd'hui — J{cycleDayToday}/14</p>
            <div
              className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
              style={{ background: SESSION_TYPE_COLORS[todaySession.type].bg, border: `2px solid ${SESSION_TYPE_COLORS[todaySession.type].text}40` }}
              onClick={() => setSelectedSession(todaySession)}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={14} style={{ color: SESSION_TYPE_COLORS[todaySession.type].text }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: SESSION_TYPE_COLORS[todaySession.type].text, fontFamily: 'Inter, sans-serif' }}>Séance du jour</span>
                </div>
                <h3 className="text-white text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{todaySession.name}</h3>
                <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{todaySession.focus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Toutes les séances du cycle — LISTE */}
        <SessionList
          cycleDayToday={cycleDayToday}
          sessionImages={sessionImages}
          onSelectSession={setSelectedSession}
          data={data}
        />

        {/* Légende */}
        <div className="mt-6 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Légende des scores</p>
          <div className="grid grid-cols-2 gap-2">
            {[{ range: '90-100', label: 'Optimal', color: '#22c55e' }, { range: '75-89', label: 'Excellent', color: '#84cc16' }, { range: '60-74', label: 'Très bon', color: '#eab308' }, { range: '< 60', label: 'Acceptable', color: '#ef4444' }].map(({ range, label, color }) => (
              <div key={range} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{range} — {label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
