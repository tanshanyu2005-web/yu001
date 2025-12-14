import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows, 
  PerspectiveCamera,
  Float
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// Components
import { FoliageSystem } from './components/FoliageSystem';
import { InstancedOrnaments } from './components/InstancedOrnaments';
import { PolaroidGallery } from './components/PolaroidGallery';
import { Overlay } from './components/Overlay';
import { THEME } from './types';

// State Logic for Animation
function SceneController({ isInteracting, setChaosLevel }: { isInteracting: boolean, setChaosLevel: (v: number) => void }) {
  // We use a ref for the actual value to animate it in useFrame without re-rendering React
  const value = useRef(1.0); // Start in Chaos (1.0)
  
  useFrame((state, delta) => {
    // Target: 0 (Formed) when interacting, 1 (Chaos) when not
    const target = isInteracting ? 0.0 : 1.0;
    
    // Smooth damping
    // Cinematic feel: Slow to assemble (heavy), slightly faster to explode
    const speed = isInteracting ? 1.5 : 2.0; 
    
    value.current = THREE.MathUtils.damp(value.current, target, speed, delta);
    
    // Pass value up for other non-3D components if needed, but mostly we pass it down via props/context
    // Optimization: In a huge app we'd use Zustand, here we force update via prop
    setChaosLevel(value.current);
    
    // Camera Motion based on Chaos
    // When Chaos: Camera drifts
    // When Formed: Camera stabilizes
    const cam = state.camera;
    if (value.current > 0.5) {
       // Gentle drift
       cam.position.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.005;
    }
  });
  return null;
}

function SceneLights() {
    return (
        <>
            <ambientLight intensity={0.2} color={THEME.colors.primaryGreen} />
            <spotLight 
                position={[10, 20, 10]} 
                angle={0.5} 
                penumbra={1} 
                intensity={200} 
                color={THEME.colors.champagne} 
                castShadow 
                shadow-bias={-0.0001}
            />
            <pointLight position={[-10, -5, -10]} intensity={50} color={THEME.colors.accentGold} />
            {/* Rim Light */}
            <spotLight 
                position={[0, 10, -15]} 
                intensity={300} 
                color="#4a9eff" 
                angle={1}
            />
        </>
    )
}

export default function App() {
  const [isInteracting, setIsInteracting] = useState(false);
  const [chaosLevel, setChaosLevel] = useState(1.0);
  const [interactionMode, setInteractionMode] = useState<'mouse' | 'gesture'>('mouse');

  // Mouse Handlers
  const handlePointerDown = () => setIsInteracting(true);
  const handlePointerUp = () => setIsInteracting(false);

  // Keyboard Handlers (Spacebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if(e.code === 'Space') setIsInteracting(true); }
    const handleKeyUp = (e: KeyboardEvent) => { if(e.code === 'Space') setIsInteracting(false); }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }
  }, []);

  return (
    <div 
        className="w-full h-screen bg-black relative"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
    >
      <Overlay interactionMode={interactionMode} setInteractionMode={setInteractionMode} />
      
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ 
            antialias: false, 
            toneMapping: THREE.ReinhardToneMapping, 
            toneMappingExposure: 1.5,
            stencil: false,
            depth: true 
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 2, 22]} fov={35} />
        
        {/* Interaction Logic */}
        <SceneController isInteracting={isInteracting} setChaosLevel={setChaosLevel} />

        {/* Environment */}
        <color attach="background" args={['#010201']} />
        <Environment preset="city" background={false} blur={1} />
        <fog attach="fog" args={['#010201', 10, 40]} />

        {/* Lighting */}
        <SceneLights />

        {/* The Tree Elements */}
        <group position={[0, -4, 0]}>
            <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2} floatingRange={[-0.2, 0.2]}>
                <FoliageSystem count={15000} chaosLevel={chaosLevel} />
                <InstancedOrnaments count={100} chaosLevel={chaosLevel} type="gift" />
                <InstancedOrnaments count={300} chaosLevel={chaosLevel} type="ball" />
                <InstancedOrnaments count={500} chaosLevel={chaosLevel} type="light" />
                <PolaroidGallery count={40} chaosLevel={chaosLevel} />
            </Float>
        </group>

        {/* Ground Reflections */}
        <ContactShadows 
            opacity={0.5} 
            scale={40} 
            blur={2} 
            far={10} 
            resolution={256} 
            color="#000000" 
        />

        {/* Controls */}
        <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={10} 
            maxDistance={35}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 3}
            autoRotate={!isInteracting}
            autoRotateSpeed={0.5}
            dampingFactor={0.05}
        />

        {/* Post Processing */}
        <EffectComposer disableNormalPass>
            <Bloom 
                luminanceThreshold={0.8} 
                mipmapBlur 
                intensity={1.5} 
                radius={0.4}
            />
            <Noise opacity={0.05} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>

      </Canvas>
    </div>
  );
}