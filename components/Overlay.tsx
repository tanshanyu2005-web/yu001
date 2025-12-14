import React from 'react';

interface OverlayProps {
  interactionMode: 'mouse' | 'gesture';
  setInteractionMode: (mode: 'mouse' | 'gesture') => void;
}

export const Overlay: React.FC<OverlayProps> = ({ interactionMode, setInteractionMode }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 md:p-12 z-10">
      
      {/* Header */}
      <header className="flex flex-col items-center md:items-start space-y-2">
        <h2 className="text-amber-200 text-xs tracking-[0.5em] uppercase opacity-80 font-serif">The Collection</h2>
        <h1 className="text-4xl md:text-6xl text-white font-serif tracking-tight drop-shadow-2xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-yellow-500">
            GRAND LUXURY
          </span>
          <br />
          <span className="italic font-light opacity-90">Noël</span>
        </h1>
      </header>

      {/* Controls / Footer */}
      <footer className="flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        
        <div className="text-white/60 text-sm font-sans max-w-xs text-right md:text-left">
            <p className="mb-2 uppercase tracking-widest text-[10px] text-amber-400">Status</p>
            <p className="font-serif italic text-lg leading-tight">
               "Order is the ultimate luxury."
            </p>
        </div>

        <div className="flex flex-col items-end pointer-events-auto">
            <div className="flex gap-4 mb-6">
                <button 
                    onClick={() => setInteractionMode('mouse')}
                    className={`px-4 py-2 text-xs uppercase tracking-widest border transition-all duration-500
                    ${interactionMode === 'mouse' ? 'border-amber-400 text-amber-400 bg-amber-900/20' : 'border-white/20 text-white/40 hover:border-white/60'}`}
                >
                    Manual Control
                </button>
            </div>

            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-300 to-yellow-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative px-8 py-4 bg-black border border-amber-500/50 rounded-lg shadow-2xl flex flex-col items-center">
                    <span className="text-amber-500 text-xs tracking-widest uppercase mb-1">
                        {interactionMode === 'mouse' ? 'Click & Hold' : 'Clench Fist'}
                    </span>
                    <span className="text-white font-serif text-xl">
                        To Assemble
                    </span>
                </div>
            </div>
        </div>
      </footer>
      
      {/* Decorative Border */}
      <div className="absolute inset-4 border border-white/10 pointer-events-none" />
      <div className="absolute inset-4 border-t border-b border-amber-500/20 scale-x-90 pointer-events-none" />
    </div>
  );
};