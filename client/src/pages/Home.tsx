// DESIGN: "Coach Nocturne" — Page d'accueil
// Hero section avec image, stats du programme, phase courante

import { useLocation } from 'wouter';
import { Dumbbell, Target, Flame, ChevronRight, Trophy, Calendar } from 'lucide-react';
import { useFitnessTracker } from '../hooks/useFitnessTracker';
import { programData } from '../lib/programData';

const HERO_IMAGE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/hero-fitness-5h7p34NBzccTy9ggEni2uM.webp";

export default function Home() {
  const [, navigate] = useLocation();
  const { data, startProgram, getCurrentWeek, getStats } = useFitnessTracker();
  const stats = getStats();
  const currentWeek = getCurrentWeek();

  const currentPhase = programData.phases.find(
    p => currentWeek >= p.weekRange[0] && currentWeek <= p.weekRange[1]
  ) || programData.phases[0];

  const weekProgress = data.startDate
    ? Math.min(((currentWeek - 1) / 12) * 100, 100)
    : 0;

  const todayDay = new Date().getDay(); // 0=dim, 1=lun...
  const sessionDays: Record<number, string> = { 1: 'upper_a', 2: 'lower_a', 4: 'upper_b', 5: 'lower_b' };
  const todaySession = sessionDays[todayDay];
  const todayWorkout = todaySession
    ? programData.sessions.find(s => s.id === todaySession)
    : null;

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
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(15,15,20,0.3) 0%, rgba(15,15,20,0.0) 40%, rgba(15,15,20,1) 100%)',
          }}
        />
        {/* Header content */}
        <div className="absolute top-0 left-0 right-0 p-5 flex items-start justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
              Programme
            </p>
            <h1
              className="text-white text-2xl font-bold leading-tight"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
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
            3 mois
          </div>
        </div>
        {/* Bottom hero text */}
        <div className="absolute bottom-4 left-5">
          <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            {data.startDate ? `Semaine ${currentWeek} / 12` : 'Programme non démarré'}
          </p>
          <h2
            className="text-white text-xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            {currentPhase.name}
          </h2>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-2">
        {/* Progression globale */}
        {data.startDate && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
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
                style={{
                  width: `${weekProgress}%`,
                  background: 'linear-gradient(90deg, #FF6B35, #FF3366)',
                }}
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
        {todayWorkout ? (
          <div
            className="rounded-2xl overflow-hidden cursor-pointer hover-glow transition-all duration-300"
            style={{
              background: 'rgba(255, 107, 53, 0.08)',
              border: '1px solid rgba(255, 107, 53, 0.2)',
            }}
            onClick={() => navigate('/workout')}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={16} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Séance du jour
                </span>
              </div>
              <h3
                className="text-white text-lg font-bold"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {todayWorkout.name}
              </h3>
              <p className="text-white/60 text-sm mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
                {todayWorkout.focus}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-white/40" />
                  <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {todayWorkout.exercises.length} exercices
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-white/40" />
                  <span className="text-white/60 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                    ~{todayWorkout.durationMin} min
                  </span>
                </div>
              </div>
            </div>
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ background: 'rgba(255, 107, 53, 0.1)', borderTop: '1px solid rgba(255, 107, 53, 0.15)' }}
            >
              <span className="text-orange-400 text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                Commencer la séance
              </span>
              <ChevronRight size={16} className="text-orange-400" />
            </div>
          </div>
        ) : (
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-white/40" />
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                Jour de repos
              </span>
            </div>
            <h3
              className="text-white text-lg font-bold"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Récupération active
            </h3>
            <p className="text-white/50 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Le muscle grandit pendant le repos. Marche légère, étirements, sommeil de qualité.
            </p>
          </div>
        )}

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
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <Icon size={16} className="mx-auto mb-1.5" style={{ color: '#FF6B35' }} />
                <div
                  className="text-white font-bold text-lg leading-none"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
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
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                Phase actuelle
              </p>
              <h3
                className="text-white font-bold text-base"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
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
            onClick={() => {
              startProgram();
              navigate('/workout');
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
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
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
              { label: 'Objectif', value: 'Volume bras/jambes' },
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
