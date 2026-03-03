import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, Frown } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md sm:max-w-lg text-center space-y-8">
        {/* 404 Number */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 backdrop-blur-xl">
            <Frown className="w-12 h-12 sm:w-14 sm:h-14 text-purple-400 animate-pulse" />
          </div>
          <h1 className="text-6xl sm:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 animate-pulse">
            404
          </h1>
        </div>

        {/* Messages */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Sahifa topilmadi
          </h2>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">

          <Button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Home className="w-4 h-4" />
            <span>Bosh sahifaga</span>
          </Button>
        </div>

        {/* Footer message */}
        <div className="pt-6 border-t border-slate-700/50">
          <p className="text-xs sm:text-sm text-slate-400">
            Agar bu xatolik bo'lsa, iltimos{" "}
            <a href="https://t.me/Arkitex_admin/" className="text-purple-400 hover:text-purple-300 underline">
              biz bilan bog'laning
            </a>
          </p>
        </div>
      </div>

      {/* Animated CSS */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default NotFound;
