import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, Clock, Calendar, Hash, Shield, AlertTriangle, 
  Play, Lock, CheckCircle, Timer, FileText, ChevronRight 
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
    className: 'bg-muted text-muted-foreground border-border' 
  },
  available: { 
    label: 'Mavjud', 
    icon: Play,
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30' 
  },
  finished: { 
    label: 'Yakunlangan', 
    icon: CheckCircle,
    className: 'bg-secondary text-secondary-foreground border-border' 
  },
};

function getTimeInfo(exam: Exam) {
  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);

  if (isAfter(now, end)) return { text: 'Vaqt tugagan', color: 'text-muted-foreground' };
  if (isBefore(now, start)) {
    const mins = differenceInMinutes(start, now);
    if (mins < 60) return { text: `${mins} daqiqada boshlanadi`, color: 'text-yellow-600 dark:text-yellow-400' };
    const hours = Math.floor(mins / 60);
    if (hours < 24) return { text: `${hours} soatda boshlanadi`, color: 'text-muted-foreground' };
    return { text: `${Math.floor(hours / 24)} kunda boshlanadi`, color: 'text-muted-foreground' };
  }
  const remaining = differenceInMinutes(end, now);
  return { text: `${remaining} daqiqa qoldi`, color: 'text-green-600 dark:text-green-400' };
}

export default function ExamList() {
  const [exams] = useState<Exam[]>(MOCK_EXAMS);
  const navigate = useNavigate();

  const handleStartExam = (exam: Exam) => {
    navigate(`/dashboard/student/exam/${exam.id}/take`, { state: { exam } });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Imtihonlar</h1>
            <p className="text-muted-foreground text-sm mt-1">Sizga tayinlangan barcha imtihonlar</p>
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

        <div className="space-y-4">
          {exams.map(exam => {
            const cfg = statusConfig[exam.status];
            const timeInfo = getTimeInfo(exam);
            const StatusIcon = cfg.icon;
            const now = new Date();
            const canStart = exam.status === 'available' && 
              !isBefore(now, new Date(exam.start_time)) && 
              !isAfter(now, new Date(exam.end_time));

            return (
              <Card key={exam.id} className="overflow-hidden hover:shadow-md transition-all">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Main info */}
                    <div className="flex-1 p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground text-lg">{exam.title}</h3>
                            <Badge variant="outline" className={cfg.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {cfg.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <BookOpen className="h-3.5 w-3.5" />
                              {exam.course_name}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-primary/70 font-medium">
                              <Hash className="h-3.5 w-3.5" />
                              {exam.hashtag}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Time & details */}
                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(new Date(exam.start_time), 'dd.MM.yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {format(new Date(exam.start_time), 'HH:mm')} – {format(new Date(exam.end_time), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5" />
                          <span>{exam.duration_minutes} daqiqa</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{exam.total_questions} ta savol</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-medium ${timeInfo.color}`}>
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>{timeInfo.text}</span>
                        </div>
                      </div>

                      {/* Rules */}
                      {exam.rules.length > 0 && exam.status !== 'finished' && (
                        <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-1.5">
                            <Shield className="h-3.5 w-3.5" />
                            Qoidalar
                          </div>
                          <ul className="space-y-1">
                            {exam.rules.map((rule, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-muted-foreground/60 mt-0.5">•</span>
                                {rule}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Action panel */}
                    <div className="flex items-center justify-end p-5 lg:border-l border-t lg:border-t-0 border-border bg-muted/20 lg:w-48">
                      {exam.status === 'finished' ? (
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="gap-2 w-full lg:w-auto"
                          onClick={() => navigate('/dashboard/student/exam-results')}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Natijani ko'rish
                        </Button>
                      ) : canStart ? (
                        <Button 
                          size="sm" 
                          className="gap-2 w-full lg:w-auto"
                          onClick={() => handleStartExam(exam)}
                        >
                          <Play className="h-4 w-4" />
                          Boshlash
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          disabled 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 w-full lg:w-auto"
                        >
                          <Lock className="h-4 w-4" />
                          {exam.status === 'not_started' ? 'Kutilmoqda' : 'Vaqt tugagan'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
