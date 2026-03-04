// DESIGN: "Coach Nocturne" — Dark Mode Premium Fitness
// Hero section avec image, stats du programme, cycle 14 jours, séance du jour

import { useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Dumbbell, Target, Flame, ChevronRight, ChevronLeft, Trophy, Calendar, Zap, Bike, Bed, Check, GripVertical, X } from 'lucide-react';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { programData, cycle14Days, getCycleDayForDate, getSessionForCycleDay } from '../lib/programData';
import { toast } from 'sonner';
import { useAuth } from '../_core/hooks/useAuth';

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

// Calories à MANGER par session (apport journalier recommandé)
const SESSION_CALORIES_EAT: Record<string, { kcal: number; color: string; label: string }> = {
  upper_a:           { kcal: 2700, color: '#A855F7', label: '2700 kcal' },
  upper_b:           { kcal: 2700, color: '#A855F7', label: '2700 kcal' },
  lower_a:           { kcal: 2800, color: '#EC4899', label: '2800 kcal' },
  lower_b:           { kcal: 2800, color: '#EC4899', label: '2800 kcal' },
  football:          { kcal: 2900, color: '#F97316', label: '2900 kcal' },
  running_endurance: { kcal: 2750, color: '#3B82F6', label: '2750 kcal' },
  running_intervals: { kcal: 2750, color: '#3B82F6', label: '2750 kcal' },
  cycling:           { kcal: 2500, color: '#22C55E', label: '2500 kcal' },
  rest:              { kcal: 2300, color: '#22C55E', label: '2300 kcal' },
};

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
  const { data, startProgram, getCurrentWeek, getStats, setScheduleOverride } = useFitnessTracker();
  const [calendarOffset, setCalendarOffset] = useState(0); // offset en cycles de 14 jours

  // Drag & drop pour swapper deux jours du calendrier
  const [draggingDay, setDraggingDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);
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
  const todayCycleDay = cycle14Days.find(d => d.dayNumber === cycleDayToday);
  const todaySession = todayCycleDay ? getSessionForCycleDay(cycleDayToday) : null;
  const todayType = todayCycleDay?.type || 'rest';
  const todayColors = SESSION_TYPE_COLORS[todayType];

  // Prochain jour d'entraînement
  const nextTrainingDay = cycle14Days.find(
    d => d.dayNumber > cycleDayToday && d.type !== 'rest'
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
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
          {/* Navigation du cycle */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCalendarOffset(o => o - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <ChevronLeft size={14} className="text-white/50" />
            </button>
            <span className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
              {calendarOffset === 0 ? 'Cycle actuel (J1–J14)' : calendarOffset > 0 ? `Cycle +${calendarOffset}` : `Cycle ${calendarOffset}`}
            </span>
            <button onClick={() => setCalendarOffset(o => o + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <ChevronRight size={14} className="text-white/50" />
            </button>
          </div>

          {/* Grille calendrier — scroll horizontal, grandes cards */}
          {(['Semaine 1', 'Semaine 2'] as const).map((weekLabel, weekIdx) => (
            <div key={weekLabel} style={{ marginBottom: weekIdx === 0 ? 14 : 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>{weekLabel}</p>
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
                scrollSnapType: 'x mandatory',
                WebkitOverflowScrolling: 'touch',
                msOverflowStyle: 'none', scrollbarWidth: 'none',
              }}>
                {cycle14Days.slice(weekIdx * 7, weekIdx * 7 + 7).map(day => {
                  const absoluteDayNumber = day.dayNumber + calendarOffset * 14;
                  const isToday = !!(data.startDate && absoluteDayNumber === cycleDayToday);
                  const isPast = !!(data.startDate && absoluteDayNumber < cycleDayToday);
                  const isDraggingThis = draggingDay === day.dayNumber;
                  const isDragTarget = dragOverDay === day.dayNumber && draggingDay !== null && draggingDay !== day.dayNumber;
                  const colors = SESSION_TYPE_COLORS[day.type];
                  const sessionImg = SESSION_IMAGES[day.sessionId];
                  const eatInfo = SESSION_CALORIES_EAT[day.sessionId];
                  const sessionDateMs = data.startDate ? new Date(data.startDate).getTime() + (absoluteDayNumber - 1) * 86400000 : null;
                  const sessionDateKey = sessionDateMs ? (() => { const d = new Date(sessionDateMs); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })() : null;
                  const isCompleted = !!(sessionDateKey && Object.keys(data.sessionLogs || {}).some(k => k.startsWith(sessionDateKey)));

                  const handleTapOrDrop = () => {
                    if (isDragging.current) {
                      // Mode drag : on vient de relâcher — géré par onTouchEnd
                      return;
                    }
                    // Tap simple : ouvrir la séance
                    if (day.type !== 'rest' && calendarOffset === 0) {
                      localStorage.setItem('pendingSessionId', day.sessionId);
                      navigate('/workout');
                    }
                  };

                  return (
                    <button
                      key={day.dayNumber}
                      onClick={handleTapOrDrop}
                      onTouchStart={(e) => {
                        if (calendarOffset !== 0) return;
                        dragStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                        isDragging.current = false;
                        // Appui long = 500ms
                        longPressTimer.current = setTimeout(() => {
                          isDragging.current = true;
                          setDraggingDay(day.dayNumber);
                          if (navigator.vibrate) navigator.vibrate(40);
                        }, 500);
                      }}
                      onTouchMove={(e) => {
                        if (!dragStartPos.current) return;
                        const dx = e.touches[0].clientX - dragStartPos.current.x;
                        const dy = e.touches[0].clientY - dragStartPos.current.y;
                        if (Math.sqrt(dx*dx + dy*dy) > 8 && longPressTimer.current) {
                          clearTimeout(longPressTimer.current);
                          longPressTimer.current = null;
                        }
                        if (!isDragging.current) return;
                        // Détecter la card sous le doigt
                        const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
                        const card = el?.closest('[data-day]') as HTMLElement | null;
                        const targetDay = card ? parseInt(card.dataset.day || '0') : null;
                        if (targetDay && targetDay !== draggingDay) setDragOverDay(targetDay);
                      }}
                      onTouchEnd={() => {
                        if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
                        if (isDragging.current && draggingDay !== null && dragOverDay !== null && draggingDay !== dragOverDay) {
                          // Swap les deux jours
                          const dayA = cycle14Days.find(d => d.dayNumber === draggingDay);
                          const dayB = cycle14Days.find(d => d.dayNumber === dragOverDay);
                          if (dayA && dayB) {
                            setScheduleOverride(`cycle_day_${draggingDay}`, dayB.sessionId);
                            setScheduleOverride(`cycle_day_${dragOverDay}`, dayA.sessionId);
                            toast.success(`J${draggingDay} ⇄ J${dragOverDay} — séances échangées`);
                          }
                        }
                        isDragging.current = false;
                        setDraggingDay(null);
                        setDragOverDay(null);
                      }}
                      data-day={day.dayNumber}
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
                          ? '2px dashed #FF6B35'
                          : isToday
                          ? `2px solid ${colors.text}`
                          : isCompleted
                          ? '1px solid rgba(34,197,94,0.5)'
                          : '1px solid rgba(255,255,255,0.08)',
                        opacity: isDraggingThis ? 0.6 : isPast && !isCompleted && !isToday ? 0.45 : 1,
                        cursor: 'pointer',
                        background: isDragTarget ? 'rgba(255,107,53,0.12)' : '#0e0e14',
                        boxShadow: isDraggingThis ? '0 0 24px rgba(255,107,53,0.5)' : isToday ? `0 0 20px ${colors.text}66` : '0 4px 16px rgba(0,0,0,0.4)',
                        transform: isDraggingThis ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.15s',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Photo de fond — prend toute la hauteur sauf la barre calories */}
                      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
                        {sessionImg ? (
                          <img
                            src={sessionImg}
                            alt={day.label}
                            style={{
                              position: 'absolute', inset: 0, width: '100%', height: '100%',
                              objectFit: 'cover',
                              filter: isPast && !isCompleted ? 'brightness(0.22) grayscale(0.7)' : 'brightness(0.55)',
                            }}
                          />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.02)' }} />
                        )}
                        {/* Gradient sombre vers le bas */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.82) 100%)' }} />

                        {/* Badge complété */}
                        {isCompleted && (
                          <div style={{
                            position: 'absolute', top: 4, right: 4, width: 14, height: 14,
                            borderRadius: '50%', background: 'rgba(34,197,94,0.95)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check size={8} color="#fff" />
                          </div>
                        )}

                        {/* Numéro de jour + label séance */}
                        <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, padding: '0 10px' }}>
                          <div style={{
                            fontSize: 13, fontWeight: 800, lineHeight: 1,
                            color: isToday ? colors.text : isCompleted ? '#22C55E' : 'rgba(255,255,255,0.55)',
                            fontFamily: 'Syne, sans-serif',
                          }}>J{absoluteDayNumber}</div>
                          {day.type === 'rest' ? (
                            <div style={{ fontSize: 22, lineHeight: 1, marginTop: 4 }}>😴</div>
                          ) : (
                            <div style={{
                              fontSize: 11, fontWeight: 700, lineHeight: 1.2, marginTop: 4,
                              color: colors.text,
                              fontFamily: 'Inter, sans-serif',
                            }}>
                              {day.label.split(' — ')[0]}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Barre calories à manger — couleur selon le niveau */}
                      <div style={{
                        background: `${eatInfo?.color ?? '#22C55E'}20`,
                        borderTop: `2px solid ${eatInfo?.color ?? '#22C55E'}70`,
                        padding: '7px 10px 8px',
                        display: 'flex', alignItems: 'baseline', gap: 3,
                      }}>
                        <div style={{
                          fontSize: 16, fontWeight: 800, lineHeight: 1,
                          color: eatInfo?.color ?? '#22C55E',
                          fontFamily: 'Syne, sans-serif',
                          letterSpacing: '-0.02em',
                        }}>
                          {eatInfo?.kcal ?? 2300}
                        </div>
                        <div style={{
                          fontSize: 9, fontWeight: 600, lineHeight: 1,
                          color: `${eatInfo?.color ?? '#22C55E'}bb`,
                          fontFamily: 'Inter, sans-serif',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>kcal</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Indication drag & drop */}
          {draggingDay !== null && (
            <div className="mt-3 rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(255,107,53,0.12)', border: '1px solid rgba(255,107,53,0.3)' }}>
              <GripVertical size={12} style={{ color: '#FF6B35' }} />
              <span className="text-xs" style={{ color: '#FF6B35', fontFamily: 'Inter, sans-serif' }}>
                J{draggingDay} sélectionné — dépose sur un autre jour pour échanger
              </span>
              <button onClick={() => { setDraggingDay(null); setDragOverDay(null); isDragging.current = false; }} style={{ marginLeft: 'auto' }}>
                <X size={12} style={{ color: 'rgba(255,107,53,0.7)' }} />
              </button>
            </div>
          )}

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

        {/* Stats rapides */}
        {data.startDate && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Séances', value: stats.totalSessions, unit: '', icon: Dumbbell },
              { label: 'Gain bras', value: stats.armGain > 0 ? `+${stats.armGain.toFixed(1)}` : stats.armGain.toFixed(1), unit: 'cm', icon: Target },
              { label: 'Gain cuisse', value: stats.thighGain > 0 ? `+${stats.thighGain.toFixed(1)}` : stats.thighGain.toFixed(1), unit: 'cm', icon: Target },
            ].map(({ label, value, unit, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Icon size={16} className="mx-auto mb-1.5" style={{ color: '#FF6B35' }} />
                <div className="text-white font-bold text-lg leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {value}
                  <span className="text-xs text-white/40 ml-0.5">{unit}</span>
                </div>
                <div className="text-white/40 text-xs mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}

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

        {/* CTA si programme non démarré */}
        {!data.startDate && (
          <button
            onClick={() => { startProgram(); navigate('/workout'); }}
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
