// ============================================================
// DESIGN: "Coach Nocturne" — Dark Mode Premium Fitness
// Page Progrès : mesures hebdomadaires, adaptation calorique, graphiques
// ============================================================

import { useState } from 'react';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Plus, TrendingUp, Scale, Ruler, Target, ChevronDown, ChevronUp, Flame, Zap } from 'lucide-react';
import { toast } from 'sonner';
import {
  computeCalorieAdaptation,
  computeIdealWeightProgression,
  analyzeBodyComposition,
  computeWeekProjections,
  type WeeklyMeasurement,
} from '../lib/calorieAdaptationEngine';

// ============================================================
// TOOLTIP PERSONNALISÉ
// ============================================================

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(14,14,22,0.97)', border: '1px solid rgba(255,107,53,0.3)', fontFamily: 'Inter, sans-serif' }}>
        <p className="text-white/50 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong> {p.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ============================================================
// NORMES RELATIVES PAR EXERCICE (ratio charge / poids de corps)
// Source : Strength Level, Layne Norton, Jeff Nippard
// Adapté pour 68kg, intermédiaire
// Attention : les exercices de jambes (squat, presse) ont naturellement
// des charges plus élevées que les exercices de bras — c'est normal.
// ============================================================
const EXERCISE_NORMS: Record<string, {
  name: string;
  group: string;
  color: string;
  // Ratio charge max / poids de corps pour un intermédiaire (68kg)
  // Ex : squat à 1.2 = 68 × 1.2 = ~82 kg est un niveau intermédiaire
  beginnerRatio: number;
  intermediateRatio: number;
  advancedRatio: number;
  // Contexte : certains exercices sont naturellement plus lourds
  context: string;
}> = {
  developpe_couche:       { name: 'Développé couché',    group: 'Pectoraux',  color: '#FF6B35', beginnerRatio: 0.5, intermediateRatio: 0.9, advancedRatio: 1.25, context: 'Exercice de référence haut du corps' },
  developpe_halteres:     { name: 'Dév. haltères',        group: 'Pectoraux',  color: '#FF6B35', beginnerRatio: 0.2, intermediateRatio: 0.35, advancedRatio: 0.5,  context: 'Par haltère — diviser par 2 pour comparer au DC' },
  squat:                  { name: 'Squat',                 group: 'Jambes',     color: '#22C55E', beginnerRatio: 0.75, intermediateRatio: 1.25, advancedRatio: 1.75, context: 'Naturellement plus lourd que les exos haut du corps' },
  presse_cuisse:          { name: 'Presse cuisse',         group: 'Jambes',     color: '#22C55E', beginnerRatio: 1.5, intermediateRatio: 2.5, advancedRatio: 3.5,  context: 'Presse : charge élevée normale (levier mécanique)' },
  souleve_de_terre:       { name: 'Soulevé de terre',     group: 'Postérieur', color: '#8B5CF6', beginnerRatio: 0.75, intermediateRatio: 1.4, advancedRatio: 2.0,  context: 'Exercice roi du postérieur de cuisse + dos' },
  sdt_roumain:            { name: 'SDT roumain',           group: 'Ischio',     color: '#8B5CF6', beginnerRatio: 0.5, intermediateRatio: 0.9, advancedRatio: 1.3,  context: 'Ischio-jambiers — charge inférieure au SDT classique' },
  fentes_marche:          { name: 'Fentes marchées',      group: 'Jambes',     color: '#22C55E', beginnerRatio: 0.3, intermediateRatio: 0.6, advancedRatio: 0.9,  context: 'Par haltère — unilatéral, charge relative plus faible' },
  hip_thrust:             { name: 'Hip thrust',            group: 'Fessiers',   color: '#EC4899', beginnerRatio: 0.8, intermediateRatio: 1.5, advancedRatio: 2.2,  context: 'Fessiers — charge naturellement élevée' },
  tractions:              { name: 'Tractions',             group: 'Dos',        color: '#3B82F6', beginnerRatio: 0.0, intermediateRatio: 0.1, advancedRatio: 0.3,  context: 'Lest ajouté au poids de corps (0 = poids de corps)' },
  rowing_barre:           { name: 'Rowing barre',          group: 'Dos',        color: '#3B82F6', beginnerRatio: 0.5, intermediateRatio: 0.9, advancedRatio: 1.3,  context: 'Dos épais — comparable au DC' },
  curl_barre:             { name: 'Curl barre',            group: 'Biceps',     color: '#F59E0B', beginnerRatio: 0.2, intermediateRatio: 0.35, advancedRatio: 0.5,  context: 'Biceps — charges faibles normales vs jambes' },
  curl_incline:           { name: 'Curl incliné',         group: 'Biceps',     color: '#F59E0B', beginnerRatio: 0.1, intermediateRatio: 0.2, advancedRatio: 0.3,  context: 'Par haltère — étirement maximal biceps' },
  curl_marteau:           { name: 'Curl marteau',          group: 'Biceps',     color: '#F59E0B', beginnerRatio: 0.15, intermediateRatio: 0.25, advancedRatio: 0.4,  context: 'Brachial + biceps — souvent plus lourd que curl classique' },
  dips:                   { name: 'Dips',                  group: 'Triceps',    color: '#EF4444', beginnerRatio: 0.0, intermediateRatio: 0.15, advancedRatio: 0.4,  context: 'Lest ajouté au poids de corps' },
  extension_triceps_poulie: { name: 'Extension triceps',  group: 'Triceps',    color: '#EF4444', beginnerRatio: 0.1, intermediateRatio: 0.2, advancedRatio: 0.35, context: 'Poulie haute — isolation triceps' },
  face_pull:              { name: 'Face pull',             group: 'Épaules',    color: '#A78BFA', beginnerRatio: 0.1, intermediateRatio: 0.2, advancedRatio: 0.35, context: 'Deltoïdes postérieurs — charge légère normale' },
  elevation_laterale:     { name: 'Élév. latérales',       group: 'Épaules',    color: '#A78BFA', beginnerRatio: 0.05, intermediateRatio: 0.1, advancedRatio: 0.18, context: 'Deltoïdes latéraux — toujours léger, c’est normal' },
  leg_extension:          { name: 'Leg extension',         group: 'Jambes',     color: '#22C55E', beginnerRatio: 0.4, intermediateRatio: 0.7, advancedRatio: 1.0,  context: 'Isolation quadriceps' },
  leg_curl:               { name: 'Leg curl',              group: 'Ischio',     color: '#8B5CF6', beginnerRatio: 0.3, intermediateRatio: 0.5, advancedRatio: 0.75, context: 'Isolation ischio-jambiers' },
  mollets:                { name: 'Mollets',               group: 'Mollets',    color: '#06B6D4', beginnerRatio: 0.8, intermediateRatio: 1.5, advancedRatio: 2.5,  context: 'Mollets — charge élevée normale (muscle endurance)' },
};

function getStrengthLevel(exerciseId: string, maxWeight: number, bodyWeight = 68): {
  level: 'debutant' | 'intermediaire' | 'avance' | 'elite';
  label: string;
  color: string;
  ratio: number;
  nextTarget: number;
  gap: number;
} {
  const norm = EXERCISE_NORMS[exerciseId];
  if (!norm) return { level: 'intermediaire', label: 'Intermédiaire', color: '#3b82f6', ratio: 0, nextTarget: 0, gap: 0 };
  const ratio = maxWeight / bodyWeight;
  if (ratio < norm.beginnerRatio) {
    const nextTarget = Math.round(norm.beginnerRatio * bodyWeight);
    return { level: 'debutant', label: 'Débutant', color: '#ef4444', ratio, nextTarget, gap: nextTarget - maxWeight };
  } else if (ratio < norm.intermediateRatio) {
    const nextTarget = Math.round(norm.intermediateRatio * bodyWeight);
    return { level: 'intermediaire', label: 'Intermédiaire', color: '#f59e0b', ratio, nextTarget, gap: nextTarget - maxWeight };
  } else if (ratio < norm.advancedRatio) {
    const nextTarget = Math.round(norm.advancedRatio * bodyWeight);
    return { level: 'avance', label: 'Avancé', color: '#22c55e', ratio, nextTarget, gap: nextTarget - maxWeight };
  } else {
    return { level: 'elite', label: 'Élite', color: '#a855f7', ratio, nextTarget: 0, gap: 0 };
  }
}

function ExercisesTab({ getExerciseProgress, totalSessions }: {
  getExerciseProgress: (id: string) => Array<{ maxWeight: number; totalVolume: number; date: string }> | null;
  totalSessions: number;
}) {
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const EXERCISE_LIST = Object.entries(EXERCISE_NORMS).map(([id, norm]) => ({ id, ...norm }));
  const GROUPS = ['all', ...Array.from(new Set(EXERCISE_LIST.map(e => e.group)))];

  const exercisesWithData = EXERCISE_LIST.map(ex => {
    const progress = getExerciseProgress(ex.id);
    if (!progress || progress.length === 0) return null;
    const lastWeight = progress[progress.length - 1].maxWeight;
    const firstWeight = progress[0].maxWeight;
    const strengthInfo = getStrengthLevel(ex.id, lastWeight);
    return { ...ex, progress, lastWeight, firstWeight, strengthInfo };
  }).filter(Boolean) as Array<{
    id: string; name: string; group: string; color: string; context: string;
    progress: Array<{ maxWeight: number; totalVolume: number; date: string }>;
    lastWeight: number; firstWeight: number;
    strengthInfo: ReturnType<typeof getStrengthLevel>;
  }>;

  // Analyse globale : points forts et faibles
  const strengths = exercisesWithData
    .filter(e => e.strengthInfo.level === 'avance' || e.strengthInfo.level === 'elite')
    .sort((a, b) => b.strengthInfo.ratio - a.strengthInfo.ratio);
  const weaknesses = exercisesWithData
    .filter(e => e.strengthInfo.level === 'debutant')
    .sort((a, b) => a.strengthInfo.ratio - b.strengthInfo.ratio);

  const filtered = selectedGroup === 'all' ? exercisesWithData : exercisesWithData.filter(e => e.group === selectedGroup);

  if (totalSessions === 0) {
    return (
      <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <Zap size={32} className="text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Les graphiques de charges apparaîtront après tes premières séances</p>
        <p className="text-white/25 text-xs mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Enregistre tes charges dans chaque séance pour voir ta progression</p>
      </div>
    );
  }

  if (exercisesWithData.length === 0) {
    return (
      <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
        <Zap size={32} className="text-white/20 mx-auto mb-3" />
        <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Aucune donnée de charge enregistrée</p>
        <p className="text-white/25 text-xs mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Enregistre tes charges dans chaque séance pour voir ta progression</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Analyse globale points forts / faibles */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {strengths.length > 0 && (
            <div className="p-3 rounded-2xl" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <p className="text-green-400 text-xs font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>💪 POINTS FORTS</p>
              {strengths.slice(0, 3).map(e => (
                <div key={e.id} className="mb-1.5">
                  <p className="text-white/80 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{e.name}</p>
                  <p className="text-green-400/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{e.lastWeight} kg · {e.strengthInfo.label}</p>
                </div>
              ))}
            </div>
          )}
          {weaknesses.length > 0 && (
            <div className="p-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-red-400 text-xs font-bold mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>🎯 À TRAVAILLER</p>
              {weaknesses.slice(0, 3).map(e => (
                <div key={e.id} className="mb-1.5">
                  <p className="text-white/80 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{e.name}</p>
                  <p className="text-red-400/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Objectif : +{e.strengthInfo.gap} kg</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Note importante sur les charges relatives */}
      <div className="p-3 rounded-2xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
        <p className="text-blue-300/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
          ℹ️ <strong>Charges relatives</strong> — Normal de mettre plus lourd sur les jambes que les bras. L’analyse compare chaque exercice à ses propres normes (ex : squat intermédiaire = 1.25× poids de corps, curl intermédiaire = 0.35×).
        </p>
      </div>

      {/* Filtre par groupe musculaire */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {GROUPS.map(g => (
          <button key={g} onClick={() => setSelectedGroup(g)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: selectedGroup === g ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.05)',
              color: selectedGroup === g ? '#FF6B35' : 'rgba(255,255,255,0.4)',
              border: selectedGroup === g ? '1px solid rgba(255,107,53,0.3)' : '1px solid transparent',
              fontFamily: 'Inter, sans-serif',
            }}>
            {g === 'all' ? 'Tous' : g}
          </button>
        ))}
      </div>

      {/* Graphiques par exercice */}
      {filtered.map(ex => {
        const chartData = ex.progress.map((p, i) => ({
          name: `S${i + 1}`,
          'Charge (kg)': p.maxWeight,
        }));
        const gain = ex.lastWeight - ex.firstWeight;
        const gainPct = ex.firstWeight > 0 ? Math.round((gain / ex.firstWeight) * 100) : 0;
        const { level, label, color: levelColor, nextTarget, gap } = ex.strengthInfo;
        const levelBarPct = Math.min(
          level === 'debutant' ? Math.round((ex.lastWeight / (EXERCISE_NORMS[ex.id].beginnerRatio * 68)) * 100)
          : level === 'intermediaire' ? Math.round(((ex.lastWeight - EXERCISE_NORMS[ex.id].beginnerRatio * 68) / ((EXERCISE_NORMS[ex.id].intermediateRatio - EXERCISE_NORMS[ex.id].beginnerRatio) * 68)) * 100)
          : level === 'avance' ? Math.round(((ex.lastWeight - EXERCISE_NORMS[ex.id].intermediateRatio * 68) / ((EXERCISE_NORMS[ex.id].advancedRatio - EXERCISE_NORMS[ex.id].intermediateRatio) * 68)) * 100)
          : 100, 100
        );

        return (
          <div key={ex.id} className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${ex.color}20` }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{ex.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: `${ex.color}15`, color: ex.color, fontFamily: 'Inter, sans-serif' }}>{ex.group}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold" style={{ background: `${levelColor}15`, color: levelColor, fontFamily: 'Inter, sans-serif' }}>{label}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif', color: ex.color }}>{ex.lastWeight} kg</div>
                {gain !== 0 && (
                  <div className="text-xs font-semibold" style={{ color: gain > 0 ? '#22c55e' : '#ef4444', fontFamily: 'Inter, sans-serif' }}>
                    {gain > 0 ? '+' : ''}{gain} kg ({gainPct > 0 ? '+' : ''}{gainPct}%)
                  </div>
                )}
              </div>
            </div>

            {/* Barre de niveau */}
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Niveau {label}</span>
                {level !== 'elite' && <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Prochain palier : {nextTarget} kg (+{gap} kg)</span>}
                {level === 'elite' && <span className="text-purple-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Élite ★</span>}
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${levelBarPct}%`, background: levelColor }} />
              </div>
            </div>

            {/* Graphique */}
            {ex.progress.length > 1 && (
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`grad-${ex.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ex.color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={ex.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Charge (kg)" stroke={ex.color} strokeWidth={2} fill={`url(#grad-${ex.id})`} dot={{ fill: ex.color, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Contexte coach */}
            <p className="text-white/25 text-xs mt-2 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{ex.context}</p>

            <div className="flex justify-between mt-1">
              <span className="text-white/25 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Début : {ex.firstWeight} kg</span>
              <span className="text-white/25 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{ex.progress.length} séances</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function ProgressPage() {
  const { data, addProgressEntry, getExerciseProgress, getStats } = useFitnessTracker();
  const stats = getStats();

  const [activeTab, setActiveTab] = useState<'weekly' | 'charts' | 'calories' | 'exercises'>('weekly');
  const [showForm, setShowForm] = useState(false);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [form, setForm] = useState({
    weight: '',
    bodyFat: '',
    armCircumference: '',
    thighCircumference: '',
    waistCircumference: '',
    notes: '',
  });

  // Convertit les progressEntries en WeeklyMeasurement
  const weeklyMeasurements: WeeklyMeasurement[] = data.progressEntries.map((e, idx) => ({
    weekNumber: idx + 1,
    date: e.date,
    weight: e.weight,
    bodyFat: e.bodyFat,
    armCircumference: e.armCircumference,
    thighCircumference: e.thighCircumference,
    waistCircumference: e.waistCircumference,
    notes: undefined,
  }));

  const currentWeek = weeklyMeasurements.length + 1;
  const calorieAdaptation = computeCalorieAdaptation(weeklyMeasurements, currentWeek);
  const projections = computeWeekProjections(
    weeklyMeasurements[0]?.weight ?? 68,
    weeklyMeasurements[0]?.bodyFat ?? 13,
    weeklyMeasurements,
    12
  );
  const idealProgression = computeIdealWeightProgression(weeklyMeasurements[0]?.weight ?? 68, 12);

  const handleSubmit = () => {
    if (!form.weight) { toast.error('Le poids est requis'); return; }
    addProgressEntry({
      date: new Date().toISOString(),
      weight: Number(form.weight),
      bodyFat: form.bodyFat ? Number(form.bodyFat) : undefined,
      armCircumference: form.armCircumference ? Number(form.armCircumference) : undefined,
      thighCircumference: form.thighCircumference ? Number(form.thighCircumference) : undefined,
      waistCircumference: form.waistCircumference ? Number(form.waistCircumference) : undefined,
    });
    setForm({ weight: '', bodyFat: '', armCircumference: '', thighCircumference: '', waistCircumference: '', notes: '' });
    setShowForm(false);
    toast.success('Mesures de la semaine enregistrées !');
  };

  // Données graphique poids
  const weightChartData = projections.map((p, i) => {
    const real = weeklyMeasurements.find(m => m.weekNumber === p.week);
    return {
      name: `S${p.week}`,
      'Poids réel': real?.weight ?? null,
      'Projection': p.projectedWeight,
      'Min idéal': idealProgression[i]?.minWeight,
      'Max idéal': idealProgression[i]?.maxWeight,
    };
  });

  // Données graphique mensurations
  const measureChartData = weeklyMeasurements.map(m => ({
    name: `S${m.weekNumber}`,
    'Bras (cm)': m.armCircumference ?? null,
    'Cuisse (cm)': m.thighCircumference ?? null,
    'Tour de taille (cm)': m.waistCircumference ?? null,
  }));

  const verdictColors: Record<string, string> = {
    too_fast: '#ef4444',
    too_slow: '#f59e0b',
    optimal: '#22c55e',
    initial: '#3b82f6',
  };
  const verdictIcons: Record<string, string> = {
    too_fast: '⚡',
    too_slow: '🐢',
    optimal: '🎯',
    initial: '🚀',
  };

  const TABS = [
    { id: 'weekly', label: 'Hebdo', icon: <Scale size={14} /> },
    { id: 'charts', label: 'Graphiques', icon: <TrendingUp size={14} /> },
    { id: 'calories', label: 'Calories', icon: <Flame size={14} /> },
    { id: 'exercises', label: 'Charges', icon: <Zap size={14} /> },
  ] as const;

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #0e0e16 0%, #12121e 100%)' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Suivi</p>
        <h1 className="text-white text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Progression</h1>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-2xl text-center" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)' }}>
            <p className="text-white font-black text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>{stats.totalSessions}</p>
            <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>Séances</p>
          </div>
          <div className="p-3 rounded-2xl text-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <p className="text-white font-black text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
              {weeklyMeasurements.length > 1
                ? `+${(weeklyMeasurements[weeklyMeasurements.length - 1].weight - weeklyMeasurements[0].weight).toFixed(1)}kg`
                : '—'}
            </p>
            <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>Prise totale</p>
          </div>
          <div className="p-3 rounded-2xl text-center" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-white font-black text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
              {weeklyMeasurements.length > 0
                ? `${weeklyMeasurements[weeklyMeasurements.length - 1].weight}kg`
                : '68kg'}
            </p>
            <p className="text-white/40 text-xs mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>Poids actuel</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                background: activeTab === tab.id ? 'rgba(255,107,53,0.15)' : 'transparent',
                color: activeTab === tab.id ? '#FF6B35' : 'rgba(255,255,255,0.35)',
                fontFamily: 'Inter, sans-serif',
                border: activeTab === tab.id ? '1px solid rgba(255,107,53,0.25)' : '1px solid transparent',
              }}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ============================================================ */}
        {/* ONGLET HEBDO */}
        {/* ============================================================ */}
        {activeTab === 'weekly' && (
          <>
            {/* Bouton saisie hebdomadaire */}
            <button
              onClick={() => setShowForm(!showForm)}
              className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 active:scale-98"
              style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.25)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,53,0.2)' }}>
                  <Plus size={18} className="text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Saisir les mesures de la semaine</p>
                  <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Chaque lundi matin à jeun</p>
                </div>
              </div>
              {showForm ? <ChevronUp size={16} className="text-orange-400" /> : <ChevronDown size={16} className="text-orange-400" />}
            </button>

            {/* Formulaire de saisie */}
            {showForm && (
              <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  📏 Mesure-toi le lundi matin à jeun, après les toilettes, avant de manger.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'weight', label: 'Poids (kg) *', placeholder: '68.5', required: true },
                    { key: 'bodyFat', label: 'Masse grasse (%)', placeholder: '13' },
                    { key: 'armCircumference', label: 'Tour de bras (cm)', placeholder: '33' },
                    { key: 'thighCircumference', label: 'Tour de cuisse (cm)', placeholder: '55' },
                    { key: 'waistCircumference', label: 'Tour de taille (cm)', placeholder: '78' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-white/40 text-xs block mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>{field.label}</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form]}
                        onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'Inter, sans-serif' }}
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-98"
                  style={{ background: 'linear-gradient(135deg, #FF6B35, #FF4500)', color: 'white', fontFamily: 'Syne, sans-serif' }}
                >
                  Enregistrer les mesures
                </button>
              </div>
            )}

            {/* Rappel pesée lundi 7h */}
            {new Date().getDay() === 1 && (
              <div className="p-3 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.25)' }}>
                <span className="text-2xl">⚖️</span>
                <div>
                  <p className="text-orange-400 text-xs font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>C'est lundi — Jour de pesée !</p>
                  <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Pèse-toi à jeun et enregistre ton poids ci-dessous. L'app ajustera tes calories en conséquence.</p>
                </div>
              </div>
            )}

            {/* Historique des semaines */}
            {weeklyMeasurements.length === 0 ? (
              <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <Scale size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Aucune mesure enregistrée</p>
                <p className="text-white/25 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Commence par saisir tes mesures de départ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...weeklyMeasurements].reverse().map((m, i) => {
                  const prev = weeklyMeasurements.find(w => w.weekNumber === m.weekNumber - 1);
                  const analysis = analyzeBodyComposition(m, prev);
                  const isExpanded = expandedWeek === m.weekNumber;
                  const weightDiff = prev ? m.weight - prev.weight : null;

                  return (
                    <div key={m.weekNumber} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        className="w-full p-4 flex items-center gap-3 text-left"
                        onClick={() => setExpandedWeek(isExpanded ? null : m.weekNumber)}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)' }}>
                          <span className="text-orange-400 font-black text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>S{m.weekNumber}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{m.weight} kg</span>
                            {weightDiff !== null && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                                background: weightDiff > 0 ? 'rgba(34,197,94,0.15)' : weightDiff < 0 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                                color: weightDiff > 0 ? '#22c55e' : weightDiff < 0 ? '#ef4444' : 'rgba(255,255,255,0.4)',
                                fontFamily: 'Inter, sans-serif',
                              }}>
                                {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(2)} kg
                              </span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {new Date(m.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}
                            {m.bodyFat && ` · ${m.bodyFat}% MG`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-xs font-semibold" style={{ color: verdictColors[analysis.qualityScore >= 70 ? 'optimal' : analysis.qualityScore >= 40 ? 'initial' : 'too_fast'], fontFamily: 'Inter, sans-serif' }}>
                              {analysis.qualityLabel}
                            </p>
                          </div>
                          {isExpanded ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          {/* Composition corporelle */}
                          <div className="grid grid-cols-2 gap-2 pt-3">
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)' }}>
                              <p className="text-green-400/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Masse maigre</p>
                              <p className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{analysis.leanMassKg} kg</p>
                              {analysis.leanMassGain !== undefined && (
                                <p className="text-xs" style={{ color: analysis.leanMassGain >= 0 ? '#22c55e' : '#ef4444', fontFamily: 'Inter, sans-serif' }}>
                                  {analysis.leanMassGain >= 0 ? '+' : ''}{analysis.leanMassGain} kg
                                </p>
                              )}
                            </div>
                            <div className="p-3 rounded-xl" style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.1)' }}>
                              <p className="text-orange-400/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Masse grasse</p>
                              <p className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{analysis.fatMassKg} kg</p>
                              {analysis.fatMassGain !== undefined && (
                                <p className="text-xs" style={{ color: analysis.fatMassGain <= 0.1 ? '#22c55e' : '#ef4444', fontFamily: 'Inter, sans-serif' }}>
                                  {analysis.fatMassGain >= 0 ? '+' : ''}{analysis.fatMassGain} kg
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Mensurations */}
                          {(m.armCircumference || m.thighCircumference || m.waistCircumference) && (
                            <div className="grid grid-cols-3 gap-2">
                              {m.armCircumference && (
                                <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                  <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Bras</p>
                                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{m.armCircumference} cm</p>
                                </div>
                              )}
                              {m.thighCircumference && (
                                <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                  <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Cuisse</p>
                                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{m.thighCircumference} cm</p>
                                </div>
                              )}
                              {m.waistCircumference && (
                                <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                  <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>Taille</p>
                                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{m.waistCircumference} cm</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Conseil */}
                          <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.1)' }}>
                            <p className="text-blue-300/80 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{analysis.advice}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* ONGLET GRAPHIQUES */}
        {/* ============================================================ */}
        {activeTab === 'charts' && (
          <>
            {/* Graphique poids + projection */}
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white font-bold text-sm mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Évolution du poids — 12 semaines</h3>
              <p className="text-white/30 text-xs mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Zone verte = fourchette optimale lean bulk (0.2-0.5 kg/sem)</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weightChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Max idéal" stroke="rgba(34,197,94,0.2)" fill="rgba(34,197,94,0.06)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="Min idéal" stroke="rgba(34,197,94,0.2)" fill="rgba(34,197,94,0.06)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="Projection" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="Poids réel" stroke="#FF6B35" strokeWidth={2.5} dot={{ fill: '#FF6B35', r: 4 }} connectNulls={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Graphique mensurations */}
            {measureChartData.some(d => d['Bras (cm)'] || d['Cuisse (cm)']) && (
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 className="text-white font-bold text-sm mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Mensurations (cm)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={measureChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Bras (cm)" stroke="#FF6B35" strokeWidth={2} dot={{ fill: '#FF6B35', r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="Cuisse (cm)" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="Tour de taille (cm)" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {weeklyMeasurements.length === 0 && (
              <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <TrendingUp size={32} className="text-white/20 mx-auto mb-3" />
                <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Les graphiques apparaîtront après ta 1ère saisie</p>
              </div>
            )}
          </>
        )}

        {/* ============================================================ */}
        {/* ONGLET CALORIES ADAPTATIVES */}
        {/* ============================================================ */}
        {activeTab === 'calories' && (
          <>
            {/* Verdict de la semaine */}
            <div className="p-4 rounded-2xl" style={{ background: `${verdictColors[calorieAdaptation.verdict]}15`, border: `1px solid ${verdictColors[calorieAdaptation.verdict]}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{verdictIcons[calorieAdaptation.verdict]}</span>
                <div>
                  <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                    Semaine {currentWeek} — {calorieAdaptation.verdict === 'optimal' ? 'Progression optimale' : calorieAdaptation.verdict === 'too_fast' ? 'Trop rapide' : calorieAdaptation.verdict === 'too_slow' ? 'Trop lente' : 'Calibration initiale'}
                  </p>
                  {calorieAdaptation.weeklyWeightGain !== undefined && (
                    <p className="text-xs" style={{ color: verdictColors[calorieAdaptation.verdict], fontFamily: 'Inter, sans-serif' }}>
                      {calorieAdaptation.weeklyWeightGain >= 0 ? '+' : ''}{calorieAdaptation.weeklyWeightGain.toFixed(2)} kg cette semaine
                    </p>
                  )}
                </div>
              </div>
              <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>{calorieAdaptation.recommendation}</p>
            </div>

            {/* Calories adaptées */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
                <p className="text-orange-400/70 text-xs mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Jours training</p>
                <p className="text-white font-black text-2xl" style={{ fontFamily: 'Syne, sans-serif' }}>{calorieAdaptation.baseCaloriesTraining}</p>
                <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>kcal/jour</p>
              </div>
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <p className="text-blue-400/70 text-xs mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Jours repos</p>
                <p className="text-white font-black text-2xl" style={{ fontFamily: 'Syne, sans-serif' }}>{calorieAdaptation.baseCaloriesRest}</p>
                <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>kcal/jour</p>
              </div>
            </div>

            {/* Macros adaptées */}
            <div className="p-4 rounded-2xl space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>Macros cibles (jours training)</h3>
              {[
                { label: 'Protéines', value: calorieAdaptation.proteinsTarget, unit: 'g', color: '#22c55e', pct: Math.round(calorieAdaptation.proteinsTarget * 4 / calorieAdaptation.baseCaloriesTraining * 100) },
                { label: 'Glucides', value: calorieAdaptation.carbsTraining, unit: 'g', color: '#FF6B35', pct: Math.round(calorieAdaptation.carbsTraining * 4 / calorieAdaptation.baseCaloriesTraining * 100) },
                { label: 'Lipides', value: calorieAdaptation.fatsTarget, unit: 'g', color: '#f59e0b', pct: Math.round(calorieAdaptation.fatsTarget * 9 / calorieAdaptation.baseCaloriesTraining * 100) },
              ].map(macro => (
                <div key={macro.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{macro.label}</span>
                    <span className="text-white text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{macro.value}g · {macro.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${macro.pct}%`, background: macro.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Projection 12 semaines */}
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h3 className="text-white font-bold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Projection calories — 12 semaines</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projections.map(p => (
                  <div key={p.week} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-white/50 text-xs w-8" style={{ fontFamily: 'Inter, sans-serif' }}>S{p.week}</span>
                    <span className="text-white/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{p.projectedWeight} kg</span>
                    <span className="text-orange-400 text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{p.caloriesTraining} kcal</span>
                    <span className="text-blue-400 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{p.caloriesRest} kcal repos</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explication */}
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
              <h4 className="text-blue-300 font-semibold text-xs mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Comment ça marche ?</h4>
              <div className="space-y-1.5">
                {[
                  '📏 Tu saisis ton poids chaque lundi matin à jeun',
                  '📊 L\'app calcule ta vitesse de prise de poids',
                  '⚡ Si > 0.5 kg/sem : -150 kcal (trop de gras)',
                  '🐢 Si < 0.15 kg/sem : +150 kcal (muscle insuffisant)',
                  '🎯 Si 0.15-0.5 kg/sem : maintien (lean bulk parfait)',
                ].map((tip, i) => (
                  <p key={i} className="text-blue-300/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{tip}</p>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ============================================================ */}
        {/* ONGLET CHARGES */}
        {/* ============================================================ */}
        {activeTab === 'exercises' && (
          <ExercisesTab getExerciseProgress={getExerciseProgress} totalSessions={stats.totalSessions} />
        )}
      </div>
    </div>
  );
}
