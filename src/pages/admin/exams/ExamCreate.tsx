import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, CheckCircle,
  XCircle, GraduationCap, FileText, Clock, Settings2, HelpCircle,
  Sparkles, BookOpen, ListChecks, ChevronRight, Hash, AlignLeft,
  Timer, Target, BarChart3, Eye, Shuffle, Layers
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Skeleton } from '@/components/ui/skeleton';

type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

interface GroupItem {
  id: number;
  name: string;
}

interface AnswerForm {
  localId: string;
  text: string;
  is_correct: boolean;
  order: number;
}

interface QuestionForm {
  localId: string;
  text: string;
  question_type: QuestionType;
  order: number;
  explanation: string;
  answers: AnswerForm[];
}

interface ExamForm {
  title: string;
  description: string;
  subject: string;
  hashtag: string;
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
}

const defaultExamForm: ExamForm = {
  title: '',
  description: '',
  subject: '',
  hashtag: '',
  start_date: '',
  end_date: '',
  duration_minutes: 60,
  passing_score: 60,
  question_score: 5,
  total_points: 100,
  num_questions_to_show: 20,
  status: 'published',
  show_results_immediately: false,
  shuffled_questions: true,
};

const createLocalId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const createDefaultAnswers = (): AnswerForm[] => [
  { localId: createLocalId(), text: '', is_correct: true, order: 1 },
  { localId: createLocalId(), text: '', is_correct: false, order: 2 },
  { localId: createLocalId(), text: '', is_correct: false, order: 3 },
  { localId: createLocalId(), text: '', is_correct: false, order: 4 },
];

const createQuestion = (order: number): QuestionForm => ({
  localId: createLocalId(),
  text: '',
  question_type: 'multiple_choice',
  order,
  explanation: '',
  answers: createDefaultAnswers(),
});

const toDatetimeLocal = (isoString: string) => {
  const date = new Date(isoString);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const toIsoString = (localDatetime: string) => {
  return new Date(localDatetime).toISOString();
};

const questionTypeLabels: Record<QuestionType, { label: string; icon: React.ReactNode; color: string }> = {
  multiple_choice: { label: "Ko'p tanlovli", icon: <ListChecks className="h-3.5 w-3.5" />, color: 'text-blue-500' },
  true_false: { label: "Ha / Yo'q", icon: <CheckCircle className="h-3.5 w-3.5" />, color: 'text-emerald-500' },
  short_answer: { label: 'Qisqa javob', icon: <AlignLeft className="h-3.5 w-3.5" />, color: 'text-amber-500' },
  essay: { label: 'Insho', icon: <BookOpen className="h-3.5 w-3.5" />, color: 'text-purple-500' },
};

const answerLetterColors = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
];

export default function ExamCreate() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const isEditMode = Boolean(examId);
  const { user } = useAuth();
  const basePath = user?.role === 'manager'
    ? '/dashboard/manager'
    : user?.role === 'teacher' || user?.role === 'sub_teacher'
      ? '/dashboard/teacher'
      : '/dashboard/admin';

  const [examData, setExamData] = useState<ExamForm>(defaultExamForm);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [activeStep, setActiveStep] = useState<'info' | 'questions'>('info');
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await authFetch(API_ENDPOINTS.GROUPS);
        const data = await response.json().catch(() => []);
        if (!response.ok) throw new Error(data?.detail || "Guruhlarni olib bo'lmadi");
        const rows = Array.isArray(data) ? data : (data.results || []);
        setGroups(rows.map((row: any) => ({ id: row.id, name: row.name || row.title || `Group ${row.id}` })));
      } catch (error) {
        console.error('Groups fetch error:', error);
        toast.error("Guruhlar ro'yxatini yuklashda xatolik");
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    if (!isEditMode || !examId) return;
    const fetchExamDetail = async () => {
      try {
        setLoading(true);
        const response = await authFetch(API_ENDPOINTS.EXAM_DETAIL(examId));
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.detail || "Imtihon ma'lumotlarini olib bo'lmadi");

        setExamData({
          title: data.title || '',
          description: data.description || '',
          subject: data.subject || '',
          hashtag: data.hashtag || '',
          start_date: data.start_date ? toDatetimeLocal(data.start_date) : '',
          end_date: data.end_date ? toDatetimeLocal(data.end_date) : '',
          duration_minutes: data.duration_minutes || 60,
          passing_score: data.passing_score || 60,
          question_score: data.question_score || 5,
          total_points: data.total_points || 100,
          num_questions_to_show: data.num_questions_to_show || 20,
          status: data.status || 'published',
          show_results_immediately: Boolean(data.show_results_immediately),
          shuffled_questions: Boolean(data.shuffled_questions),
        });

        setSelectedGroups((data.groups || []).map((item: any) => item.id));

        const mappedQuestions: QuestionForm[] = (data.questions || []).map((question: any, index: number) => ({
          localId: createLocalId(),
          text: question.text || '',
          question_type: (question.question_type || 'multiple_choice') as QuestionType,
          order: question.order || index + 1,
          explanation: question.explanation || '',
          answers: (question.answers || []).map((answer: any, aIndex: number) => ({
            localId: createLocalId(),
            text: answer.text || '',
            is_correct: Boolean(answer.is_correct),
            order: answer.order || aIndex + 1,
          })),
        }));

        setQuestions(mappedQuestions);
      } catch (error) {
        console.error('Exam detail fetch error:', error);
        toast.error(error instanceof Error ? error.message : "Imtihonni yuklab bo'lmadi");
        navigate(`${basePath}/exams`);
      } finally {
        setLoading(false);
      }
    };
    fetchExamDetail();
  }, [isEditMode, examId, navigate, basePath]);

  const toggleGroup = (id: number) => {
    setSelectedGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const addQuestion = () => {
    const newQ = createQuestion(questions.length + 1);
    setQuestions((prev) => [...prev, newQ]);
    setExpandedQuestion(newQ.localId);
  };

  const updateQuestion = (qId: string, field: keyof QuestionForm, value: any) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.localId !== qId) return q;
      const updated: QuestionForm = { ...q, [field]: value };
      if (field === 'question_type') {
        const qType = value as QuestionType;
        if (qType === 'multiple_choice' || qType === 'true_false') {
          if (updated.answers.length < 2) updated.answers = createDefaultAnswers();
        }
      }
      return updated;
    }));
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.localId !== qId).map((q, i) => ({ ...q, order: i + 1 })));
    if (expandedQuestion === qId) setExpandedQuestion(null);
  };

  const addAnswer = (qId: string) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.localId !== qId) return q;
      return {
        ...q,
        answers: [...q.answers, { localId: createLocalId(), text: '', is_correct: false, order: q.answers.length + 1 }],
      };
    }));
  };

  const updateAnswer = (qId: string, aId: string, field: keyof AnswerForm, value: any) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.localId !== qId) return q;
      const updatedAnswers = q.answers.map((a) => {
        if (a.localId !== aId) return a;
        return { ...a, [field]: value };
      }).map((a) => {
        if ((q.question_type === 'multiple_choice' || q.question_type === 'true_false') && field === 'is_correct' && value === true) {
          return a.localId === aId ? { ...a, is_correct: true } : { ...a, is_correct: false };
        }
        return a;
      });
      return { ...q, answers: updatedAnswers };
    }));
  };

  const removeAnswer = (qId: string, aId: string) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.localId !== qId) return q;
      return { ...q, answers: q.answers.filter((a) => a.localId !== aId).map((a, i) => ({ ...a, order: i + 1 })) };
    }));
  };

  const validateForm = () => {
    if (!examData.title.trim() || !examData.subject.trim() || selectedGroups.length === 0) {
      return "Iltimos, barcha majburiy maydonlarni to'ldiring";
    }
    if (!examData.start_date || !examData.end_date) {
      return 'Boshlanish va tugash vaqtini kiriting';
    }
    if (new Date(examData.start_date).getTime() >= new Date(examData.end_date).getTime()) {
      return "Boshlanish vaqti tugash vaqtidan kichik bo'lishi kerak";
    }
    if (questions.length === 0) {
      return "Kamida 1 ta savol qo'shing";
    }
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text.trim()) return `${i + 1}-savol matni bo'sh bo'lmasligi kerak`;
      if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        const validAnswers = question.answers.filter((a) => a.text.trim());
        if (validAnswers.length < 2) return `${i + 1}-savolda kamida 2 ta variant bo'lishi kerak`;
        if (!validAnswers.some((a) => a.is_correct)) return `${i + 1}-savolda kamida 1 ta to'g'ri javob bo'lishi kerak`;
      }
    }
    return null;
  };

  const syncQuestions = async (targetExamId: number) => {
    if (isEditMode) {
      const oldQuestionsResponse = await authFetch(API_ENDPOINTS.EXAM_QUESTIONS(targetExamId));
      const oldQuestionsData = await oldQuestionsResponse.json().catch(() => []);
      if (!oldQuestionsResponse.ok) throw new Error('Eski savollarni olishda xatolik yuz berdi');
      const oldQuestions = Array.isArray(oldQuestionsData) ? oldQuestionsData : (oldQuestionsData.results || []);
      for (const oldQuestion of oldQuestions) {
        const deleteResponse = await authFetch(API_ENDPOINTS.EXAM_QUESTION_DETAIL(oldQuestion.id), { method: 'DELETE' });
        if (!deleteResponse.ok) throw new Error("Eski savollarni o'chirishda xatolik yuz berdi");
      }
    }

    for (let qIndex = 0; qIndex < questions.length; qIndex++) {
      const question = questions[qIndex];
      const questionResponse = await authFetch(API_ENDPOINTS.EXAM_QUESTIONS_LIST, {
        method: 'POST',
        body: JSON.stringify({
          exam: targetExamId,
          text: question.text,
          question_type: question.question_type,
          order: qIndex + 1,
          explanation: question.explanation,
        }),
      });
      const questionData = await questionResponse.json().catch(() => ({}));
      if (!questionResponse.ok) throw new Error(questionData?.detail || `${qIndex + 1}-savolni saqlashda xatolik`);
      const createdQuestionId = questionData.id;
      if (!createdQuestionId) throw new Error('Yaratilgan savol ID qaytmadi');

      if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        const answerRows = question.answers.filter((a) => a.text.trim());
        for (let aIndex = 0; aIndex < answerRows.length; aIndex++) {
          const answer = answerRows[aIndex];
          const answerResponse = await authFetch(API_ENDPOINTS.EXAM_ANSWERS, {
            method: 'POST',
            body: JSON.stringify({
              question: createdQuestionId,
              text: answer.text,
              is_correct: answer.is_correct,
              order: aIndex + 1,
            }),
          });
          const answerData = await answerResponse.json().catch(() => ({}));
          if (!answerResponse.ok) throw new Error(answerData?.detail || `${qIndex + 1}-savol variantlarini saqlashda xatolik`);
        }
      }
    }
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) { toast.error(validationError); return; }

    try {
      setSaving(true);
      const payload = {
        title: examData.title,
        description: examData.description,
        subject: examData.subject,
        hashtag: examData.hashtag,
        group_ids: selectedGroups,
        start_date: toIsoString(examData.start_date),
        end_date: toIsoString(examData.end_date),
        duration_minutes: examData.duration_minutes,
        passing_score: examData.passing_score,
        question_score: examData.question_score,
        total_points: examData.total_points,
        num_questions_to_show: examData.num_questions_to_show,
        status: examData.status,
        show_results_immediately: examData.show_results_immediately,
        shuffled_questions: examData.shuffled_questions,
      };

      const response = await authFetch(
        isEditMode && examId ? API_ENDPOINTS.EXAM_DETAIL(examId) : API_ENDPOINTS.EXAMS,
        { method: isEditMode ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || 'Imtihonni saqlashda xatolik yuz berdi');
      const savedExamId = data.id;
      if (!savedExamId) throw new Error('Imtihon ID qaytmadi');

      await syncQuestions(savedExamId);
      toast.success(isEditMode ? 'Imtihon muvaffaqiyatli yangilandi' : 'Imtihon muvaffaqiyatli yaratildi');
      navigate(`${basePath}/exams`);
    } catch (error) {
      console.error('Exam save error:', error);
      toast.error(error instanceof Error ? error.message : 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const totalCorrect = questions.reduce((sum, q) => sum + (q.answers.some(a => a.is_correct) ? 1 : 0), 0);
  const totalAnswers = questions.reduce((sum, q) => sum + q.answers.filter(a => a.text.trim()).length, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/exams`)} className="rounded-xl h-10 w-10 hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {isEditMode ? 'Imtihonni tahrirlash' : 'Yangi imtihon'}
                </h1>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {activeStep === 'info' ? "Asosiy sozlamalarni to'ldiring" : "Savollar va variantlarni qo'shing"}
              </p>
            </div>
          </div>

          {activeStep === 'questions' && (
            <Button onClick={handleSave} className="gap-2 rounded-xl shadow-lg shadow-primary/20" disabled={saving} size="lg">
              <Save className="h-4 w-4" />
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          )}
        </div>

        {/* Step Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveStep('info')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeStep === 'info'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Settings2 className="h-4 w-4" />
            Sozlamalar
            {activeStep !== 'info' && examData.title && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveStep('questions')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              activeStep === 'questions'
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Savollar
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-md">
              {questions.length}
            </Badge>
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* === STEP 1: INFO === */}
            {activeStep === 'info' && (
              <div className="space-y-5">
                {/* Basic info */}
                <div className="card-glass p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">Asosiy ma'lumotlar</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground">Imtihon nomi *</Label>
                      <Input
                        placeholder="Masalan: Matematika yakuniy imtihon"
                        value={examData.title}
                        onChange={(e) => setExamData((prev) => ({ ...prev, title: e.target.value }))}
                        className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-medium text-muted-foreground">Tavsif</Label>
                      <Textarea
                        placeholder="Imtihon haqida qisqacha..."
                        value={examData.description}
                        onChange={(e) => setExamData((prev) => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="rounded-xl bg-muted/30 border-border/50 focus:bg-background resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Fan nomi *</Label>
                      <Input
                        placeholder="Masalan: Matematika"
                        value={examData.subject}
                        onChange={(e) => setExamData((prev) => ({ ...prev, subject: e.target.value }))}
                        className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Hashtag</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input
                          placeholder="math_final"
                          value={examData.hashtag}
                          onChange={(e) => setExamData((prev) => ({ ...prev, hashtag: e.target.value }))}
                          className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Groups */}
                <div className="card-glass p-6 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">Guruhlar *</h2>
                    {selectedGroups.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs rounded-lg">{selectedGroups.length} tanlandi</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {groups.map((group) => {
                      const isSelected = selectedGroups.includes(group.id);
                      return (
                        <button
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className={`relative px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                            isSelected
                              ? 'bg-primary/10 text-primary border-primary/40 shadow-sm shadow-primary/10'
                              : 'bg-muted/30 text-muted-foreground border-transparent hover:border-border hover:text-foreground'
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary" />
                          )}
                          {group.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time & Scoring */}
                <div className="card-glass p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-base font-semibold text-foreground">Vaqt va baholash</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Boshlanish *
                      </Label>
                      <Input
                        type="datetime-local"
                        value={examData.start_date}
                        onChange={(e) => setExamData((prev) => ({ ...prev, start_date: e.target.value }))}
                        className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> Tugash *
                      </Label>
                      <Input
                        type="datetime-local"
                        value={examData.end_date}
                        onChange={(e) => setExamData((prev) => ({ ...prev, end_date: e.target.value }))}
                        className="h-11 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { label: 'Davomiyligi', icon: <Timer className="h-3 w-3" />, key: 'duration_minutes', suffix: 'daq' },
                      { label: "O'tish bali", icon: <Target className="h-3 w-3" />, key: 'passing_score', suffix: '%' },
                      { label: 'Savol bali', icon: <BarChart3 className="h-3 w-3" />, key: 'question_score', suffix: '' },
                      { label: 'Umumiy ball', icon: <BarChart3 className="h-3 w-3" />, key: 'total_points', suffix: '' },
                      { label: 'Savollar soni', icon: <Layers className="h-3 w-3" />, key: 'num_questions_to_show', suffix: '' },
                    ].map((item) => (
                      <div key={item.key} className="space-y-1.5">
                        <Label className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                          {item.icon} {item.label}
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={(examData as any)[item.key]}
                            onChange={(e) => setExamData((prev) => ({ ...prev, [item.key]: parseInt(e.target.value) || 0 }))}
                            className="h-10 rounded-xl bg-muted/30 border-border/50 focus:bg-background text-center font-semibold pr-8"
                          />
                          {item.suffix && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">{item.suffix}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <Select value={examData.status} onValueChange={(v) => setExamData((prev) => ({ ...prev, status: v }))}>
                      <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">✅ Faol</SelectItem>
                        <SelectItem value="open">🟢 Ochiq</SelectItem>
                        <SelectItem value="closed">🔴 Yopiq</SelectItem>
                        <SelectItem value="expired">⏰ Muddati o'tgan</SelectItem>
                        <SelectItem value="archived">📦 Arxivlangan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="my-2" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-2.5">
                        <Eye className="h-4 w-4 text-primary/70" />
                        <span className="text-sm font-medium text-foreground">Natijalarni darhol ko'rsatish</span>
                      </div>
                      <Switch
                        checked={examData.show_results_immediately}
                        onCheckedChange={(v) => setExamData((prev) => ({ ...prev, show_results_immediately: v }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex items-center gap-2.5">
                        <Shuffle className="h-4 w-4 text-primary/70" />
                        <span className="text-sm font-medium text-foreground">Savollarni aralashtirish</span>
                      </div>
                      <Switch
                        checked={examData.shuffled_questions}
                        onCheckedChange={(v) => setExamData((prev) => ({ ...prev, shuffled_questions: v }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => setActiveStep('questions')} className="gap-2 rounded-xl" size="lg">
                    Keyingi: Savollar
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* === STEP 2: QUESTIONS === */}
            {activeStep === 'questions' && (
              <div className="space-y-4">
                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="stat-card text-center py-4">
                    <p className="text-2xl font-bold text-foreground">{questions.length}</p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Savollar</p>
                  </div>
                  <div className="stat-card text-center py-4">
                    <p className="text-2xl font-bold text-emerald-500">{totalCorrect}</p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">To'g'ri belgilangan</p>
                  </div>
                  <div className="stat-card text-center py-4">
                    <p className="text-2xl font-bold text-blue-500">{totalAnswers}</p>
                    <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Jami variantlar</p>
                  </div>
                </div>

                {/* Questions list */}
                {questions.map((question) => {
                  const isExpanded = expandedQuestion === question.localId;
                  const qTypeInfo = questionTypeLabels[question.question_type];
                  const hasCorrect = question.answers.some(a => a.is_correct);
                  const filledAnswers = question.answers.filter(a => a.text.trim()).length;

                  return (
                    <div
                      key={question.localId}
                      className={`card-modern overflow-hidden transition-all duration-300 ${
                        isExpanded ? 'ring-2 ring-primary/20 shadow-lg shadow-primary/5' : ''
                      }`}
                    >
                      {/* Question header - always visible */}
                      <button
                        onClick={() => setExpandedQuestion(isExpanded ? null : question.localId)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                      >
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{question.order}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {question.text || 'Savol matni kiritilmagan...'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-semibold flex items-center gap-1 ${qTypeInfo.color}`}>
                              {qTypeInfo.icon} {qTypeInfo.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">•</span>
                            <span className="text-[10px] text-muted-foreground">{filledAnswers} variant</span>
                            {!hasCorrect && (question.question_type === 'multiple_choice' || question.question_type === 'true_false') && (
                              <>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className="text-[10px] text-destructive font-medium">⚠ To'g'ri javob yo'q</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {/* Expanded content */}
                      {isExpanded && (
                        <div className="border-t border-border/50 p-5 space-y-4 bg-muted/10">
                          <div className="flex items-center gap-2 justify-between">
                            <Select
                              value={question.question_type}
                              onValueChange={(v) => updateQuestion(question.localId, 'question_type', v as QuestionType)}
                            >
                              <SelectTrigger className="h-9 w-44 text-xs rounded-lg bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">📋 Ko'p tanlovli</SelectItem>
                                <SelectItem value="true_false">✅ Ha / Yo'q</SelectItem>
                                <SelectItem value="short_answer">✏️ Qisqa javob</SelectItem>
                                <SelectItem value="essay">📝 Insho</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 rounded-lg gap-1.5 text-xs"
                              onClick={() => removeQuestion(question.localId)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              O'chirish
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Savol matni *</Label>
                            <Textarea
                              placeholder="Savolni kiriting..."
                              value={question.text}
                              onChange={(e) => updateQuestion(question.localId, 'text', e.target.value)}
                              rows={3}
                              className="rounded-xl bg-background border-border/50 resize-none text-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Izoh (ixtiyoriy)</Label>
                            <Input
                              placeholder="To'g'ri javob izohi..."
                              value={question.explanation}
                              onChange={(e) => updateQuestion(question.localId, 'explanation', e.target.value)}
                              className="h-10 rounded-xl bg-background border-border/50"
                            />
                          </div>

                          {/* Answers */}
                          {(question.question_type === 'multiple_choice' || question.question_type === 'true_false') && (
                            <div className="space-y-3">
                              <Label className="text-xs font-medium text-muted-foreground">Javob variantlari</Label>
                              <div className="space-y-2.5">
                                {question.answers.map((answer, aIndex) => (
                                  <div
                                    key={answer.localId}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                                      answer.is_correct
                                        ? 'bg-emerald-500/5 border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                                        : 'bg-background border-border/40 hover:border-border'
                                    }`}
                                  >
                                    <button
                                      onClick={() => updateAnswer(question.localId, answer.localId, 'is_correct', true)}
                                      className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center border-2 transition-all duration-200 font-bold text-sm ${
                                        answer.is_correct
                                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                          : `${answerLetterColors[aIndex % answerLetterColors.length]} border-2`
                                      }`}
                                      title={answer.is_correct ? "To'g'ri javob" : "To'g'ri deb belgilash"}
                                    >
                                      {answer.is_correct ? <CheckCircle className="h-4 w-4" /> : String.fromCharCode(65 + aIndex)}
                                    </button>
                                    <Input
                                      placeholder={`${String.fromCharCode(65 + aIndex)}-variant matnini kiriting`}
                                      value={answer.text}
                                      onChange={(e) => updateAnswer(question.localId, answer.localId, 'text', e.target.value)}
                                      className="flex-1 h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/50"
                                    />
                                    {question.answers.length > 2 && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                        onClick={() => removeAnswer(question.localId, answer.localId)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {question.answers.length < 6 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full border-dashed border-2 text-xs gap-1.5 rounded-xl h-10 hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
                                  onClick={() => addAnswer(question.localId)}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Variant qo'shish
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add question button */}
                <button
                  onClick={addQuestion}
                  className="w-full border-2 border-dashed border-border/60 hover:border-primary/40 rounded-2xl p-8 flex flex-col items-center gap-3 text-muted-foreground hover:text-foreground transition-all duration-300 group"
                >
                  <div className="h-14 w-14 rounded-2xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <Plus className="h-7 w-7 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-semibold block">Yangi savol qo'shish</span>
                    <span className="text-xs text-muted-foreground">#{questions.length + 1}-savol</span>
                  </div>
                </button>

                {/* Bottom actions */}
                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveStep('info')} className="gap-2 rounded-xl" disabled={saving}>
                    <ArrowLeft className="h-4 w-4" />
                    Sozlamalar
                  </Button>
                  <Button onClick={handleSave} className="gap-2 rounded-xl shadow-lg shadow-primary/20" disabled={saving} size="lg">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saqlanmoqda...' : isEditMode ? 'Yangilash' : 'Saqlash'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
