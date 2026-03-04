// BodyHologram — Corps humain SVG holographique orange
// Affiche les zones musculaires actives selon le type de séance du jour

import { useEffect, useRef } from 'react';

// Zones musculaires par type de séance
const MUSCLE_ZONES: Record<string, string[]> = {
  upper_a: ['chest', 'shoulders', 'triceps'],
  upper_b: ['back', 'biceps', 'shoulders'],
  lower_a: ['quads', 'glutes', 'calves'],
  lower_b: ['hamstrings', 'glutes', 'calves'],
  football: ['quads', 'hamstrings', 'calves', 'core'],
  running_endurance: ['quads', 'hamstrings', 'calves', 'core'],
  running_intervals: ['quads', 'hamstrings', 'calves', 'core'],
  cycling: ['quads', 'hamstrings', 'glutes', 'calves'],
  rest: [],
};

// Labels affichés sous le corps
const ZONE_LABELS: Record<string, string> = {
  chest: 'Pectoraux',
  shoulders: 'Épaules',
  triceps: 'Triceps',
  back: 'Dos',
  biceps: 'Biceps',
  quads: 'Quadriceps',
  hamstrings: 'Ischio',
  glutes: 'Fessiers',
  calves: 'Mollets',
  core: 'Core',
};

interface BodyHologramProps {
  sessionId: string;
  className?: string;
}

export function BodyHologram({ sessionId, className = '' }: BodyHologramProps) {
  const activeZones = MUSCLE_ZONES[sessionId] || [];
  const isRest = sessionId === 'rest' || activeZones.length === 0;
  const pulseRef = useRef<SVGAnimateElement | null>(null);

  const activeColor = '#FF6B35';
  const activeGlow = 'rgba(255,107,53,0.6)';
  const baseColor = 'rgba(255,255,255,0.08)';
  const baseStroke = 'rgba(255,255,255,0.15)';
  const activeStroke = '#FF6B35';

  const isActive = (zone: string) => activeZones.includes(zone);
  const fillFor = (zone: string) => isActive(zone) ? 'rgba(255,107,53,0.18)' : baseColor;
  const strokeFor = (zone: string) => isActive(zone) ? activeStroke : baseStroke;
  const strokeWidthFor = (zone: string) => isActive(zone) ? 1.5 : 0.8;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Corps SVG hologramme */}
      <div className="relative" style={{ width: 160, height: 320 }}>
        {/* Halo de fond */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: isRest
              ? 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(255,107,53,0.08) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />

        <svg
          viewBox="0 0 100 220"
          width="160"
          height="320"
          style={{ position: 'relative', zIndex: 1 }}
        >
          <defs>
            {/* Filtre glow pour les zones actives */}
            <filter id="glow-active" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-body" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Gradient hologramme de base */}
            <linearGradient id="body-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
            </linearGradient>

            {/* Gradient actif */}
            <linearGradient id="active-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,107,53,0.35)" />
              <stop offset="100%" stopColor="rgba(255,107,53,0.15)" />
            </linearGradient>
          </defs>

          {/* === TÊTE === */}
          <ellipse cx="50" cy="14" rx="10" ry="12"
            fill={baseColor} stroke={baseStroke} strokeWidth="0.8" filter="url(#glow-body)" />

          {/* === COU === */}
          <rect x="46" y="24" width="8" height="6" rx="2"
            fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />

          {/* === ÉPAULES === */}
          {/* Épaule gauche */}
          <ellipse cx="30" cy="36" rx="10" ry="7"
            fill={fillFor('shoulders')} stroke={strokeFor('shoulders')} strokeWidth={strokeWidthFor('shoulders')}
            filter={isActive('shoulders') ? 'url(#glow-active)' : undefined}>
            {isActive('shoulders') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </ellipse>
          {/* Épaule droite */}
          <ellipse cx="70" cy="36" rx="10" ry="7"
            fill={fillFor('shoulders')} stroke={strokeFor('shoulders')} strokeWidth={strokeWidthFor('shoulders')}
            filter={isActive('shoulders') ? 'url(#glow-active)' : undefined}>
            {isActive('shoulders') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </ellipse>

          {/* === PECTORAUX === */}
          {/* Pec gauche */}
          <path d="M38 32 Q50 30 50 42 Q44 46 36 44 Q32 40 38 32Z"
            fill={fillFor('chest')} stroke={strokeFor('chest')} strokeWidth={strokeWidthFor('chest')}
            filter={isActive('chest') ? 'url(#glow-active)' : undefined}>
            {isActive('chest') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Pec droit */}
          <path d="M62 32 Q50 30 50 42 Q56 46 64 44 Q68 40 62 32Z"
            fill={fillFor('chest')} stroke={strokeFor('chest')} strokeWidth={strokeWidthFor('chest')}
            filter={isActive('chest') ? 'url(#glow-active)' : undefined}>
            {isActive('chest') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>

          {/* === DOS === */}
          <path d="M38 32 Q50 28 62 32 Q66 44 64 52 Q50 56 36 52 Q34 44 38 32Z"
            fill={fillFor('back')} stroke={strokeFor('back')} strokeWidth={strokeWidthFor('back')}
            opacity={isActive('back') ? 1 : 0.4}
            filter={isActive('back') ? 'url(#glow-active)' : undefined}>
            {isActive('back') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>

          {/* === BRAS GAUCHE === */}
          {/* Biceps gauche */}
          <path d="M22 34 Q16 40 14 52 Q18 56 22 54 Q26 44 28 36Z"
            fill={fillFor('biceps')} stroke={strokeFor('biceps')} strokeWidth={strokeWidthFor('biceps')}
            filter={isActive('biceps') ? 'url(#glow-active)' : undefined}>
            {isActive('biceps') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Triceps gauche */}
          <path d="M22 34 Q28 36 26 44 Q22 54 18 52 Q14 44 16 36Z"
            fill={fillFor('triceps')} stroke={strokeFor('triceps')} strokeWidth={strokeWidthFor('triceps')}
            filter={isActive('triceps') ? 'url(#glow-active)' : undefined}>
            {isActive('triceps') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Avant-bras gauche */}
          <path d="M14 52 Q10 60 10 70 Q14 72 18 70 Q20 62 22 54Z"
            fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />

          {/* === BRAS DROIT === */}
          {/* Biceps droit */}
          <path d="M78 34 Q84 40 86 52 Q82 56 78 54 Q74 44 72 36Z"
            fill={fillFor('biceps')} stroke={strokeFor('biceps')} strokeWidth={strokeWidthFor('biceps')}
            filter={isActive('biceps') ? 'url(#glow-active)' : undefined}>
            {isActive('biceps') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Triceps droit */}
          <path d="M78 34 Q72 36 74 44 Q78 54 82 52 Q86 44 84 36Z"
            fill={fillFor('triceps')} stroke={strokeFor('triceps')} strokeWidth={strokeWidthFor('triceps')}
            filter={isActive('triceps') ? 'url(#glow-active)' : undefined}>
            {isActive('triceps') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Avant-bras droit */}
          <path d="M86 52 Q90 60 90 70 Q86 72 82 70 Q80 62 78 54Z"
            fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />

          {/* === ABDOS / CORE === */}
          <path d="M36 52 Q50 56 64 52 Q66 68 64 76 Q50 80 36 76 Q34 68 36 52Z"
            fill={fillFor('core')} stroke={strokeFor('core')} strokeWidth={strokeWidthFor('core')}
            filter={isActive('core') ? 'url(#glow-active)' : undefined}>
            {isActive('core') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Ligne centrale abdos */}
          <line x1="50" y1="52" x2="50" y2="76" stroke={isActive('core') ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.08)'} strokeWidth="0.5" />
          {/* Lignes horizontales abdos */}
          {[58, 64, 70].map(y => (
            <line key={y} x1="38" y1={y} x2="62" y2={y}
              stroke={isActive('core') ? 'rgba(255,107,53,0.3)' : 'rgba(255,255,255,0.06)'}
              strokeWidth="0.5" />
          ))}

          {/* === HANCHES === */}
          <path d="M36 76 Q50 80 64 76 Q68 84 66 90 Q50 94 34 90 Q32 84 36 76Z"
            fill={fillFor('glutes')} stroke={strokeFor('glutes')} strokeWidth={strokeWidthFor('glutes')}
            filter={isActive('glutes') ? 'url(#glow-active)' : undefined}>
            {isActive('glutes') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" />
            )}
          </path>

          {/* === QUADRICEPS === */}
          {/* Quad gauche */}
          <path d="M34 90 Q36 92 38 92 Q40 110 38 124 Q34 126 30 124 Q28 108 30 90Z"
            fill={fillFor('quads')} stroke={strokeFor('quads')} strokeWidth={strokeWidthFor('quads')}
            filter={isActive('quads') ? 'url(#glow-active)' : undefined}>
            {isActive('quads') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Quad droit */}
          <path d="M66 90 Q64 92 62 92 Q60 110 62 124 Q66 126 70 124 Q72 108 70 90Z"
            fill={fillFor('quads')} stroke={strokeFor('quads')} strokeWidth={strokeWidthFor('quads')}
            filter={isActive('quads') ? 'url(#glow-active)' : undefined}>
            {isActive('quads') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>

          {/* === ISCHIO-JAMBIERS === */}
          {/* Ischio gauche */}
          <path d="M30 90 Q28 108 30 124 Q34 126 36 124 Q34 108 34 90Z"
            fill={fillFor('hamstrings')} stroke={strokeFor('hamstrings')} strokeWidth={strokeWidthFor('hamstrings')}
            opacity={isActive('hamstrings') ? 1 : 0.3}
            filter={isActive('hamstrings') ? 'url(#glow-active)' : undefined}>
            {isActive('hamstrings') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Ischio droit */}
          <path d="M70 90 Q72 108 70 124 Q66 126 64 124 Q66 108 66 90Z"
            fill={fillFor('hamstrings')} stroke={strokeFor('hamstrings')} strokeWidth={strokeWidthFor('hamstrings')}
            opacity={isActive('hamstrings') ? 1 : 0.3}
            filter={isActive('hamstrings') ? 'url(#glow-active)' : undefined}>
            {isActive('hamstrings') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>

          {/* === GENOUX === */}
          <ellipse cx="34" cy="128" rx="6" ry="5" fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />
          <ellipse cx="66" cy="128" rx="6" ry="5" fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />

          {/* === MOLLETS === */}
          {/* Mollet gauche */}
          <path d="M30 132 Q28 148 30 162 Q34 164 38 162 Q40 148 38 132Z"
            fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth={strokeWidthFor('calves')}
            filter={isActive('calves') ? 'url(#glow-active)' : undefined}>
            {isActive('calves') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>
          {/* Mollet droit */}
          <path d="M70 132 Q72 148 70 162 Q66 164 62 162 Q60 148 62 132Z"
            fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth={strokeWidthFor('calves')}
            filter={isActive('calves') ? 'url(#glow-active)' : undefined}>
            {isActive('calves') && (
              <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
            )}
          </path>

          {/* === CHEVILLES / PIEDS === */}
          <ellipse cx="34" cy="166" rx="5" ry="4" fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />
          <ellipse cx="66" cy="166" rx="5" ry="4" fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />
          <path d="M28 168 Q34 170 40 168 L42 172 Q34 174 26 172Z" fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />
          <path d="M60 168 Q66 170 72 168 L74 172 Q66 174 58 172Z" fill={baseColor} stroke={baseStroke} strokeWidth="0.6" />

          {/* === LIGNES DE SCAN hologramme === */}
          {!isRest && [40, 80, 120, 160].map((y, i) => (
            <line key={i} x1="10" y1={y} x2="90" y2={y}
              stroke="rgba(255,107,53,0.06)" strokeWidth="0.4">
              <animate attributeName="opacity" values="0;0.4;0" dur={`${3 + i * 0.5}s`} repeatCount="indefinite" />
            </line>
          ))}

          {/* Ligne de scan verticale */}
          {!isRest && (
            <line x1="50" y1="0" x2="50" y2="180" stroke="rgba(255,107,53,0.08)" strokeWidth="0.3">
              <animate attributeName="opacity" values="0;0.5;0" dur="4s" repeatCount="indefinite" />
            </line>
          )}
        </svg>
      </div>

      {/* Labels des zones actives */}
      {activeZones.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-3 max-w-[200px]">
          {activeZones.map(zone => (
            <span
              key={zone}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: 'rgba(255,107,53,0.12)',
                border: '1px solid rgba(255,107,53,0.3)',
                color: '#FF6B35',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {ZONE_LABELS[zone] || zone}
            </span>
          ))}
        </div>
      )}

      {isRest && (
        <p className="text-white/30 text-xs mt-3 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          Récupération musculaire
        </p>
      )}
    </div>
  );
}
