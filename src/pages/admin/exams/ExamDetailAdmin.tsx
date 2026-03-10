import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Edit, Trash2, Calendar, Clock, Users, Hash,
  FileText, CheckCircle, XCircle, GraduationCap, Eye, Shuffle, BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const mockExam = {
  id: 1,
  title: 'Matematika yakuniy imtihon',
  description: 'Algebra va geometriya bo\'yicha yakuniy test. Bu imtihon o\'quvchilarning butun semestr davomidagi bilimlarini baholash uchun mo\'ljallangan.',
  subject: 'Matematika',
  hashtag: '#math_final',
  groups: [{ id: 1, name: 'A1' }, { id: 2, name: 'A2' }],
  start_date: '2026-03-15T09:00:00Z',
  end_date: '2026-03-15T11:00:00Z',
  duration_minutes: 60,
  passing_score: 60,
  question_score: 5,
  total_points: 100,
  num_questions_to_show: 20,
  status: 'published',
  show_results_immediately: false,
  shuffled_questions: true,
  created_by_username: 'teacher1',
  created_at: '2026-03-10T08:00:00Z',
  questions: [
    {
      id: 1, text: '2 + 2 = ?', question_type: 'multiple_choice', order: 1, explanation: 'Oddiy arifmetika',
      answers: [
        { id: 1, text: '3', is_correct: false },
        { id: 2, text: '4', is_correct: true },
        { id: 3, text: '5', is_correct: false },
        { id: 4, text: '6', is_correct: false },
      ]
    },
    {
      id: 2, text: 'Uchburchakning ichki burchaklari yig\'indisi nechaga teng?', question_type: 'multiple_choice', order: 2, explanation: 'Geometriya asoslari',
      answers: [
        { id: 5, text: '90°', is_correct: false },
        { id: 6, text: '180°', is_correct: true },
        { id: 7, text: '270°', is_correct: false },
        { id: 8, text: '360°', is_correct: false },
      ]
    },
    {
      id: 3, text: '√144 = ?', question_type: 'multiple_choice', order: 3, explanation: 'Ildiz chiqarish',
      answers: [
        { id: 9, text: '10', is_correct: false },
        { id: 10, text: '11', is_correct: false },
        { id: 11, text: '12', is_correct: true },
        { id: 12, text: '14', is_correct: false },
      ]
    },
    {
      id: 4, text: '5! (5 faktorial) nechaga teng?', question_type: 'multiple_choice', order: 4, explanation: '5! = 5×4×3×2×1 = 120',
      answers: [
        { id: 13, text: '60', is_correct: false },
        { id: 14, text: '100', is_correct: false },
        { id: 15, text: '120', is_correct: true },
        { id: 16, text: '150', is_correct: false },
      ]
    },
  ],
};

export default function ExamDetailAdmin() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'manager' ? '/dashboard/manager' : user?.role === 'teacher' || user?.role === 'sub_teacher' ? '/dashboard/teacher' : '/dashboard/admin';

  const exam = mockExam;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/exams`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400">
                  <CheckCircle className="h-3 w-3 mr-1" />Faol
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{exam.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`${basePath}/exams/${examId}/edit`)}>
              <Edit className="h-3.5 w-3.5" />Tahrirlash
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => toast.info('O\'chirish funksiyasi')}>
              <Trash2 className="h-3.5 w-3.5" />O'chirish
            </Button>
          </div>
        </div>

        {/* Info Grid */}
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

        {/* Details */}
        <Card className="border-border/50">
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span className="font-medium">Hashtag:</span>
                  <Badge variant="secondary" className="text-xs">{exam.hashtag}</Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Fan:</span>
                  <span className="text-foreground">{exam.subject}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Guruhlar:</span>
                  <div className="flex gap-1.5">
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

        {/* Questions */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Savollar ({exam.questions.length})
          </h2>
          <div className="space-y-3">
            {exam.questions.map((q, qi) => (
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
