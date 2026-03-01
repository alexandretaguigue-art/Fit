// ============================================================
// DESIGN: "Coach Nocturne" — Composant SessionTimeline
// Affiche l'historique + les prévisions des séances par domaine
// Navigation flèche gauche (passé) / droite (futur)
// ============================================================
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react';
import { cycle14Days, getSessionForCycleDay, type WorkoutSession } from '../lib/programData';
import { useFitnessTracker } from '../hooks/useFitnessTracker';

// ============================================================
// TYPES
// ============================================================
interface TimelineEntry {
  date: string;           // YYYY-MM-DD
  cycleIndex: number;     // numéro du cycle (1, 2, 3...)
  cycleDay: number;       // jour dans le cycle (1-14)
  sessionId: string;
  label: string;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
  log?: {
    perceivedDifficulty: number;
    energyLevel: number;
    overallNotes?: string;
    exercises?: Array<{ exerciseId: string; sets: Array<{ weight: number; reps: number; completed: boolean }> }>;
    cardioData?: { durationMin?: number; distanceKm?: number; avgPaceMinPerKm?: number; avgHeartRate?: number };
  };
  projection?: {
    message: string;
    highlight?: string;
  };
}

// Domaines de séances
const DOMAIN_CONFIG: Record<string, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  sessionIds: string[];
}> = {
  gym: {
    label: 'Musculation',
    icon: '💪',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    sessionIds: ['upper_a', 'lower_a', 'upper_b', 'lower_b'],
  },
  running: {
    label: 'Course',
    icon: '🏃',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    sessionIds: ['running_endurance', 'running_intervals'],
  },
  football: {
    label: 'Football',
    icon: '⚽',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    sessionIds: ['football'],
  },
  cycling: {
    label: 'Vélo',
    icon: '🚴',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    sessionIds: ['cycling'],
  },
};

// ============================================================
// HELPERS
// ============================================================
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getDaysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function formatPace(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}'${String(s).padStart(2, '0')}"`;
}

// Calcule la progression entre deux séances (pour les exercices de muscu)
function computeGymProgression(
  current: Array<{ exerciseId: string; sets: Array<{ weight: number; reps: number; completed: boolean }> }>,
  previous: Array<{ exerciseId: string; sets: Array<{ weight: number; reps: number; completed: boolean }> }>
): { trend: 'up' | 'down' | 'same'; detail: string } {
  if (!previous || previous.length === 0) return { trend: 'same', detail: 'Première séance' };
  
  let totalVolumeCurrent = 0;
  let totalVolumePrevious = 0;
  
  current.forEach(ex => {
    ex.sets.filter(s => s.completed).forEach(s => {
      totalVolumeCurrent += s.weight * s.reps;
    });
  });
  previous.forEach(ex => {
    ex.sets.filter(s => s.completed).forEach(s => {
      totalVolumePrevious += s.weight * s.reps;
    });
  });
  
  if (totalVolumePrevious === 0) return { trend: 'same', detail: 'Pas de données' };
  
  const diff = totalVolumeCurrent - totalVolumePrevious;
  const pct = Math.round((diff / totalVolumePrevious) * 100);
  
  if (pct > 3) return { trend: 'up', detail: `+${pct}% de volume` };
  if (pct < -3) return { trend: 'down', detail: `${pct}% de volume` };
  return { trend: 'same', detail: 'Volume stable' };
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
interface SessionTimelineProps {
  session: WorkoutSession;
  domain: 'gym' | 'running' | 'football' | 'cycling';
}

export default function SessionTimeline({ session, domain }: SessionTimelineProps) {
  const { data, getSessionLogs, getCardioAdaptation } = useFitnessTracker();
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null); // null = aujourd'hui

  const config = DOMAIN_CONFIG[domain];
  const today = new Date().toISOString().split('T')[0];

  // ============================================================
  // GÉNÉRATION DE LA TIMELINE (passé + futur sur 12 semaines)
  // ============================================================
  const timeline = useMemo((): TimelineEntry[] => {
    if (!data.startDate) return [];

    const entries: TimelineEntry[] = [];
    const startDate = data.startDate.split('T')[0];
    const totalDays = 84; // 12 semaines

    for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
      const date = addDays(startDate, dayOffset);
      const cycleDay = ((dayOffset % 14) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
      const cycleIndex = Math.floor(dayOffset / 14) + 1;
      const cycleInfo = cycle14Days.find(c => c.dayNumber === cycleDay);
      
      if (!cycleInfo) continue;
      if (!config.sessionIds.includes(cycleInfo.sessionId)) continue;

      const isPast = date < today;
      const isToday = date === today;
      const isFuture = date > today;

      // Chercher le log correspondant
      const matchingLog = data.sessionLogs.find(l => {
        const logDate = l.date.split('T')[0];
        return logDate === date && l.sessionId === cycleInfo.sessionId;
      });

      // Projection pour les séances futures
      let projection: TimelineEntry['projection'] | undefined;
      if (isFuture) {
        const pastLogs = data.sessionLogs
          .filter(l => l.sessionId === cycleInfo.sessionId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (pastLogs.length > 0 && domain === 'running') {
          const adapt = getCardioAdaptation(cycleInfo.sessionId);
          projection = {
            message: adapt.message,
            highlight: adapt.nextTarget.distanceKm
              ? `Objectif : ${adapt.nextTarget.distanceKm} km`
              : adapt.nextTarget.paceTarget
              ? `Allure cible : ${adapt.nextTarget.paceTarget}`
              : undefined,
          };
        } else if (isFuture && domain === 'gym' && pastLogs.length > 0) {
          projection = {
            message: 'Charges adaptées selon ta dernière séance',
            highlight: 'Poids pré-remplis automatiquement',
          };
        } else if (isFuture) {
          projection = {
            message: cycleIndex === 1 ? 'Séance de fondation' : cycleIndex <= 4 ? 'Phase Accumulation' : cycleIndex <= 8 ? 'Phase Développement' : 'Phase Intensification',
          };
        }
      }

      entries.push({
        date,
        cycleIndex,
        cycleDay,
        sessionId: cycleInfo.sessionId,
        label: cycleInfo.label,
        isPast,
        isToday,
        isFuture,
        log: matchingLog ? {
          perceivedDifficulty: matchingLog.perceivedDifficulty,
          energyLevel: matchingLog.energyLevel,
          overallNotes: matchingLog.overallNotes,
          exercises: matchingLog.exercises,
        } : undefined,
        projection,
      });
    }

    return entries;
  }, [data.startDate, data.sessionLogs, today, config.sessionIds, domain, getCardioAdaptation]);

  // Index de la séance d'aujourd'hui dans la timeline
  const todayIndex = useMemo(() => {
    const idx = timeline.findIndex(e => e.isToday);
    return idx >= 0 ? idx : timeline.findIndex(e => e.isFuture);
  }, [timeline]);

  // Séance affichée
  const displayIndex = currentIndex !== null ? currentIndex : todayIndex;
  const displayEntry = timeline[displayIndex];

  // Compter passé/futur
  const pastCount = timeline.filter(e => e.isPast && e.log).length;
  const futureCount = timeline.filter(e => e.isFuture).length;

  if (!data.startDate) return null;

  return (
    <div className="mt-4">
      {/* Bouton d'ouverture */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setCurrentIndex(null);
        }}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div className="text-left">
            <p className={`text-sm font-semibold ${config.color}`} style={{ fontFamily: 'Syne, sans-serif' }}>
              Historique {config.label}
            </p>
            <p className="text-white/50 text-xs">
              {pastCount} séance{pastCount > 1 ? 's' : ''} réalisée{pastCount > 1 ? 's' : ''} · {futureCount} à venir
            </p>
          </div>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Panel timeline */}
      {isOpen && (
        <div className="mt-2 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          {/* Navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <button
              onClick={() => setCurrentIndex(Math.max(0, (displayIndex ?? 0) - 1))}
              disabled={displayIndex <= 0}
              className="p-1.5 rounded-lg bg-white/10 disabled:opacity-30 hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>

            {/* Indicateur de position */}
            <div className="flex items-center gap-1.5">
              {timeline.map((entry, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all rounded-full ${
                    idx === displayIndex
                      ? `w-6 h-2 ${entry.isToday ? 'bg-white' : entry.isPast ? (entry.log ? 'bg-green-400' : 'bg-white/30') : 'bg-white/20'}`
                      : `w-2 h-2 ${entry.isToday ? 'bg-white/60' : entry.isPast ? (entry.log ? 'bg-green-400/60' : 'bg-white/20') : 'bg-white/10'}`
                  }`}
                  title={formatDate(entry.date)}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentIndex(Math.min(timeline.length - 1, (displayIndex ?? 0) + 1))}
              disabled={displayIndex >= timeline.length - 1}
              className="p-1.5 rounded-lg bg-white/10 disabled:opacity-30 hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Contenu de la séance affichée */}
          {displayEntry ? (
            <div className="p-4">
              {/* Header séance */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    {displayEntry.isToday && (
                      <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
                        AUJOURD'HUI
                      </span>
                    )}
                    {displayEntry.isPast && displayEntry.log && (
                      <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> RÉALISÉE
                      </span>
                    )}
                    {displayEntry.isPast && !displayEntry.log && (
                      <span className="text-xs font-bold text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                        NON ENREGISTRÉE
                      </span>
                    )}
                    {displayEntry.isFuture && (
                      <span className="text-xs font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> À VENIR
                      </span>
                    )}
                  </div>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {displayEntry.label}
                  </p>
                  <p className="text-white/50 text-xs mt-0.5">
                    {formatDate(displayEntry.date)} · Cycle {displayEntry.cycleIndex}, J{displayEntry.cycleDay}
                  </p>
                </div>
                <span className="text-2xl">{config.icon}</span>
              </div>

              {/* Données de la séance passée */}
              {displayEntry.log && (
                <div className="space-y-3">
                  {/* Ressenti */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/5 rounded-lg p-2.5 text-center">
                      <p className="text-white/40 text-xs mb-1">Difficulté</p>
                      <p className="text-white font-bold text-lg">{displayEntry.log.perceivedDifficulty}/10</p>
                    </div>
                    <div className="flex-1 bg-white/5 rounded-lg p-2.5 text-center">
                      <p className="text-white/40 text-xs mb-1">Énergie</p>
                      <p className="text-white font-bold text-lg">{displayEntry.log.energyLevel}/10</p>
                    </div>
                  </div>

                  {/* Données cardio */}
                  {displayEntry.log.overallNotes && (
                    <div className={`rounded-lg p-3 ${config.bgColor} border ${config.borderColor}`}>
                      <p className={`text-xs font-semibold ${config.color} mb-1`}>Performance</p>
                      <p className="text-white/80 text-sm">{displayEntry.log.overallNotes}</p>
                    </div>
                  )}

                  {/* Données musculation — exercices clés */}
                  {displayEntry.log.exercises && displayEntry.log.exercises.length > 0 && domain === 'gym' && (
                    <div className="space-y-1.5">
                      <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Exercices réalisés</p>
                      {displayEntry.log.exercises.slice(0, 4).map((ex, i) => {
                        const completedSets = ex.sets.filter(s => s.completed);
                        if (completedSets.length === 0) return null;
                        const maxWeight = Math.max(...completedSets.map(s => s.weight));
                        const totalReps = completedSets.reduce((acc, s) => acc + s.reps, 0);
                        
                        // Comparaison avec séance précédente du même type
                        const prevLogs = data.sessionLogs
                          .filter(l => l.sessionId === displayEntry.sessionId && l.date < displayEntry.date)
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        const prevEx = prevLogs[0]?.exercises?.find(e => e.exerciseId === ex.exerciseId);
                        const prevMax = prevEx ? Math.max(...prevEx.sets.filter(s => s.completed).map(s => s.weight)) : null;
                        const trend = prevMax !== null ? (maxWeight > prevMax ? 'up' : maxWeight < prevMax ? 'down' : 'same') : null;

                        return (
                          <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                            <p className="text-white/70 text-xs capitalize">
                              {ex.exerciseId.replace(/_/g, ' ')}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-white text-xs font-semibold">
                                {maxWeight}kg × {totalReps} reps
                              </p>
                              {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
                              {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
                              {trend === 'same' && <Minus className="w-3 h-3 text-white/30" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Progression vs séance précédente */}
                  {domain === 'gym' && displayEntry.log.exercises && (() => {
                    const prevLogs = data.sessionLogs
                      .filter(l => l.sessionId === displayEntry.sessionId && l.date < displayEntry.date)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    if (prevLogs.length === 0) return null;
                    const prog = computeGymProgression(displayEntry.log.exercises!, prevLogs[0].exercises);
                    return (
                      <div className={`flex items-center gap-2 rounded-lg p-2.5 ${
                        prog.trend === 'up' ? 'bg-green-500/10 border border-green-500/20' :
                        prog.trend === 'down' ? 'bg-red-500/10 border border-red-500/20' :
                        'bg-white/5 border border-white/10'
                      }`}>
                        {prog.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />}
                        {prog.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />}
                        {prog.trend === 'same' && <Minus className="w-4 h-4 text-white/40 shrink-0" />}
                        <p className={`text-xs font-semibold ${
                          prog.trend === 'up' ? 'text-green-400' :
                          prog.trend === 'down' ? 'text-red-400' :
                          'text-white/50'
                        }`}>
                          vs séance précédente : {prog.detail}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Séance future — projection */}
              {displayEntry.isFuture && displayEntry.projection && (
                <div className={`rounded-lg p-3 ${config.bgColor} border ${config.borderColor}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Clock className={`w-3.5 h-3.5 ${config.color}`} />
                    <p className={`text-xs font-semibold ${config.color}`}>Prévision adaptée</p>
                  </div>
                  <p className="text-white/70 text-sm">{displayEntry.projection.message}</p>
                  {displayEntry.projection.highlight && (
                    <p className={`text-xs font-bold mt-1.5 ${config.color}`}>
                      → {displayEntry.projection.highlight}
                    </p>
                  )}
                </div>
              )}

              {/* Séance passée non enregistrée */}
              {displayEntry.isPast && !displayEntry.log && (
                <div className="rounded-lg p-3 bg-white/5 border border-white/10 text-center">
                  <p className="text-white/30 text-sm">Séance non enregistrée</p>
                  <p className="text-white/20 text-xs mt-0.5">
                    {getDaysBetween(displayEntry.date, today)} jour{getDaysBetween(displayEntry.date, today) > 1 ? 's' : ''} passé{getDaysBetween(displayEntry.date, today) > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Boutons de navigation rapide */}
              <div className="flex gap-2 mt-3">
                {/* Séance précédente du même domaine */}
                {displayIndex > 0 && (
                  <button
                    onClick={() => setCurrentIndex(displayIndex - 1)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-white/50 text-xs">Précédente</span>
                  </button>
                )}
                {/* Retour à aujourd'hui */}
                {!displayEntry.isToday && todayIndex >= 0 && (
                  <button
                    onClick={() => setCurrentIndex(null)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <span className="text-white/70 text-xs font-semibold">Aujourd'hui</span>
                  </button>
                )}
                {/* Séance suivante du même domaine */}
                {displayIndex < timeline.length - 1 && (
                  <button
                    onClick={() => setCurrentIndex(displayIndex + 1)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="text-white/50 text-xs">Suivante</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/50" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-white/30 text-sm">Programme non démarré</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
