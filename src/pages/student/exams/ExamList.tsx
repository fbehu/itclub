import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Clock, Calendar, Hash, Shield, AlertTriangle, 
  Play, Lock, CheckCircle, Timer, FileText, ChevronRight,
  GraduationCap, Users, Sparkles
} from 'lucide-react';
import { format, isBefore, isAfter, differenceInMinutes } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

export interface Exam {
  id: number;
  title: string;
  course_name: string;
  hashtag: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_questions: number;
  status: 'not_started' | 'available' | 'finished';
  rules: string[];
}

const MOCK_EXAMS: Exam[] = [
  {
    id: 1,
    title: 'Python asoslari — Yakuniy imtihon',
    course_name: 'Python dasturlash',
    hashtag: '#python_final_2024',
    start_time: new Date(Date.now() - 30 * 60000).toISOString(),
    end_time: new Date(Date.now() + 90 * 60000).toISOString(),
    duration_minutes: 60,
    total_questions: 30,
    status: 'available',
    rules: [
      'Imtihon vaqtida boshqa sahifalarga o\'tish taqiqlanadi',
      'Ekran yozish va screenshot olish cheklangan',
      'Imtihondan chiqib ketish javoblarni o\'chiradi',
      'Har bir savolga faqat 1 ta javob tanlash mumkin',
    ],
  },
  {
    id: 2,
    title: 'Web dasturlash — Oraliq nazorat',
    course_name: 'Frontend Development',
    hashtag: '#frontend_mid_2024',
    start_time: new Date(Date.now() + 2 * 3600000).toISOString(),
    end_time: new Date(Date.now() + 4 * 3600000).toISOString(),
    duration_minutes: 45,
    total_questions: 25,
    status: 'not_started',
    rules: [
      'Imtihon vaqtida boshqa sahifalarga o\'tish taqiqlanadi',
      'Har bir savolga 1.5 daqiqa vaqt beriladi',
    ],
  },
  {
    id: 3,
    title: 'Ma\'lumotlar bazasi — Yakuniy test',
    course_name: 'SQL & Database',
    hashtag: '#sql_final_2024',
    start_time: new Date(Date.now() - 5 * 3600000).toISOString(),
    end_time: new Date(Date.now() - 3 * 3600000).toISOString(),
    duration_minutes: 90,
    total_questions: 40,
    status: 'finished',
    rules: [],
  },
  {
    id: 4,
    title: 'Algoritm va ma\'lumot tuzilmalari',
    course_name: 'Computer Science',
    hashtag: '#algo_2024',
    start_time: new Date(Date.now() + 24 * 3600000).toISOString(),
    end_time: new Date(Date.now() + 26 * 3600000).toISOString(),
    duration_minutes: 120,
    total_questions: 50,
    status: 'not_started',
    rules: [
      'Imtihon vaqtida boshqa sahifalarga o\'tish taqiqlanadi',
      'Ekran yozish va screenshot olish cheklangan',
      'Kalkulyator ishlatish mumkin emas',
    ],
  },
];

const statusConfig = {
  not_started: { 
    label: 'Boshlanmagan', 
    icon: Lock,
    bgClass: 'bg-muted/50',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    accentColor: 'border-l-muted-foreground/40',
  },
  available: { 
    label: 'Mavjud', 
    icon: Play,
    bgClass: 'bg-primary/[0.02]',
    badgeClass: 'bg-primary/10 text-primary border-primary/30',
    accentColor: 'border-l-primary',
  },
  finished: { 
    label: 'Yakunlangan', 
    icon: CheckCircle,
    bgClass: 'bg-muted/30',
    badgeClass: 'bg-secondary text-secondary-foreground border-border',
    accentColor: 'border-l-muted-foreground/30',
  },
};

function getTimeInfo(exam: Exam) {
  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);

  if (isAfter(now, end)) return { text: 'Vaqt tugagan', color: 'text-muted-foreground', urgent: false };
  if (isBefore(now, start)) {
    const mins = differenceInMinutes(start, now);
    if (mins < 60) return { text: `${mins} daqiqada boshlanadi`, color: 'text-primary', urgent: true };
    const hours = Math.floor(mins / 60);
    if (hours < 24) return { text: `${hours} soatda boshlanadi`, color: 'text-muted-foreground', urgent: false };
    return { text: `${Math.floor(hours / 24)} kunda boshlanadi`, color: 'text-muted-foreground', urgent: false };
  }
  const remaining = differenceInMinutes(end, now);
  return { text: `${remaining} daqiqa qoldi`, color: 'text-primary', urgent: true };
}

export default function ExamList() {
  const [exams] = useState<Exam[]>(MOCK_EXAMS);
  const navigate = useNavigate();

  const handleStartExam = (exam: Exam) => {
    navigate(`/dashboard/student/exam/${exam.id}/take`, { state: { exam } });
  };

  const availableExams = exams.filter(e => e.status === 'available');
  const upcomingExams = exams.filter(e => e.status === 'not_started');
  const finishedExams = exams.filter(e => e.status === 'finished');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Imtihonlar</h1>
              <p className="text-muted-foreground text-sm">Sizga tayinlangan barcha imtihonlar</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard/student/exam-results')}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Natijalar
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{availableExams.length}</p>
                <p className="text-xs text-muted-foreground">Mavjud</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingExams.length}</p>
                <p className="text-xs text-muted-foreground">Kutilmoqda</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{finishedExams.length}</p>
                <p className="text-xs text-muted-foreground">Yakunlangan</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available exams */}
        {availableExams.length > 0 && (
          <ExamSection title="Hozir mavjud" exams={availableExams} onStart={handleStartExam} navigate={navigate} />
        )}

        {/* Upcoming */}
        {upcomingExams.length > 0 && (
          <ExamSection title="Kutilmoqda" exams={upcomingExams} onStart={handleStartExam} navigate={navigate} />
        )}

        {/* Finished */}
        {finishedExams.length > 0 && (
          <ExamSection title="Yakunlangan" exams={finishedExams} onStart={handleStartExam} navigate={navigate} />
        )}
      </div>
    </DashboardLayout>
  );
}

function ExamSection({ title, exams, onStart, navigate }: { 
  title: string; 
  exams: Exam[]; 
  onStart: (exam: Exam) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {exams.map(exam => (
          <ExamCardItem key={exam.id} exam={exam} onStart={onStart} navigate={navigate} />
        ))}
      </div>
    </div>
  );
}

function ExamCardItem({ exam, onStart, navigate }: { 
  exam: Exam; 
  onStart: (exam: Exam) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const cfg = statusConfig[exam.status];
  const timeInfo = getTimeInfo(exam);
  const StatusIcon = cfg.icon;
  const now = new Date();
  const canStart = exam.status === 'available' && 
    !isBefore(now, new Date(exam.start_time)) && 
    !isAfter(now, new Date(exam.end_time));

  return (
    <Card className={`overflow-hidden border-l-4 ${cfg.accentColor} hover:shadow-lg transition-all duration-200`}>
      <CardContent className="p-0">
        <div className={`p-5 space-y-4 ${cfg.bgClass}`}>
          {/* Top: title + badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="font-semibold text-foreground leading-tight">{exam.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  {exam.course_name}
                </span>
                <span className="text-xs text-primary/70 font-medium">
                  {exam.hashtag}
                </span>
              </div>
            </div>
            <Badge variant="outline" className={`shrink-0 text-xs ${cfg.badgeClass}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {cfg.label}
            </Badge>
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(exam.start_time), 'dd.MM.yyyy')}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(exam.start_time), 'HH:mm')} – {format(new Date(exam.end_time), 'HH:mm')}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {exam.duration_minutes} daq
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              {exam.total_questions} savol
            </span>
          </div>

          {/* Time status */}
          {timeInfo.urgent && (
            <div className={`flex items-center gap-1.5 text-xs font-semibold ${timeInfo.color}`}>
              <AlertTriangle className="h-3.5 w-3.5" />
              {timeInfo.text}
            </div>
          )}
          {!timeInfo.urgent && exam.status !== 'available' && (
            <div className={`flex items-center gap-1.5 text-xs ${timeInfo.color}`}>
              <Clock className="h-3.5 w-3.5" />
              {timeInfo.text}
            </div>
          )}

          {/* Rules */}
          {exam.rules.length > 0 && exam.status !== 'finished' && (
            <div className="p-3 rounded-lg bg-card/80 border border-border">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                <Shield className="h-3 w-3" />
                Qoidalar
              </div>
              <ul className="space-y-1">
                {exam.rules.map((rule, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-muted-foreground/50 mt-0.5 shrink-0">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action */}
          <div className="pt-1">
            {exam.status === 'finished' ? (
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => navigate('/dashboard/student/exam-results')}
              >
                <CheckCircle className="h-4 w-4" />
                Natijani ko'rish
              </Button>
            ) : canStart ? (
              <Button 
                size="sm" 
                className="w-full gap-2"
                onClick={() => onStart(exam)}
              >
                <Play className="h-4 w-4" />
                Imtihonni boshlash
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                disabled 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
              >
                <Lock className="h-4 w-4" />
                {exam.status === 'not_started' ? 'Vaqti kelmagan' : 'Vaqt tugagan'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
