// DESIGN: "Coach Nocturne" — Dark Mode Premium Fitness
// Hero section avec image, stats du programme, cycle 14 jours, séance du jour

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Dumbbell, Target, Flame, ChevronRight, ChevronLeft, Trophy, Calendar, Zap, Bike, Bed, Check, GripVertical, X } from 'lucide-react';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import BodyModel3D from '../components/BodyModel3D';
import { computeMuscleStates, fatigueToStateLabel, MUSCLE_LABELS, type SessionRecord } from '../lib/muscleRecovery';
import { programData, cycle14Days, getCycleDayForDate, getSessionForCycleDay } from '../lib/programData';
import { toast } from 'sonner';
import { useAuth } from '../_core/hooks/useAuth';
import { MACRO_TARGETS, sessionIdToNutritionType } from '../lib/nutritionEngine';

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/hero-fitness-5h7p34NBzccTy9ggEni2uM.webp";
const ARMS_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/arms-workout-2RWQ6DDsWG2NyCDojBoRnV.webp";
const LEGS_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/legs-workout-FPHHWKCXVWXNSCVHGWmz2h.webp";

// Image par session ID
const SESSION_IMAGES: Record<string, string> = {
  upper_a: ARMS_IMAGE,
  upper_b: ARMS_IMAGE,
  lower_a: LEGS_IMAGE,
  lower_b: LEGS_IMAGE,
  football: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80',
  running_endurance: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&q=80',
  running_intervals: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&q=80',
  cycling: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
  rest: '',
};

// Calories brûlées estimées par session
const SESSION_CALORIES_BURNED: Record<string, number> = {
  upper_a: 420, upper_b: 400, lower_a: 520, lower_b: 480,
  football: 650, running_endurance: 580, running_intervals: 620,
  cycling: 380, rest: 0,
};

// Couleurs par type nutritionnel (synchronisé avec MACRO_TARGETS de nutritionEngine)
const NUTRITION_TYPE_COLORS: Record<string, string> = {
  training: '#FF6B35',
  running:  '#3B82F6',
  football: '#F97316',
  cycling:  '#14B8A6',
  rest:     '#22C55E',
};

// Calcule les infos caloriques dynamiquement depuis MACRO_TARGETS (source unique de vérité)
function getEatInfo(sessionId: string): { kcal: number; color: string; label: string } {
  const nutritionType = sessionIdToNutritionType(sessionId);
  const kcal = MACRO_TARGETS[nutritionType].calories;
  const color = NUTRITION_TYPE_COLORS[nutritionType] ?? '#FF6B35';
  return { kcal, color, label: `${kcal} kcal` };
}

const SESSION_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  gym:      { bg: 'rgba(255,107,53,0.08)',  border: 'rgba(255,107,53,0.25)',  text: '#FF6B35', badge: 'rgba(255,107,53,0.15)' },
  football: { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   text: '#22C55E', badge: 'rgba(34,197,94,0.15)' },
  running:  { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)',  text: '#3B82F6', badge: 'rgba(59,130,246,0.15)' },
  cycling:  { bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.25)',  text: '#14B8A6', badge: 'rgba(20,184,166,0.15)' },
  rest:     { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.4)', badge: 'rgba(255,255,255,0.06)' },
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  gym: 'Musculation', football: 'Football', running: 'Course', cycling: 'Vélo', rest: 'Repos',
};

function SessionTypeIcon({ type, size = 16 }: { type: string; size?: number }) {
  const color = SESSION_TYPE_COLORS[type]?.text || '#fff';
  if (type === 'gym') return <Dumbbell size={size} style={{ color }} />;
  if (type === 'football') return <span style={{ fontSize: size, lineHeight: 1 }}>⚽</span>;
  if (type === 'running') return <Zap size={size} style={{ color }} />;
  if (type === 'cycling') return <Bike size={size} style={{ color }} />;
  if (type === 'rest') return <Bed size={size} style={{ color }} />;
  return <Dumbbell size={size} style={{ color }} />;
}

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [, navigate] = useLocation();
  const { data, startProgram, getCurrentWeek, getStats, setScheduleOverride, getScheduleOverride, adaptNutritionForSession } = useFitnessTracker();
  // calendarWeekOffset : offset en semaines calendaires (0 = semaine contenant J1 du programme)
  // Calculer le lundi de la semaine contenant startDate
  const getStartMonday = (startDate: string): Date => {
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay(); // 0=Dim, 1=Lun...
    const diff = dow === 0 ? -6 : 1 - dow; // décalage pour aller au lundi
    d.setDate(d.getDate() + diff);
    return d;
  };
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(() => {
    if (!data.startDate) return 0;
    const startMonday = getStartMonday(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor((today.getTime() - startMonday.getTime()) / msPerWeek);
  });
  const [pendingStart, setPendingStart] = useState(false);

  // Naviguer vers /workout seulement après que startDate est effectivement persisté dans le state
  useEffect(() => {
    if (pendingStart && data.startDate) {
      setPendingStart(false);
      toast.success('🏋️ Programme démarré ! Jour 1 — c\'est parti !', { duration: 3000 });
      navigate('/workout');
    }
  }, [pendingStart, data.startDate, navigate]);

  // Synchroniser l'offset de semaine sur la semaine courante quand startDate change
  useEffect(() => {
    if (!data.startDate) {
      setCalendarWeekOffset(0);
      return;
    }
    const startMonday = getStartMonday(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weekOffset = Math.floor((today.getTime() - startMonday.getTime()) / msPerWeek);
    setCalendarWeekOffset(weekOffset);
  }, [data.startDate]);

  // Modal de confirmation avant swap avec adaptation nutritionnelle
  const [swapConfirm, setSwapConfirm] = useState<{
    srcDay: number;
    tgtDay: number;
    srcId: string;
    tgtId: string;
    srcDateKey: string | null;
    tgtDateKey: string | null;
  } | null>(null);

  // Drag & drop iOS-style
  const [draggingDay, setDraggingDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  // Ordre visuel local (avant persistance) pour le swap en direct
  const [visualOrder, setVisualOrder] = useState<Record<number, string>>({});
  // Position de la card flottante
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
  // IDs originaux au moment du début du drag (figés pour tous les swaps visuels)
  const dragOriginalIds = useRef<Record<number, string>>({});
  const cardRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const floatCardRef = useRef<HTMLDivElement | null>(null);
  // Refs sur les deux conteneurs de scroll horizontal (Semaine 1 et Semaine 2)
  const scrollContainerRefs = useRef<Array<HTMLDivElement | null>>([null, null]);
  // Ref sur le conteneur principal de la page (pour bloquer le scroll vertical)
  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  // Ref pour le timer d'auto-scroll aux extrémités
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Bloquer/débloquer le scroll horizontal des conteneurs calendrier ET le scroll vertical de la page
  const setScrollLocked = useCallback((locked: boolean) => {
    // Scroll horizontal des rangées calendrier
    scrollContainerRefs.current.forEach(el => {
      if (!el) return;
      if (locked) {
        el.style.overflowX = 'hidden';
        el.style.scrollSnapType = 'none';
      } else {
        el.style.overflowX = 'auto';
        el.style.scrollSnapType = 'x mandatory';
      }
    });
    // Scroll vertical de la page entière
    if (pageContainerRef.current) {
      pageContainerRef.current.style.overflow = locked ? 'hidden' : '';
    }
    // Bloquer aussi le scroll du body/html pour éviter le rebond iOS
    document.body.style.overflow = locked ? 'hidden' : '';
    document.body.style.touchAction = locked ? 'none' : '';
  }, []);

  // Démarrer l'auto-scroll vers la gauche ou la droite (pour atteindre les cartes hors écran)
  const startAutoScroll = useCallback((direction: 'left' | 'right') => {
    if (autoScrollTimer.current) return;
    autoScrollTimer.current = setInterval(() => {
      scrollContainerRefs.current.forEach(el => {
        if (!el) return;
        el.scrollLeft += direction === 'right' ? 6 : -6;
      });
    }, 16);
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);

  // Résoudre le sessionId effectif d'un jour (override visuel > override persisté > défaut)
  const getEffectiveSessionId = useCallback((dayNumber: number): string => {
    if (visualOrder[dayNumber]) return visualOrder[dayNumber];
    const override = getScheduleOverride(`cycle_day_${dayNumber}`);
    if (override) return override;
    return cycle14Days.find(d => d.dayNumber === dayNumber)?.sessionId ?? 'rest';
  }, [visualOrder, getScheduleOverride]);

  // Infos d'un sessionId
  const getSessionInfo = useCallback((sessionId: string) => {
    const typeMap: Record<string, string> = {
      upper_a: 'gym', upper_b: 'gym', lower_a: 'gym', lower_b: 'gym',
      football: 'football', running_endurance: 'running', running_intervals: 'running',
      cycling: 'cycling', rest: 'rest',
    };
    const labelMap: Record<string, string> = {
      upper_a: 'Haut A', upper_b: 'Haut B', lower_a: 'Bas A', lower_b: 'Bas B',
      football: 'Football', running_endurance: 'Course', running_intervals: 'Course',
      cycling: 'Vélo', rest: 'Repos',
    };
    return {
      type: typeMap[sessionId] ?? 'rest',
      label: labelMap[sessionId] ?? sessionId,
      img: SESSION_IMAGES[sessionId] ?? '',
      eatInfo: getEatInfo(sessionId),
    };
  }, []);
  const stats = getStats();
  const currentWeek = getCurrentWeek();

  const currentPhase = programData.phases.find(
    p => currentWeek >= p.weekRange[0] && currentWeek <= p.weekRange[1]
  ) || programData.phases[0];

  const weekProgress = data.startDate
    ? Math.min(((currentWeek - 1) / 12) * 100, 100)
    : 0;

  // Calcul du jour du cycle 14 jours
  const today = new Date();
  const programStart = data.startDate ? new Date(data.startDate) : today;
  const cycleDayToday = data.startDate ? getCycleDayForDate(today, programStart) : 1;
  // Quel cycle (offset) correspond au jour actuel ?
  const todayCycleOffset = data.startDate
    ? Math.floor((today.getTime() - programStart.getTime()) / (14 * 24 * 60 * 60 * 1000))
    : 0;

  // Calcul du vrai jour de la semaine pour une card du calendrier
  // absoluteDayNumber = position dans le programme (1 = J1 du programme)
  const getWeekdayLabel = (absoluteDayNumber: number): string => {
    if (!data.startDate) {
      // Sans date de démarrage, on affiche juste J1=Lun par convention
      return ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][(absoluteDayNumber - 1) % 7];
    }
    const startMs = new Date(data.startDate).getTime();
    const dayMs = startMs + (absoluteDayNumber - 1) * 24 * 60 * 60 * 1000;
    const dayOfWeek = new Date(dayMs).getDay(); // 0=Dim, 1=Lun, ..., 6=Sam
    return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][dayOfWeek];
  };
  const todayCycleDay = cycle14Days.find(d => d.dayNumber === cycleDayToday);
  const todaySession = todayCycleDay ? getSessionForCycleDay(cycleDayToday) : null;
  const todayType = todayCycleDay?.type || 'rest';
  const todayColors = SESSION_TYPE_COLORS[todayType];

  // SessionId effectif du jour (avec override)
  const todaySessionId = getEffectiveSessionId(cycleDayToday);

  // Prochain jour d'entraînement
  const nextTrainingDay = cycle14Days.find(
    d => d.dayNumber > cycleDayToday && d.type !== 'rest'
  );

  return (
    <div ref={pageContainerRef} className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      {/* Hero Section */}
      <div className="relative h-72 overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Fitness hero"
          className="w-full h-full object-cover object-center"
          style={{ filter: 'brightness(0.55)' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(15,15,20,0.3) 0%, rgba(15,15,20,0.0) 40%, rgba(15,15,20,1) 100%)',
          }}
        />
        <div className="absolute top-0 left-0 right-0 p-5 flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              Programme
            </p>
            <h1 className="text-white text-2xl font-bold leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              FitPro
            </h1>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(255, 107, 53, 0.2)',
              border: '1px solid rgba(255, 107, 53, 0.4)',
              color: '#FF6B35',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Cycle 14 jours
          </div>
        </div>
        <div className="absolute bottom-4 left-5">
          <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {data.startDate ? `Semaine ${currentWeek} / 12 · Jour ${cycleDayToday}/14` : 'Programme non démarré'}
          </p>
          <h2 className="text-white text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
            {currentPhase.name}
          </h2>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-2">
        {/* Progression globale */}
        {data.startDate && (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Progression du programme
              </span>
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                {Math.round(weekProgress)}%
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${weekProgress}%`, background: 'linear-gradient(90deg, #FF6B35, #FF3366)' }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {programData.phases.map(phase => (
                <div key={phase.id} className="text-center">
                  <div
                    className="text-xs"
                    style={{
                      color: phase.id === currentPhase.id ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {phase.weeks}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Séance du jour */}
        {todaySession && todayType !== 'rest' ? (
          <div
            className="rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
            style={{ background: todayColors.bg, border: `1px solid ${todayColors.border}` }}
            onClick={() => navigate('/workout')}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <SessionTypeIcon type={todayType} size={16} />
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: todayColors.text, fontFamily: 'Inter, sans-serif' }}
                >
                  Séance du jour · {SESSION_TYPE_LABELS[todayType]}
                </span>
              </div>
              <h3 className="text-white text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                {todaySession.name}
              </h3>
              <p className="text-white/60 text-sm mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                {todaySession.focus}
              </p>
              <div className="flex items-center gap-4 mt-3">
                {todaySession.exercises.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Dumbbell size={14} className="text-white/40" />
                    <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {todaySession.exercises.length} exercices
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-white/40" />
                  <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                    ~{todaySession.durationMin} min
                  </span>
                </div>
                {todaySession.cardioDetails && (
                  <div className="flex items-center gap-1.5">
                    <Flame size={14} className="text-white/40" />
                    <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                      ~{todaySession.cardioDetails.totalCaloriesBurned} kcal
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: `${todayColors.badge}`, borderTop: `1px solid ${todayColors.border}` }}
            >
              <span className="text-sm font-semibold" style={{ color: todayColors.text, fontFamily: 'Inter, sans-serif' }}>
                Voir la séance
              </span>
              <ChevronRight size={16} style={{ color: todayColors.text }} />
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
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
            {nextTrainingDay && (
              <p className="text-white/30 text-xs mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Prochaine séance : J{nextTrainingDay.dayNumber} — {nextTrainingDay.label}
              </p>
            )}
          </div>
        )}

        {/* Planning cycle 14 jours — nouveau design avec photos */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              Planning 14 jours
            </p>
            <span className="text-white/30 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              Appuie pour modifier
            </span>
          </div>
          {/* Navigation par semaine calendaire */}
          {(() => {
            // Calcul du label de la semaine affichée
            let weekNavLabel = 'Semaine du programme';
            if (data.startDate) {
              const startMonday = getStartMonday(data.startDate);
              const weekMonday = new Date(startMonday.getTime() + calendarWeekOffset * 7 * 24 * 60 * 60 * 1000);
              const weekSunday = new Date(weekMonday.getTime() + 6 * 24 * 60 * 60 * 1000);
              const fmt = (d: Date) => `${d.getDate()} ${['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'][d.getMonth()]}`;
              weekNavLabel = `${fmt(weekMonday)} – ${fmt(weekSunday)}`;
            }
            return (
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarWeekOffset(o => o - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <ChevronLeft size={14} className="text-white/50" />
                </button>
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {weekNavLabel}
                </span>
                <button onClick={() => setCalendarWeekOffset(o => o + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <ChevronRight size={14} className="text-white/50" />
                </button>
              </div>
            );
          })()}

          {/* Card flottante qui suit le doigt */}
          {draggingDay !== null && floatPos !== null && (() => {
            const floatSessionId = getEffectiveSessionId(draggingDay);
            const floatInfo = getSessionInfo(floatSessionId);
            const floatColors = SESSION_TYPE_COLORS[floatInfo.type];
            return (
              <div
                ref={floatCardRef}
                style={{
                  position: 'fixed',
                  left: floatPos.x - 55,
                  top: floatPos.y - 80,
                  width: 110,
                  aspectRatio: '3/4',
                  borderRadius: 16,
                  overflow: 'hidden',
                  zIndex: 9999,
                  pointerEvents: 'none',
                  border: '2px solid #FF6B35',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 32px rgba(255,107,53,0.4)',
                  transform: 'scale(1.12) rotate(-3deg)',
                  transition: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {floatInfo.img ? (
                  <img src={floatInfo.img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: '#1a1a22' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 100%)' }} />
                <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, padding: '0 8px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontFamily: 'Syne, sans-serif' }}>J{draggingDay}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: floatColors.text, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{floatInfo.label}</div>
                </div>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: `${floatInfo.eatInfo.color}25`, borderTop: `2px solid ${floatInfo.eatInfo.color}60`, padding: '4px 8px', display: 'flex', alignItems: 'baseline', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: floatInfo.eatInfo.color, fontFamily: 'Syne, sans-serif' }}>{floatInfo.eatInfo.kcal}</span>
                  <span style={{ fontSize: 8, color: `${floatInfo.eatInfo.color}aa`, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>kcal</span>
                </div>
              </div>
            );
          })()}

          {/* Grille calendrier — une semaine calendaire Lun-Dim */}
          {(() => {
            // Construire les 7 jours de la semaine affichée (Lun à Dim)
            // Chaque slot a : date réelle, programDayNumber (1-based depuis startDate, null si avant démarrage)
            const slots = Array.from({ length: 7 }, (_, i) => {
              if (!data.startDate) {
                // Sans programme, afficher J1-J7 par défaut
                return { programDayNumber: i + 1, isPreProgram: false, date: null };
              }
              const startMonday = getStartMonday(data.startDate);
              const slotDate = new Date(startMonday.getTime() + (calendarWeekOffset * 7 + i) * 24 * 60 * 60 * 1000);
              const startDate = new Date(data.startDate);
              startDate.setHours(0, 0, 0, 0);
              slotDate.setHours(0, 0, 0, 0);
              const diffDays = Math.round((slotDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
              if (diffDays < 0) {
                // Avant le démarrage du programme
                return { programDayNumber: null, isPreProgram: true, date: slotDate };
              }
              // programDayNumber dans le cycle 14j (1-14)
              const cycleDay = (diffDays % 14) + 1;
              return { programDayNumber: cycleDay, isPreProgram: false, date: slotDate };
            });
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            return (
              <div style={{ marginBottom: 0 }}>
                <div
                  ref={el => { scrollContainerRefs.current[0] = el; }}
                  style={{
                    display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    msOverflowStyle: 'none', scrollbarWidth: 'none',
                  }}
                >
                  {slots.map((slot, slotIdx) => {
                    const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
                    const weekdayLabel = WEEKDAY_LABELS[slotIdx];

                    // Jour avant démarrage du programme : repos forcé
                    if (slot.isPreProgram) {
                      const isSlotToday = !!(slot.date && slot.date.getTime() === todayDate.getTime());
                      const restColors = SESSION_TYPE_COLORS['rest'];
                      const restEatInfo = getEatInfo('rest');
                      return (
                        <div
                          key={`pre-${slotIdx}`}
                          style={{
                            position: 'relative', borderRadius: 16, overflow: 'hidden', flexShrink: 0,
                            width: 'calc((100vw - 64px) / 2.5)', minWidth: 110, maxWidth: 160,
                            aspectRatio: '3/4', scrollSnapAlign: 'start',
                            border: isSlotToday ? '2px solid #FF6B35' : '1px solid rgba(255,255,255,0.05)',
                            background: '#0a0a10',
                            boxShadow: isSlotToday ? '0 0 20px rgba(255,107,53,0.4)' : '0 4px 16px rgba(0,0,0,0.4)',
                            opacity: 0.3,
                            display: 'flex', flexDirection: 'column',
                          }}
                        >
                          <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.01)' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.82) 100%)' }} />
                            <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, padding: '0 10px' }}>
                              <div style={{ fontSize: 9, fontWeight: 600, lineHeight: 1, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{weekdayLabel}</div>
                              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1, color: 'rgba(255,255,255,0.3)', fontFamily: 'Syne, sans-serif' }}>
                                {slot.date ? `${slot.date.getDate()} ${['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'][slot.date.getMonth()]}` : ''}
                              </div>
                              <div style={{ fontSize: 22, lineHeight: 1, marginTop: 4 }}>💤</div>
                            </div>
                          </div>
                          <div style={{ background: `${restEatInfo.color}10`, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '7px 10px 8px', display: 'flex', alignItems: 'baseline', gap: 3 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: 'rgba(255,255,255,0.2)', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>{restEatInfo.kcal}</div>
                            <div style={{ fontSize: 9, fontWeight: 600, lineHeight: 1, color: 'rgba(255,255,255,0.15)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>kcal</div>
                          </div>
                        </div>
                      );
                    }

                    // Jour du programme
                    const dayNumber = slot.programDayNumber!;
                    const isSlotToday = !!(slot.date && slot.date.getTime() === todayDate.getTime());
                    const isPast = !!(slot.date && slot.date.getTime() < todayDate.getTime());

                    const isDraggingThis = draggingDay === dayNumber;
                    const isDragTarget = dragOverDay === dayNumber && draggingDay !== null && draggingDay !== dayNumber;

                    const effectiveSessionId = getEffectiveSessionId(dayNumber);
                    const sessionInfo = getSessionInfo(effectiveSessionId);
                    const colors = SESSION_TYPE_COLORS[sessionInfo.type];
                    const sessionImg = sessionInfo.img;
                    const eatInfo = sessionInfo.eatInfo;

                    const sessionDateKey = slot.date ? `${slot.date.getFullYear()}-${String(slot.date.getMonth()+1).padStart(2,'0')}-${String(slot.date.getDate()).padStart(2,'0')}` : null;
                    const isCompleted = !!(sessionDateKey && Object.keys(data.sessionLogs || {}).some(k => k.startsWith(sessionDateKey)));

                    const shouldWiggle = draggingDay !== null && !isDraggingThis;

                    // Calcul du numéro de jour absolu dans le programme (pour affichage)
                    // absoluteDayNumber = position dans le programme depuis J1 (1-based)
                    // On utilise diffDays recalculé proprement depuis startDate (minuit local)
                    const absoluteDayNumber = (() => {
                      if (!data.startDate || !slot.date) return dayNumber;
                      const sd = new Date(data.startDate);
                      sd.setHours(0, 0, 0, 0);
                      const diffMs = slot.date.getTime() - sd.getTime();
                      return Math.round(diffMs / (24 * 60 * 60 * 1000)) + 1;
                    })();

                    const handleTap = () => {
                      if (isDragging.current) return;
                      if (effectiveSessionId !== 'rest' && isSlotToday) {
                        localStorage.setItem('pendingSessionId', effectiveSessionId);
                        navigate('/workout');
                      }
                    };

                    // Drag & drop uniquement sur la semaine courante
                    const isCurrentWeek = !!(data.startDate && (() => {
                      const startMonday = getStartMonday(data.startDate);
                      const todayMon = getStartMonday(new Date().toISOString());
                      return startMonday.getTime() + calendarWeekOffset * 7 * 24 * 60 * 60 * 1000 === todayMon.getTime();
                    })());

                    return (
                    <button
                      key={`day-${slotIdx}`}
                      ref={el => { cardRefs.current[dayNumber] = el; }}
                      onClick={handleTap}
                      onTouchStart={(e) => {
                        if (!isCurrentWeek) return;
                        dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                        isDragging.current = false;
                        longPressTimer.current = setTimeout(() => {
                          isDragging.current = true;
                          setDraggingDay(dayNumber);
                          setFloatPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                          // Mémoriser les IDs originaux de TOUS les jours au début du drag
                          // pour que les swaps visuels soient toujours basés sur l'état initial
                          dragOriginalIds.current = {};
                          Object.keys(cardRefs.current).forEach(k => {
                            const n = parseInt(k);
                            dragOriginalIds.current[n] = getEffectiveSessionId(n);
                          });
                          // Bloquer le scroll horizontal dès que le drag commence
                          setScrollLocked(true);
                          if (navigator.vibrate) navigator.vibrate([30, 10, 30]);
                        }, 450);
                      }}
                      onTouchMove={(e) => {
                        if (!dragStartPos.current) return;
                        const dx = e.touches[0].clientX - dragStartPos.current.x;
                        const dy = e.touches[0].clientY - dragStartPos.current.y;
                        // Annuler le long press si le doigt bouge avant le déclenchement
                        if (Math.sqrt(dx*dx + dy*dy) > 6 && longPressTimer.current) {
                          clearTimeout(longPressTimer.current);
                          longPressTimer.current = null;
                        }
                        if (!isDragging.current) return;
                        // Bloquer TOUT scroll natif pendant le drag
                        e.preventDefault();
                        e.stopPropagation();
                        const touchX = e.touches[0].clientX;
                        const touchY = e.touches[0].clientY;
                        // Mettre à jour la position de la card flottante
                        setFloatPos({ x: touchX, y: touchY });
                        // Auto-scroll aux extrémités : zone de 60px sur les bords de l'écran
                        const EDGE_ZONE = 60;
                        const screenW = window.innerWidth;
                        if (touchX < EDGE_ZONE) {
                          startAutoScroll('left');
                        } else if (touchX > screenW - EDGE_ZONE) {
                          startAutoScroll('right');
                        } else {
                          stopAutoScroll();
                        }
                        // Détecter la card cible sous le doigt
                        const el = document.elementFromPoint(touchX, touchY);
                        const card = el?.closest('[data-day]') as HTMLElement | null;
                        const targetDay = card ? parseInt(card.dataset.day || '0') : null;
                        if (targetDay && targetDay !== draggingDay) {
                          setDragOverDay(targetDay);
                          // Swap visuel immédiat : utiliser les IDs ORIGINAUX (figés au début du drag)
                          // pour éviter que les passages successifs sur différentes cards mélangent les IDs
                          setVisualOrder(() => {
                            const srcOrigId = dragOriginalIds.current[draggingDay!] ?? getEffectiveSessionId(draggingDay!);
                            const tgtOrigId = dragOriginalIds.current[targetDay] ?? getEffectiveSessionId(targetDay);
                            // Reconstruire l'ordre visuel depuis les originaux
                            const newOrder: Record<number, string> = {};
                            // Copier tous les originaux
                            Object.entries(dragOriginalIds.current).forEach(([k, v]) => {
                              newOrder[parseInt(k)] = v;
                            });
                            // Appliquer le swap src ↔ tgt
                            newOrder[draggingDay!] = tgtOrigId;
                            newOrder[targetDay] = srcOrigId;
                            return newOrder;
                          });
                        }
                      }}
                      onTouchEnd={() => {
                        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                        if (isDragging.current && draggingDay !== null && dragOverDay !== null && draggingDay !== dragOverDay) {
                          // Calculer les dateKeys des deux jours pour l'adaptation nutritionnelle
                          const srcId = getEffectiveSessionId(draggingDay);
                          const tgtId = getEffectiveSessionId(dragOverDay);
                          const getSrcDateKey = (dayNum: number) => {
                            // Chercher la date réelle du slot correspondant à ce dayNumber dans la semaine affichée
                            const matchSlot = slots.find(s => s.programDayNumber === dayNum && !s.isPreProgram);
                            if (!matchSlot?.date) return null;
                            const d = matchSlot.date;
                            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                          };
                          // Afficher le modal de confirmation
                          setSwapConfirm({
                            srcDay: draggingDay,
                            tgtDay: dragOverDay,
                            srcId,
                            tgtId,
                            srcDateKey: getSrcDateKey(draggingDay),
                            tgtDateKey: getSrcDateKey(dragOverDay),
                          });
                        }
                        // Réinitialiser le drag
                        isDragging.current = false;
                        setDraggingDay(null);
                        setDragOverDay(null);
                        setFloatPos(null);
                        setVisualOrder({});
                        // Débloquer le scroll et arrêter l'auto-scroll
                        stopAutoScroll();
                        setScrollLocked(false);
                      }}
                      data-day={dayNumber}
                      style={{
                        position: 'relative',
                        borderRadius: 16,
                        overflow: 'hidden',
                        flexShrink: 0,
                        width: 'calc((100vw - 64px) / 2.5)',
                        minWidth: 110,
                        maxWidth: 160,
                        aspectRatio: '3/4',
                        scrollSnapAlign: 'start',
                        border: isDraggingThis
                          ? '2px solid #FF6B35'
                          : isDragTarget
                          ? '2px solid rgba(255,107,53,0.8)'
                          : isSlotToday
                          ? '2px solid #FF6B35'
                          : isCompleted
                          ? '1px solid rgba(34,197,94,0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                        opacity: isDraggingThis ? 0 : isPast && !isCompleted && !isSlotToday ? 0.45 : 1,
                        cursor: 'pointer',
                        background: isDragTarget ? 'rgba(255,107,53,0.08)' : '#0e0e14',
                        boxShadow: isDragTarget ? '0 0 20px rgba(255,107,53,0.35)' : isSlotToday ? '0 0 20px #FF6B3566' : '0 4px 16px rgba(0,0,0,0.4)',
                        transform: isDragTarget ? 'scale(0.95)' : shouldWiggle ? undefined : 'scale(1)',
                        animation: shouldWiggle ? 'wiggle 0.4s ease-in-out infinite alternate' : 'none',
                        transition: isDraggingThis ? 'none' : 'all 0.18s',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTouchCallout: 'none',
                      }}
                    >
                      {/* Photo de fond */}
                      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                        {sessionImg ? (
                          <img
                            src={sessionImg}
                            alt={sessionInfo.label}
                            style={{
                              position: 'absolute', inset: 0, width: '100%', height: '100%',
                              objectFit: 'cover',
                              filter: isPast && !isCompleted ? 'brightness(0.22) grayscale(0.7)' : 'brightness(0.55)',
                              transition: 'all 0.25s',
                            }}
                          />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.02)' }} />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.82) 100%)' }} />
                        {isCompleted && (
                          <div style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: '50%', background: 'rgba(34,197,94,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={8} color="#fff" />
                          </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, padding: '0 10px' }}>
                          <div style={{ fontSize: 9, fontWeight: 600, lineHeight: 1, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                            {weekdayLabel}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1, color: isSlotToday ? '#FF6B35' : isCompleted ? '#22C55E' : 'rgba(255,255,255,0.55)', fontFamily: 'Syne, sans-serif' }}>J{absoluteDayNumber}</div>
                          {effectiveSessionId === 'rest' ? (
                            <div style={{ fontSize: 22, lineHeight: 1, marginTop: 4 }}>😴</div>
                          ) : (
                            <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.2, marginTop: 4, color: colors.text, fontFamily: 'Inter, sans-serif', transition: 'color 0.25s' }}>
                              {sessionInfo.label}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Barre calories */}
                      <div style={{ background: `${eatInfo.color}20`, borderTop: `2px solid ${eatInfo.color}70`, padding: '7px 10px 8px', display: 'flex', alignItems: 'baseline', gap: 3, transition: 'all 0.25s' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: eatInfo.color, fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em' }}>{eatInfo.kcal}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, lineHeight: 1, color: `${eatInfo.color}bb`, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>kcal</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {/* Hint discret en mode drag */}
          {draggingDay !== null && (
            <div className="mt-2 text-center">
              <span className="text-xs" style={{ color: 'rgba(255,107,53,0.7)', fontFamily: 'Inter, sans-serif' }}>
                Dépose sur un autre jour pour échanger ↕
              </span>
            </div>
          )}

          {/* CSS animation wiggle */}
          <style>{`
            @keyframes wiggle {
              0%   { transform: rotate(-2deg) scale(0.97); }
              50%  { transform: rotate(2deg) scale(1.01); }
              100% { transform: rotate(-1deg) scale(0.98); }
            }
          `}</style>

          {/* Légende */}
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(SESSION_TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: SESSION_TYPE_COLORS[type].text }}
                />
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hologramme 3D de récupération musculaire — Layout deux colonnes */}
        {(() => {
          const sessionRecords: SessionRecord[] = data.sessionLogs.map(log => ({
            sessionId: log.sessionId,
            dateKey: log.date.split('T')[0],
            completedAt: new Date(log.date).getTime(),
          }));
          const muscleStates = computeMuscleStates(sessionRecords);
          const muscleStatuses = Array.from(muscleStates.entries()).map(([group, state]) => ({
            id: group,
            name: MUSCLE_LABELS[group],
            state: fatigueToStateLabel(state.fatigue),
            fatigue: state.fatigue,
            recoveryHoursLeft: state.hoursUntilRecovered,
          }));

          // Muscles sollicités aujourd'hui (non frais)
          const activeMuscles = muscleStatuses.filter(m => m.state !== 'fresh');
          // Muscles frais (non sollicités)
          const freshMuscles = muscleStatuses.filter(m => m.state === 'fresh');

          const stateColors: Record<string, string> = {
            fresh: '#4a9eff',
            recovered: '#22c55e',
            light: '#84cc16',
            moderate: '#f97316',
            fatigued: '#ef4444',
            exhausted: '#dc2626',
          };
          const stateLabels: Record<string, string> = {
            fresh: 'Frais',
            recovered: 'Récupéré',
            light: 'Légère fatigue',
            moderate: 'Fatigue modérée',
            fatigued: 'Fatigué',
            exhausted: 'Épuisé',
          };

          // Score de récupération global
          const recoveryScore = muscleStatuses.length > 0
            ? Math.round(muscleStatuses.reduce((acc, m) => acc + (1 - m.fatigue), 0) / muscleStatuses.length * 100)
            : 100;

          return (
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: '#080b12', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Header fin */}
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>Analyse musculaire</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, color: '#fff', marginTop: 2, lineHeight: 1.2 }}>
                    {todaySession?.name || 'Repos'}
                  </p>
                  {todaySession?.focus && (
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{todaySession.focus}</p>
                  )}
                </div>
                {/* Score de récupération */}
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Récupération</p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, lineHeight: 1, marginTop: 2, color: recoveryScore >= 80 ? '#22c55e' : recoveryScore >= 50 ? '#f97316' : '#ef4444' }}>
                    {recoveryScore}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2, color: 'rgba(255,255,255,0.3)' }}>%</span>
                  </p>
                </div>
              </div>

              {/* Ligne de séparation ultra fine */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 0 }} />

              {/* Corps du bloc : 2 colonnes */}
              <div className="flex flex-row" style={{ minHeight: 460 }}>

                {/* Colonne gauche : modèle 3D — fond identique au bloc */}
                <div className="flex-none" style={{ width: '55%' }}>
                  <BodyModel3D
                    muscleStatuses={muscleStatuses}
                    height={460}
                    onMuscleClick={(m) => {
                      const label = stateLabels[m.state] || m.state;
                      toast(`${m.name} : ${label}${m.recoveryHoursLeft > 0 ? ` — récup dans ~${m.recoveryHoursLeft}h` : ''}`);
                    }}
                  />
                  {/* Hint glisse */}
                  <p style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.15)', paddingBottom: 12, fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
                    Glisse pour tourner · Tape pour les détails
                  </p>
                </div>

                {/* Colonne droite : infos */}
                <div
                  className="flex-1 flex flex-col"
                  style={{ padding: '20px 18px', gap: 0, borderLeft: '1px solid rgba(255,255,255,0.05)', overflowY: 'auto' }}
                >

                  {/* Objectif calorique */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 8 }}>Objectif du jour</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#FF6B35', lineHeight: 1 }}>
                        {getEatInfo(todaySessionId).kcal}
                      </span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,107,53,0.5)', fontWeight: 500 }}>kcal</span>
                    </div>
                  </div>

                  {/* Muscles sollicités */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 10 }}>Muscles sollicités</p>
                    {activeMuscles.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {activeMuscles.slice(0, 5).map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: stateColors[m.state], flexShrink: 0, boxShadow: `0 0 6px ${stateColors[m.state]}80` }} />
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>{m.name}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, color: stateColors[m.state] }}>{stateLabels[m.state]}</span>
                              {m.recoveryHoursLeft > 0 && (
                                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>~{m.recoveryHoursLeft}h</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.2)', lineHeight: 1.5 }}>Tous les muscles sont frais — prêt pour l'entraînement.</p>
                    )}
                  </div>

                  {/* Stats si programme démarré */}
                  {data.startDate && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 10 }}>Progression</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                          { label: 'Séances', value: stats.totalSessions, unit: '' },
                          { label: 'Gain bras', value: stats.armGain > 0 ? `+${stats.armGain.toFixed(1)}` : stats.armGain.toFixed(1), unit: 'cm' },
                          { label: 'Gain cuisse', value: stats.thighGain > 0 ? `+${stats.thighGain.toFixed(1)}` : stats.thighGain.toFixed(1), unit: 'cm' },
                        ].map(({ label, value, unit }) => (
                          <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: '#FF6B35' }}>{value}<span style={{ fontSize: 10, marginLeft: 2, color: 'rgba(255,107,53,0.4)', fontWeight: 400 }}>{unit}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Légende en bas */}
                  <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 8 }}>Légende</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 8px' }}>
                      {Object.entries(stateColors).map(([state, color]) => (
                        <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{stateLabels[state]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {/* Phase actuelle */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Phase actuelle
              </p>
              <h3 className="text-white font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
                {currentPhase.name}
              </h3>
            </div>
            <span
              className="text-xs px-2 py-1 rounded-full font-medium"
              style={{
                background: `${currentPhase.color}20`,
                color: currentPhase.color,
                border: `1px solid ${currentPhase.color}40`,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              S{currentPhase.weekRange[0]}-{currentPhase.weekRange[1]}
            </span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            {currentPhase.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {currentPhase.keyFocus.map(focus => (
              <span
                key={focus}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {focus}
              </span>
            ))}
          </div>
        </div>

        {/* Modal de confirmation swap + adaptation nutritionnelle */}
        {swapConfirm && (
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              padding: '0 0 env(safe-area-inset-bottom, 0)',
            }}
            onClick={() => setSwapConfirm(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: '#1a1a24',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '24px 24px 0 0',
                padding: '24px 20px 32px',
                width: '100%',
                maxWidth: 480,
              }}
            >
              {/* Poignée */}
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />

              {/* Titre */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,107,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔄</div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 16, fontFamily: 'Syne, sans-serif', lineHeight: 1.2 }}>Modifier le planning</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                    J{swapConfirm.srcDay} ⇄ J{swapConfirm.tgtDay}
                  </p>
                </div>
              </div>

              {/* Aperçu du swap */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '12px 14px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>J{swapConfirm.srcDay}</p>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{getSessionInfo(swapConfirm.srcId).label}</p>
                    <p style={{ color: getSessionInfo(swapConfirm.srcId).eatInfo.color, fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{getSessionInfo(swapConfirm.srcId).eatInfo.kcal} kcal</p>
                  </div>
                  <div style={{ color: '#FF6B35', fontSize: 20 }}>⇄</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>J{swapConfirm.tgtDay}</p>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>{getSessionInfo(swapConfirm.tgtId).label}</p>
                    <p style={{ color: getSessionInfo(swapConfirm.tgtId).eatInfo.color, fontSize: 11, fontFamily: 'Inter, sans-serif' }}>{getSessionInfo(swapConfirm.tgtId).eatInfo.kcal} kcal</p>
                  </div>
                </div>
              </div>

              {/* Message adaptation */}
              <div style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 20 }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                  🥗 Ton plan nutritionnel sera automatiquement ajusté pour ces deux jours. Les repas déjà consommés ne seront pas modifiés.
                </p>
              </div>

              {/* Boutons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => {
                    const { srcDay, tgtDay, srcId, tgtId, srcDateKey, tgtDateKey } = swapConfirm;
                    // 1. Persister le swap dans le planning
                    setScheduleOverride(`cycle_day_${srcDay}`, tgtId);
                    setScheduleOverride(`cycle_day_${tgtDay}`, srcId);
                    // 2. Adapter la nutrition pour les deux jours (si date connue)
                    if (srcDateKey) adaptNutritionForSession(srcDateKey, tgtId);
                    if (tgtDateKey) adaptNutritionForSession(tgtDateKey, srcId);
                    toast.success(`J${srcDay} ⇄ J${tgtDay} — planning et nutrition adaptés ✓`);
                    setSwapConfirm(null);
                  }}
                  style={{
                    width: '100%', padding: '14px 0', borderRadius: 14,
                    background: 'linear-gradient(135deg, #FF6B35, #FF3366)',
                    color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'Syne, sans-serif',
                    border: 'none', cursor: 'pointer',
                    boxShadow: '0 6px 24px rgba(255,107,53,0.3)',
                  }}
                >
                  Oui, adapter mon plan
                </button>
                <button
                  onClick={() => {
                    const { srcDay, tgtDay, srcId, tgtId } = swapConfirm;
                    // Swap sans adaptation nutritionnelle
                    setScheduleOverride(`cycle_day_${srcDay}`, tgtId);
                    setScheduleOverride(`cycle_day_${tgtDay}`, srcId);
                    toast.success(`J${srcDay} ⇄ J${tgtDay} — séances échangées (nutrition inchangée)`);
                    setSwapConfirm(null);
                  }}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 14,
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  Non, garder mon plan actuel
                </button>
                <button
                  onClick={() => setSwapConfirm(null)}
                  style={{
                    width: '100%', padding: '10px 0', borderRadius: 14,
                    background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.35)', fontWeight: 500, fontSize: 13, fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CTA si programme non démarré */}
        {!data.startDate && (
          <button
            onClick={() => {
              startProgram();
              setPendingStart(true);
            }}
            className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FF6B35, #FF3366)',
              fontFamily: 'Syne, sans-serif',
              boxShadow: '0 8px 30px rgba(255, 107, 53, 0.35)',
            }}
          >
            Démarrer mon programme
          </button>
        )}

        {/* Profil */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Ton profil
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Poids', value: '68 kg' },
              { label: 'Taille', value: '1m75' },
              { label: 'Âge', value: '26 ans' },
              { label: 'Masse grasse', value: '13%' },
              { label: 'Objectif', value: 'Volume bras/jambes + foot' },
              { label: 'Calories/j', value: '2900 kcal' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
                <span className="text-white text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
