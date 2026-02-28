// DESIGN: "Coach Nocturne" — Page Conseils
// Conseils avancés pour maximiser les résultats : sommeil, hydratation, suppléments, mentalité

import { useState } from 'react';
import { advancedTips, programData } from '../lib/programData';
import { Moon, Droplets, Pill, Brain, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

const tipCategories = [
  {
    key: 'sleep',
    label: 'Sommeil',
    icon: Moon,
    color: '#a855f7',
    description: 'Le muscle grandit pendant le repos, pas pendant l\'entraînement.',
    tips: advancedTips.sleep,
  },
  {
    key: 'hydration',
    label: 'Hydratation',
    icon: Droplets,
    color: '#3b82f6',
    description: 'La déshydratation réduit les performances de 10-20%.',
    tips: advancedTips.hydration,
  },
  {
    key: 'supplements',
    label: 'Suppléments',
    icon: Pill,
    color: '#22c55e',
    description: 'Seulement 4 suppléments ont des preuves solides d\'efficacité.',
    tips: advancedTips.supplements,
  },
  {
    key: 'mindset',
    label: 'Mentalité',
    icon: Brain,
    color: '#FF6B35',
    description: 'La cohérence sur 3 mois vaut mieux que 3 semaines parfaites.',
    tips: advancedTips.mindset,
  },
  {
    key: 'recovery',
    label: 'Récupération',
    icon: Moon,
    color: '#eab308',
    description: 'Optimiser la récupération pour maximiser les gains.',
    tips: advancedTips.recovery,
  },
];

const phaseDetails = [
  {
    phase: programData.phases[0],
    details: [
      "Semaines 1-2 : Commence à 60-70% de ta charge maximale estimée. L'objectif est d'apprendre les mouvements, pas de te détruire.",
      "Semaines 3-4 : Augmente progressivement jusqu'à 75-80% de ta charge max. Tu devrais commencer à sentir les exercices.",
      "Fin de phase : Tu dois avoir établi tes charges de base sur tous les exercices. Note-les soigneusement.",
    ],
    keyMetric: "Maîtrise technique sur 8 exercices fondamentaux",
  },
  {
    phase: programData.phases[1],
    details: [
      "Semaines 5-6 : Augmente le volume (+1 série sur les exercices principaux). Charges à 80-85% du max.",
      "Semaines 7-8 : Intensité maximale de la phase. Chaque séance doit être légèrement plus difficile que la précédente.",
      "Fin de phase : Tu devrais avoir augmenté tes charges de 10-20% sur les exercices principaux.",
    ],
    keyMetric: "+10-20% de charge sur squat, développé couché, tractions",
  },
  {
    phase: programData.phases[2],
    details: [
      "Semaines 9-11 : Introduction des drop sets (après la dernière série, réduis la charge de 30% et continue jusqu'à l'échec).",
      "Semaine 12 : DÉCHARGE OBLIGATOIRE. Réduis le volume de 40% (moins de séries) mais garde l'intensité. Ton corps a besoin de récupérer pour la super-compensation.",
      "Après la semaine 12 : Prends 1 semaine de repos complet, puis recommence avec un nouveau programme.",
    ],
    keyMetric: "Super-compensation en semaine 12 — gains visibles",
  },
];

export default function TipsPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('sleep');
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0F0F14' }}>
      <div className="p-5">
        <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
          Conseils
        </h1>
        <p className="text-white/50 text-sm mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          Maximise tes résultats au-delà de l'entraînement
        </p>

        {/* Règle des 3 piliers */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.08), rgba(255, 51, 102, 0.08))',
            border: '1px solid rgba(255, 107, 53, 0.2)',
          }}
        >
          <h3 className="text-white font-bold text-base mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            La règle des 3 piliers
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Entraînement', value: '33%', desc: 'Le stimulus' },
              { label: 'Nutrition', value: '33%', desc: 'Le carburant' },
              { label: 'Récupération', value: '33%', desc: 'La construction' },
            ].map(({ label, value, desc }) => (
              <div key={label} className="text-center">
                <div
                  className="text-xl font-bold mb-0.5"
                  style={{ fontFamily: 'Syne, sans-serif', color: '#FF6B35' }}
                >
                  {value}
                </div>
                <div className="text-white text-xs font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </div>
                <div className="text-white/40 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs mt-3 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
            Négliger un seul pilier réduit l'efficacité des deux autres de moitié. La plupart des gens s'entraînent bien mais dorment mal ou mangent insuffisamment.
          </p>
        </div>

        {/* Catégories de conseils */}
        <div className="space-y-3 mb-6">
          {tipCategories.map(({ key, label, icon: Icon, color, description, tips }) => (
            <div
              key={key}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: expandedCategory === key
                  ? `1px solid ${color}40`
                  : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <button
                className="w-full p-4 flex items-center gap-3 text-left"
                onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15` }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {label}
                  </h3>
                  <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {description}
                  </p>
                </div>
                {expandedCategory === key
                  ? <ChevronUp size={16} className="text-white/30 flex-shrink-0" />
                  : <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
                }
              </button>

              {expandedCategory === key && (
                <div
                  className="px-4 pb-4 space-y-2.5"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="pt-3 space-y-2.5">
                    {tips.map((tip, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                          style={{ background: `${color}20`, color, fontFamily: 'Inter, sans-serif' }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Détail des phases */}
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
            Détail des phases du programme
          </p>
          <div className="space-y-3">
            {phaseDetails.map(({ phase, details, keyMetric }) => (
              <div
                key={phase.id}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: expandedPhase === phase.id
                    ? `1px solid ${phase.color}40`
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <button
                  className="w-full p-4 flex items-center gap-3 text-left"
                  onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${phase.color}15` }}
                  >
                    <Calendar size={18} style={{ color: phase.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
                      {phase.name}
                    </h3>
                    <p className="text-white/50 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Semaines {phase.weeks}
                    </p>
                  </div>
                  {expandedPhase === phase.id
                    ? <ChevronUp size={16} className="text-white/30 flex-shrink-0" />
                    : <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
                  }
                </button>

                {expandedPhase === phase.id && (
                  <div
                    className="px-4 pb-4"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="pt-3 space-y-2.5">
                      {details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                            style={{ background: phase.color }}
                          />
                          <p className="text-white/70 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {detail}
                          </p>
                        </div>
                      ))}
                      <div
                        className="mt-3 p-3 rounded-xl"
                        style={{ background: `${phase.color}10`, border: `1px solid ${phase.color}25` }}
                      >
                        <p className="text-xs font-semibold mb-1" style={{ color: phase.color, fontFamily: 'Inter, sans-serif' }}>
                          Métrique clé de la phase
                        </p>
                        <p className="text-white/70 text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                          {keyMetric}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Erreurs à éviter */}
        <div
          className="mt-6 rounded-2xl p-4"
          style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
        >
          <h3 className="text-red-400 font-bold text-sm mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Les 5 erreurs qui sabotent les résultats
          </h3>
          <div className="space-y-2">
            {[
              "Changer de programme toutes les 2 semaines — la progression prend du temps.",
              "Sauter des repas ou manger insuffisamment de protéines.",
              "Négliger le sommeil (moins de 7h/nuit = -30% de récupération).",
              "Augmenter les charges trop vite au détriment de la technique.",
              "Faire du cardio excessif qui ronge les gains musculaires.",
            ].map((error, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-red-400 text-xs flex-shrink-0 mt-0.5">✗</span>
                <p className="text-white/60 text-xs leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {error}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
