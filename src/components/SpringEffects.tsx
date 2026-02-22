import React from 'react';

export const SpringEffects: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes float-petal {
          0% { transform: translateY(-5vh) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.4; }
          100% { transform: translateY(105vh) translateX(80px) rotate(360deg); opacity: 0; }
        }

        .spring-petal {
          position: fixed;
          pointer-events: none;
          z-index: 1;
          font-size: 16px;
          animation: float-petal linear infinite;
          opacity: 0;
        }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="spring-petal"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 8}s`,
              fontSize: `${12 + Math.random() * 8}px`,
            }}
          >
            {['🌸', '🌿', '🌷', '💮'][i % 4]}
          </div>
        ))}
      </div>
    </>
  );
};
