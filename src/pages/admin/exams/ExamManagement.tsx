import { useEffect, useMemo, useState } from 'react';
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
  CheckCircle, XCircle, AlertCircle, Activity
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
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';

interface GroupItem {
  id: number;
  name: string;
}

interface Exam {
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
  questions?: Array<{ id: number }>;
  created_by_username: string;
  created_at: string;
}

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
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const basePath = user?.role === 'manager'
    ? '/dashboard/manager'
    : user?.role === 'teacher' || user?.role === 'sub_teacher'
      ? '/dashboard/teacher'
      : '/dashboard/admin';

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.EXAMS);
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data?.detail || 'Imtihonlar ro\'yxatini olib bo\'lmadi');
      }

      const rows: Exam[] = Array.isArray(data) ? data : (data.results || []);
      setExams(rows);
    } catch (error) {
      console.error('Exam management fetch error:', error);
      toast.error('Imtihonlar ro\'yxatini yuklab bo\'lmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const filtered = useMemo(() => {
    return exams.filter((exam) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        exam.title.toLowerCase().includes(q) ||
        exam.subject.toLowerCase().includes(q) ||
        (exam.hashtag || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || exam.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [exams, searchQuery, statusFilter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('uz-UZ', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!deleteExamId) return;

    try {
      setDeleting(true);
      const response = await authFetch(API_ENDPOINTS.EXAM_DETAIL(deleteExamId), {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || 'Imtihonni o\'chirib bo\'lmadi');
      }

      toast.success('Imtihon o\'chirildi');
      setExams((prev) => prev.filter((item) => item.id !== deleteExamId));
      setDeleteExamId(null);
    } catch (error) {
      console.error('Delete exam error:', error);
      toast.error(error instanceof Error ? error.message : 'O\'chirishda xatolik yuz berdi');
    } finally {
      setDeleting(false);
    }
  };

  const stats = {
    total: exams.length,
    active: exams.filter((e) => e.status === 'published' || e.status === 'open').length,
    closed: exams.filter((e) => e.status === 'closed' || e.status === 'expired' || e.status === 'archived').length,
  };

  const canCreate = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'sub_teacher';
  const canEdit = canCreate;
  const canDelete = user?.role === 'admin' || user?.role === 'teacher' || user?.role === 'sub_teacher';
  const canMonitor = true; // all roles can monitor

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              Imtihonlar boshqaruvi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {canCreate ? 'Imtihonlarni yarating, tahrirlang va boshqaring' : 'Imtihon statistikalarini ko\'ring va kuzating'}
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => navigate(`${basePath}/exams/create`)} className="gap-2">
              <Plus className="h-4 w-4" />
              Yangi imtihon
            </Button>
          )}
        </div>

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

        <div className="grid gap-4">
          {loading ? (
            <>
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-52 rounded-xl" />
              ))}
            </>
          ) : filtered.length === 0 ? (
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
              const questionsCount = exam.questions?.length || 0;

              return (
                <Card key={exam.id} className="border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md group">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
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
                              {canMonitor && (
                                <DropdownMenuItem onClick={() => navigate(`${basePath}/exams/${exam.id}/monitor`)}>
                                  <Activity className="h-4 w-4 mr-2" />Kuzatish
                                </DropdownMenuItem>
                              )}
                              {canEdit && (
                                <DropdownMenuItem onClick={() => navigate(`${basePath}/exams/${exam.id}/edit`)}>
                                  <Edit className="h-4 w-4 mr-2" />Tahrirlash
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteExamId(exam.id)}>
                                  <Trash2 className="h-4 w-4 mr-2" />O'chirish
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <Hash className="h-3 w-3" />{exam.hashtag || '#exam'}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <FileText className="h-3 w-3" />{exam.subject}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <Clock className="h-3 w-3" />{exam.duration_minutes} daqiqa
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <FileText className="h-3 w-3" />{questionsCount} savol ({exam.num_questions_to_show} ko'rsatiladi)
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-1.5">
                            <GraduationCap className="h-3 w-3" />O'tish bali: {exam.passing_score}%
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            {exam.groups?.map(g => g.name).join(', ') || 'Guruh biriktirilmagan'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(exam.start_date)} — {formatDate(exam.end_date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex lg:flex-col gap-2 shrink-0">
                        <Button variant="outline" size="sm" className="gap-1.5 flex-1 lg:flex-none" onClick={() => navigate(`${basePath}/exams/${exam.id}`)}>
                          <Eye className="h-3.5 w-3.5" />Ko'rish
                        </Button>
                        {canMonitor && (
                          <Button variant="outline" size="sm" className="gap-1.5 flex-1 lg:flex-none border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10" onClick={() => navigate(`${basePath}/exams/${exam.id}/monitor`)}>
                            <Activity className="h-3.5 w-3.5" />Kuzatish
                          </Button>
                        )}
                        {canEdit && (
                          <Button variant="outline" size="sm" className="gap-1.5 flex-1 lg:flex-none" onClick={() => navigate(`${basePath}/exams/${exam.id}/edit`)}>
                            <Edit className="h-3.5 w-3.5" />Tahrirlash
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      <AlertDialog open={deleteExamId !== null} onOpenChange={() => !deleting && setDeleteExamId(null)}>
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
