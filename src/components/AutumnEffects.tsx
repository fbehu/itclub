import React from 'react';

export const AutumnEffects: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes fall-leaf {
          0% {
            transform: translateY(-10vh) translateX(0) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(100px) rotateZ(360deg);
            opacity: 0;
          }
        }

        @keyframes sway-leaf {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(20px); }
          75% { transform: translateX(-20px); }
        }

        .autumn-leaf {
          position: fixed;
          width: 40px;
          height: 40px;
          font-size: 30px;
          pointer-events: none;
          animation: fall-leaf linear infinite;
          opacity: 0.8;
          z-index: 1;
        }

        .autumn-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .autumn-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #d4a574 0%, #c89968 25%, #d4705f 50%, #c85a3f 75%, #8b6f47 100%);
          background-size: 400% 400%;
          animation: autumn-gradient 20s ease infinite;
          z-index: -1;
        }

        @keyframes autumn-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .autumn-tree {
          position: fixed;
          font-size: 50px;
          opacity: 0.6;
          z-index: 1;
        }

        .autumn-pumpkin {
          position: fixed;
          font-size: 40px;
          opacity: 0.7;
          animation: sway-leaf 4s ease-in-out infinite;
          z-index: 1;
        }
      `}</style>

      <div className="autumn-background"></div>
      <div className="autumn-container">
        {/* Tupadigan bargli */}
        {Array.from({ length: 40 }).map((_, i) => {
          const leafTypes = ['🍂', '🍁', '🌰'];
          const delay = Math.random() * 20;
          const duration = 8 + Math.random() * 4;
          
          return (
            <div
              key={`leaf-${i}`}
              className="autumn-leaf"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
              }}
            >
              {leafTypes[i % leafTypes.length]}
            </div>
          );
        })}

        {/* Daraxtlar */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`tree-${i}`}
            className="autumn-tree"
            style={{
              left: `${(i + 1) * 20 - 10}%`,
              bottom: '10%',
            }}
          >
            🌳
          </div>
        ))}

        {/* Balqqalar */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`pumpkin-${i}`}
            className="autumn-pumpkin"
            style={{
              left: `${15 + i * 20}%`,
              bottom: '5%',
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            🎃
          </div>
        ))}
      </div>
    </>
  );
};
