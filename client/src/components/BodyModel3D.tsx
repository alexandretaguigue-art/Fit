/**
 * BodyModel3D — Visualisation 3D anatomique réelle (Z-Anatomy, CC BY-SA 4.0)
 * 
 * Palette de couleurs :
 *   Frais      → bleu #4a9eff
 *   Récupéré   → vert #22c55e
 *   Léger      → vert-jaune #84cc16
 *   Modéré     → orange #f97316
 *   Fatigué    → rouge #ef4444
 *   Épuisé     → rouge foncé #dc2626
 */

import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

export type MuscleState = 'fresh' | 'recovered' | 'light' | 'moderate' | 'fatigued' | 'exhausted';

export interface MuscleStatus {
  id: string;
  name: string;
  state: MuscleState;
  fatigue: number;
  recoveryHoursLeft: number;
}

// ─── Mapping MuscleGroup → noms de meshes dans le GLB ────────────────────────
const MUSCLE_MESH_MAP: Record<string, string[]> = {
  chest: [
    'Clavicular head of pectoralis major muscle',
    'Sternocostal head of pectoralis major muscle',
    '(Abdominal part of pectoralis major muscle)',
    'Clavicular head of pectoralis major muscle.001',
    'Sternocostal head of pectoralis major muscle.001',
    '(Abdominal part of pectoralis major muscle).001',
    'Pectoralis minor muscle',
    'Pectoralis minor muscle.001',
  ],
  shoulders: [
    'Acromial part of deltoid muscle',
    'Clavicular part of deltoid muscle',
    'Scapular spinal part of deltoid muscle',
    'Acromial part of deltoid muscle.001',
    'Clavicular part of deltoid muscle.001',
    'Scapular spinal part of deltoid muscle.001',
  ],
  triceps: [
    'Medial head of triceps brachii',
    'Lateral head of triceps brachii',
    'Long head of triceps brachii',
    'Medial head of triceps brachii.001',
    'Lateral head of triceps brachii.001',
    'Long head of triceps brachii.001',
  ],
  biceps: [
    'Long head of biceps brachii',
    'Short head of biceps brachii',
    'Long head of biceps brachii.001',
    'Short head of biceps brachii.001',
    'Brachialis muscle',
    'Brachialis muscle.001',
  ],
  forearms: [
    'Superficial head of pronator teres',
    'Deep head of pronator teres',
    'Superficial head of pronator teres.001',
    'Deep head of pronator teres.001',
    'Humeral head of flexor carpi ulnaris',
    'Ulnar head of flexor carpi ulnaris',
    'Humeral head of flexor carpi ulnaris.001',
    'Ulnar head of flexor carpi ulnaris.001',
    'Brachioradialis muscle',
    'Brachioradialis muscle.001',
  ],
  traps: [
    'Ascending part of trapezius muscle',
    'Descending part of trapezius muscle',
    'Transverse part of trapezius muscle',
    'Ascending part of trapezius muscle.001',
    'Descending part of trapezius muscle.001',
    'Transverse part of trapezius muscle.001',
  ],
  back: [
    'Latissimus dorsi muscle',
    'Latissimus dorsi muscle.001',
    'Rhomboid major muscle',
    'Rhomboid minor muscle',
    'Rhomboid major muscle.001',
    'Rhomboid minor muscle.001',
    'Iliocostalis lumborum muscle',
    'Longissimus thoracis muscle',
    'Spinalis thoracis muscle',
    'Iliocostalis lumborum muscle.001',
    'Longissimus thoracis muscle.001',
    'Spinalis thoracis muscle.001',
  ],
  abs: [
    'Rectus abdominis muscle',
    'Rectus abdominis muscle.001',
    'External abdominal oblique muscle',
    'External abdominal oblique muscle.001',
    'Internal abdominal oblique muscle',
    'Internal abdominal oblique muscle.001',
  ],
  glutes: [
    'Gluteus maximus muscle',
    'Gluteus medius muscle',
    'Gluteus minimus muscle',
    'Gluteus maximus muscle.001',
    'Gluteus medius muscle.001',
    'Gluteus minimus muscle.001',
  ],
  quads: [
    'Rectus femoris muscle',
    'Vastus lateralis muscle',
    'Vastus medialis muscle',
    'Vastus intermedius muscle',
    'Rectus femoris muscle.001',
    'Vastus lateralis muscle.001',
    'Vastus medialis muscle.001',
    'Vastus intermedius muscle.001',
  ],
  hamstrings: [
    'Long head of biceps femoris',
    'Short head of biceps femoris',
    'Semitendinosus muscle',
    'Semimembranosus muscle',
    'Long head of biceps femoris.001',
    'Short head of biceps femoris.001',
    'Semitendinosus muscle.001',
    'Semimembranosus muscle.001',
  ],
  calves: [
    'Lateral head of gastrocnemius',
    'Medial head of gastrocnemius',
    'Soleus muscle',
    'Lateral head of gastrocnemius.001',
    'Medial head of gastrocnemius.001',
    'Soleus muscle.001',
  ],
};

// Normalise un nom de mesh : espaces → underscores, supprime les suffixes numériques (.001, .007, etc.)
// Exemples :
//   'Clavicular head of pectoralis major muscle' → 'clavicular_head_of_pectoralis_major_muscle'
//   'Clavicular_head_of_pectoralis_major_muscle001' → 'clavicular_head_of_pectoralis_major_muscle'
//   '(Abdominal_part_of_pectoralis_major_muscle)003' → '(abdominal_part_of_pectoralis_major_muscle)'
function normalizeMeshName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')       // espaces → underscores
    .replace(/\.?\d+$/, '');    // supprime le suffixe numérique final (.001, 003, etc.)
}

// Map inverse meshName normalisé → groupId
const MESH_TO_GROUP: Record<string, string> = {};
for (const [group, meshes] of Object.entries(MUSCLE_MESH_MAP)) {
  for (const mesh of meshes) {
    MESH_TO_GROUP[normalizeMeshName(mesh)] = group;
  }
}

// Mots-clés pour identifier les os (à rendre transparents)
const BONE_KEYWORDS = [
  'bone', 'cartilage', 'tooth', 'incisor', 'molar', 'premolar', 'canine',
  'skull', 'vertebr', 'rib', 'sternum', 'clavicle', 'scapula', 'pelvis',
  'femur', 'tibia', 'fibula', 'humerus', 'radius', 'ulna', 'patella',
  'calcaneus', 'mat_bone',
];

function isBoneMesh(name: string): boolean {
  const n = name.toLowerCase();
  return BONE_KEYWORDS.some(k => n.includes(k));
}

// ─── Couleur selon fatigue ────────────────────────────────────────────────────
function fatigueToColor(fatigue: number): THREE.Color {
  if (fatigue < 0.05) return new THREE.Color('#4a9eff'); // bleu = frais
  if (fatigue < 0.2)  return new THREE.Color('#22c55e'); // vert = récupéré
  if (fatigue < 0.4)  return new THREE.Color('#84cc16'); // vert-jaune = léger
  if (fatigue < 0.65) return new THREE.Color('#f97316'); // orange = modéré
  if (fatigue < 0.85) return new THREE.Color('#ef4444'); // rouge = fatigué
  return new THREE.Color('#dc2626');                      // rouge foncé = épuisé
}

// ─── Composant modèle anatomique (interne au Canvas) ─────────────────────────
const MODEL_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/body_e4b553e2.glb';

// Précharger le modèle
useGLTF.preload(MODEL_URL);

function AnatomyModel({
  muscleStatuses,
  onMuscleClick,
  autoRotate,
}: {
  muscleStatuses: MuscleStatus[];
  onMuscleClick?: (m: MuscleStatus) => void;
  autoRotate: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  // Charger le modèle via useGLTF (cache automatique)
  const { scene: originalScene } = useGLTF(MODEL_URL);

  // Cloner la scène avec matériaux individuels par mesh
  const scene = useMemo(() => {
    // Clonage profond de la scène
    const cloned = originalScene.clone(true);

    // Centrer et mettre à l'échelle
    const box = new THREE.Box3().setFromObject(cloned);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3.5 / maxDim;
    cloned.scale.setScalar(scale);
    cloned.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    // Le modèle Z-Anatomy : pas de rotation initiale, la face est vers la caméra par défaut
    // cloned.rotation.y = 0; // pas de rotation

    // Assigner des matériaux NEUFS et INDIVIDUELS à chaque mesh
    // (clone(true) ne clone pas les matériaux, ils restent partagés)
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.castShadow = true;

      const matName = (child.material as any)?.name ?? '';
      if (isBoneMesh(child.name) || matName.toLowerCase().includes('bone')) {
        // Os → transparent
        child.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#c8b89a'),
          roughness: 0.8,
          metalness: 0.0,
          transparent: true,
          opacity: 0.05,
        });
      } else {
        // Muscle → matériau individuel neuf
        // Couleur initiale : bleu si mappé, gris très foncé sinon (pour ne pas distraire)
        const isMapped = !!MESH_TO_GROUP[normalizeMeshName(child.name)];
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(isMapped ? '#4a9eff' : '#1a1a1a'),
          emissive: new THREE.Color(isMapped ? '#0a2040' : '#080808'),
          emissiveIntensity: isMapped ? 0.4 : 0.05,
          roughness: isMapped ? 0.55 : 0.8,
          metalness: 0.0,
        });
        child.material = mat;
      }
    });

    return cloned;
  }, [originalScene]);

  // Map groupId → MuscleStatus
  const groupToStatus = useMemo(() => {
    const map = new Map<string, MuscleStatus>();
    for (const s of muscleStatuses) map.set(s.id, s);
    return map;
  }, [muscleStatuses]);

  // Mettre à jour les couleurs quand muscleStatuses ou hovered change
  useEffect(() => {
    let totalMeshes = 0, mappedMeshes = 0, coloredMeshes = 0;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) totalMeshes++;
      if (!(child instanceof THREE.Mesh)) return;
      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat?.isMeshStandardMaterial) return;
      if (mat.transparent && mat.opacity < 0.1) return; // os, on touche pas

      const groupId = MESH_TO_GROUP[normalizeMeshName(child.name)];
      const status = groupId ? groupToStatus.get(groupId) : undefined;
      const isHov = hoveredGroup === groupId && !!groupId;

      if (status) {
        const col = fatigueToColor(status.fatigue);
        mat.color.copy(isHov ? col.clone().multiplyScalar(1.6) : col);
        mat.emissive.copy(isHov ? col.clone().multiplyScalar(0.5) : col.clone().multiplyScalar(0.12));
        mat.emissiveIntensity = isHov ? 1.2 : 0.7;
        mat.roughness = 0.5;
        mat.metalness = 0.0;
        mat.needsUpdate = true;
        child.userData.muscleStatus = status;
      } else if (groupId) {
        // Muscle mappé mais sans statut → bleu frais (aucune fatigue)
        mappedMeshes++; coloredMeshes++;
        mat.color.set('#4a9eff');
        mat.emissive.set('#0a2040');
        mat.emissiveIntensity = 0.4;
        mat.roughness = 0.5;
        mat.metalness = 0.0;
        mat.needsUpdate = true;
        child.userData.muscleStatus = undefined;
      } else {
        // Muscle non mappé (os, ligaments, etc.) → gris neutre discret
        mat.color.set('#3a2020');
        mat.emissive.set('#1a0a0a');
        mat.emissiveIntensity = 0.08;
        mat.roughness = 0.7;
        mat.metalness = 0.0;
        mat.needsUpdate = true;
        child.userData.muscleStatus = undefined;
      }
    });

  }, [scene, groupToStatus, hoveredGroup]);

  // Rotation automatique
  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const status = e.object?.userData?.muscleStatus as MuscleStatus | undefined;
    if (status && onMuscleClick) onMuscleClick(status);
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const groupId = MESH_TO_GROUP[normalizeMeshName(e.object?.name ?? '')];
    if (groupId) {
      setHoveredGroup(groupId);
      document.body.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHoveredGroup(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group ref={groupRef} rotation={[0, Math.PI, 0]}>
      <primitive
        object={scene}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />
    </group>
  );
}

// ─── Loader skeleton ─────────────────────────────────────────────────────────
function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.5;
  });
  return (
    <group>
      <mesh ref={meshRef} position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.3, 1.8, 8, 16]} />
        <meshStandardMaterial color="#1e3a5f" wireframe opacity={0.5} transparent />
      </mesh>
    </group>
  );
}

// ─── Labels et couleurs d'état ────────────────────────────────────────────────
const STATE_LABELS: Record<MuscleState, string> = {
  fresh: 'Non sollicité',
  recovered: 'Récupéré ✓',
  light: 'Légère fatigue',
  moderate: 'Fatigue modérée',
  fatigued: 'Fatigué',
  exhausted: 'Épuisé',
};

const STATE_COLORS: Record<MuscleState, string> = {
  fresh: '#4a9eff',
  recovered: '#22c55e',
  light: '#84cc16',
  moderate: '#f97316',
  fatigued: '#ef4444',
  exhausted: '#dc2626',
};

// ─── Composant principal ──────────────────────────────────────────────────────
interface BodyModel3DProps {
  muscleStatuses: MuscleStatus[];
  onMuscleClick?: (muscle: MuscleStatus) => void;
  height?: number;
}

export default function BodyModel3D({ muscleStatuses, onMuscleClick, height = 400 }: BodyModel3DProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleStatus | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMuscleClick = (muscle: MuscleStatus) => {
    setSelectedMuscle(muscle);
    setAutoRotate(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSelectedMuscle(null);
      setAutoRotate(true);
    }, 5000);
    if (onMuscleClick) onMuscleClick(muscle);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Canvas 3D */}
      <div
        style={{
          width: '100%',
          height,
          borderRadius: 16,
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 20%, #0a1628 0%, #030810 100%)',
          border: '1px solid rgba(74,158,255,0.12)',
          boxShadow: 'inset 0 0 60px rgba(0,30,80,0.4)',
        }}
      >
        <Canvas
          camera={{ position: [0, 0.3, 5.5], fov: 42 }}
          gl={{
            antialias: true,
            alpha: false,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.3,
            powerPreference: 'high-performance',
          }}
        >
          {/* Éclairage équilibré */}
          <ambientLight intensity={1.4} color="#ffffff" />
          <directionalLight position={[3, 6, 5]} intensity={2.8} color="#ffffff" />
          <directionalLight position={[-3, 4, 3]} intensity={1.4} color="#c0d8ff" />
          <directionalLight position={[0, -2, 4]} intensity={0.9} color="#ffd0b0" />
          <pointLight position={[0, 4, 2]} intensity={1.2} color="#ffffff" />
          <pointLight position={[3, 1, 3]} intensity={0.6} color="#80b0ff" />
          <pointLight position={[-3, 1, 3]} intensity={0.6} color="#ffb080" />

          {/* Modèle anatomique */}
          <Suspense fallback={<LoadingFallback />}>
            <AnatomyModel
              muscleStatuses={muscleStatuses}
              onMuscleClick={handleMuscleClick}
              autoRotate={autoRotate}
            />
          </Suspense>

          {/* Contrôles orbitaux */}
          <OrbitControls
            enablePan={false}
            minDistance={2.5}
            maxDistance={8}
            minPolarAngle={Math.PI * 0.1}
            maxPolarAngle={Math.PI * 0.9}
            onStart={() => setAutoRotate(false)}
            onEnd={() => {
              if (!selectedMuscle) {
                setTimeout(() => setAutoRotate(true), 3000);
              }
            }}
          />
        </Canvas>
      </div>

      {/* Tooltip muscle sélectionné */}
      {selectedMuscle && (
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(5,12,28,0.96)',
            border: `1px solid ${STATE_COLORS[selectedMuscle.state]}60`,
            borderRadius: 12,
            padding: '10px 18px',
            textAlign: 'center',
            backdropFilter: 'blur(12px)',
            minWidth: 190,
            zIndex: 10,
            boxShadow: `0 4px 24px ${STATE_COLORS[selectedMuscle.state]}30`,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: STATE_COLORS[selectedMuscle.state], marginBottom: 3 }}>
            {selectedMuscle.name}
          </div>
          <div style={{ fontSize: 11, color: STATE_COLORS[selectedMuscle.state], opacity: 0.9 }}>
            {STATE_LABELS[selectedMuscle.state]}
          </div>
          {selectedMuscle.recoveryHoursLeft > 0 && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              Récupération dans ~{selectedMuscle.recoveryHoursLeft}h
            </div>
          )}
        </div>
      )}

      {/* Légende */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, justifyContent: 'center' }}>
        {[
          { color: '#4a9eff', label: 'Frais' },
          { color: '#22c55e', label: 'Récupéré' },
          { color: '#f97316', label: 'Fatigué' },
          { color: '#ef4444', label: 'Épuisé' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
        Glisse pour tourner · Tape sur un muscle pour les détails
      </p>
    </div>
  );
}
