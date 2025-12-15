import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import Experience from './components/Experience';
import { TreeState } from './types';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>('CHAOS');

  const toggleState = () => {
    setTreeState((prev) => (prev === 'CHAOS' ? 'FORMED' : 'CHAOS'));
  };

  return (
    <div className="relative w-full h-screen bg-neutral-900">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 4, 20], fov: 45 }}
        gl={{ antialias: false, toneMappingExposure: 1.5 }}
      >
        <Suspense fallback={null}>
          <Experience treeState={treeState} />
        </Suspense>
      </Canvas>
      <Loader />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8 md:p-12">
        {/* Header */}
        <header className="flex flex-col items-center justify-center space-y-2 animate-fade-in">
          <h1 className="text-4xl md:text-6xl text-[#FFD700] font-serif font-bold tracking-wider drop-shadow-[0_0_15px_rgba(255,215,0,0.5)] text-center">
            THE GRAND CHRISTMAS
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-80" />
          <p className="text-red-500 font-serif tracking-[0.1em] text-lg md:text-xl font-bold uppercase drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]">
            Merry Christmas to Jasmine
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col items-center pointer-events-auto pb-8">
          <button
            onClick={toggleState}
            className="group relative px-12 py-4 bg-transparent border border-[#FFD700] overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]"
          >
            {/* Button Background Animation */}
            <div className="absolute inset-0 w-full h-full bg-[#FFD700] opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            
            <span className="relative z-10 font-serif text-[#FFD700] text-xl tracking-widest uppercase font-bold group-hover:scale-105 transition-transform duration-300 inline-block">
              {treeState === 'CHAOS' ? 'ASSEMBLE' : 'SCATTER'}
            </span>
          </button>
          
          <p className="mt-4 text-[#FFD700] opacity-60 text-xs tracking-wider font-light">
            {treeState === 'CHAOS' ? 'Chaos Mode Active' : 'Formed Mode Active'}
          </p>
        </div>
      </div>

      {/* Decorative Borders */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 mix-blend-overlay opacity-30">
        <div className="w-full h-full border border-[#FFD700]" />
        <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#FFD700]" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#FFD700]" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#FFD700]" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#FFD700]" />
      </div>
    </div>
  );
};

export default App;
