import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, Calendar, Clock, Users, Hash, FileText,
  Edit, Trash2, Eye, MoreHorizontal, GraduationCap, Filter,
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Exam {
  id: number;
  title: string;
  description: string;
  subject: string;
  hashtag: string;
  groups: { id: number; name: string }[];
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
  questions_count: number;
  created_by_username: string;
  created_at: string;
}

const mockExams: Exam[] = [
  {
    id: 1,
    title: 'Matematika yakuniy imtihon',
    description: 'Algebra va geometriya bo\'yicha yakuniy test',
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
    questions_count: 30,
    created_by_username: 'teacher1',
    created_at: '2026-03-10T08:00:00Z',
  },
  {
    id: 2,
    title: 'Ingliz tili grammar test',
    description: 'Grammar va vocabulary bo\'yicha test',
    subject: 'Ingliz tili',
    hashtag: '#eng_grammar',
    groups: [{ id: 3, name: 'B1' }],
    start_date: '2026-03-20T14:00:00Z',
    end_date: '2026-03-20T15:30:00Z',
    duration_minutes: 45,
    passing_score: 50,
    question_score: 2,
    total_points: 50,
    num_questions_to_show: 25,
    status: 'published',
    show_results_immediately: true,
    shuffled_questions: true,
    questions_count: 25,
    created_by_username: 'teacher2',
    created_at: '2026-03-09T12:00:00Z',
  },
  {
    id: 3,
    title: 'Python dasturlash',
    description: 'Python asoslari bo\'yicha test',
    subject: 'Dasturlash',
    hashtag: '#python_basics',
    groups: [{ id: 1, name: 'A1' }],
    start_date: '2026-03-25T10:00:00Z',
    end_date: '2026-03-25T11:00:00Z',
    duration_minutes: 50,
    passing_score: 70,
    question_score: 10,
    total_points: 100,
    num_questions_to_show: 10,
    status: 'closed',
    show_results_immediately: false,
    shuffled_questions: false,
    questions_count: 15,
    created_by_username: 'teacher1',
    created_at: '2026-03-08T09:00:00Z',
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  published: { label: 'Faol', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400', icon: CheckCircle },
  open: { label: 'Ochiq', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400', icon: CheckCircle },
  closed: { label: 'Yopiq', color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
  expired: { label: 'Muddati o\'tgan', color: 'bg-destructive/15 text-destructive border-destructive/30', icon: AlertCircle },
  archived: { label: 'Arxivlangan', color: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

export default function ExamManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteExamId, setDeleteExamId] = useState<number | null>(null);

  const basePath = user?.role === 'manager' ? '/dashboard/manager' : user?.role === 'teacher' || user?.role === 'sub_teacher' ? '/dashboard/teacher' : '/dashboard/admin';

  const filtered = mockExams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.hashtag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDelete = () => {
    toast.success('Imtihon o\'chirildi');
    setDeleteExamId(null);
  };

  const stats = {
    total: mockExams.length,
    active: mockExams.filter(e => e.status === 'published' || e.status === 'open').length,
    closed: mockExams.filter(e => e.status === 'closed' || e.status === 'expired' || e.status === 'archived').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              Imtihonlar boshqaruvi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Imtihonlarni yarating, tahrirlang va boshqaring</p>
          </div>
          <Button onClick={() => navigate(`${basePath}/exams/create`)} className="gap-2">
            <Plus className="h-4 w-4" />
            Yangi imtihon
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Jami', value: stats.total, icon: FileText, color: 'text-primary' },
            { label: 'Faol', value: stats.active, icon: CheckCircle, color: 'text-emerald-500' },
            { label: 'Yopiq', value: stats.closed, icon: XCircle, color: 'text-muted-foreground' },
          ].map(stat => (
            <Card key={stat.label} className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Imtihon nomi, fan yoki hashtag bo'yicha qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="published">Faol</SelectItem>
              <SelectItem value="open">Ochiq</SelectItem>
              <SelectItem value="closed">Yopiq</SelectItem>
              <SelectItem value="expired">Muddati o'tgan</SelectItem>
              <SelectItem value="archived">Arxivlangan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exam Cards */}
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Imtihon topilmadi</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Yangi imtihon yarating yoki qidiruv filtrini o'zgartiring</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map(exam => {
              const status = statusConfig[exam.status] || statusConfig.closed;
              const StatusIcon = status.icon;
              return (
                <Card key={exam.id} className="border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md group">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Left: Info */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-foreground truncate">{exam.title}</h3>
                              <Badge variant="outline" className={`text-[11px] ${status.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{exam.description}</p>
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`${basePath}/exams/${exam.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />Ko'rish
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`${basePath}/exams/${exam.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />Tahrirlash
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteExamId(exam.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />O'chirish
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Meta info pills */}
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <Hash className="h-3 w-3" />{exam.hashtag}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <FileText className="h-3 w-3" />{exam.subject}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <Clock className="h-3 w-3" />{exam.duration_minutes} daqiqa
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <FileText className="h-3 w-3" />{exam.questions_count} savol ({exam.num_questions_to_show} ko'rsatiladi)
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <GraduationCap className="h-3 w-3" />O'tish bali: {exam.passing_score}%
                          </span>
                        </div>

                        {/* Groups + Date */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {exam.groups.map(g => g.name).join(', ')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(exam.start_date)} — {formatDate(exam.end_date)}
                          </span>
                        </div>
                      </div>

                      {/* Right: Quick actions */}
                      <div className="flex lg:flex-col gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="gap-1.5 flex-1 lg:flex-none" onClick={() => navigate(`${basePath}/exams/${exam.id}`)}>
                          <Eye className="h-3.5 w-3.5" />Ko'rish
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 flex-1 lg:flex-none" onClick={() => navigate(`${basePath}/exams/${exam.id}/edit`)}>
                          <Edit className="h-3.5 w-3.5" />Tahrirlash
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteExamId !== null} onOpenChange={() => setDeleteExamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Imtihonni o'chirishni tasdiqlang</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni ortga qaytarib bo'lmaydi. Imtihon va unga tegishli barcha savollar o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
