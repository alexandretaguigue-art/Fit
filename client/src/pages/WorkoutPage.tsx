// DESIGN: "Coach Nocturne" — Dark Mode Premium Fitness
// Journal interactif avec scoring, jugement des charges, alternatives
// Cycle 14 jours : musculation, football, course, vélo, repos

import { useState } from 'react';
import { ChevronDown, ChevronUp, Check, ArrowUp, ArrowRight, ArrowDown, Dumbbell, Clock, Zap, Bike, Flame, Target } from 'lucide-react';
import { programData, cycle14Days, getCycleDayForDate, getSessionForCycleDay } from '../lib/programData';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import ScoreRing from '../components/ScoreRing';
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
// EXERCISE CARD (Musculation)
// ============================================================

interface SetData { weight: number; reps: number; completed: boolean; }
interface ExerciseLog { exerciseId: string; sets: SetData[]; alternativeUsed?: string; notes?: string; }

function ExerciseCard({ exercise, onLog, lastLog, adaptation }: {
  exercise: Exercise;
  onLog: (log: ExerciseLog) => void;
  lastLog?: ExerciseLog;
  adaptation?: import('../lib/adaptationEngine').AdaptationResult | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAlt, setShowAlt] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  const suggestedWeight = adaptation?.suggestedWeight ?? lastLog?.sets[0]?.weight ?? exercise.defaultWeight ?? 0;
  const suggestedRepsMin = adaptation?.suggestedRepsMin ?? exercise.repsMin;
  const [sets, setSets] = useState<SetData[]>(() =>
    Array.from({ length: adaptation?.suggestedSets ?? exercise.sets }, () => ({
      weight: suggestedWeight, reps: suggestedRepsMin, completed: false,
    }))
  );

  const displayScore = selectedAlt
    ? exercise.alternatives.find(a => a.name === selectedAlt)?.relevanceScore ?? exercise.relevanceScore
    : exercise.relevanceScore;
  const allCompleted = sets.every(s => s.completed);
  const completedCount = sets.filter(s => s.completed).length;

  const updateSet = (idx: number, field: 'weight' | 'reps', value: number) => {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const toggleSet = (idx: number) => {
    setSets(prev => prev.map((s, i) => i === idx ? { ...s, completed: !s.completed } : s));
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
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: allCompleted ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.04)',
        border: allCompleted ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header compact — toujours visible */}
      <div className="p-4 flex items-center gap-3">
        {/* Bouton check série principale — grand et accessible */}
        <button
          onClick={() => {
            // Coche la première série non complétée
            const firstUncompleted = sets.findIndex(s => !s.completed);
            if (firstUncompleted >= 0) toggleSet(firstUncompleted);
            else if (allCompleted) { handleSave(); }
          }}
          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-95"
          style={{
            background: allCompleted ? 'rgba(34,197,94,0.2)' : completedCount > 0 ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.06)',
            border: allCompleted ? '2px solid rgba(34,197,94,0.5)' : completedCount > 0 ? '2px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {allCompleted ? (
            <Check size={22} className="text-green-400" />
          ) : (
            <>
              <span className="text-white font-bold text-base leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
                {completedCount}/{sets.length}
              </span>
              <span className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>séries</span>
            </>
          )}
        </button>

        {/* Infos exercice */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              {selectedAlt ?? exercise.name}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {hasMedia && (
                <button
                  onClick={e => { e.stopPropagation(); setShowDemo(!showDemo); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: showDemo ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  title="Voir démonstration"
                >
                  <span style={{ fontSize: '12px' }}>🎥</span>
                </button>
              )}
              {expanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              {sets.length} × {repsLabel}
            </span>
            {sets[0] && (
              <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                · {sets[0].weight}kg
              </span>
            )}
            {adaptBadge && (
              <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${adaptBadge.color}20`, color: adaptBadge.color, fontFamily: 'Inter, sans-serif' }}>
                {adaptBadge.icon}{adaptBadge.label}
              </span>
            )}
          </div>
          {exercise.muscleGroups.slice(0, 2).map(m => (
            <span key={m} className="inline-block text-xs px-1.5 py-0.5 rounded-full mr-1 mt-1" style={{ background: 'rgba(255,107,53,0.08)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Démo image/vidéo */}
      {showDemo && hasMedia && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {exercise.videoUrl ? (
            <video
              src={exercise.videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full"
              style={{ maxHeight: '220px', objectFit: 'contain' }}
            />
          ) : exercise.imageUrl ? (
            <img
              src={exercise.imageUrl}
              alt={`Démonstration ${exercise.name}`}
              className="w-full"
              style={{ maxHeight: '220px', objectFit: 'contain' }}
            />
          ) : null}
          <p className="text-white/40 text-xs text-center py-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            Technique correcte — {exercise.name}
          </p>
        </div>
      )}

      {/* Séries — toujours visibles quand expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Séries rapides */}
          <div className="space-y-2">
            {sets.map((set, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: set.completed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                  border: set.completed ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <button
                  onClick={() => toggleSet(idx)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 active:scale-90"
                  style={{
                    background: set.completed ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)',
                    border: set.completed ? '2px solid rgba(34,197,94,0.5)' : '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {set.completed ? <Check size={14} className="text-green-400" /> : <span className="text-white/40 text-xs font-bold">{idx + 1}</span>}
                </button>
                <span className="text-white/40 text-xs w-6" style={{ fontFamily: 'Inter, sans-serif' }}>S{idx + 1}</span>
                {/* Poids */}
                <div className="flex items-center gap-1">
                  <button onClick={() => updateSet(idx, 'weight', Math.max(0, set.weight - 2.5))} className="w-8 h-8 rounded-lg text-white font-bold text-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>−</button>
                  <div className="w-14 text-center">
                    <span className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{set.weight}</span>
                    <span className="text-white/40 text-xs ml-0.5">kg</span>
                  </div>
                  <button onClick={() => updateSet(idx, 'weight', set.weight + 2.5)} className="w-8 h-8 rounded-lg text-white font-bold text-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>+</button>
                </div>
                {/* Reps */}
                <div className="flex items-center gap-1">
                  <button onClick={() => updateSet(idx, 'reps', Math.max(1, set.reps - 1))} className="w-8 h-8 rounded-lg text-white font-bold text-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>−</button>
                  <div className="w-10 text-center">
                    <span className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{set.reps}</span>
                    <span className="text-white/40 text-xs ml-0.5">r</span>
                  </div>
                  <button onClick={() => updateSet(idx, 'reps', set.reps + 1)} className="w-8 h-8 rounded-lg text-white font-bold text-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>+</button>
                </div>
              </div>
            ))}
          </div>

          {/* Conseils d'exécution */}
          {exercise.tips.length > 0 && (
            <div className="p-3 rounded-xl space-y-1.5" style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.1)' }}>
              {exercise.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ background: '#FF6B35' }} />
                  <p className="text-white/55 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{tip}</p>
                </div>
              ))}
            </div>
          )}

          {/* Alternatives */}
          <button
            onClick={() => setShowAlt(!showAlt)}
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/55 transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <ArrowRight size={11} />Machine indisponible ? Alternatives
          </button>
          {showAlt && (
            <div className="space-y-2">
              <button onClick={() => setSelectedAlt(null)} className="w-full flex items-center justify-between p-2.5 rounded-xl" style={{ background: !selectedAlt ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)', border: !selectedAlt ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-white text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>{exercise.name} (original)</span>
                <span className="text-xs font-bold" style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}>{exercise.relevanceScore}/100</span>
              </button>
              {exercise.alternatives.map(alt => (
                <button key={alt.name} onClick={() => setSelectedAlt(alt.name)} className="w-full flex items-center justify-between p-2.5 rounded-xl" style={{ background: selectedAlt === alt.name ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)', border: selectedAlt === alt.name ? '1px solid rgba(255,107,53,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-white/80 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{alt.name}</span>
                  <span className="text-xs font-bold" style={{ color: alt.relevanceScore >= 90 ? '#22c55e' : alt.relevanceScore >= 75 ? '#84cc16' : '#eab308', fontFamily: 'Inter, sans-serif' }}>{alt.relevanceScore}/100</span>
                </button>
              ))}
            </div>
          )}

          <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-95" style={{ background: allCompleted ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #FF6B35, #FF3366)', fontFamily: 'Inter, sans-serif' }}>
            {allCompleted ? '✓ Exercice terminé' : 'Enregistrer les séries'}
          </button>
        </div>
      )}
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
// VUE CARDIO (Course + Vélo)
// ============================================================

function CardioView({ session }: { session: WorkoutSession }) {
  const [duration, setDuration] = useState(session.durationMin);
  const [feeling, setFeeling] = useState(7);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const cardio = session.cardioDetails;
  const colors = SESSION_TYPE_COLORS[session.type];
  const isRunning = session.type === 'running';

  if (submitted) {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: `${colors.bg}`, border: `1px solid ${colors.border}` }}>
          <div className="text-4xl mb-2">{isRunning ? '🏃' : '🚴'}</div>
          <div className="text-white text-xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Séance enregistrée !</div>
          <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{duration} min · Ressenti {feeling}/10</p>
          {cardio && <p className="text-white/40 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>~{cardio.totalCaloriesBurned} kcal brûlées</p>}
        </div>
        <button onClick={() => setSubmitted(false)} className="w-full py-3 rounded-xl text-white/60 text-sm border" style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }}>
          Revoir la séance
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Note du coach */}
      <div className="p-3 rounded-xl" style={{ background: `${colors.bg}`, border: `1px solid ${colors.border}` }}>
        <p className="text-xs font-semibold mb-1" style={{ color: colors.text, fontFamily: 'Inter, sans-serif' }}>Note du coach</p>
        <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{session.coachNote}</p>
      </div>

      {/* Blocs de la séance */}
      {cardio && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#FF6B35' }} />
            <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Échauffement : {cardio.warmupMin} min</span>
          </div>
          {cardio.mainBlocks.map((block, i) => {
            const intensityColor = { low: '#14B8A6', medium: '#eab308', high: '#FF6B35', maximal: '#ef4444' }[block.intensity];
            return (
              <div key={i} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{block.name}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${intensityColor}15`, color: intensityColor, fontFamily: 'Inter, sans-serif' }}>
                    {block.intensity === 'maximal' ? 'Max' : block.intensity === 'high' ? 'Haute' : block.intensity === 'medium' ? 'Modérée' : 'Légère'}
                  </span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{block.description}</p>
                {block.reps && <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{block.reps} répétitions</p>}
                <div className="mt-2 p-2 rounded-lg" style={{ background: `${intensityColor}10` }}>
                  <p className="text-xs" style={{ color: intensityColor, fontFamily: 'Inter, sans-serif' }}>💡 {block.coachTip}</p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full" style={{ background: '#14B8A6' }} />
            <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Retour au calme : {cardio.cooldownMin} min</span>
          </div>
        </div>
      )}

      {/* Durée réelle */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex justify-between mb-2">
          <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Durée réelle</span>
          <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{duration} min</span>
        </div>
        <input type="range" min="15" max="90" step="5" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: colors.text }} />
        <div className="flex justify-between mb-2 mt-3">
          <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Ressenti</span>
          <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{feeling}/10</span>
        </div>
        <input type="range" min="1" max="10" value={feeling} onChange={e => setFeeling(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: colors.text }} />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes, distance, sensations..." className="w-full text-white/80 text-xs rounded-xl p-3 resize-none mt-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif', minHeight: '70px' }} />
      </div>

      <button
        onClick={() => { setSubmitted(true); toast.success(`${session.name} enregistré !`); }}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:opacity-90 active:scale-95"
        style={{ background: `linear-gradient(135deg, ${colors.text}, ${colors.text}CC)`, fontFamily: 'Syne, sans-serif', boxShadow: `0 8px 30px ${colors.text}30` }}
      >
        {isRunning ? '🏃 Terminer la course' : '🚴 Terminer le vélo'}
      </button>
    </div>
  );
}

// ============================================================
// SESSION VIEW (Musculation)
// ============================================================

function GymSessionView({ session }: { session: WorkoutSession }) {
  const { logSession, analyzeSession, getSuggestedWeight, getCurrentWeek, getExerciseAdaptation, getFatigueScore } = useFitnessTracker();
  const fatigueScore = getFatigueScore();
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [difficulty, setDifficulty] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const currentWeek = getCurrentWeek();

  const handleExerciseLog = (log: ExerciseLog) => {
    setExerciseLogs(prev => {
      const existing = prev.findIndex(l => l.exerciseId === log.exerciseId);
      if (existing >= 0) { const updated = [...prev]; updated[existing] = log; return updated; }
      return [...prev, log];
    });
  };

  const handleSubmitSession = () => {
    const sessionLog: SessionLog = {
      sessionId: session.id, date: new Date().toISOString(), weekNumber: currentWeek,
      exercises: exerciseLogs, perceivedDifficulty: difficulty, energyLevel: energy, overallNotes: notes,
    };
    logSession(sessionLog);
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
      {session.exercises.map(exercise => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onLog={handleExerciseLog}
          lastLog={exerciseLogs.find(l => l.exerciseId === exercise.id)}
          adaptation={getExerciseAdaptation(exercise.id)}
        />
      ))}
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

  // Séance du jour selon le cycle
  const cycleDayToday = data.startDate ? getCycleDayForDate(today, programStart) : 1;
  const todaySession = data.startDate ? getSessionForCycleDay(cycleDayToday) : null;

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
        {selectedSession.type === 'gym' && <GymSessionView session={selectedSession} />}
        {selectedSession.type === 'football' && <FootballView session={selectedSession} />}
        {(selectedSession.type === 'running' || selectedSession.type === 'cycling') && <CardioView session={selectedSession} />}
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

        {/* Toutes les séances du cycle */}
        <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>Toutes les séances</p>
        <div className="space-y-3">
          {cycle14Days.map(cycleDay => {
            const session = getSessionForCycleDay(cycleDay.dayNumber);
            if (!session) return null;
            const colors = SESSION_TYPE_COLORS[cycleDay.type];
            const isToday = data.startDate && cycleDay.dayNumber === cycleDayToday;
            const avgScore = session.exercises.length > 0
              ? Math.round(session.exercises.reduce((acc, e) => acc + e.relevanceScore, 0) / session.exercises.length)
              : null;

            return (
              <div
                key={cycleDay.dayNumber}
                className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                style={{
                  background: isToday ? colors.bg : 'rgba(255,255,255,0.03)',
                  border: isToday ? `1px solid ${colors.text}50` : '1px solid rgba(255,255,255,0.07)',
                }}
                onClick={() => setSelectedSession(session)}
              >
                <div className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: '18px' }}>{cycleDay.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold" style={{ color: colors.text, fontFamily: 'Inter, sans-serif' }}>J{cycleDay.dayNumber}</span>
                      {isToday && <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${colors.text}20`, color: colors.text, fontFamily: 'Inter, sans-serif' }}>Aujourd'hui</span>}
                    </div>
                    <h3 className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>{session.name}</h3>
                    <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{session.focus} · {session.durationMin}min</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {avgScore !== null ? (
                      <ScoreRing score={avgScore} size={44} strokeWidth={3} showLabel={false} />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                        <span style={{ fontSize: '16px' }}>{cycleDay.icon}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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
