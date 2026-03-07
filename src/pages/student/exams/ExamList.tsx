import { useState, useEffect } from 'react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import ExamCard, { Exam } from './ExamCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FileX } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function ExamList() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await authFetch(API_ENDPOINTS.STUDENT_EXAMS);
        if (res.ok) {
          const data = await res.json();
          setExams(Array.isArray(data) ? data : data.results || []);
        }
      } catch (e) {
        console.error('Failed to fetch exams:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Imtihonlar</h1>
          <p className="text-muted-foreground text-sm mt-1">Sizga tayinlangan imtihonlar ro'yxati</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileX className="h-12 w-12 mb-3 opacity-40" />
            <p className="font-medium">Imtihonlar topilmadi</p>
            <p className="text-sm">Hozircha sizga tayinlangan imtihonlar yo'q</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map(exam => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
