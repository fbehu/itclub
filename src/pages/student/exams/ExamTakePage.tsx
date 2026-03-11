import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, Clock, ChevronLeft, ChevronRight, 
  Send, Shield, Maximize, X, Flag
} from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import {
  buildExamSessionWebSocketUrl,
  getExamSessionKey,
  getOrCreateExamDeviceId,
  removeExamSessionKey,
  setExamSessionKey,
} from '@/lib/examSession';
import { API_ENDPOINTS } from '@/config/api';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: number;
  text: string;
  options: { id: number; text: string }[];
}

interface ApiQuestion {
  id: number;
  text: string;
  answers?: Array<{
    id: number;
    text: string;
  }>;
}

interface ExamState {
  id: number;
  title: string;
  duration_minutes: number;
}

interface ApiStudentExam {
  id: number;
  exam: number;
  status: 'in_progress' | 'submitted' | 'graded';
  exam_session_key?: string;
}

interface ExamLocationState {
  exam?: ExamState;
  studentExamId?: number;
  examSessionKey?: string | null;
}

interface SessionStatusMessage {
  type: 'session_status';
  expired: boolean;
  status?: string;
  student_exam_id?: number;
  reason?: string;
  message?: string;
  new_device?: string;
  session_updated_at?: string;
  server_time?: string;
}

interface ForceLogoutMessage {
  type: 'force_logout';
  reason?: string;
  message?: string;
}

const STORAGE_KEY = 'exam_answers_';
const SESSION_CONFLICT_FALLBACK = "Sessiya boshqa qurilmaga o'tgan. Imtihonni qayta ochib davom eting.";

export default function ExamTakePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId } = useParams();
  const { toast } = useToast();
  const locationState = (location.state as ExamLocationState | null) || null;
  const exam = locationState?.exam;
  const stateStudentExamId = locationState?.studentExamId;
  const stateExamSessionKey = locationState?.examSessionKey;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentExamId, setStudentExamId] = useState<number | null>(stateStudentExamId || null);
  const [examSessionKey, setExamSessionKeyState] = useState<string | null>(
    stateExamSessionKey || getExamSessionKey(stateStudentExamId ?? null)
  );
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
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const devToolsCheckIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionSocketRef = useRef<WebSocket | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitRef = useRef<() => void>(() => {});
  const sessionConflictHandledRef = useRef(false);

  const resolvedExamId = exam?.id || (examId ? Number(examId) : null);
  const storageKey = STORAGE_KEY + (resolvedExamId || 'unknown');

  const stopSessionMonitoring = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    if (sessionSocketRef.current) {
      const socket = sessionSocketRef.current;
      sessionSocketRef.current = null;

      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    }
  }, []);

  const handleSessionConflict = useCallback((detail?: string, targetStudentExamId?: number | null) => {
    if (sessionConflictHandledRef.current) {
      return;
    }
    sessionConflictHandledRef.current = true;

    const message = detail || SESSION_CONFLICT_FALLBACK;
    const resolvedStudentExamId = targetStudentExamId ?? studentExamId;

    if (resolvedStudentExamId) {
      removeExamSessionKey(resolvedStudentExamId);
    }

    setSessionTerminated(true);
    stopSessionMonitoring();
    setQuestionError(message);
    toast({
      variant: 'destructive',
      title: 'Sessiya tugatildi',
      description: message,
    });
    navigate('/dashboard/student/exams');
  }, [navigate, stopSessionMonitoring, studentExamId, toast]);

  const handleForceLogout = useCallback((detail?: string) => {
    setSessionTerminated(true);
    stopSessionMonitoring();

    if (studentExamId) {
      removeExamSessionKey(studentExamId);
    }

    const message = detail || "Sizning akkountingizga boshqa qurilmadan kirildi. Iltimos, qayta login qiling.";
    alert(message);
    toast({
      variant: 'destructive',
      title: 'Majburiy logout',
      description: message,
    });

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    navigate('/login');
  }, [navigate, stopSessionMonitoring, studentExamId, toast]);

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

  useEffect(() => {
    const ensureStudentExamAndQuestions = async () => {
      if (!resolvedExamId) {
        setLoadingQuestions(false);
        setQuestionError('Imtihon ID topilmadi.');
        return;
      }

      try {
        const deviceId = getOrCreateExamDeviceId();
        let currentStudentExamId = studentExamId;
        let currentExamSessionKey = examSessionKey || getExamSessionKey(currentStudentExamId);

        if (!currentStudentExamId) {
          const listResponse = await authFetch(API_ENDPOINTS.STUDENT_EXAMS);
          const listData = await listResponse.json().catch(() => []);

          if (listResponse.ok) {
            const rows: ApiStudentExam[] = Array.isArray(listData) ? listData : (listData.results || []);
            const inProgress = rows.find((row) => row.exam === resolvedExamId && row.status === 'in_progress');
            if (inProgress) {
              currentStudentExamId = inProgress.id;
              currentExamSessionKey = inProgress.exam_session_key || getExamSessionKey(inProgress.id);
            }
          }
        }

        if (currentStudentExamId && !currentExamSessionKey) {
          const detailResponse = await authFetch(API_ENDPOINTS.STUDENT_EXAM_DETAIL(currentStudentExamId), {
            headers: {
              'X-Device-Id': deviceId,
            },
          });
          const detailData = await detailResponse.json().catch(() => ({}));

          if (detailResponse.status === 409) {
            handleSessionConflict(detailData?.detail || SESSION_CONFLICT_FALLBACK, currentStudentExamId);
            return;
          }

          if (!detailResponse.ok) {
            throw new Error(detailData?.detail || 'Imtihon sessiyasi topilmadi.');
          }

          currentExamSessionKey = detailData?.exam_session_key || null;
        }

        if (!currentStudentExamId) {
          const createResponse = await authFetch(API_ENDPOINTS.STUDENT_EXAMS, {
            method: 'POST',
            headers: {
              'X-Device-Id': deviceId,
            },
            body: JSON.stringify({ exam: resolvedExamId }),
          });
          const createData = await createResponse.json().catch(() => ({}));

          if (createResponse.status === 409) {
            handleSessionConflict(createData?.detail || SESSION_CONFLICT_FALLBACK);
            return;
          }

          if (!createResponse.ok) {
            throw new Error(createData?.detail || 'Imtihonni boshlashda xatolik yuz berdi.');
          }

          currentStudentExamId = createData.id;
          currentExamSessionKey = createData?.exam_session_key || null;

          if (createData?.session_replaced) {
            toast({
              title: 'Sessiya yangilandi',
              description: 'Imtihon sessiyasi ushbu qurilmaga ko‘chirildi.',
            });
          }
        }

        if (!currentStudentExamId || !currentExamSessionKey) {
          throw new Error('Imtihon sessiyasi olinmadi. Qaytadan boshlang.');
        }

        setStudentExamId(currentStudentExamId);
        setExamSessionKeyState(currentExamSessionKey);
        setExamSessionKey(currentStudentExamId, currentExamSessionKey);

        const questionResponse = await authFetch(API_ENDPOINTS.STUDENT_EXAM_QUESTIONS(currentStudentExamId), {
          headers: {
            'X-Exam-Session-Key': currentExamSessionKey,
          },
        });
        const questionData = await questionResponse.json().catch(() => []);

        if (questionResponse.status === 409) {
          handleSessionConflict(questionData?.detail || SESSION_CONFLICT_FALLBACK, currentStudentExamId);
          return;
        }

        if (!questionResponse.ok) {
          throw new Error(questionData?.detail || 'Savollarni olib bo‘lmadi.');
        }

        const rawQuestions: ApiQuestion[] = Array.isArray(questionData)
          ? questionData
          : (questionData.results || []);

        const mappedQuestions: Question[] = rawQuestions.map((item) => ({
          id: item.id,
          text: item.text,
          options: (item.answers || []).map((ans) => ({
            id: ans.id,
            text: ans.text,
          })),
        }));

        setQuestions(mappedQuestions);

        const savedAnswers = localStorage.getItem(storageKey);
        if (savedAnswers) {
          try {
            const parsed = JSON.parse(savedAnswers);
            if (parsed && typeof parsed === 'object') {
              setAnswers(parsed);
            }
          } catch {
            localStorage.removeItem(storageKey);
          }
        }
      } catch (error) {
        console.error('Exam questions load error:', error);
        const message = error instanceof Error ? error.message : 'Imtihon savollarini yuklashda xatolik.';
        setQuestionError(message);
        toast({
          variant: 'destructive',
          title: 'Xatolik',
          description: message,
        });
      } finally {
        setLoadingQuestions(false);
      }
    };

    ensureStudentExamAndQuestions();
  }, [examSessionKey, handleSessionConflict, resolvedExamId, storageKey, studentExamId, toast]);

  useEffect(() => {
    if (!studentExamId || !examSessionKey || sessionTerminated) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      return;
    }

    stopSessionMonitoring();
    const socketUrl = buildExamSessionWebSocketUrl(studentExamId, token, examSessionKey);

    try {
      const socket = new WebSocket(socketUrl);
      sessionSocketRef.current = socket;

      const sendHeartbeat = () => {
        if (socket.readyState !== WebSocket.OPEN) {
          return;
        }

        socket.send(JSON.stringify({
          type: 'heartbeat',
          session_key: examSessionKey,
        }));
      };

      socket.onopen = () => {
        sendHeartbeat();
        heartbeatIntervalRef.current = setInterval(sendHeartbeat, 3000);
      };

      socket.onmessage = (event) => {
        let message: SessionStatusMessage | ForceLogoutMessage | null = null;

        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!message?.type) {
          return;
        }

        if (sessionConflictHandledRef.current) {
          return;
        }

        if (message.type === 'session_status' && message.expired) {
          const conflictMessage = message.message || SESSION_CONFLICT_FALLBACK;
          if (message.new_device) {
            alert(`${conflictMessage}\nYangi qurilma: ${message.new_device}`);
          } else {
            alert(conflictMessage);
          }

          const fullMessage = message.new_device
            ? `${conflictMessage} (${message.new_device})`
            : conflictMessage;
          handleSessionConflict(fullMessage, studentExamId);
          return;
        }

        if (message.type === 'force_logout') {
          handleForceLogout(message.message);
        }
      };

      socket.onclose = () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
      };
    } catch (error) {
      console.error('Exam session websocket error:', error);
    }

    return () => {
      stopSessionMonitoring();
    };
  }, [
    examSessionKey,
    handleForceLogout,
    handleSessionConflict,
    sessionTerminated,
    stopSessionMonitoring,
    studentExamId,
  ]);

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

  useEffect(() => {
    if (questions.length > 0 && currentQuestion >= questions.length) {
      setCurrentQuestion(0);
    }
  }, [questions.length, currentQuestion]);

  // Clear answers and navigate away on cheat
  const handleCheatDetected = useCallback((reason: string) => {
    setWarningCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        localStorage.removeItem(storageKey);
        setSessionTerminated(true);
        stopSessionMonitoring();
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
  }, [navigate, storageKey, stopSessionMonitoring]);

  // Timer
  useEffect(() => {
    if (sessionTerminated) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          submitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionTerminated]);

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
      (window as any).OffscreenCanvas = function(width: number, height: number) {
        blurScreenOnly();
        return new originalOffscreenCanvasConstructor(width, height);
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

  const handleAnswer = (questionId: number, optionId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const toggleFlag = (qId: number) => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(qId) ? next.delete(qId) : next.add(qId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (sessionTerminated) {
      return;
    }

    if (!studentExamId) {
      toast({
        variant: 'destructive',
        title: 'Xatolik',
        description: 'Student exam ID topilmadi. Qaytadan urinib ko‘ring.',
      });
      return;
    }

    const currentSessionKey = examSessionKey || getExamSessionKey(studentExamId);
    if (!currentSessionKey) {
      setSessionTerminated(true);
      stopSessionMonitoring();
      toast({
        variant: 'destructive',
        title: 'Sessiya topilmadi',
        description: 'Imtihon sessiyasi yo‘qolgan. Imtihonni qayta oching.',
      });
      navigate('/dashboard/student/exams');
      return;
    }

    setIsSubmitting(true);

    try {
      const answerEntries = Object.entries(answers);
      for (const [questionId, selectedAnswerId] of answerEntries) {
        const answerResponse = await authFetch(API_ENDPOINTS.STUDENT_ANSWERS, {
          method: 'POST',
          headers: {
            'X-Exam-Session-Key': currentSessionKey,
          },
          body: JSON.stringify({
            student_exam: studentExamId,
            question: Number(questionId),
            selected_answer: selectedAnswerId,
            text_answer: '',
          }),
        });

        if (answerResponse.status === 409) {
          const conflictData = await answerResponse.json().catch(() => ({}));
          handleSessionConflict(conflictData?.detail || SESSION_CONFLICT_FALLBACK, studentExamId);
          return;
        }

        if (!answerResponse.ok) {
          const answerError = await answerResponse.json().catch(() => ({}));
          const detailText = String(answerError?.detail || '');
          const normalizedDetail = detailText.toLowerCase();

          // Duplicate yoki "savol sizga tayinlanmadi" holatlarida qolganlarini davom ettiramiz.
          const canSkip =
            (answerResponse.status === 400 && normalizedDetail.includes('already')) ||
            (answerResponse.status === 403 && normalizedDetail.includes('tayinlanmadi'));

          if (!canSkip) {
            throw new Error(detailText || 'Javob yuborishda xatolik yuz berdi.');
          }
        }
      }

      const submitResponse = await authFetch(API_ENDPOINTS.STUDENT_EXAM_SUBMIT(studentExamId), {
        method: 'POST',
        headers: {
          'X-Exam-Session-Key': currentSessionKey,
        },
        body: JSON.stringify({}),
      });
      const submitData = await submitResponse.json().catch(() => ({}));

      if (submitResponse.status === 409) {
        handleSessionConflict(submitData?.detail || SESSION_CONFLICT_FALLBACK, studentExamId);
        return;
      }

      if (!submitResponse.ok) {
        throw new Error(submitData?.detail || 'Imtihonni topshirishda xatolik yuz berdi.');
      }

      localStorage.removeItem(storageKey);
      removeExamSessionKey(studentExamId);
      setSessionTerminated(true);
      stopSessionMonitoring();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      navigate(`/dashboard/student/exam/${studentExamId}/results`, {
        state: { exam, result: submitData },
      });
    } catch (error) {
      console.error('Exam submit error:', error);
      toast({
        variant: 'destructive',
        title: 'Topshirishda xatolik',
        description: error instanceof Error ? error.message : 'Imtihonni topshirib bo‘lmadi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    submitRef.current = () => {
      void handleSubmit();
    };
  }, [handleSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const q = questions[currentQuestion];
  const isUrgent = timeLeft < 300;

  useEffect(() => {
    if (!exam) {
      navigate('/dashboard/student/exams');
    }
  }, [exam, navigate]);

  if (!exam) {
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
            {questions.map((mq, i) => (
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
          {loadingQuestions ? (
            <div className="max-w-2xl mx-auto space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : questionError ? (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md w-full border-destructive/40">
                <CardContent className="p-6 text-center space-y-3">
                  <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
                  <h3 className="text-lg font-semibold text-destructive">Savollar yuklanmadi</h3>
                  <p className="text-sm text-muted-foreground">{questionError}</p>
                </CardContent>
              </Card>
            </div>
          ) : devToolsDetected ? (
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
          ) : q ? (
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
                {q.options.map((opt, optionIndex) => {
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
                          {String.fromCharCode(65 + optionIndex)}
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
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Savollar topilmadi</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-card px-4 py-3 shrink-0">
        {/* Mobile question nav */}
        <div className="flex lg:hidden gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-hide">
          {questions.map((mq, i) => (
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
            disabled={currentQuestion === 0 || devToolsDetected || loadingQuestions || totalQuestions === 0}
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
                disabled={devToolsDetected || loadingQuestions || totalQuestions === 0}
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="gap-1.5"
              >
                <span className="hidden sm:inline">Keyingi</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={devToolsDetected || loadingQuestions || totalQuestions === 0 || isSubmitting}
                onClick={() => setShowConfirmSubmit(true)}
                className="gap-1.5"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Topshirilmoqda...' : 'Yakunlash'}
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
                <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-1.5" />
                  {isSubmitting ? 'Topshirilmoqda...' : 'Topshirish'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
