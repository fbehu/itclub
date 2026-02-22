import { useEffect, useRef, useState } from 'react';

// Snowflake component
const Snowflake = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="fixed pointer-events-none z-50 text-white opacity-80"
    style={style}
  >
  </div>
);

export function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    const flakes: React.CSSProperties[] = [];
    const count = 50;

    for (let i = 0; i < count; i++) {
      flakes.push({
        left: `${Math.random() * 100}%`,
        top: `-${Math.random() * 20}px`,
        fontSize: `${Math.random() * 10 + 8}px`,
        animationDuration: `${Math.random() * 5 + 8}s`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: Math.random() * 0.6 + 0.4,
      });
    }

    setSnowflakes(flakes);
  }, []);

  return (
    <>
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10px) rotate(0deg) translateX(0);
            opacity: 1;
          }
          25% {
            transform: translateY(25vh) rotate(90deg) translateX(10px);
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(-10px);
          }
          75% {
            transform: translateY(75vh) rotate(270deg) translateX(10px);
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(0);
            opacity: 0.3;
          }
        }
      `}</style>
      {snowflakes.map((style, i) => (
        <Snowflake
          key={i}
          style={{
            ...style,
            animation: `snowfall ${style.animationDuration} linear infinite`,
            animationDelay: style.animationDelay as string,
          }}
        />
      ))}
    </>
  );
}

export function FireworksEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = [
      '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
      '#ff6600', '#ff0066', '#66ff00', '#0066ff', '#6600ff', '#00ff66',
      '#ffd700', '#ff1493', '#00ced1', '#ff4500', '#9400d3', '#7fff00'
    ];

    const createFirework = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * (canvas.height * 0.5);
      const particleCount = Math.floor(Math.random() * 30) + 30;
      const color = colors[Math.floor(Math.random() * colors.length)];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 / particleCount) * i;
        const speed = Math.random() * 4 + 2;
        
      }
    };

    const createConfetti = () => {
      const x = Math.random() * canvas.width;
      const color = colors[Math.floor(Math.random() * colors.length)];

    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial burst of fireworks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => createFirework(), i * 300);
    }

    // Periodic fireworks
    const fireworkInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        createFirework();
      }
    }, 2000);

    // Confetti rain
    const confettiInterval = setInterval(() => {
      for (let i = 0; i < 3; i++) {
        createConfetti();
      }
    }, 100);

    animate();

    // Stop confetti after 10 seconds, continue fireworks
    const confettiTimeout = setTimeout(() => {
      clearInterval(confettiInterval);
    }, 10000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(fireworkInterval);
      clearInterval(confettiInterval);
      clearTimeout(confettiTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ background: 'transparent' }}
    />
  );
}

export function SantaHat({ className = '' }: { className?: string }) {
  return (
    <div 
      className={`absolute z-10 ${className}`}
      style={{ 
        top: '-30px', 
        right: '-10px',
        transform: 'rotate(17deg)'
      }}
    >
      <svg width="55" height="50" viewBox="0 0 70 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Hat shadow */}
        <ellipse cx="38" cy="55" rx="25" ry="5" fill="rgba(0,0,0,0.2)" />
        {/* Hat body */}
        <path
          d="M8 52 Q15 20 38 5 Q60 20 67 52"
          fill="url(#hatGradient)"
          stroke="#8b0000"
          strokeWidth="1"
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id="hatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e53935" />
            <stop offset="50%" stopColor="#c62828" />
            <stop offset="100%" stopColor="#b71c1c" />
          </linearGradient>
        </defs>
        {/* White fur trim */}
        <ellipse cx="38" cy="54" rx="32" ry="8" fill="#fff" />
        <ellipse cx="38" cy="54" rx="30" ry="6" fill="#f5f5f5" />
        {/* Fur texture */}
        <ellipse cx="20" cy="54" rx="4" ry="3" fill="#fff" />
        <ellipse cx="38" cy="55" rx="5" ry="3" fill="#fff" />
        <ellipse cx="55" cy="54" rx="4" ry="3" fill="#fff" />
        {/* Pom pom */}
        <circle cx="40" cy="5" r="8" fill="#fff" />
        <circle cx="38" cy="4" r="6" fill="#f9f9f9" />
        <circle cx="36" cy="3" r="2" fill="#fff" />
        {/* Highlights */}
        <path
          d="M18 35 Q25 15 36 8"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function WinterGreeting() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div 
      className="fixed top-8 left-1/2 -translate-x-1/2 z-50 text-center"
      style={{
        animation: 'bounceIn 1s ease-out, fadeOutUp 1s ease-in 7s forwards'
      }}
    >
      <style>{`
        @keyframes bounceIn {
          0% { transform: translate(-50%, -50px) scale(0.5); opacity: 0; }
          60% { transform: translate(-50%, 10px) scale(1.1); }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        @keyframes fadeOutUp {
          0% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -30px); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
      
    </div>
  );
}

export function SnowmanDecoration() {
  return (
    <div className="fixed bottom-4 left-4 z-30 opacity-80 pointer-events-none hidden sm:block">
      <svg width="60" height="80" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Bottom ball */}
        <circle cx="40" cy="80" r="20" fill="#fff" stroke="#ddd" strokeWidth="1" />
        {/* Middle ball */}
        <circle cx="40" cy="50" r="15" fill="#fff" stroke="#ddd" strokeWidth="1" />
        {/* Head */}
        <circle cx="40" cy="28" r="12" fill="#fff" stroke="#ddd" strokeWidth="1" />
        {/* Hat */}
        <rect x="30" y="8" width="20" height="12" fill="#2c3e50" rx="2" />
        <rect x="25" y="18" width="30" height="4" fill="#2c3e50" rx="1" />
        {/* Eyes */}
        <circle cx="36" cy="25" r="2" fill="#2c3e50" />
        <circle cx="44" cy="25" r="2" fill="#2c3e50" />
        {/* Carrot nose */}
        <path d="M40 28 L48 30 L40 32 Z" fill="#e67e22" />
        {/* Buttons */}
        <circle cx="40" cy="45" r="2" fill="#2c3e50" />
        <circle cx="40" cy="52" r="2" fill="#2c3e50" />
        <circle cx="40" cy="59" r="2" fill="#2c3e50" />
        {/* Scarf */}
        <path d="M28 35 Q40 40 52 35" stroke="#c0392b" strokeWidth="4" fill="none" />
        <path d="M50 35 L55 50" stroke="#c0392b" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* Arms */}
        <path d="M25 50 L10 40" stroke="#8b4513" strokeWidth="3" strokeLinecap="round" />
        <path d="M55 50 L70 40" stroke="#8b4513" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}
