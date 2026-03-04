import { useState, useEffect, useRef } from 'react';

export type MuscleState = 'fresh' | 'recovered' | 'light' | 'moderate' | 'fatigued' | 'exhausted';

export interface MuscleStatus {
  id: string;
  name: string;
  state: MuscleState;
  fatigue: number; // 0 = fresh, 1 = exhausted
  recoveryHoursLeft: number;
}

interface BodyAnatomySVGProps {
  muscleStatuses: MuscleStatus[];
  onMuscleClick?: (muscle: MuscleStatus) => void;
  className?: string;
}

// Couleur selon fatigue : bleu cyan → vert → orange → rouge
function fatigueToColor(fatigue: number): string {
  if (fatigue < 0.05) return '#00bfff'; // bleu cyan = non sollicité
  if (fatigue < 0.25) return '#22c55e'; // vert = bien récupéré
  if (fatigue < 0.5)  return '#84cc16'; // vert-jaune = légère fatigue
  if (fatigue < 0.7)  return '#f97316'; // orange = fatigue modérée
  if (fatigue < 0.85) return '#ef4444'; // rouge = fatigué
  return '#dc2626';                      // rouge foncé = épuisé
}

function fatigueToOpacity(fatigue: number): number {
  if (fatigue < 0.05) return 0.35;
  return 0.55 + fatigue * 0.35;
}

function fatigueToGlow(fatigue: number): string {
  if (fatigue < 0.05) return 'none';
  const color = fatigueToColor(fatigue);
  const intensity = Math.round(fatigue * 12 + 4);
  return `drop-shadow(0 0 ${intensity}px ${color})`;
}

// Composant d'un muscle cliquable
function MusclePath({
  id, d, cx, cy, rx, ry, isEllipse, status, onClick, transform
}: {
  id: string;
  d?: string;
  cx?: number; cy?: number; rx?: number; ry?: number;
  isEllipse?: boolean;
  status?: MuscleStatus;
  onClick?: (s: MuscleStatus) => void;
  transform?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const fatigue = status?.fatigue ?? 0;
  const color = fatigueToColor(fatigue);
  const opacity = fatigueToOpacity(fatigue) + (hovered ? 0.2 : 0);
  const filter = hovered ? `drop-shadow(0 0 8px ${color})` : fatigueToGlow(fatigue);

  const handleClick = () => {
    if (status && onClick) onClick(status);
  };

  const sharedProps = {
    fill: color,
    fillOpacity: opacity,
    stroke: color,
    strokeWidth: hovered ? 1.5 : 0.8,
    strokeOpacity: 0.7,
    style: { filter, cursor: 'pointer', transition: 'all 0.3s ease' },
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onClick: handleClick,
    transform,
  };

  if (isEllipse) {
    return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...sharedProps} />;
  }
  return <path d={d} {...sharedProps} />;
}

// ─── VUE AVANT ────────────────────────────────────────────────────────────────
function FrontView({ statuses, onMuscleClick }: { statuses: Map<string, MuscleStatus>; onMuscleClick?: (m: MuscleStatus) => void }) {
  const get = (id: string) => statuses.get(id);

  return (
    <svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="bodyGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#001a33" stopOpacity="0" />
          <stop offset="100%" stopColor="#000d1a" stopOpacity="0.8" />
        </radialGradient>
      </defs>

      {/* ── Silhouette corps ── */}
      {/* Tête */}
      <ellipse cx="100" cy="28" rx="18" ry="22"
        fill="none" stroke="#1e4a7a" strokeWidth="1.2" strokeOpacity="0.6" />
      {/* Cou */}
      <rect x="92" y="48" width="16" height="14" rx="4"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.5" />
      {/* Torse */}
      <path d="M62 62 L138 62 L145 155 L55 155 Z"
        fill="none" stroke="#1e4a7a" strokeWidth="1.2" strokeOpacity="0.5" />
      {/* Hanches */}
      <path d="M55 155 L145 155 L140 185 L60 185 Z"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      {/* Bras gauche */}
      <path d="M62 65 L38 68 L30 130 L42 132 L50 155"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      {/* Bras droit */}
      <path d="M138 65 L162 68 L170 130 L158 132 L150 155"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      {/* Avant-bras gauche */}
      <path d="M30 130 L24 190 L36 192 L42 132"
        fill="none" stroke="#1e4a7a" strokeWidth="0.8" strokeOpacity="0.3" />
      {/* Avant-bras droit */}
      <path d="M170 130 L176 190 L164 192 L158 132"
        fill="none" stroke="#1e4a7a" strokeWidth="0.8" strokeOpacity="0.3" />
      {/* Jambe gauche */}
      <path d="M60 185 L55 290 L75 292 L80 185"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      {/* Jambe droite */}
      <path d="M140 185 L145 290 L125 292 L120 185"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      {/* Mollet gauche */}
      <path d="M55 290 L52 360 L72 362 L75 292"
        fill="none" stroke="#1e4a7a" strokeWidth="0.8" strokeOpacity="0.3" />
      {/* Mollet droit */}
      <path d="M145 290 L148 360 L128 362 L125 292"
        fill="none" stroke="#1e4a7a" strokeWidth="0.8" strokeOpacity="0.3" />

      {/* ── MUSCLES AVANT ── */}

      {/* Pectoraux gauche */}
      <MusclePath id="pec_left"
        d="M68 68 Q80 65 92 70 L90 100 Q80 108 68 104 Z"
        status={get('chest')} onClick={onMuscleClick} />
      {/* Pectoraux droit */}
      <MusclePath id="pec_right"
        d="M132 68 Q120 65 108 70 L110 100 Q120 108 132 104 Z"
        status={get('chest')} onClick={onMuscleClick} />

      {/* Deltoïdes antérieurs gauche */}
      <MusclePath id="delt_ant_left"
        d="M62 65 L68 68 L65 90 L55 88 L52 72 Z"
        status={get('shoulders')} onClick={onMuscleClick} />
      {/* Deltoïdes antérieurs droit */}
      <MusclePath id="delt_ant_right"
        d="M138 65 L132 68 L135 90 L145 88 L148 72 Z"
        status={get('shoulders')} onClick={onMuscleClick} />

      {/* Biceps gauche */}
      <MusclePath id="bicep_left"
        d="M38 72 L50 70 L52 110 L38 112 Z"
        status={get('biceps')} onClick={onMuscleClick} />
      {/* Biceps droit */}
      <MusclePath id="bicep_right"
        d="M162 72 L150 70 L148 110 L162 112 Z"
        status={get('biceps')} onClick={onMuscleClick} />

      {/* Triceps gauche (visible de face, côté) */}
      <MusclePath id="tri_left"
        d="M30 72 L38 72 L38 112 L30 110 Z"
        status={get('triceps')} onClick={onMuscleClick} />
      {/* Triceps droit */}
      <MusclePath id="tri_right"
        d="M170 72 L162 72 L162 112 L170 110 Z"
        status={get('triceps')} onClick={onMuscleClick} />

      {/* Avant-bras gauche */}
      <MusclePath id="forearm_left"
        d="M30 132 L42 132 L38 185 L26 183 Z"
        status={get('forearms')} onClick={onMuscleClick} />
      {/* Avant-bras droit */}
      <MusclePath id="forearm_right"
        d="M170 132 L158 132 L162 185 L174 183 Z"
        status={get('forearms')} onClick={onMuscleClick} />

      {/* Abdominaux */}
      <MusclePath id="abs_upper"
        d="M88 105 L112 105 L114 130 L86 130 Z"
        status={get('abs')} onClick={onMuscleClick} />
      <MusclePath id="abs_lower"
        d="M86 130 L114 130 L112 155 L88 155 Z"
        status={get('abs')} onClick={onMuscleClick} />

      {/* Obliques gauche */}
      <MusclePath id="oblique_left"
        d="M68 104 L88 105 L86 155 L62 150 Z"
        status={get('abs')} onClick={onMuscleClick} />
      {/* Obliques droit */}
      <MusclePath id="oblique_right"
        d="M132 104 L112 105 L114 155 L138 150 Z"
        status={get('abs')} onClick={onMuscleClick} />

      {/* Quadriceps gauche */}
      <MusclePath id="quad_left"
        d="M60 188 L80 188 L78 285 L58 283 Z"
        status={get('quads')} onClick={onMuscleClick} />
      {/* Quadriceps droit */}
      <MusclePath id="quad_right"
        d="M140 188 L120 188 L122 285 L142 283 Z"
        status={get('quads')} onClick={onMuscleClick} />

      {/* Tibias / Tibialis gauche */}
      <MusclePath id="tibialis_left"
        d="M58 295 L70 295 L68 355 L56 353 Z"
        status={get('calves')} onClick={onMuscleClick} />
      {/* Tibialis droit */}
      <MusclePath id="tibialis_right"
        d="M142 295 L130 295 L132 355 L144 353 Z"
        status={get('calves')} onClick={onMuscleClick} />

      {/* Adducteurs gauche */}
      <MusclePath id="adductor_left"
        d="M80 188 L95 188 L93 270 L78 268 Z"
        status={get('quads')} onClick={onMuscleClick} />
      {/* Adducteurs droit */}
      <MusclePath id="adductor_right"
        d="M120 188 L105 188 L107 270 L122 268 Z"
        status={get('quads')} onClick={onMuscleClick} />

      {/* Trapèze supérieur (visible de face) */}
      <MusclePath id="trap_front"
        d="M82 52 Q100 58 118 52 L132 65 Q100 72 68 65 Z"
        status={get('traps')} onClick={onMuscleClick} />

      {/* Labels discrets */}
      <text x="100" y="415" textAnchor="middle" fontSize="8" fill="#1e4a7a" opacity="0.6">AVANT</text>
    </svg>
  );
}

// ─── VUE ARRIÈRE ──────────────────────────────────────────────────────────────
function BackView({ statuses, onMuscleClick }: { statuses: Map<string, MuscleStatus>; onMuscleClick?: (m: MuscleStatus) => void }) {
  const get = (id: string) => statuses.get(id);

  return (
    <svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
      {/* ── Silhouette corps (miroir) ── */}
      <ellipse cx="100" cy="28" rx="18" ry="22"
        fill="none" stroke="#1e4a7a" strokeWidth="1.2" strokeOpacity="0.6" />
      <rect x="92" y="48" width="16" height="14" rx="4"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.5" />
      <path d="M62 62 L138 62 L145 155 L55 155 Z"
        fill="none" stroke="#1e4a7a" strokeWidth="1.2" strokeOpacity="0.5" />
      <path d="M55 155 L145 155 L140 185 L60 185 Z"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M62 65 L38 68 L30 130 L42 132 L50 155"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M138 65 L162 68 L170 130 L158 132 L150 155"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M30 130 L24 190 L36 192 L42 132"
        fill="none" stroke="#1e4a7a" strokeWidth="0.8" strokeOpacity="0.3" />
      <path d="M170 130 L176 190 L164 192 L158 132"
        fill="none" stroke="#1e4a7a" strokeWidth="0.8" strokeOpacity="0.3" />
      <path d="M60 185 L55 290 L75 292 L80 185"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M140 185 L145 290 L125 292 L120 185"
        fill="none" stroke="#1e4a7a" strokeWidth="1" strokeOpacity="0.4" />
      <path d="M55 290 L52 360 L72 362 L75 292"
        fill="none" stroke="#1e4a7a" strokeWidth="0.8" strokeOpacity="0.3" />
      <path d="M145 290 L148 360 L128 362 L125 292"
        fill="none" stroke="#1e4a7a" strokeWidth="0.8" strokeOpacity="0.3" />

      {/* ── MUSCLES ARRIÈRE ── */}

      {/* Trapèze gauche */}
      <MusclePath id="trap_left"
        d="M82 52 Q100 58 100 62 L80 80 L65 68 Z"
        status={get('traps')} onClick={onMuscleClick} />
      {/* Trapèze droit */}
      <MusclePath id="trap_right"
        d="M118 52 Q100 58 100 62 L120 80 L135 68 Z"
        status={get('traps')} onClick={onMuscleClick} />

      {/* Deltoïdes postérieurs gauche */}
      <MusclePath id="delt_post_left"
        d="M62 65 L68 68 L62 95 L50 90 L50 72 Z"
        status={get('shoulders')} onClick={onMuscleClick} />
      {/* Deltoïdes postérieurs droit */}
      <MusclePath id="delt_post_right"
        d="M138 65 L132 68 L138 95 L150 90 L150 72 Z"
        status={get('shoulders')} onClick={onMuscleClick} />

      {/* Grand dorsal gauche */}
      <MusclePath id="lat_left"
        d="M68 78 Q80 72 92 75 L90 150 Q75 155 62 148 Z"
        status={get('back')} onClick={onMuscleClick} />
      {/* Grand dorsal droit */}
      <MusclePath id="lat_right"
        d="M132 78 Q120 72 108 75 L110 150 Q125 155 138 148 Z"
        status={get('back')} onClick={onMuscleClick} />

      {/* Rhomboïdes / Milieu du dos */}
      <MusclePath id="rhomboids"
        d="M88 75 L112 75 L112 115 L88 115 Z"
        status={get('back')} onClick={onMuscleClick} />

      {/* Érecteurs spinaux */}
      <MusclePath id="erector_left"
        d="M90 115 L100 115 L100 155 L90 155 Z"
        status={get('back')} onClick={onMuscleClick} />
      <MusclePath id="erector_right"
        d="M100 115 L110 115 L110 155 L100 155 Z"
        status={get('back')} onClick={onMuscleClick} />

      {/* Triceps gauche (vue arrière) */}
      <MusclePath id="tri_back_left"
        d="M36 70 L50 70 L50 115 L36 113 Z"
        status={get('triceps')} onClick={onMuscleClick} />
      {/* Triceps droit */}
      <MusclePath id="tri_back_right"
        d="M164 70 L150 70 L150 115 L164 113 Z"
        status={get('triceps')} onClick={onMuscleClick} />

      {/* Avant-bras gauche */}
      <MusclePath id="forearm_back_left"
        d="M30 132 L42 132 L38 185 L26 183 Z"
        status={get('forearms')} onClick={onMuscleClick} />
      {/* Avant-bras droit */}
      <MusclePath id="forearm_back_right"
        d="M170 132 L158 132 L162 185 L174 183 Z"
        status={get('forearms')} onClick={onMuscleClick} />

      {/* Fessiers gauche */}
      <MusclePath id="glute_left"
        d="M60 158 L95 158 L95 188 L60 188 Z"
        status={get('glutes')} onClick={onMuscleClick} />
      {/* Fessiers droit */}
      <MusclePath id="glute_right"
        d="M140 158 L105 158 L105 188 L140 188 Z"
        status={get('glutes')} onClick={onMuscleClick} />

      {/* Ischio-jambiers gauche */}
      <MusclePath id="hamstring_left"
        d="M60 190 L80 190 L78 285 L58 283 Z"
        status={get('hamstrings')} onClick={onMuscleClick} />
      {/* Ischio-jambiers droit */}
      <MusclePath id="hamstring_right"
        d="M140 190 L120 190 L122 285 L142 283 Z"
        status={get('hamstrings')} onClick={onMuscleClick} />

      {/* Mollets gauche */}
      <MusclePath id="calf_left"
        d="M57 295 L73 295 L70 355 L55 353 Z"
        status={get('calves')} onClick={onMuscleClick} />
      {/* Mollets droit */}
      <MusclePath id="calf_right"
        d="M143 295 L127 295 L130 355 L145 353 Z"
        status={get('calves')} onClick={onMuscleClick} />

      {/* Label */}
      <text x="100" y="415" textAnchor="middle" fontSize="8" fill="#1e4a7a" opacity="0.6">ARRIÈRE</text>
    </svg>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function BodyAnatomySVG({ muscleStatuses, onMuscleClick, className }: BodyAnatomySVGProps) {
  const [showBack, setShowBack] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleStatus | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Construire la map id → status
  const statusMap = new Map<string, MuscleStatus>();
  for (const ms of muscleStatuses) {
    statusMap.set(ms.id, ms);
  }

  const handleFlip = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => {
      setShowBack(b => !b);
      setIsFlipping(false);
    }, 200);
  };

  const handleMuscleClick = (muscle: MuscleStatus) => {
    setSelectedMuscle(muscle);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(() => setSelectedMuscle(null), 3000);
    if (onMuscleClick) onMuscleClick(muscle);
  };

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  const stateLabel: Record<MuscleState, string> = {
    fresh: 'Non sollicité',
    recovered: 'Récupéré',
    light: 'Légère fatigue',
    moderate: 'Fatigue modérée',
    fatigued: 'Fatigué',
    exhausted: 'Épuisé',
  };

  const stateColor: Record<MuscleState, string> = {
    fresh: '#00bfff',
    recovered: '#22c55e',
    light: '#84cc16',
    moderate: '#f97316',
    fatigued: '#ef4444',
    exhausted: '#dc2626',
  };

  return (
    <div className={`relative flex flex-col items-center ${className ?? ''}`}>
      {/* Conteneur hologramme */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 200,
          aspectRatio: '200/420',
          background: 'radial-gradient(ellipse at center, rgba(0,40,80,0.4) 0%, rgba(0,10,20,0.95) 100%)',
          borderRadius: 16,
          border: '1px solid rgba(0,150,255,0.2)',
          boxShadow: '0 0 30px rgba(0,100,255,0.15), inset 0 0 30px rgba(0,50,150,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Lignes de scan hologramme */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,150,255,0.03) 3px, rgba(0,150,255,0.03) 4px)',
        }} />

        {/* SVG anatomique avec animation de flip */}
        <div style={{
          transform: isFlipping ? 'rotateY(90deg)' : 'rotateY(0deg)',
          transition: 'transform 0.2s ease-in-out',
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
        }}>
          {showBack
            ? <BackView statuses={statusMap} onMuscleClick={handleMuscleClick} />
            : <FrontView statuses={statusMap} onMuscleClick={handleMuscleClick} />
          }
        </div>

        {/* Bouton flip */}
        <button
          onClick={handleFlip}
          style={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 10,
            background: 'rgba(0,100,200,0.3)',
            border: '1px solid rgba(0,150,255,0.4)',
            borderRadius: 8,
            padding: '4px 8px',
            color: '#60a5fa',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(4px)',
          }}
        >
          {showBack ? '← Avant' : 'Arrière →'}
        </button>
      </div>

      {/* Tooltip muscle sélectionné */}
      {selectedMuscle && (
        <div style={{
          marginTop: 8,
          padding: '8px 12px',
          background: 'rgba(0,20,40,0.95)',
          border: `1px solid ${stateColor[selectedMuscle.state]}40`,
          borderRadius: 10,
          textAlign: 'center',
          width: '100%',
          maxWidth: 200,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: stateColor[selectedMuscle.state] }}>
            {selectedMuscle.name}
          </div>
          <div style={{ fontSize: 11, color: stateColor[selectedMuscle.state], opacity: 0.8 }}>
            {stateLabel[selectedMuscle.state]}
          </div>
          {selectedMuscle.recoveryHoursLeft > 0 && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              Récupération dans {selectedMuscle.recoveryHoursLeft}h
            </div>
          )}
        </div>
      )}

      {/* Légende */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, justifyContent: 'center',
        maxWidth: 200,
      }}>
        {[
          { color: '#00bfff', label: 'Frais' },
          { color: '#22c55e', label: 'Récupéré' },
          { color: '#f97316', label: 'Fatigué' },
          { color: '#ef4444', label: 'Épuisé' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
