import React from 'react';

export const SpringEffects: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes float-flower {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-20px) rotate(10deg); opacity: 0.8; }
        }

        @keyframes sway {
          0%, 100% { transform: translateX(0px); }
          25% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }

        .spring-flower {
          position: fixed;
          width: 20px;
          height: 20px;
          pointer-events: none;
          animation: float-flower 6s ease-in-out infinite;
          z-index: 1;
          opacity: 0.7;
        }

        .spring-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .spring-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 25%, #fd79a8 50%, #fdcb6e 75%, #6c5ce7 100%);
          background-size: 400% 400%;
          animation: spring-gradient 15s ease infinite;
          z-index: -1;
        }

        @keyframes spring-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .spring-leaf {
          position: fixed;
          font-size: 24px;
          animation: sway 4s ease-in-out infinite;
          opacity: 0.6;
          z-index: 1;
        }
      `}</style>

      <div className="spring-background"></div>
      <div className="spring-container">
        {/* Gullalar */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={`flower-${i}`}
            className="spring-flower"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              color: ['#ff6b6b', '#ff8787', '#ffa5a5', '#ffd93d', '#ffed4e'][i % 5],
            }}
          >
            🌸
          </div>
        ))}

        {/* Yashil shoxlar */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`leaf-${i}`}
            className="spring-leaf"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          >
            🌿
          </div>
        ))}
      </div>
    </>
  );
};
