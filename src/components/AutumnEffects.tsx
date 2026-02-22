import React from 'react';

export const AutumnEffects: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes fall-leaf-a {
          0% { transform: translateY(-5vh) translateX(0) rotateZ(0deg); opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.3; }
          100% { transform: translateY(105vh) translateX(60px) rotateZ(360deg); opacity: 0; }
        }

        .autumn-leaf-el {
          position: fixed;
          pointer-events: none;
          z-index: 1;
          animation: fall-leaf-a linear infinite;
          opacity: 0;
        }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {Array.from({ length: 15 }).map((_, i) => {
          const leaves = ['🍂', '🍁', '🌰', '🍃'];
          return (
            <div
              key={i}
              className="autumn-leaf-el"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 12}s`,
                animationDuration: `${8 + Math.random() * 6}s`,
                fontSize: `${18 + Math.random() * 12}px`,
              }}
            >
              {leaves[i % leaves.length]}
            </div>
          );
        })}
      </div>
    </>
  );
};
