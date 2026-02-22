import React from 'react';

export const SummerEffects: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes float-sun {
          0%, 100% { transform: translateY(0px); opacity: 1; }
          50% { transform: translateY(-30px); opacity: 0.8; }
        }

        @keyframes twinkle-star {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes sway-palm {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }

        .summer-sun {
          position: fixed;
          width: 60px;
          height: 60px;
          top: 20px;
          right: 30px;
          font-size: 50px;
          animation: float-sun 4s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255, 200, 0, 0.5));
          z-index: 1;
        }

        .summer-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .summer-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 50%, #FFE4B5 100%);
          z-index: -1;
        }

        .summer-cloud {
          position: fixed;
          font-size: 30px;
          animation: float-cloud 20s linear infinite;
          opacity: 0.7;
          z-index: 1;
        }

        @keyframes float-cloud {
          0% { transform: translateX(-100px); }
          100% { transform: translateX(calc(100vw + 100px)); }
        }

        .summer-star {
          position: fixed;
          font-size: 16px;
          animation: twinkle-star 3s ease-in-out infinite;
          z-index: 1;
        }

        .summer-palm {
          position: fixed;
          font-size: 40px;
          animation: sway-palm 3s ease-in-out infinite;
          opacity: 0.6;
          z-index: 1;
        }
      `}</style>

      <div className="summer-background"></div>
      <div className="summer-container">
        {/* Quyosh */}
        <div className="summer-sun">☀️</div>

        {/* Bulutlar */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`cloud-${i}`}
            className="summer-cloud"
            style={{
              top: `${20 + i * 8}%`,
              animationDelay: `${i * 2.5}s`,
            }}
          >
            ☁️
          </div>
        ))}

        {/* Yulduzlar */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="summer-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 30}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            ⭐
          </div>
        ))}

        {/* Palma daraxtlari */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`palm-${i}`}
            className="summer-palm"
            style={{
              left: `${i % 2 === 0 ? 5 : 85}%`,
              bottom: `${10 + (i % 3) * 15}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            🌴
          </div>
        ))}
      </div>
    </>
  );
};
