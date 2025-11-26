import React, { useState } from 'react';
import { FlowerTheme } from '../types';

interface LuckyWheelProps {
  themes: FlowerTheme[];
  onSelect: (theme: FlowerTheme) => void;
}

const LuckyWheel: React.FC<LuckyWheelProps> = ({ themes, onSelect }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);

  const sliceAngle = 360 / themes.length;

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);

    const extraSpins = 5 + Math.random() * 5; // 5 to 10 full spins
    const randomOffset = Math.random() * 360;
    const totalRotation = rotation + (extraSpins * 360) + randomOffset;

    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      // Calculate which segment won
      // Normalize rotation to 0-360
      const actualRotation = totalRotation % 360;
      // The pointer is at 90 degrees (right side) usually, or top (0). 
      // Assuming pointer is at Top (0 degrees), we need to correct for the rotation direction.
      // CSS Rotate moves clockwise. Index 0 is at 0 degrees initially.
      // If we rotate 10 degrees, index 0 moves to 10 deg.
      // To find what's at 0 (top), we invert logic.
      const index = Math.floor(((360 - actualRotation) % 360) / sliceAngle);
      onSelect(themes[index]);
    }, 4000); // 4s animation
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 text-4xl filter drop-shadow-lg">
          🔻
        </div>

        {/* Wheel */}
        <div 
          className="w-full h-full rounded-full border-4 border-white dark:border-gray-800 shadow-2xl relative overflow-hidden transition-transform cubic-bezier(0.2, 0.8, 0.2, 1)"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionDuration: '4s',
          }}
        >
          {themes.map((theme, i) => (
            <div
              key={theme.id}
              className="absolute w-full h-full top-0 left-0"
              style={{
                transform: `rotate(${i * sliceAngle}deg)`,
                transformOrigin: '50% 50%',
              }}
            >
              <div 
                className="w-full h-full absolute top-0 left-0 flex justify-center pt-2"
                style={{
                    backgroundColor: i % 2 === 0 ? theme.primary : theme.secondary,
                    clipPath: `polygon(50% 50%, 0 0, 100% 0)`, // Simplified slice
                    transform: `rotate(${90 + (sliceAngle/2)}deg) skewY(-${90 - sliceAngle}deg)`, // Math heavy, simplifying visual for robustness
                    // Use Conic Gradient approach for perfect slices instead?
                }}
              >
              </div>
              {/* Icon Label - tricky to position with pure CSS slices, using absolute positioning based on angle */}
            </div>
          ))}
          
           {/* Fallback visual: Conic Gradient is cleaner for many slices */}
           <div 
             className="absolute inset-0 rounded-full"
             style={{
               background: `conic-gradient(${themes.map((t, i) => `${t.primary} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ')})`
             }}
           ></div>

           {themes.map((theme, i) => {
              const angle = (i * sliceAngle) + (sliceAngle / 2);
              const radius = 40; // percent
              const x = 50 + radius * Math.sin(Math.PI * 2 * angle / 360);
              const y = 50 - radius * Math.cos(Math.PI * 2 * angle / 360);
              return (
                <div 
                  key={theme.id}
                  className="absolute text-sm font-bold text-white drop-shadow-md transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${angle}deg)` }}
                >
                  {theme.icon}
                </div>
              )
           })}

        </div>
        
        {/* Center Pin */}
        <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full -translate-x-1/2 -translate-y-1/2 z-10 shadow-lg border-2 border-gray-200 flex items-center justify-center">
            <span className="text-[10px]">🌸</span>
        </div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-full shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-wider"
      >
        {isSpinning ? '...' : 'SPIN!'}
      </button>
    </div>
  );
};

export default LuckyWheel;