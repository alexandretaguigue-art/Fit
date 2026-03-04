// ============================================================
// HOLOGRAMME 3D DU CORPS — Three.js + @react-three/fiber
// Affiche un corps humain anatomique avec les muscles colorés
// selon leur niveau de fatigue/récupération.
//
// Vert (#00FF88) = récupéré
// Orange (#FF8800) = fatigue modérée
// Rouge (#FF2244) = épuisé
// Bleu hologramme (#0044FF) = non sollicité
// ============================================================

import { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import {
  type MuscleGroup,
  type MuscleState,
  fatigueToColor,
  MUSCLE_LABELS,
  fatigueLabel,
} from '../lib/muscleRecovery';

// ============================================================
// TYPES
// ============================================================

interface MuscleZone {
  id: MuscleGroup;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  shape: 'ellipsoid' | 'box' | 'cylinder' | 'torus_segment';
  side?: 'left' | 'right' | 'center';
}

interface BodyHologram3DProps {
  muscleStates: Map<MuscleGroup, MuscleState>;
  onMuscleClick?: (muscle: MuscleGroup) => void;
  height?: number;
}

// ============================================================
// DÉFINITION ANATOMIQUE DES ZONES MUSCULAIRES
// Coordonnées en espace 3D : Y = haut, Z = avant
// Corps centré en (0, 0, 0), hauteur totale ≈ 4 unités
// ============================================================

const MUSCLE_ZONES: MuscleZone[] = [
  // ── TÊTE & COU ──────────────────────────────────────────
  // (pas de muscle, juste pour la silhouette — géré dans le corps de base)

  // ── TRAPÈZES ────────────────────────────────────────────
  { id: 'traps',       position: [-0.35, 1.55, 0.0],  scale: [0.28, 0.18, 0.18], shape: 'ellipsoid', side: 'left' },
  { id: 'traps',       position: [ 0.35, 1.55, 0.0],  scale: [0.28, 0.18, 0.18], shape: 'ellipsoid', side: 'right' },

  // ── PECTORAUX ───────────────────────────────────────────
  { id: 'chest',       position: [-0.28, 1.1, 0.18],  scale: [0.32, 0.22, 0.14], shape: 'ellipsoid', side: 'left' },
  { id: 'chest',       position: [ 0.28, 1.1, 0.18],  scale: [0.32, 0.22, 0.14], shape: 'ellipsoid', side: 'right' },

  // ── DELTOÏDES ANTÉRIEURS ────────────────────────────────
  { id: 'front_delts', position: [-0.62, 1.25, 0.08], scale: [0.16, 0.20, 0.14], shape: 'ellipsoid', side: 'left' },
  { id: 'front_delts', position: [ 0.62, 1.25, 0.08], scale: [0.16, 0.20, 0.14], shape: 'ellipsoid', side: 'right' },

  // ── DELTOÏDES LATÉRAUX ──────────────────────────────────
  { id: 'side_delts',  position: [-0.72, 1.22, 0.0],  scale: [0.14, 0.22, 0.14], shape: 'ellipsoid', side: 'left' },
  { id: 'side_delts',  position: [ 0.72, 1.22, 0.0],  scale: [0.14, 0.22, 0.14], shape: 'ellipsoid', side: 'right' },

  // ── DELTOÏDES POSTÉRIEURS ───────────────────────────────
  { id: 'rear_delts',  position: [-0.65, 1.22, -0.1], scale: [0.15, 0.18, 0.12], shape: 'ellipsoid', side: 'left' },
  { id: 'rear_delts',  position: [ 0.65, 1.22, -0.1], scale: [0.15, 0.18, 0.12], shape: 'ellipsoid', side: 'right' },

  // ── BICEPS ──────────────────────────────────────────────
  { id: 'biceps',      position: [-0.75, 0.85, 0.08], scale: [0.12, 0.28, 0.12], shape: 'ellipsoid', side: 'left' },
  { id: 'biceps',      position: [ 0.75, 0.85, 0.08], scale: [0.12, 0.28, 0.12], shape: 'ellipsoid', side: 'right' },

  // ── TRICEPS ─────────────────────────────────────────────
  { id: 'triceps',     position: [-0.75, 0.85, -0.1], scale: [0.12, 0.28, 0.10], shape: 'ellipsoid', side: 'left' },
  { id: 'triceps',     position: [ 0.75, 0.85, -0.1], scale: [0.12, 0.28, 0.10], shape: 'ellipsoid', side: 'right' },

  // ── AVANT-BRAS ──────────────────────────────────────────
  { id: 'forearms',    position: [-0.78, 0.48, 0.04], scale: [0.10, 0.24, 0.10], shape: 'ellipsoid', side: 'left' },
  { id: 'forearms',    position: [ 0.78, 0.48, 0.04], scale: [0.10, 0.24, 0.10], shape: 'ellipsoid', side: 'right' },

  // ── GRAND DORSAL ────────────────────────────────────────
  { id: 'lats',        position: [-0.45, 0.95, -0.12], scale: [0.22, 0.38, 0.12], shape: 'ellipsoid', side: 'left' },
  { id: 'lats',        position: [ 0.45, 0.95, -0.12], scale: [0.22, 0.38, 0.12], shape: 'ellipsoid', side: 'right' },

  // ── BAS DU DOS ──────────────────────────────────────────
  { id: 'lower_back',  position: [ 0.0,  0.62, -0.16], scale: [0.32, 0.22, 0.10], shape: 'ellipsoid', side: 'center' },

  // ── ABDOMINAUX ──────────────────────────────────────────
  { id: 'abs',         position: [ 0.0,  0.82, 0.18],  scale: [0.24, 0.32, 0.10], shape: 'ellipsoid', side: 'center' },

  // ── OBLIQUES ────────────────────────────────────────────
  { id: 'obliques',    position: [-0.30, 0.78, 0.14],  scale: [0.14, 0.28, 0.10], shape: 'ellipsoid', side: 'left' },
  { id: 'obliques',    position: [ 0.30, 0.78, 0.14],  scale: [0.14, 0.28, 0.10], shape: 'ellipsoid', side: 'right' },

  // ── FESSIERS ────────────────────────────────────────────
  { id: 'glutes',      position: [-0.22, 0.28, -0.22], scale: [0.24, 0.28, 0.20], shape: 'ellipsoid', side: 'left' },
  { id: 'glutes',      position: [ 0.22, 0.28, -0.22], scale: [0.24, 0.28, 0.20], shape: 'ellipsoid', side: 'right' },

  // ── QUADRICEPS ──────────────────────────────────────────
  { id: 'quads',       position: [-0.22, -0.15, 0.14], scale: [0.20, 0.42, 0.16], shape: 'ellipsoid', side: 'left' },
  { id: 'quads',       position: [ 0.22, -0.15, 0.14], scale: [0.20, 0.42, 0.16], shape: 'ellipsoid', side: 'right' },

  // ── ISCHIO-JAMBIERS ─────────────────────────────────────
  { id: 'hamstrings',  position: [-0.22, -0.15, -0.14], scale: [0.18, 0.40, 0.14], shape: 'ellipsoid', side: 'left' },
  { id: 'hamstrings',  position: [ 0.22, -0.15, -0.14], scale: [0.18, 0.40, 0.14], shape: 'ellipsoid', side: 'right' },

  // ── ADDUCTEURS ──────────────────────────────────────────
  { id: 'adductors',   position: [-0.12, -0.12, 0.08], scale: [0.10, 0.38, 0.10], shape: 'ellipsoid', side: 'left' },
  { id: 'adductors',   position: [ 0.12, -0.12, 0.08], scale: [0.10, 0.38, 0.10], shape: 'ellipsoid', side: 'right' },

  // ── FLÉCHISSEURS DE HANCHE ──────────────────────────────
  { id: 'hip_flexors', position: [-0.18, 0.18, 0.12],  scale: [0.12, 0.20, 0.10], shape: 'ellipsoid', side: 'left' },
  { id: 'hip_flexors', position: [ 0.18, 0.18, 0.12],  scale: [0.12, 0.20, 0.10], shape: 'ellipsoid', side: 'right' },

  // ── MOLLETS ─────────────────────────────────────────────
  { id: 'calves',      position: [-0.20, -0.82, -0.06], scale: [0.12, 0.28, 0.12], shape: 'ellipsoid', side: 'left' },
  { id: 'calves',      position: [ 0.20, -0.82, -0.06], scale: [0.12, 0.28, 0.12], shape: 'ellipsoid', side: 'right' },
];

// ============================================================
// COMPOSANT MUSCLE MESH
// ============================================================

interface MuscleMeshProps {
  zone: MuscleZone;
  fatigue: number;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
  pulseOffset: number;
}

function MuscleMesh({ zone, fatigue, isHovered, onClick, onHover, pulseOffset }: MuscleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [rgb] = useMemo(() => [fatigueToColor(fatigue)], [fatigue]);

  // Couleur de base selon fatigue
  const baseColor = new THREE.Color(rgb[0], rgb[1], rgb[2]);
  // Si non sollicité (fatigue ≈ 0), couleur hologramme bleu cyan
  const isUnsolicited = fatigue < 0.05;
  const color = isUnsolicited
    ? new THREE.Color(0.0, 0.55, 1.0)
    : baseColor;

  // Animation de pulsation pour les muscles fatigués
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (fatigue > 0.1) {
      const pulse = 0.7 + 0.3 * Math.sin(clock.elapsedTime * 2 + pulseOffset);
      mat.emissiveIntensity = isHovered ? 1.2 : pulse * fatigue * 0.8;
    } else {
      mat.emissiveIntensity = isHovered ? 0.8 : 0.15;
    }
    // Légère animation de scale au hover
    const targetScale = isHovered ? 1.12 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(
        zone.scale[0] * targetScale,
        zone.scale[1] * targetScale,
        zone.scale[2] * targetScale
      ),
      0.1
    );
  });

  return (
    <mesh
      ref={meshRef}
      position={zone.position}
      scale={zone.scale}
      rotation={zone.rotation ? zone.rotation.map(r => r * Math.PI / 180) as [number, number, number] : [0, 0, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={() => onHover(false)}
    >
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isUnsolicited ? 0.6 : 0.5}
        transparent
        opacity={isUnsolicited ? 0.55 : 0.85}
        roughness={0.2}
        metalness={0.3}
        wireframe={false}
      />
    </mesh>
  );
}

// ============================================================
// SILHOUETTE DU CORPS (géométrie de base)
// ============================================================

function BodySilhouette() {
  return (
    <group>
      {/* Tête */}
      <mesh position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color="#0044aa" transparent opacity={0.15} wireframe />
      </mesh>
      {/* Cou */}
      <mesh position={[0, 1.72, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.18, 12]} />
        <meshStandardMaterial color="#0044aa" transparent opacity={0.12} wireframe />
      </mesh>
      {/* Torse */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.82, 0.80, 0.36]} />
        <meshStandardMaterial color="#0055cc" transparent opacity={0.12} wireframe />
      </mesh>
      {/* Bassin */}
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.68, 0.38, 0.32]} />
        <meshStandardMaterial color="#0033aa" transparent opacity={0.08} wireframe />
      </mesh>
      {/* Bras gauche */}
      <mesh position={[-0.75, 0.85, 0]} rotation={[0, 0, 0.12]}>
        <cylinderGeometry args={[0.09, 0.07, 0.72, 10]} />
        <meshStandardMaterial color="#0044aa" transparent opacity={0.10} wireframe />
      </mesh>
      {/* Bras droit */}
      <mesh position={[0.75, 0.85, 0]} rotation={[0, 0, -0.12]}>
        <cylinderGeometry args={[0.09, 0.07, 0.72, 10]} />
        <meshStandardMaterial color="#0044aa" transparent opacity={0.10} wireframe />
      </mesh>
      {/* Avant-bras gauche */}
      <mesh position={[-0.78, 0.48, 0]} rotation={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.07, 0.055, 0.52, 10]} />
        <meshStandardMaterial color="#0044aa" transparent opacity={0.10} wireframe />
      </mesh>
      {/* Avant-bras droit */}
      <mesh position={[0.78, 0.48, 0]} rotation={[0, 0, -0.08]}>
        <cylinderGeometry args={[0.07, 0.055, 0.52, 10]} />
        <meshStandardMaterial color="#0044aa" transparent opacity={0.10} wireframe />
      </mesh>
      {/* Cuisse gauche */}
      <mesh position={[-0.22, -0.15, 0]}>
        <cylinderGeometry args={[0.17, 0.14, 0.72, 12]} />
        <meshStandardMaterial color="#0033aa" transparent opacity={0.08} wireframe />
      </mesh>
      {/* Cuisse droite */}
      <mesh position={[0.22, -0.15, 0]}>
        <cylinderGeometry args={[0.17, 0.14, 0.72, 12]} />
        <meshStandardMaterial color="#0033aa" transparent opacity={0.08} wireframe />
      </mesh>
      {/* Jambe gauche */}
      <mesh position={[-0.20, -0.82, 0]}>
        <cylinderGeometry args={[0.10, 0.08, 0.60, 10]} />
        <meshStandardMaterial color="#0033aa" transparent opacity={0.08} wireframe />
      </mesh>
      {/* Jambe droite */}
      <mesh position={[0.20, -0.82, 0]}>
        <cylinderGeometry args={[0.10, 0.08, 0.60, 10]} />
        <meshStandardMaterial color="#0033aa" transparent opacity={0.08} wireframe />
      </mesh>
      {/* Pied gauche */}
      <mesh position={[-0.20, -1.17, 0.06]}>
        <boxGeometry args={[0.14, 0.08, 0.28]} />
        <meshStandardMaterial color="#0044aa" transparent opacity={0.10} wireframe />
      </mesh>
      {/* Pied droit */}
      <mesh position={[0.20, -1.17, 0.06]}>
        <boxGeometry args={[0.14, 0.08, 0.28]} />
        <meshStandardMaterial color="#0044aa" transparent opacity={0.10} wireframe />
      </mesh>
    </group>
  );
}

// ============================================================
// PARTICULES HOLOGRAMME (effet ambiance)
// ============================================================

function HologramParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 120;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 2.4;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 3.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.elapsedTime * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#0088ff" size={0.018} transparent opacity={0.4} />
    </points>
  );
}

// ============================================================
// SCÈNE PRINCIPALE
// ============================================================

interface SceneProps {
  muscleStates: Map<MuscleGroup, MuscleState>;
  onMuscleClick: (muscle: MuscleGroup) => void;
}

function Scene({ muscleStates, onMuscleClick }: SceneProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Rotation automatique lente
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.3;
  });

  // Dédupliquer les zones par muscle (gauche + droite = même état)
  const uniqueZones = MUSCLE_ZONES;

  return (
    <>
      {/* Éclairage hologramme */}
      <ambientLight intensity={0.6} color="#0033aa" />
      <pointLight position={[2, 3, 2]} intensity={2.5} color="#00aaff" />
      <pointLight position={[-2, 1, -1]} intensity={1.5} color="#0066ff" />
      <pointLight position={[0, -2, 2]} intensity={1.0} color="#0044cc" />
      <pointLight position={[0, 2, -2]} intensity={1.0} color="#00ccff" />

      <HologramParticles />

      <group ref={groupRef}>
        <BodySilhouette />

        {uniqueZones.map((zone, idx) => {
          const state = muscleStates.get(zone.id);
          const fatigue = state?.fatigue ?? 0;
          const zoneKey = `${zone.id}-${zone.side ?? 'center'}-${idx}`;

          return (
            <MuscleMesh
              key={zoneKey}
              zone={zone}
              fatigue={fatigue}
              isHovered={hoveredMuscle === zoneKey}
              onClick={() => onMuscleClick(zone.id)}
              onHover={(h) => setHoveredMuscle(h ? zoneKey : null)}
              pulseOffset={idx * 0.4}
            />
          );
        })}
      </group>
    </>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL EXPORTÉ
// ============================================================

export default function BodyHologram3D({ muscleStates, onMuscleClick, height = 360 }: BodyHologram3DProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const handleMuscleClick = (muscle: MuscleGroup) => {
    setSelectedMuscle(prev => prev === muscle ? null : muscle);
    onMuscleClick?.(muscle);
  };

  const selectedState = selectedMuscle ? muscleStates.get(selectedMuscle) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      {/* Canvas Three.js */}
      <Canvas
        camera={{ position: [0, 0.3, 3.2], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene muscleStates={muscleStates} onMuscleClick={handleMuscleClick} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
          rotateSpeed={0.5}
          autoRotate={false}
        />
      </Canvas>

      {/* Légende couleurs */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        {[
          { color: '#00FF88', label: 'Récupéré' },
          { color: '#FF8800', label: 'Fatigue mod.' },
          { color: '#FF2244', label: 'Épuisé' },
          { color: '#0044FF', label: 'Non sollicité' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontFamily: 'Inter, sans-serif' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Tooltip muscle sélectionné */}
      {selectedMuscle && selectedState && (
        <div style={{
          position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid rgba(255,107,53,0.4)',
          borderRadius: 12,
          padding: '8px 14px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          minWidth: 160,
        }}>
          <p style={{ color: 'white', fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', margin: 0 }}>
            {MUSCLE_LABELS[selectedMuscle]}
          </p>
          <p style={{
            fontSize: 11, margin: '2px 0 0',
            fontFamily: 'Inter, sans-serif',
            color: selectedState.fatigue > 0.6 ? '#FF2244' :
                   selectedState.fatigue > 0.3 ? '#FF8800' :
                   selectedState.fatigue > 0.05 ? '#FFD700' : '#00FF88',
          }}>
            {fatigueLabel(selectedState.fatigue)}
          </p>
          {selectedState.hoursUntilRecovered > 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, margin: '2px 0 0', fontFamily: 'Inter, sans-serif' }}>
              Récupération dans ~{Math.round(selectedState.hoursUntilRecovered)}h
            </p>
          )}
          <button
            onClick={() => setSelectedMuscle(null)}
            style={{ position: 'absolute', top: 4, right: 8, color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}
          >×</button>
        </div>
      )}

      {/* Hint interaction */}
      <p style={{
        position: 'absolute', bottom: 8, right: 8,
        color: 'rgba(255,255,255,0.2)', fontSize: 9,
        fontFamily: 'Inter, sans-serif', margin: 0,
      }}>
        Toucher un muscle pour les détails
      </p>
    </div>
  );
}
