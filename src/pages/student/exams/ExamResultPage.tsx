import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, CheckCircle, Clock, FileX } from 'lucide-react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';

interface ExamResult {
  id: number;
  exam_title: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  submitted_at: string;
}

export default function ExamResultPage() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await authFetch(API_ENDPOINTS.STUDENT_EXAM_RESULTS);
        if (res.ok) {
          const data = await res.json();
          setResults(Array.isArray(data) ? data : data.results || []);
        }
      } catch (e) {
        console.error('Failed to fetch exam results:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const getScoreColor = (score: number) => {
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
            {results.map(result => (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-foreground truncate flex-1">{result.exam_title}</h3>
                    <Badge variant="outline" className={getScoreColor(result.score)}>
                      {result.score}%
                    </Badge>
                  </div>

                  <div className="space-y-2.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 flex-shrink-0" />
                      <span className={`font-semibold text-base ${getScoreColor(result.score)}`}>
                        {result.score} ball
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      <span>To'g'ri javoblar: {result.correct_answers}/{result.total_questions}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{format(new Date(result.submitted_at), 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
