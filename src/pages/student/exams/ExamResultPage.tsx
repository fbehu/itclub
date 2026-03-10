import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, CheckCircle, Clock, FileX, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';

interface StudentAnswer {
  id: number;
  points_earned: number | null;
}

interface StudentExamResult {
  id: number;
  exam: number;
  exam_title: string;
  status: 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  completed_at: string | null;
  started_at: string;
  passed: boolean | null;
  answers: StudentAnswer[];
}

export default function ExamResultPage() {
  const [results, setResults] = useState<StudentExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await authFetch(API_ENDPOINTS.STUDENT_EXAM_RESULTS);
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          throw new Error(data?.detail || 'Natijalarni olib bo\'lmadi');
        }

        const rows: StudentExamResult[] = Array.isArray(data) ? data : (data.results || []);
        const doneRows = rows.filter((item) => ['submitted', 'graded'].includes(item.status));
        doneRows.sort((a, b) => {
          const aTime = new Date(a.completed_at || a.started_at).getTime();
          const bTime = new Date(b.completed_at || b.started_at).getTime();
          return bTime - aTime;
        });
        setResults(doneRows);
      } catch (e) {
        console.error('Failed to fetch exam results:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imtihon natijalari</h1>
          <p className="text-muted-foreground text-sm mt-1">Topshirilgan imtihonlar bo'yicha natijalar</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileX className="h-12 w-12 mb-3 opacity-40" />
            <p className="font-medium">Natijalar topilmadi</p>
            <p className="text-sm">Hali birorta imtihon topshirilmagan</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(result => {
              const answeredCount = result.answers?.length || 0;
              const correctCount = (result.answers || []).filter((item) => (item.points_earned || 0) > 0).length;
              const submittedAt = result.completed_at || result.started_at;

              return (
                <Card
                  key={result.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    navigate(`/dashboard/student/exam/${result.id}/results`, {
                      state: { result },
                    })
                  }
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-foreground truncate flex-1">{result.exam_title}</h3>
                      <Badge variant="outline" className={getScoreColor(result.score)}>
                        {result.score ?? '-'}
                      </Badge>
                    </div>

                    <div className="space-y-2.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 flex-shrink-0" />
                        <span className={`font-semibold text-base ${getScoreColor(result.score)}`}>
                          {result.score ?? 0} ball
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>To'g'ri javoblar: {correctCount}/{answeredCount}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{format(new Date(submittedAt), 'dd.MM.yyyy HH:mm')}</span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <span className="text-xs text-primary inline-flex items-center gap-1">
                        Batafsil
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
