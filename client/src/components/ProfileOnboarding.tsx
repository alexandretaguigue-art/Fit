/**
 * ProfileOnboarding — Formulaire multi-étapes pour collecter le profil utilisateur
 * Design : dark premium, cohérent avec "Coach Nocturne"
 */

import { useState } from 'react';
import { ChevronRight, ChevronLeft, User, Target, Dumbbell, Utensils, Check } from 'lucide-react';
import type { UserProfile } from '../hooks/useUserProfile';
import { toast } from 'sonner';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const GOALS = [
  { id: 'lean_bulk', label: 'Prise de masse', desc: '+250 kcal/j', icon: '💪' },
  { id: 'cut', label: 'Sèche', desc: '-400 kcal/j', icon: '🔥' },
  { id: 'recomp', label: 'Recomposition', desc: 'Maintien calorique', icon: '⚖️' },
  { id: 'perf', label: 'Performance', desc: '+200 kcal/j', icon: '⚡' },
  { id: 'maintain', label: 'Maintien', desc: 'Équilibre', icon: '🎯' },
];

const ACTIVITIES = [
  { id: 'sedentaire', label: 'Sédentaire', desc: 'Bureau, peu de marche', icon: '🪑' },
  { id: 'leger', label: 'Léger', desc: '1-3 séances/sem', icon: '🚶' },
  { id: 'modere', label: 'Modéré', desc: '3-5 séances/sem', icon: '🏃' },
  { id: 'actif', label: 'Très actif', desc: '6-7 séances/sem', icon: '🏋️' },
];

const SPORTS_OPTIONS = [
  { id: 'muscu', label: 'Musculation', icon: '🏋️' },
  { id: 'football', label: 'Football', icon: '⚽' },
  { id: 'running', label: 'Course', icon: '🏃' },
  { id: 'cycling', label: 'Vélo', icon: '🚴' },
  { id: 'natation', label: 'Natation', icon: '🏊' },
  { id: 'tennis', label: 'Tennis', icon: '🎾' },
  { id: 'basket', label: 'Basket', icon: '🏀' },
  { id: 'boxe', label: 'Boxe', icon: '🥊' },
];

const DIETS = [
  { id: '', label: 'Aucun régime', icon: '🍽️' },
  { id: 'vegetarien', label: 'Végétarien', icon: '🥗' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'sans_gluten', label: 'Sans gluten', icon: '🌾' },
  { id: 'sans_lactose', label: 'Sans lactose', icon: '🥛' },
];

const LEVELS = [
  { id: 'debutant', label: 'Débutant', desc: '< 1 an', icon: '🌱' },
  { id: 'intermediaire', label: 'Intermédiaire', desc: '1-3 ans', icon: '📈' },
  { id: 'avance', label: 'Avancé', desc: '3+ ans', icon: '🏆' },
];

const STEP_LABELS = ['Profil', 'Objectif', 'Sport', 'Nutrition'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
            style={{
              background: i < current ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : i === current ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.06)',
              border: i === current ? '1px solid #FF6B35' : '1px solid transparent',
              color: i <= current ? 'white' : 'rgba(255,255,255,0.3)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {i < current ? <Check size={14} /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className="w-8 h-0.5" style={{ background: i < current ? '#FF6B35' : 'rgba(255,255,255,0.1)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function NumericInput({ label, value, onChange, min, max, unit, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; unit: string; step?: number;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 font-bold"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >−</button>
        <span className="text-white font-bold text-lg w-16 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>
          {value} <span className="text-white/40 text-xs font-normal">{unit}</span>
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 font-bold"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >+</button>
      </div>
    </div>
  );
}

export default function ProfileOnboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);

  // Step 0 — Identité
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [sex, setSex] = useState<'homme' | 'femme' | 'autre'>('homme');
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(175);

  // Step 1 — Objectif
  const [goal, setGoal] = useState('lean_bulk');
  const [activity, setActivity] = useState('modere');
  const [targetWeight, setTargetWeight] = useState<number | null>(null);
  const [timeline, setTimeline] = useState(12);

  // Step 2 — Sport
  const [sports, setSports] = useState<string[]>(['muscu']);
  const [level, setLevel] = useState('intermediaire');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(4);

  // Step 3 — Nutrition
  const [diet, setDiet] = useState('');
  const [avoid, setAvoid] = useState('');
  const [foodPrefs, setFoodPrefs] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(5);

  const toggleSport = (id: string) => {
    setSports(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const canNext = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 2) return sports.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canNext()) {
      if (step === 0) toast.error('Entre ton prénom (2 caractères min)');
      if (step === 2) toast.error('Sélectionne au moins un sport');
      return;
    }
    if (step < 3) { setStep(s => s + 1); return; }

    // Finalisation
    const profile: UserProfile = {
      name: name.trim(),
      age, sex, weight, height,
      goal, activity,
      sports: sports.length > 0 ? sports : ['muscu'],
      diet: diet || undefined,
      avoid: avoid.trim() || undefined,
      foodPrefs: foodPrefs.trim() || undefined,
      mealsPerDay, level, sessionsPerWeek,
      targetWeight: targetWeight ?? null,
      timeline,
    };
    onComplete(profile);
  };

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6" style={{ background: '#0F0F14' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)' }}>
          <User size={24} className="text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Mon profil</h1>
        <p className="text-white/40 text-sm mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
          {STEP_LABELS[step]} · Étape {step + 1}/4
        </p>
      </div>

      <StepIndicator current={step} total={4} />

      {/* Step 0 — Identité */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl" style={cardStyle}>
            <p className="text-white/50 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Prénom</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Alex"
              className="w-full bg-transparent text-white text-lg font-bold outline-none"
              style={{ fontFamily: 'Syne, sans-serif' }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['homme', 'femme', 'autre'] as const).map(s => (
              <button key={s} onClick={() => setSex(s)}
                className="py-3 rounded-2xl text-sm font-semibold capitalize transition-all"
                style={{
                  background: sex === s ? 'linear-gradient(135deg, #FF6B35, #FF3366)' : 'rgba(255,255,255,0.04)',
                  border: sex === s ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: sex === s ? 'white' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >{s}</button>
            ))}
          </div>
          <NumericInput label="Âge" value={age} onChange={setAge} min={14} max={80} unit="ans" />
          <NumericInput label="Poids" value={weight} onChange={setWeight} min={40} max={200} unit="kg" />
          <NumericInput label="Taille" value={height} onChange={setHeight} min={140} max={220} unit="cm" />
        </div>
      )}

      {/* Step 1 — Objectif */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Objectif principal</p>
          <div className="space-y-2">
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setGoal(g.id)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all"
                style={{
                  background: goal === g.id ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
                  border: goal === g.id ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-2xl">{g.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{g.label}</p>
                  <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{g.desc}</p>
                </div>
                {goal === g.id && <Check size={16} className="ml-auto" style={{ color: '#FF6B35' }} />}
              </button>
            ))}
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider mt-4 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Niveau d'activité quotidien</p>
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITIES.map(a => (
              <button key={a.id} onClick={() => setActivity(a.id)}
                className="p-3 rounded-2xl text-left transition-all"
                style={{
                  background: activity === a.id ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
                  border: activity === a.id ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-xl">{a.icon}</span>
                <p className="text-white font-semibold text-xs mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>{a.label}</p>
                <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{a.desc}</p>
              </button>
            ))}
          </div>
          <NumericInput label="Durée programme" value={timeline} onChange={setTimeline} min={4} max={52} unit="sem" step={4} />
        </div>
      )}

      {/* Step 2 — Sport */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Sports pratiqués (plusieurs possibles)</p>
          <div className="grid grid-cols-2 gap-2">
            {SPORTS_OPTIONS.map(s => (
              <button key={s.id} onClick={() => toggleSport(s.id)}
                className="flex items-center gap-2 p-3 rounded-2xl transition-all"
                style={{
                  background: sports.includes(s.id) ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
                  border: sports.includes(s.id) ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-white text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{s.label}</span>
                {sports.includes(s.id) && <Check size={14} className="ml-auto" style={{ color: '#FF6B35' }} />}
              </button>
            ))}
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider mt-4 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Niveau</p>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => setLevel(l.id)}
                className="p-3 rounded-2xl text-center transition-all"
                style={{
                  background: level === l.id ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
                  border: level === l.id ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-xl">{l.icon}</span>
                <p className="text-white font-semibold text-xs mt-1" style={{ fontFamily: 'Syne, sans-serif' }}>{l.label}</p>
                <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>{l.desc}</p>
              </button>
            ))}
          </div>
          <NumericInput label="Séances/semaine" value={sessionsPerWeek} onChange={setSessionsPerWeek} min={1} max={7} unit="j/sem" />
        </div>
      )}

      {/* Step 3 — Nutrition */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-white/50 text-xs uppercase tracking-wider mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Régime alimentaire</p>
          <div className="grid grid-cols-2 gap-2">
            {DIETS.map(d => (
              <button key={d.id} onClick={() => setDiet(d.id)}
                className="flex items-center gap-2 p-3 rounded-2xl transition-all"
                style={{
                  background: diet === d.id ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
                  border: diet === d.id ? '1px solid rgba(255,107,53,0.4)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="text-xl">{d.icon}</span>
                <span className="text-white text-xs font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>{d.label}</span>
              </button>
            ))}
          </div>
          <NumericInput label="Repas par jour" value={mealsPerDay} onChange={setMealsPerDay} min={3} max={6} unit="repas" />
          <div className="p-4 rounded-2xl" style={cardStyle}>
            <p className="text-white/50 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Aliments à éviter (optionnel)</p>
            <input
              value={avoid}
              onChange={e => setAvoid(e.target.value)}
              placeholder="Ex: noix, fruits de mer..."
              className="w-full bg-transparent text-white text-sm outline-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
          <div className="p-4 rounded-2xl" style={cardStyle}>
            <p className="text-white/50 text-xs mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Préférences alimentaires (optionnel)</p>
            <input
              value={foodPrefs}
              onChange={e => setFoodPrefs(e.target.value)}
              placeholder="Ex: j'adore les pâtes, le poulet..."
              className="w-full bg-transparent text-white text-sm outline-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-5 py-4 rounded-2xl font-semibold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}
          >
            <ChevronLeft size={16} /> Retour
          </button>
        )}
        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FF6B35, #FF3366)', fontFamily: 'Syne, sans-serif', boxShadow: '0 8px 30px rgba(255,107,53,0.3)' }}
        >
          {step < 3 ? (
            <><span>Suivant</span><ChevronRight size={18} /></>
          ) : (
            <><Target size={18} /><span>Générer mon plan</span></>
          )}
        </button>
      </div>
    </div>
  );
}
