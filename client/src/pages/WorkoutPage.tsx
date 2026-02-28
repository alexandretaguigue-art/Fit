// DESIGN: "Coach Nocturne" — Page des séances d'entraînement
// Journal interactif avec scoring, jugement des charges, alternatives

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Check, X, ArrowUp, ArrowRight, ArrowDown, Dumbbell, Clock, RefreshCw } from 'lucide-react';
import { programData } from '../lib/programData';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import ScoreRing from '../components/ScoreRing';
import type { SessionLog, WorkoutSession, Exercise } from '../lib/programData';
import { toast } from 'sonner';

const ARMS_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/arms-workout-2RWQ6DDsWG2NyCDojBoRnV.webp";
const LEGS_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/legs-workout-FPHHWKCXVWXNSCVHGWmz2h.webp";

interface SetData {
  weight: number;
  reps: number;
  completed: boolean;
}

interface ExerciseLog {
  exerciseId: string;
  sets: SetData[];
  alternativeUsed?: string;
  notes?: string;
}

function ExerciseCard({ exercise, onLog, lastLog }: {
  exercise: Exercise;
  onLog: (log: ExerciseLog) => void;
  lastLog?: ExerciseLog;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAlt, setShowAlt] = useState(false);
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  const [sets, setSets] = useState<SetData[]>(() =>
    Array.from({ length: exercise.sets }, (_, i) => ({
      weight: lastLog?.sets[i]?.weight ?? exercise.defaultWeight ?? 0,
      reps: lastLog?.sets[i]?.reps ?? exercise.repsMin,
      completed: false,
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
    onLog({
      exerciseId: exercise.id,
      sets,
      alternativeUsed: selectedAlt ?? undefined,
    });
    toast.success(`${selectedAlt ?? exercise.name} enregistré !`);
  };

  const repsLabel = exercise.repsMax === null
    ? `${exercise.repsMin}s`
    : exercise.repsMin === exercise.repsMax
      ? `${exercise.repsMin}`
      : `${exercise.repsMin}-${exercise.repsMax}`;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: allCompleted ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <ScoreRing score={displayScore} size={56} strokeWidth={4} showLabel={false} animate={expanded} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="text-white font-bold text-sm leading-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {selectedAlt ?? exercise.name}
            </h3>
            {allCompleted && <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />}
          </div>
          <p className="text-white/50 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
            {exercise.muscleGroups.join(' · ')}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(255, 107, 53, 0.15)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
            >
              {exercise.sets} × {repsLabel}
            </span>
            <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              <Clock size={10} className="inline mr-1" />
              {exercise.restSeconds}s repos
            </span>
            <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              {completedCount}/{exercise.sets} séries
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp size={16} className="text-white/30" /> : <ChevronDown size={16} className="text-white/30" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Score & Raison */}
          <div className="pt-3">
            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <Info size={14} className="text-white/40 flex-shrink-0 mt-0.5" />
              <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                <span className="text-white/80 font-medium">Pertinence {displayScore}/100 — </span>
                {selectedAlt
                  ? `Alternative utilisée. ${exercise.relevanceReason}`
                  : exercise.relevanceReason}
              </p>
            </div>
          </div>

          {/* Séries */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Séries
            </p>
            <div className="space-y-2">
              {sets.map((set, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl transition-all duration-200"
                  style={{
                    background: set.completed ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.04)',
                    border: set.completed ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    className="text-white/40 text-xs font-mono w-6 text-center flex-shrink-0"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      value={set.weight}
                      onChange={e => updateSet(idx, 'weight', Number(e.target.value))}
                      className="w-16 text-center text-white text-sm font-semibold rounded-lg py-1"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      step="2.5"
                      min="0"
                    />
                    <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>kg</span>
                  </div>
                  <span className="text-white/30 text-xs">×</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={set.reps}
                      onChange={e => updateSet(idx, 'reps', Number(e.target.value))}
                      className="w-12 text-center text-white text-sm font-semibold rounded-lg py-1"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      min="1"
                    />
                    <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>reps</span>
                  </div>
                  <button
                    onClick={() => toggleSet(idx)}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      background: set.completed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    {set.completed
                      ? <Check size={14} className="text-green-400" />
                      : <X size={14} className="text-white/30" />
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Conseils */}
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              Conseils d'exécution
            </p>
            <div className="space-y-1.5">
              {exercise.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: '#FF6B35' }}
                  />
                  <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Progression */}
          <div
            className="p-3 rounded-xl"
            style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}
          >
            <p className="text-orange-400/80 text-xs font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Progression
            </p>
            <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {exercise.weightProgression}
            </p>
          </div>

          {/* Alternatives */}
          {exercise.alternatives.length > 0 && (
            <div>
              <button
                onClick={() => setShowAlt(!showAlt)}
                className="flex items-center gap-2 text-white/50 text-xs"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <RefreshCw size={12} />
                {showAlt ? 'Masquer les alternatives' : `${exercise.alternatives.length} alternative(s) disponible(s)`}
              </button>
              {showAlt && (
                <div className="mt-2 space-y-2">
                  <button
                    onClick={() => setSelectedAlt(null)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200"
                    style={{
                      background: !selectedAlt ? 'rgba(255, 107, 53, 0.12)' : 'rgba(255,255,255,0.04)',
                      border: !selectedAlt ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <span className="text-white text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {exercise.name} (original)
                    </span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}
                    >
                      {exercise.relevanceScore}/100
                    </span>
                  </button>
                  {exercise.alternatives.map(alt => (
                    <button
                      key={alt.name}
                      onClick={() => setSelectedAlt(alt.name)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200"
                      style={{
                        background: selectedAlt === alt.name ? 'rgba(255, 107, 53, 0.12)' : 'rgba(255,255,255,0.04)',
                        border: selectedAlt === alt.name ? '1px solid rgba(255, 107, 53, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className="text-white/80 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {alt.name}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{
                          color: alt.relevanceScore >= 90 ? '#22c55e' : alt.relevanceScore >= 75 ? '#84cc16' : '#eab308',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {alt.relevanceScore}/100
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bouton enregistrer */}
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-95"
            style={{
              background: allCompleted
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #FF6B35, #FF3366)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {allCompleted ? '✓ Exercice terminé' : 'Enregistrer les séries'}
          </button>
        </div>
      )}
    </div>
  );
}

function SessionView({ session }: { session: WorkoutSession }) {
  const { logSession, getLastSessionLog, analyzeSession, getSuggestedWeight, getCurrentWeek } = useFitnessTracker();
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [difficulty, setDifficulty] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const currentWeek = getCurrentWeek();
  const lastLog = getLastSessionLog(session.id);

  const handleExerciseLog = (log: ExerciseLog) => {
    setExerciseLogs(prev => {
      const existing = prev.findIndex(l => l.exerciseId === log.exerciseId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = log;
        return updated;
      }
      return [...prev, log];
    });
  };

  const handleSubmitSession = () => {
    const sessionLog: SessionLog = {
      sessionId: session.id,
      date: new Date().toISOString(),
      weekNumber: currentWeek,
      exercises: exerciseLogs,
      perceivedDifficulty: difficulty,
      energyLevel: energy,
      overallNotes: notes,
    };
    logSession(sessionLog);
    const analysis = analyzeSession(sessionLog);
    setSubmitted(true);
    toast.success(`Séance enregistrée ! Score : ${analysis.score}/100`);
  };

  if (submitted) {
    const tempLog: SessionLog = {
      sessionId: session.id,
      date: new Date().toISOString(),
      weekNumber: currentWeek,
      exercises: exerciseLogs,
      perceivedDifficulty: difficulty,
      energyLevel: energy,
    };
    const analysis = analyzeSession(tempLog);
    const verdictColor = {
      excellent: '#22c55e',
      good: '#84cc16',
      average: '#eab308',
      poor: '#ef4444',
    }[analysis.verdict];
    const verdictLabel = {
      excellent: 'Excellent',
      good: 'Bien',
      average: 'Moyen',
      poor: 'Difficile',
    }[analysis.verdict];

    return (
      <div className="p-4 space-y-4">
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="text-5xl font-bold mb-2"
            style={{ fontFamily: 'Syne, sans-serif', color: verdictColor }}
          >
            {analysis.score}/100
          </div>
          <div className="text-white font-semibold text-lg mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            {verdictLabel}
          </div>
          {analysis.feedback.map((f, i) => (
            <p key={i} className="text-white/70 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{f}</p>
          ))}
        </div>
        {analysis.suggestions.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}
          >
            <p className="text-orange-400 font-semibold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
              Conseils pour la prochaine séance
            </p>
            {analysis.suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <ArrowRight size={12} className="text-orange-400 flex-shrink-0 mt-1" />
                <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{s}</p>
              </div>
            ))}
          </div>
        )}
        {/* Suggestions de progression par exercice */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-white/70 font-semibold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Charges suggérées — prochaine séance
          </p>
          {exerciseLogs.map(exLog => {
            const ex = session.exercises.find(e => e.id === exLog.exerciseId);
            if (!ex) return null;
            const maxWeight = Math.max(...exLog.sets.map(s => s.weight), 0);
            const allDone = exLog.sets.every(s => s.completed);
            const suggestion = getSuggestedWeight(exLog.exerciseId, maxWeight, allDone, difficulty);
            const dirIcon = suggestion.direction === 'up'
              ? <ArrowUp size={12} className="text-green-400" />
              : suggestion.direction === 'down'
                ? <ArrowDown size={12} className="text-red-400" />
                : <ArrowRight size={12} className="text-yellow-400" />;
            return (
              <div key={exLog.exerciseId} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {ex.name.length > 25 ? ex.name.substring(0, 25) + '…' : ex.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {dirIcon}
                  <span
                    className="text-white text-xs font-semibold"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {suggestion.suggestedWeight} kg
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="w-full py-3 rounded-xl text-white/60 text-sm border"
          style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }}
        >
          Voir les exercices
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Note du coach */}
      <div
        className="p-3 rounded-xl"
        style={{ background: 'rgba(255, 107, 53, 0.06)', border: '1px solid rgba(255, 107, 53, 0.15)' }}
      >
        <p className="text-orange-400/80 text-xs font-semibold mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          Note du coach
        </p>
        <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
          {session.coachNote}
        </p>
      </div>

      {/* Exercices */}
      {session.exercises.map(exercise => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onLog={handleExerciseLog}
          lastLog={exerciseLogs.find(l => l.exerciseId === exercise.id)}
        />
      ))}

      {/* Évaluation de la séance */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-white/70 font-semibold text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          Évaluation de la séance
        </p>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Difficulté perçue</span>
              <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{difficulty}/10</span>
            </div>
            <input
              type="range" min="1" max="10" value={difficulty}
              onChange={e => setDifficulty(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#FF6B35' }}
            />
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Niveau d'énergie</span>
              <span className="text-white font-bold text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{energy}/10</span>
            </div>
            <input
              type="range" min="1" max="10" value={energy}
              onChange={e => setEnergy(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: '#FF6B35' }}
            />
          </div>
          <div>
            <p className="text-white/60 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Notes (optionnel)</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Douleurs, sensations, remarques..."
              className="w-full text-white/80 text-xs rounded-xl p-3 resize-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Inter, sans-serif',
                minHeight: '80px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Bouton terminer */}
      <button
        onClick={handleSubmitSession}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:opacity-90 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #FF6B35, #FF3366)',
          fontFamily: 'Syne, sans-serif',
          boxShadow: '0 8px 30px rgba(255, 107, 53, 0.25)',
        }}
      >
        Terminer et analyser la séance
      </button>
    </div>
  );
}

export default function WorkoutPage() {
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  const sessionImages: Record<string, string> = {
    upper_a: ARMS_IMAGE,
    upper_b: ARMS_IMAGE,
    lower_a: LEGS_IMAGE,
    lower_b: LEGS_IMAGE,
  };

  if (selectedSession) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
        {/* Header */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={sessionImages[selectedSession.id]}
            alt={selectedSession.name}
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.45)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(15,15,20,0.5), rgba(15,15,20,1))' }}
          />
          <div className="absolute inset-0 p-5 flex flex-col justify-end">
            <button
              onClick={() => setSelectedSession(null)}
              className="absolute top-5 left-5 text-white/60 text-sm flex items-center gap-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              ← Retour
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell size={14} style={{ color: '#FF6B35' }} />
              <span className="text-orange-400 text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                {selectedSession.focus}
              </span>
            </div>
            <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              {selectedSession.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                {selectedSession.exercises.length} exercices
              </span>
              <span className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                ~{selectedSession.durationMin} min
              </span>
            </div>
          </div>
        </div>
        <SessionView session={selectedSession} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      <div className="p-5">
        <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Séances
        </h1>
        <p className="text-white/50 text-sm mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          4 séances par semaine · Haut + Bas du corps
        </p>

        <div className="space-y-4">
          {programData.sessions.map(session => {
            const dayNames: Record<number, string> = { 1: 'Lundi', 2: 'Mardi', 4: 'Jeudi', 5: 'Vendredi' };
            const isArms = session.id.startsWith('upper');
            const avgScore = Math.round(
              session.exercises.reduce((acc, e) => acc + e.relevanceScore, 0) / session.exercises.length
            );

            return (
              <div
                key={session.id}
                className="rounded-2xl overflow-hidden cursor-pointer hover-glow transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={() => setSelectedSession(session)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={sessionImages[session.id]}
                    alt={session.name}
                    className="w-full h-full object-cover"
                    style={{ filter: 'brightness(0.4)' }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to right, rgba(15,15,20,0.9) 0%, rgba(15,15,20,0.3) 100%)' }}
                  />
                  <div className="absolute inset-0 p-4 flex items-center justify-between">
                    <div>
                      <span
                        className="text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
                      >
                        {dayNames[session.day]}
                      </span>
                      <h3 className="text-white text-lg font-bold mt-0.5" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {session.name}
                      </h3>
                      <p className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {session.focus}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <ScoreRing score={avgScore} size={52} strokeWidth={4} showLabel={false} />
                      <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {session.exercises.length} ex · {session.durationMin}min
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende des scores */}
        <div
          className="mt-6 rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Légende des scores de pertinence
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { range: '90-100', label: 'Optimal', color: '#22c55e' },
              { range: '75-89', label: 'Excellent', color: '#84cc16' },
              { range: '60-74', label: 'Très bon', color: '#eab308' },
              { range: '< 60', label: 'Acceptable', color: '#ef4444' },
            ].map(({ range, label, color }) => (
              <div key={range} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {range} — {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
