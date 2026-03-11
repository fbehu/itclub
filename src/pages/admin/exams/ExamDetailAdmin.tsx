import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Edit, Trash2, Calendar, Clock, Users, Hash,
  FileText, CheckCircle, XCircle, GraduationCap, Eye, Shuffle, BarChart3, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AnswerItem {
  id: number;
  text: string;
  is_correct: boolean;
}

interface QuestionItem {
  id: number;
  text: string;
  question_type: string;
  order: number;
  explanation: string;
  answers: AnswerItem[];
}

interface GroupItem {
  id: number;
  name: string;
}

interface ExamDetail {
  id: number;
  title: string;
  description: string;
  subject: string;
  hashtag: string;
  groups: GroupItem[];
  start_date: string;
  end_date: string;
  duration_minutes: number;
  passing_score: number;
  question_score: number;
  total_points: number;
  num_questions_to_show: number;
  status: string;
  show_results_immediately: boolean;
  shuffled_questions: boolean;
  created_by_username: string;
  created_at: string;
  questions: QuestionItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  published: { label: 'Faol', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400', icon: CheckCircle },
  open: { label: 'Ochiq', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400', icon: CheckCircle },
  closed: { label: 'Yopiq', color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
  expired: { label: 'Muddati o\'tgan', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: AlertCircle },
  archived: { label: 'Arxivlangan', color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

export default function ExamDetailAdmin() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'manager'
    ? '/dashboard/manager'
    : user?.role === 'teacher' || user?.role === 'sub_teacher'
      ? '/dashboard/teacher'
      : '/dashboard/admin';

  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!examId) {
      setLoading(false);
      return;
    }

    const fetchExamDetail = async () => {
      try {
        setLoading(true);
        const response = await authFetch(API_ENDPOINTS.EXAM_DETAIL(examId));
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.detail || 'Imtihon ma\'lumotlarini olib bo\'lmadi');
        }

        setExam(data);
      } catch (error) {
        console.error('Exam detail fetch error:', error);
        toast.error(error instanceof Error ? error.message : 'Imtihonni yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetail();
  }, [examId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!examId) return;

    try {
      setDeleting(true);
      const response = await authFetch(API_ENDPOINTS.EXAM_DETAIL(examId), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || 'Imtihonni o\'chirib bo\'lmadi');
      }

      toast.success('Imtihon o\'chirildi');
      navigate(`${basePath}/exams`);
    } catch (error) {
      console.error('Exam delete error:', error);
      toast.error(error instanceof Error ? error.message : 'O\'chirishda xatolik');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-4xl mx-auto">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!exam) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto text-center py-16">
          <p className="text-muted-foreground">Imtihon topilmadi</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate(`${basePath}/exams`)}>
            Orqaga qaytish
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const status = statusConfig[exam.status] || statusConfig.closed;
  const StatusIcon = status.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/exams`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
                <Badge variant="outline" className={status.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`${basePath}/exams/${examId}/edit`)}>
              <Edit className="h-3.5 w-3.5" />Tahrirlash
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />O'chirish
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Clock, label: 'Davomiyligi', value: `${exam.duration_minutes} daqiqa` },
            { icon: FileText, label: 'Savollar', value: `${exam.questions.length} / ${exam.num_questions_to_show}` },
            { icon: GraduationCap, label: "O'tish bali", value: `${exam.passing_score}%` },
            { icon: BarChart3, label: 'Umumiy ball', value: `${exam.total_points}` },
          ].map(item => (
            <Card key={item.label} className="border-border/50">
              <CardContent className="p-3 text-center">
                <item.icon className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{item.value}</p>
                <p className="text-[11px] text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span className="font-medium">Hashtag:</span>
                  <Badge variant="secondary" className="text-xs">{exam.hashtag || '#exam'}</Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Fan:</span>
                  <span className="text-foreground">{exam.subject}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Guruhlar:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {exam.groups.map(g => (
                      <Badge key={g.id} variant="outline" className="text-xs">{g.name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Boshlanishi:</span>
                  <span className="text-foreground text-xs">{formatDate(exam.start_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Tugashi:</span>
                  <span className="text-foreground text-xs">{formatDate(exam.end_date)}</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Shuffle className="h-4 w-4" />
                    <span className="text-xs">{exam.shuffled_questions ? 'Aralash' : 'Tartibli'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">{exam.show_results_immediately ? 'Darhol natija' : 'Natija keyin'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Savollar ({exam.questions.length})
          </h2>
          <div className="space-y-3">
            {exam.questions.map((q) => (
              <Card key={q.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{q.order}</span>
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="font-medium text-foreground">{q.text}</p>
                      {q.explanation && (
                        <p className="text-xs text-muted-foreground italic">💡 {q.explanation}</p>
                      )}
                      {(q.question_type === 'multiple_choice' || q.question_type === 'true_false') && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.answers.map((a, ai) => (
                            <div
                              key={a.id}
                              className={`flex items-center gap-2 p-2.5 rounded-xl text-sm border transition-all ${
                                a.is_correct
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-muted/30 border-border text-muted-foreground'
                              }`}
                            >
                              <span className="shrink-0 h-6 w-6 rounded-md bg-background border border-border flex items-center justify-center text-xs font-mono font-bold">
                                {String.fromCharCode(65 + ai)}
                              </span>
                              <span className="flex-1">{a.text}</span>
                              {a.is_correct && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Imtihonni o'chirishni tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni ortga qaytarib bo'lmaydi. Imtihon va unga tegishli barcha savollar o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
