import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy, CheckCircle, XCircle, Clock,
  ChevronLeft, FileX
} from 'lucide-react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentAnswerDetail {
  id: number;
  question: number;
  points_earned: number | null;
}

interface StudentExamDetail {
  id: number;
  exam_title: string;
  status: 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  passed: boolean | null;
  started_at: string;
  completed_at: string | null;
  answers: StudentAnswerDetail[];
}

export default function ExamResultsDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { examId } = useParams();

  const stateResult = (location.state as { result?: StudentExamDetail })?.result;

  const [result, setResult] = useState<StudentExamDetail | null>(stateResult || null);
  const [loading, setLoading] = useState(!stateResult);

  useEffect(() => {
    const targetId = examId || stateResult?.id;
    if (!targetId) {
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const response = await authFetch(API_ENDPOINTS.STUDENT_EXAM_DETAIL(targetId));
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || 'Natija topilmadi');
        }

        setResult(data);
      } catch (error) {
        console.error('Failed to fetch exam result detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [examId, stateResult?.id]);

  const stats = useMemo(() => {
    if (!result) {
      return {
        total: 0,
        correct: 0,
        incorrect: 0,
        submittedAt: null as string | null,
        timeTaken: 0,
      };
    }

    const total = result.answers?.length || 0;
    const correct = (result.answers || []).filter((item) => (item.points_earned || 0) > 0).length;
    const incorrect = Math.max(total - correct, 0);
    const submittedAt = result.completed_at || result.started_at;
    const timeTaken = result.completed_at
      ? Math.max(1, Math.floor((new Date(result.completed_at).getTime() - new Date(result.started_at).getTime()) / 60000))
      : 0;

    return { total, correct, incorrect, submittedAt, timeTaken };
  }, [result]);

  const getScoreStatus = (score: number | null) => {
    const value = score || 0;
    if (value >= 80) return { label: "A'lo", color: 'bg-primary/10 text-primary' };
    if (value >= 70) return { label: 'Yaxshi', color: 'bg-accent text-accent-foreground' };
    if (value >= 60) return { label: "O'rta", color: 'bg-secondary text-secondary-foreground' };
    return { label: 'Yetarli emas', color: 'bg-destructive/10 text-destructive' };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <FileX className="h-10 w-10 mb-3" />
          <p className="font-medium">Natija topilmadi</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/dashboard/student/exam-results')}>
            Orqaga qaytish
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = getScoreStatus(result.score);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/student/exam-results')}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{result.exam_title}</h1>
              <p className="text-muted-foreground text-sm mt-1">Imtihon natijasi</p>
            </div>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>

        <Card className="border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Ball</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{result.score ?? 0}</span>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">To'g'ri</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.correct}</span>
                <span className="text-muted-foreground">/{stats.total}</span>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-xs font-medium text-muted-foreground">Noto'g'ri</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.incorrect}</span>
                <span className="text-muted-foreground">/{stats.total}</span>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">Vaqt</span>
                </div>
                <span className="text-2xl font-bold text-foreground">{stats.timeTaken}</span>
                <span className="text-sm text-muted-foreground ml-1">min</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Topshirildi: {stats.submittedAt ? format(new Date(stats.submittedAt), 'dd.MM.yyyy HH:mm') : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Savollar bo'yicha holat</CardTitle>
          </CardHeader>
          <CardContent>
            {result.answers.length === 0 ? (
              <p className="text-muted-foreground text-sm">Savol javoblari mavjud emas.</p>
            ) : (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {result.answers.map((answer) => {
                  const isCorrect = (answer.points_earned || 0) > 0;
                  return (
                    <div
                      key={answer.id}
                      className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all
                        ${isCorrect
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-destructive/10 border-destructive/30'
                        }`}
                    >
                      <span className="text-sm font-bold text-muted-foreground mb-1">{answer.question}</span>
                      {isCorrect
                        ? <CheckCircle className="h-6 w-6 text-primary" />
                        : <XCircle className="h-6 w-6 text-destructive" />
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-center sm:justify-end pb-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/student/exams')} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Imtihonlarga qaytish
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
