import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, Clock, ChevronLeft, ChevronRight, 
  Send, Shield, Maximize, X, Flag
} from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: { id: string; text: string }[];
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Python dasturlash tilida o\'zgaruvchi e\'lon qilish uchun qaysi kalit so\'z ishlatiladi?',
    options: [
      { id: 'a', text: 'var' },
      { id: 'b', text: 'let' },
      { id: 'c', text: 'O\'zgaruvchi nomi to\'g\'ridan-to\'g\'ri yoziladi' },
      { id: 'd', text: 'define' },
    ],
  },
  {
    id: 2,
    text: 'Quyidagilardan qaysi biri Python\'da ro\'yxat (list) yaratish usuli?',
    options: [
      { id: 'a', text: 'my_list = {}' },
      { id: 'b', text: 'my_list = []' },
      { id: 'c', text: 'my_list = ()' },
      { id: 'd', text: 'my_list = <>' },
    ],
  },
  {
    id: 3,
    text: 'Python\'da funksiya yaratish uchun qaysi kalit so\'z ishlatiladi?',
    options: [
      { id: 'a', text: 'function' },
      { id: 'b', text: 'func' },
      { id: 'c', text: 'def' },
      { id: 'd', text: 'fn' },
    ],
  },
  {
    id: 4,
    text: 'Python\'da "Hello World" ni konsolga chiqarish uchun qaysi funksiya ishlatiladi?',
    options: [
      { id: 'a', text: 'console.log("Hello World")' },
      { id: 'b', text: 'print("Hello World")' },
      { id: 'c', text: 'echo("Hello World")' },
      { id: 'd', text: 'write("Hello World")' },
    ],
  },
  {
    id: 5,
    text: 'Python\'da tsikl yaratish uchun qaysi kalit so\'zlar ishlatiladi?',
    options: [
      { id: 'a', text: 'for va while' },
      { id: 'b', text: 'loop va repeat' },
      { id: 'c', text: 'each va do' },
      { id: 'd', text: 'iterate va cycle' },
    ],
  },
];

const STORAGE_KEY = 'exam_answers_';

export default function ExamTakePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const exam = location.state?.exam;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState((exam?.duration_minutes || 60) * 60);
  const [isBlurred, setIsBlurred] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [devToolsDetected, setDevToolsDetected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const devToolsCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = STORAGE_KEY + (exam?.id || 'unknown');

  // Apply CSS protections
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Prevent all interactions on exam content */
      [data-exam-protected] {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        pointer-events: auto !important;
      }

      /* Disable extension overlays */
      [role="button"][aria-label*="screenshot"],
      [role="button"][aria-label*="crop"],
      [role="button"][aria-label*="capture"],
      [role="button"][aria-label*="AI"],
      [data-extension] {
        pointer-events: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
      }

      /* Prevent text rendering to clipboard */
      * {
        -webkit-touch-callout: none !important;
        -webkit-user-modify: read-only !important;
      }

      /* Block text selection at pointer level */
      body * {
        cursor: not-allowed !important;
      }

      /* Prevent background images and data URIs */
      img[data-screenshot],
      img[data-capture],
      canvas[data-extension] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Detect Developer Tools
  useEffect(() => {
    const checkDevTools = () => {
      let devToolsOpen = false;

      // Method 1: Check console height
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        devToolsOpen = true;
      }

      // Method 2: Check debugger statement
      const before = performance.now();
      debugger;
      const after = performance.now();
      if (after - before > 10) {
        devToolsOpen = true;
      }

      if (devToolsOpen && !devToolsDetected) {
        setDevToolsDetected(true);
        setIsBlurred(true);
        setWarningMessage('Developer Tools (F12) ochiq! Iltimos, yopib tastahlis');
        setShowWarning(true);
      } else if (!devToolsOpen && devToolsDetected) {
        setDevToolsDetected(false);
        setIsBlurred(false);
        setShowWarning(false);
      }
    };

    // Check immediately
    checkDevTools();

    // Check every 500ms
    devToolsCheckIntervalRef.current = setInterval(checkDevTools, 500);

    return () => {
      if (devToolsCheckIntervalRef.current) {
        clearInterval(devToolsCheckIntervalRef.current);
      }
    };
  }, [devToolsDetected]);

  // Save answers
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(answers));
    }
  }, [answers, storageKey]);

  // Clear answers and navigate away on cheat
  const handleCheatDetected = useCallback((reason: string) => {
    setWarningCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        localStorage.removeItem(storageKey);
        alert('⚠️ Imtihon bekor qilindi!\n\nNoto\'g\'ri harakatlar aniqlandi. Barcha javoblaringiz o\'chirildi.');
        navigate('/dashboard/student/exams');
        return newCount;
      }
      setWarningMessage(reason);
      setShowWarning(true);
      setIsBlurred(true);
      setTimeout(() => { setIsBlurred(false); setShowWarning(false); }, 3000);
      return newCount;
    });
  }, [navigate, storageKey]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Blur screen without warning
  const blurScreenOnly = useCallback(() => {
    setIsBlurred(true);
    setTimeout(() => setIsBlurred(false), 2000);
  }, []);

  // Block F12, right-click, Ctrl+Shift+I, PrintScreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - blur and warn
      if (e.key === 'F12') { 
        e.preventDefault(); 
        handleCheatDetected('F12 tugmasi bosildi'); 
        return; 
      }
      
      // Ctrl key alone (without Shift) - just blur
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && e.key === 'Control') {
        blurScreenOnly();
        return;
      }
      
      // DevTools Ctrl+Shift+I/J - just blur
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) {
        e.preventDefault(); 
        blurScreenOnly();
        return;
      }
      
      // View page source Ctrl+U - just blur
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault(); 
        blurScreenOnly();
        return;
      }
      
      // Print Screen - just blur (no warning)
      if (e.key === 'PrintScreen') {
        e.preventDefault(); 
        blurScreenOnly();
        return;
      }
      
      // Mac screenshot keys - just blur (no warning)
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        e.preventDefault(); 
        blurScreenOnly();
        return;
      }
      
      // Alt+Tab together - blur and warn
      if (e.altKey && e.key === 'Tab') { 
        e.preventDefault();
        handleCheatDetected('Boshqa ilovaga o\'tishga urinildi'); 
        return; 
      }
      
      // Tab alone - just blur
      if (e.key === 'Tab' && !e.altKey) {
        e.preventDefault();
        blurScreenOnly();
        return;
      }
      
      // Alt alone (without Tab) - just blur
      if (e.key === 'Alt') {
        e.preventDefault();
        blurScreenOnly();
        return;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      blurScreenOnly();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
    };
  }, [handleCheatDetected]);

  // Visibility change (tab switch / app switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isFullscreen) {
        handleCheatDetected('Boshqa ilovaga yoki tabga o\'tildi');
      }
    };

    const handleBlur = () => {
      if (isFullscreen) {
        handleCheatDetected('Brauzer oynasi fokusdan chiqdi');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleCheatDetected, isFullscreen]);

  // Fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs && !showFullscreenPrompt) {
        setShowFullscreenPrompt(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [showFullscreenPrompt]);

  // Mask accessibility API and block text selection
  useEffect(() => {
    let isSelecting = false;
    let isDragging = false;

    const handleSelectStart = (e: Event) => {
      // Allow selection on buttons/clickable elements
      const target = e.target as HTMLElement;
      if (target?.tagName === 'BUTTON' || target?.closest('button') || target?.role === 'button') {
        return;
      }
      isSelecting = true;
      e.preventDefault();
      blurScreenOnly();
    };

    const handleSelect = (e: Event) => {
      if (isSelecting) {
        isSelecting = false;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Check if dragging or trying to select
      if (e.buttons > 0) {
        const target = e.target as HTMLElement;
        if (target?.tagName !== 'BUTTON' && !target?.closest('button')) {
          isDragging = true;
          blurScreenOnly();
        }
      } else {
        isDragging = false;
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      blurScreenOnly();
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      blurScreenOnly();
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      blurScreenOnly();
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow button clicks
      if (target?.tagName === 'BUTTON' || target?.closest('button') || target?.role === 'button') {
        return;
      }

      // Block right-click
      if (e.button === 2) {
        e.preventDefault();
        blurScreenOnly();
        return;
      }

      // Detect selection attempt on text
      if (window.getSelection && window.getSelection()!.toString().length > 0) {
        e.preventDefault();
        blurScreenOnly();
      }
    };

    // Mask all text content from accessibility tree
    const maskElement = (elem: HTMLElement) => {
      // Don't mask button content
      if (elem.tagName === 'BUTTON' || elem.role === 'button') {
        return;
      }

      const ariaAttrs = ['aria-label', 'aria-labelledby', 'title'];
      ariaAttrs.forEach(attr => {
        if (elem.hasAttribute(attr)) {
          elem.setAttribute(attr, 'Content hidden for security');
        }
      });
    };

    // Apply masking to all non-button elements
    document.querySelectorAll('*').forEach(elem => {
      if (elem instanceof HTMLElement && elem.tagName !== 'BUTTON') {
        maskElement(elem);
      }
    });

    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('select', handleSelect, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('cut', handleCut, true);
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('mousemove', handleMouseMove, false);

    // Monitor for new elements with text content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement && node.tagName !== 'BUTTON') {
              maskElement(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('select', handleSelect, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('cut', handleCut, true);
      document.removeEventListener('mousedown', handleMouseDown, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('mousemove', handleMouseMove, false);
      observer.disconnect();
    };
  }, [blurScreenOnly]);

  // Block canvas/OCR/AI screenshot attempts and extension communication
  useEffect(() => {
    // Block Canvas toDataURL
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(...args: any[]) {
      blurScreenOnly();
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    };

    // Block Canvas toBlob
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback: BlobCallback | null, ...args: any[]) {
      blurScreenOnly();
      if (callback) callback(null);
    };

    // Block getImageData
    const canvasContextPrototype = CanvasRenderingContext2D.prototype;
    const originalGetImageData = canvasContextPrototype.getImageData;
    canvasContextPrototype.getImageData = function(...args: any[]) {
      blurScreenOnly();
      return new ImageData(1, 1);
    };

    // Block drawImage from other sources
    const originalDrawImage = canvasContextPrototype.drawImage;
    canvasContextPrototype.drawImage = function(...args: any[]) {
      blurScreenOnly();
      return undefined;
    };

    // Block OffscreenCanvas
    if (typeof OffscreenCanvas !== 'undefined') {
      const originalOffscreenCanvasConstructor = OffscreenCanvas;
      (window as any).OffscreenCanvas = function(...args: any[]) {
        blurScreenOnly();
        return new originalOffscreenCanvasConstructor(...args);
      };
    }

    // Block window.screenX/Y and getSelection
    const originalGetSelection = window.getSelection;
    window.getSelection = function() {
      blurScreenOnly();
      return originalGetSelection?.() || null;
    };

    return () => {
      HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
      HTMLCanvasElement.prototype.toBlob = originalToBlob;
      canvasContextPrototype.getImageData = originalGetImageData;
      canvasContextPrototype.drawImage = originalDrawImage;
      window.getSelection = originalGetSelection;
    };
  }, [blurScreenOnly]);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenPrompt(false);
    } catch {
      setShowFullscreenPrompt(false);
    }
  };

  const handleAnswer = (questionId: number, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const toggleFlag = (qId: number) => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  const handleSubmit = () => {
    localStorage.removeItem(storageKey);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    navigate(`/dashboard/student/exam/${exam?.id}/results`, { state: { exam } });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = MOCK_QUESTIONS.length;
  const q = MOCK_QUESTIONS[currentQuestion];
  const isUrgent = timeLeft < 300;

  if (!exam) {
    navigate('/dashboard/student/exams');
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-[9999] bg-background flex flex-col transition-all duration-300 ${isBlurred ? 'blur-xl' : ''}`}
      style={{ 
        userSelect: 'none', 
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserModify: 'read-only',
        MozUserSelect: 'none',
      } as React.CSSProperties}
      onContextMenu={(e) => {
        e.preventDefault();
        blurScreenOnly();
      }}
      onDragStart={(e) => {
        e.preventDefault();
        blurScreenOnly();
      }}
      onCut={(e) => {
        e.preventDefault();
        blurScreenOnly();
      }}
      onCopy={(e) => {
        e.preventDefault();
        blurScreenOnly();
      }}
    >
      {/* Fullscreen prompt overlay */}
      {showFullscreenPrompt && !devToolsDetected && (
        <div className="absolute inset-0 z-[10000] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-5">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Maximize className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">To'liq ekran rejimi</h2>
                <p className="text-muted-foreground text-sm">
                  Imtihonni boshlash uchun to'liq ekran rejimiga o'tish talab etiladi. 
                  Bu xavfsizlik chorasi hisoblanadi.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border text-left">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                  <Shield className="h-3.5 w-3.5" />
                  Xavfsizlik qoidalari
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• Boshqa sahifalarga o'tish taqiqlanadi</li>
                  <li>• Screenshot va ekran yozish cheklangan</li>
                  <li>• DevTools (F12) ishlatish taqiqlanadi</li>
                  <li>• 3 marta qoidabuzarlik — imtihon bekor</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={enterFullscreen} className="w-full gap-2">
                  <Maximize className="h-4 w-4" />
                  To'liq ekranga o'tish
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/dashboard/student/exams')}
                  className="text-muted-foreground"
                >
                  Orqaga qaytish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Warning overlay */}
      {showWarning && (
        <div className="absolute inset-0 z-[10001] bg-destructive/20 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="max-w-sm w-full border-destructive/50">
            <CardContent className="p-6 text-center space-y-3">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h3 className="text-lg font-bold text-destructive">Ogohlantirish!</h3>
              <p className="text-sm text-muted-foreground">{warningMessage}</p>
              <Badge variant="outline" className="text-destructive border-destructive/30">
                {warningCount}/3 ogohlantirish
              </Badge>
              <p className="text-xs text-muted-foreground">3 ta ogohlantirishdan keyin imtihon bekor qilinadi</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground text-sm truncate">{exam.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`font-mono text-sm ${isUrgent ? 'text-destructive border-destructive/50 animate-pulse' : 'text-foreground'}`}
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            {formatTime(timeLeft)}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {answeredCount}/{totalQuestions}
          </Badge>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Question navigator (sidebar on desktop, bottom on mobile) */}
        <div className="hidden lg:flex flex-col w-56 border-r border-border bg-muted/30 p-4 shrink-0">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Savollar</p>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {MOCK_QUESTIONS.map((mq, i) => (
              <button
                key={mq.id}
                onClick={() => setCurrentQuestion(i)}
                className={`h-9 w-9 rounded-md text-xs font-medium transition-colors relative
                  ${currentQuestion === i 
                    ? 'bg-primary text-primary-foreground' 
                    : answers[mq.id] 
                      ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30' 
                      : 'bg-card border border-border text-muted-foreground hover:bg-accent'
                  }`}
              >
                {i + 1}
                {flagged.has(mq.id) && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-500" />
                )}
              </button>
            ))}
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground mt-auto">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-green-500/15 border border-green-500/30" />
              Javob berilgan
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-card border border-border" />
              Javob berilmagan
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-card border border-border relative">
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-yellow-500" />
              </span>
              Belgilangan
            </div>
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {devToolsDetected ? (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-sm w-full border-destructive/50">
                <CardContent className="p-6 text-center space-y-3">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
                  <h3 className="text-lg font-bold text-destructive">Developer Tools Ochiq</h3>
                  <p className="text-sm text-muted-foreground">
                    Imtihonni davom ettirish uchun Developer Tools (F12) ni yoping.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Iltimos, F12 tugmasini bosib Developer Tools oynasini yoping va savollar ko'rinadi.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Question header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Savol {currentQuestion + 1}/{totalQuestions}
                  </span>
                  <h2 className="text-lg font-semibold text-foreground mt-1">{q.text}</h2>
                </div>
                <Button 
                  variant={flagged.has(q.id) ? 'default' : 'outline'} 
                  size="icon" 
                  className="shrink-0 h-8 w-8"
                  onClick={() => toggleFlag(q.id)}
                >
                  <Flag className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.id;
                  return (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer(q.id, opt.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/5 shadow-sm' 
                      : 'border-border bg-card hover:border-primary/30 hover:bg-accent/50'
                    }`}
                  data-exam-protected="true"
                  style={{ pointerEvents: 'auto', userSelect: 'none' }}
                >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0
                          ${isSelected 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {opt.id.toUpperCase()}
                        </span>
                        <span className={`text-sm ${isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {opt.text}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-card px-4 py-3 shrink-0">
        {/* Mobile question nav */}
        <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
          {MOCK_QUESTIONS.map((mq, i) => (
            <button
              key={mq.id}
              onClick={() => setCurrentQuestion(i)}
              className={`h-8 min-w-[2rem] px-2 rounded-md text-xs font-medium transition-colors shrink-0 relative
                ${currentQuestion === i 
                  ? 'bg-primary text-primary-foreground' 
                  : answers[mq.id] 
                    ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30' 
                    : 'bg-muted text-muted-foreground'
                }`}
            >
              {i + 1}
              {flagged.has(mq.id) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-500" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={currentQuestion === 0 || devToolsDetected}
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            className="gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Oldingi</span>
          </Button>

          <div className="flex items-center gap-2">
            {currentQuestion < totalQuestions - 1 ? (
              <Button
                size="sm"
                disabled={devToolsDetected}
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="gap-1.5"
              >
                <span className="hidden sm:inline">Keyingi</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={devToolsDetected}
                onClick={() => setShowConfirmSubmit(true)}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                Yakunlash
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Submit confirmation */}
      {showConfirmSubmit && (
        <div className="absolute inset-0 z-[10002] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-foreground text-center">Imtihonni yakunlash</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Javob berilgan: <strong className="text-foreground">{answeredCount}/{totalQuestions}</strong></p>
                {answeredCount < totalQuestions && (
                  <p className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    {totalQuestions - answeredCount} ta savolga javob berilmagan
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirmSubmit(false)}>
                  <X className="h-4 w-4 mr-1.5" />
                  Bekor qilish
                </Button>
                <Button className="flex-1" onClick={handleSubmit}>
                  <Send className="h-4 w-4 mr-1.5" />
                  Topshirish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
