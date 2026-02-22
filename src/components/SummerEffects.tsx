import React from 'react';

export const SummerEffects: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes float-cloud-s {
          0% { transform: translateX(-120px); }
          100% { transform: translateX(calc(100vw + 120px)); }
        }
        @keyframes shimmer-sun {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(255, 180, 0, 0.4)); }
          50% { filter: drop-shadow(0 0 20px rgba(255, 180, 0, 0.6)); }
        }

        .summer-cloud-el {
          position: fixed;
          pointer-events: none;
          z-index: 1;
          font-size: 24px;
          opacity: 0.35;
          animation: float-cloud-s linear infinite;
        }
        .summer-sun-el {
          position: fixed;
          top: 12px;
          right: 80px;
          font-size: 36px;
          pointer-events: none;
          z-index: 1;
          animation: shimmer-sun 3s ease-in-out infinite;
          opacity: 0.7;
        }
      `}</style>

      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div className="summer-sun-el">☀️</div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="summer-cloud-el"
            style={{
              top: `${15 + i * 12}%`,
              animationDelay: `${i * 4}s`,
              animationDuration: `${25 + i * 5}s`,
            }}
          >
            ☁️
          </div>
        ))}
      </div>
    </>
  );
};
