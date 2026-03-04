/**
 * BodyModel3D — Visualisation 3D anatomique réelle (Z-Anatomy, CC BY-SA 4.0)
 * Modèle GLB avec muscles individuellement colorés selon l'état de récupération.
 * 
 * Palette de couleurs :
 *   Frais (0%)      → bleu acier #4a9eff (non sollicité)
 *   Récupéré (<20%) → vert émeraude #22c55e
 *   Léger (<40%)    → vert-jaune #84cc16
 *   Modéré (<65%)   → orange #f97316
 *   Fatigué (<85%)  → rouge #ef4444
 *   Épuisé (>85%)   → rouge foncé #dc2626
 */

import { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type MuscleState = 'fresh' | 'recovered' | 'light' | 'moderate' | 'fatigued' | 'exhausted';

export interface MuscleStatus {
  id: string;
  name: string;
  state: MuscleState;
  fatigue: number;
  recoveryHoursLeft: number;
}

// ─── Mapping MuscleGroup → noms de meshes dans le GLB ────────────────────────
// Chaque groupe musculaire correspond à plusieurs meshes dans le modèle Z-Anatomy
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

// ─── Couleur selon fatigue ────────────────────────────────────────────────────
function fatigueToColor(fatigue: number): THREE.Color {
  if (fatigue < 0.05) return new THREE.Color('#4a9eff'); // bleu acier = frais
  if (fatigue < 0.2)  return new THREE.Color('#22c55e'); // vert = récupéré
  if (fatigue < 0.4)  return new THREE.Color('#84cc16'); // vert-jaune = léger
  if (fatigue < 0.65) return new THREE.Color('#f97316'); // orange = modéré
  if (fatigue < 0.85) return new THREE.Color('#ef4444'); // rouge = fatigué
  return new THREE.Color('#dc2626');                      // rouge foncé = épuisé
}

function fatigueToEmissive(fatigue: number): THREE.Color {
  if (fatigue < 0.05) return new THREE.Color('#001428');
  if (fatigue < 0.2)  return new THREE.Color('#052e16');
  if (fatigue < 0.4)  return new THREE.Color('#1a2e05');
  if (fatigue < 0.65) return new THREE.Color('#431407');
  if (fatigue < 0.85) return new THREE.Color('#450a0a');
  return new THREE.Color('#3b0000');
}

// ─── Composant modèle anatomique ─────────────────────────────────────────────
const MODEL_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663274447138/CvYhbg3Bxaqv7y44UZV68i/body_e4b553e2.glb';

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
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const { gl } = useThree();

  // Construire la map meshName → MuscleStatus
  const meshToStatus = new Map<string, MuscleStatus>();
  for (const status of muscleStatuses) {
    const meshNames = MUSCLE_MESH_MAP[status.id] ?? [];
    for (const meshName of meshNames) {
      meshToStatus.set(meshName, status);
    }
  }

  // Charger le modèle avec DRACO
  useEffect(() => {
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;

        // Centrer et mettre à l'échelle le modèle
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.5 / maxDim;

        model.scale.setScalar(scale);
        model.position.set(
          -center.x * scale,
          -center.y * scale,
          -center.z * scale
        );
        // Orienter le modèle face caméra (Z-Anatomy est orienté Y-up)
        model.rotation.y = 0;

        // Appliquer les matériaux musculaires
        model.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;

          const status = meshToStatus.get(child.name);
          const isMuscleMesh = meshToStatus.has(child.name);

          if (isMuscleMesh && status) {
            // Muscle avec état de récupération → couleur dynamique
            const color = fatigueToColor(status.fatigue);
            const emissive = fatigueToEmissive(status.fatigue);
            child.material = new THREE.MeshStandardMaterial({
              color,
              emissive,
              emissiveIntensity: 0.3 + status.fatigue * 0.4,
              roughness: 0.6,
              metalness: 0.0,
              transparent: false,
            });
          } else if (child.name.toLowerCase().includes('bone') || child.name.toLowerCase().includes('cartilage') || child.name.toLowerCase().includes('tooth') || child.name.toLowerCase().includes('incisor') || child.name.toLowerCase().includes('molar') || child.name.toLowerCase().includes('premolar') || child.name.toLowerCase().includes('canine')) {
            // Os et dents → très discrets
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#c8b89a'),
              roughness: 0.8,
              metalness: 0.0,
              transparent: true,
              opacity: 0.08,
            });
          } else {
            // Autres muscles non mappés → rouge anatomique riche
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color('#c03525'),
              emissive: new THREE.Color('#200505'),
              emissiveIntensity: 0.15,
              roughness: 0.55,
              metalness: 0.05,
              transparent: true,
              opacity: 0.85,
            });
          }

          // Rendre le mesh interactif
          child.userData.muscleStatus = status;
          child.castShadow = true;
          child.receiveShadow = false;
        });

        setScene(model);
      },
      undefined,
      (error) => console.error('Error loading body.glb:', error)
    );

    return () => {
      dracoLoader.dispose();
    };
  }, []); // Charger une seule fois

  // Mettre à jour les couleurs quand muscleStatuses change
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const status = meshToStatus.get(child.name);
      if (!status) return;

      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat.isMeshStandardMaterial) return;

      const isHovered = hovered === child.name;
      const color = fatigueToColor(status.fatigue);
      const emissive = fatigueToEmissive(status.fatigue);

      mat.color.copy(isHovered ? color.clone().multiplyScalar(1.4) : color);
      mat.emissive.copy(isHovered ? color.clone().multiplyScalar(0.3) : emissive);
      mat.emissiveIntensity = isHovered ? 0.8 : (0.3 + status.fatigue * 0.4);
      mat.opacity = 1.0;
      mat.transparent = false;
      child.userData.muscleStatus = status;
    });
  }, [muscleStatuses, scene, hovered, meshToStatus]);

  // Rotation automatique lente
  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  // Gestion du clic
  const handleClick = (e: any) => {
    e.stopPropagation();
    const status = e.object?.userData?.muscleStatus as MuscleStatus | undefined;
    if (status && onMuscleClick) {
      onMuscleClick(status);
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    const name = e.object?.name;
    if (name && meshToStatus.has(name)) {
      setHovered(name);
      gl.domElement.style.cursor = 'pointer';
    }
  };

  const handlePointerOut = () => {
    setHovered(null);
    gl.domElement.style.cursor = 'auto';
  };

  if (!scene) return null;

  return (
    <group ref={groupRef}>
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
  return (
    <mesh>
      <boxGeometry args={[0.5, 2, 0.3]} />
      <meshStandardMaterial color="#1e3a5f" wireframe />
    </mesh>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
interface BodyModel3DProps {
  muscleStatuses: MuscleStatus[];
  onMuscleClick?: (muscle: MuscleStatus) => void;
  height?: number;
}

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

export default function BodyModel3D({ muscleStatuses, onMuscleClick, height = 380 }: BodyModel3DProps) {
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
    }, 4000);
    if (onMuscleClick) onMuscleClick(muscle);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
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
          background: 'radial-gradient(ellipse at 50% 30%, #0d1f3c 0%, #050d1a 100%)',
          border: '1px solid rgba(74,158,255,0.15)',
          boxShadow: '0 0 40px rgba(0,80,200,0.12)',
        }}
      >
        <Canvas
          camera={{ position: [0, 0.5, 5.5], fov: 42 }}
          gl={{ antialias: true, alpha: false }}
          shadows
        >
          {/* Éclairage premium */}
          <ambientLight intensity={0.25} color="#8ab0ff" />
          <directionalLight
            position={[2, 8, 5]}
            intensity={1.8}
            color="#ffffff"
            castShadow
          />
          <directionalLight
            position={[-4, 3, -3]}
            intensity={0.8}
            color="#4070ff"
          />
          <directionalLight
            position={[0, -3, 3]}
            intensity={0.4}
            color="#ff4020"
          />
          <pointLight position={[0, 3, 3]} intensity={0.6} color="#ffffff" />
          <pointLight position={[2, 0, 2]} intensity={0.3} color="#60a0ff" />
          <pointLight position={[-2, 0, 2]} intensity={0.3} color="#ff6040" />

          {/* Modèle anatomique */}
          <Suspense fallback={<LoadingFallback />}>
            <AnatomyModel
              muscleStatuses={muscleStatuses}
              onMuscleClick={handleMuscleClick}
              autoRotate={autoRotate}
            />
            <ContactShadows
              position={[0, -2.2, 0]}
              opacity={0.3}
              scale={4}
              blur={2}
              far={3}
              color="#000020"
            />
          </Suspense>

          {/* Contrôles orbitaux */}
          <OrbitControls
            enablePan={false}
            minDistance={2}
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
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(5,15,35,0.95)',
            border: `1px solid ${STATE_COLORS[selectedMuscle.state]}50`,
            borderRadius: 12,
            padding: '10px 16px',
            textAlign: 'center',
            backdropFilter: 'blur(8px)',
            minWidth: 180,
            zIndex: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: STATE_COLORS[selectedMuscle.state], marginBottom: 2 }}>
            {selectedMuscle.name}
          </div>
          <div style={{ fontSize: 11, color: STATE_COLORS[selectedMuscle.state], opacity: 0.85 }}>
            {STATE_LABELS[selectedMuscle.state]}
          </div>
          {selectedMuscle.recoveryHoursLeft > 0 && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
              Récupération dans ~{selectedMuscle.recoveryHoursLeft}h
            </div>
          )}
        </div>
      )}

      {/* Légende */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
        justifyContent: 'center',
      }}>
        {[
          { color: '#4a9eff', label: 'Frais' },
          { color: '#22c55e', label: 'Récupéré' },
          { color: '#f97316', label: 'Fatigué' },
          { color: '#ef4444', label: 'Épuisé' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 4px ${color}` }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Hint interaction */}
      <p style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
        Glisse pour tourner · Appuie sur un muscle pour les détails
      </p>
    </div>
  );
}
