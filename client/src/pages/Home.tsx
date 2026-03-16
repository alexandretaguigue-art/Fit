// Home.tsx — Accueil FitPro
// Séance du jour + résumé nutrition depuis les plans IA générés lors de l'onboarding

import { useLocation } from 'wouter';
import { Dumbbell, ChevronRight, Calendar, Zap, Bike, Bed, Trophy, Flame, Target, BarChart2 } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAuth } from '../_core/hooks/useAuth';

// ─── Types IA ────────────────────────────────────────────────────────────────

interface AiExercise {
  id: string;
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const DAY_NAMES_PLAN = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function getTodayDayName(): string {
  return DAY_NAMES_FR[new Date().getDay()];
}

function getDayFromPlan(weeks: unknown[]): AiDay | null {
  if (!weeks || weeks.length === 0) return null;
  const todayFr = getTodayDayName();
  const week = weeks[0] as AiWeek;
  if (!week?.days) return null;
  return week.days.find(d => d.day === todayFr) ?? week.days[0] ?? null;
}

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

function TypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  const color = getTypeColor(type).text;
  if (type === 'rest') return <Bed size={size} style={{ color }} />;
  if (type === 'cardio' || type === 'running') return <Zap size={size} style={{ color }} />;
  if (type === 'cycling') return <Bike size={size} style={{ color }} />;
  return <Dumbbell size={size} style={{ color }} />;
}

const TYPE_LABELS: Record<string, string> = {
  strength: 'Musculation', cardio: 'Cardio', hiit: 'HIIT',
  rest: 'Repos', yoga: 'Yoga', sport: 'Sport',
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { profile, aiSportPlan, aiNutritionPlan } = useUserProfile();

  const todayName = getTodayDayName();
  const todaySession: AiDay | null = aiSportPlan ? getDayFromPlan(aiSportPlan.weeks) : null;
  const isRest = !todaySession || todaySession.type === 'rest';
  const colors = todaySession ? getTypeColor(todaySession.type) : getTypeColor('rest');

  // Nutrition du jour depuis le plan IA
  const todayNutrition = (() => {
    if (!aiNutritionPlan?.week) return null;
    const week = aiNutritionPlan.week as Array<{ dayName: string; meals: Array<{ kcal: number }> }>;
    const dayIdx = new Date().getDay(); // 0=dim, 1=lun...
    const planDayName = DAY_NAMES_PLAN[(dayIdx + 6) % 7]; // convertir en Lundi-Dimanche
    const day = week.find(d => d.dayName === planDayName) ?? week[0];
    if (!day) return null;
    const totalKcal = day.meals.reduce((s, m) => s + (m.kcal ?? 0), 0);
    return { kcal: totalKcal || aiNutritionPlan.targets.kcal, target: aiNutritionPlan.targets.kcal };
  })();

  // Semaine courante dans le plan IA
  const weekLabel = aiSportPlan
    ? ((aiSportPlan.weeks[0] as AiWeek)?.theme ?? 'Semaine 1')
    : null;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ minHeight: 200, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(255,107,53,0.15) 0%, transparent 60%)' }} />
        <div className="relative p-5 pt-8">
          <p className="text-white/50 text-sm mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Bonjour{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </p>
          <h1 className="text-white text-3xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            {todayName}
          </h1>
          {weekLabel && (
            <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              {weekLabel}
            </p>
          )}
          {aiSportPlan && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,107,53,0.15)', border: '1px solid rgba(255,107,53,0.3)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>
              <Target size={12} />
              {aiSportPlan.program_name}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4 mt-4">

        {/* ── Pas de plan IA ── */}
        {!aiSportPlan && !aiNutritionPlan && (
          <div className="rounded-2xl p-5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)' }}>
              <Dumbbell size={24} className="text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
              Aucun plan généré
            </h3>
            <p className="text-white/50 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Tes plans nutrition et sport personnalisés seront affichés ici après l'onboarding.
            </p>
          </div>
        )}

        {/* ── Séance du jour ── */}
        {todaySession && !isRest && (
          <button
            className="w-full rounded-2xl overflow-hidden text-left transition-all duration-300 active:scale-98"
            style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
            onClick={() => navigate('/workout')}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TypeIcon type={todaySession.type} size={16} />
                <span className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: colors.text, fontFamily: 'Inter, sans-serif' }}>
                  Séance du jour · {TYPE_LABELS[todaySession.type] ?? todaySession.type}
                </span>
              </div>
              <h3 className="text-white text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                {todaySession.name}
              </h3>
              <div className="flex items-center gap-4 mt-3">
                {todaySession.exercises.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Dumbbell size={13} className="text-white/40" />
                    <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {todaySession.exercises.length} exercices
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-white/40" />
                  <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                    ~{todaySession.duration_min} min
                  </span>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ background: colors.badge, borderTop: `1px solid ${colors.border}` }}>
              <span className="text-sm font-semibold" style={{ color: colors.text, fontFamily: 'Inter, sans-serif' }}>
                Démarrer la séance
              </span>
              <ChevronRight size={16} style={{ color: colors.text }} />
            </div>
          </button>
        )}

        {/* ── Repos ── */}
        {isRest && aiSportPlan && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-white/40" />
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                Jour de repos
              </span>
            </div>
            <h3 className="text-white text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Récupération totale
            </h3>
            <p className="text-white/50 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Le muscle grandit pendant le repos. Dors 8h+, mange bien, étire-toi légèrement.
            </p>
          </div>
        )}

        {/* ── Résumé nutrition ── */}
        {todayNutrition && (
          <button
            className="w-full rounded-2xl p-4 text-left"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={() => navigate('/nutrition')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame size={16} style={{ color: '#FF6B35' }} />
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Objectif nutrition
                </span>
              </div>
              <ChevronRight size={14} className="text-white/30" />
            </div>
            <div className="flex items-end gap-1">
              <span className="text-white text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                {todayNutrition.target}
              </span>
              <span className="text-white/50 text-sm mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                kcal/jour
              </span>
            </div>
            {profile && (
              <p className="text-white/40 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Objectif : {profile.goal.replace('_', ' ')} · {profile.weight} kg
              </p>
            )}
          </button>
        )}

        {/* ── Programme de la semaine ── */}
        {aiSportPlan && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart2 size={16} style={{ color: '#FF6B35' }} />
                <span className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                  Programme de la semaine
                </span>
              </div>
              <button
                onClick={() => navigate('/workout')}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ background: 'rgba(255,107,53,0.12)', color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}
              >
                Voir tout
              </button>
            </div>
            <div className="space-y-2">
              {((aiSportPlan.weeks[0] as AiWeek)?.days ?? []).map((day: AiDay, idx: number) => {
                const c = getTypeColor(day.type);
                const isToday = day.day === todayName;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{
                      background: isToday ? c.bg : 'rgba(255,255,255,0.02)',
                      border: isToday ? `1px solid ${c.border}` : '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <TypeIcon type={day.type} size={14} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {day.day} — {day.name}
                      </p>
                    </div>
                    <span className="text-white/40 text-xs flex-shrink-0" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {day.duration_min} min
                    </span>
                    {isToday && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{ background: c.badge, color: c.text, fontFamily: 'Inter, sans-serif' }}>
                        Auj.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
