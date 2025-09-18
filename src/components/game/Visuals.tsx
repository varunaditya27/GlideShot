"use client";

import { ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, SMAA, Vignette, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export default function Visuals({ enabled = true }: { enabled?: boolean }) {
  return (
    <>
      {/* Soft ambient env */}
      <Environment preset="sunset" background={false} />

      {/* Grounded look under the ball */}
      <ContactShadows position={[0, 0, 0]} opacity={0.4} width={40} height={40} blur={2.5} far={20} />

      {/* Subtle postprocessing (can be disabled for performance) */}
      {enabled ? (
        <EffectComposer>
          <SMAA />
          <Bloom intensity={0.15} luminanceThreshold={0.8} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.2} darkness={0.7} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      ) : null}
    </>
  );
}
