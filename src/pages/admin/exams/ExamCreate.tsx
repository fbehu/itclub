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
  XCircle, GraduationCap, FileText, Clock, Settings2, HelpCircle
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

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await authFetch(API_ENDPOINTS.GROUPS);
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(data?.detail || 'Guruhlarni olib bo\'lmadi');
        }

        const rows = Array.isArray(data) ? data : (data.results || []);
        setGroups(rows.map((row: any) => ({ id: row.id, name: row.name || row.title || `Group ${row.id}` })));
      } catch (error) {
        console.error('Groups fetch error:', error);
        toast.error('Guruhlar ro\'yxatini yuklashda xatolik');
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

        if (!response.ok) {
          throw new Error(data?.detail || 'Imtihon ma\'lumotlarini olib bo\'lmadi');
        }

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
        toast.error(error instanceof Error ? error.message : 'Imtihonni yuklab bo\'lmadi');
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
    setQuestions((prev) => [...prev, createQuestion(prev.length + 1)]);
  };

  const updateQuestion = (qId: string, field: keyof QuestionForm, value: any) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.localId !== qId) return q;

      const updated: QuestionForm = { ...q, [field]: value };
      if (field === 'question_type') {
        const qType = value as QuestionType;
        if (qType === 'multiple_choice' || qType === 'true_false') {
          if (updated.answers.length < 2) {
            updated.answers = createDefaultAnswers();
          }
        }
      }
      return updated;
    }));
  };

  const removeQuestion = (qId: string) => {
    setQuestions((prev) => prev.filter((q) => q.localId !== qId).map((q, i) => ({ ...q, order: i + 1 })));
  };

  const addAnswer = (qId: string) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.localId !== qId) return q;
      return {
        ...q,
        answers: [
          ...q.answers,
          {
            localId: createLocalId(),
            text: '',
            is_correct: false,
            order: q.answers.length + 1,
          },
        ],
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
      return {
        ...q,
        answers: q.answers.filter((a) => a.localId !== aId).map((a, i) => ({ ...a, order: i + 1 })),
      };
    }));
  };

  const validateForm = () => {
    if (!examData.title.trim() || !examData.subject.trim() || selectedGroups.length === 0) {
      return 'Iltimos, barcha majburiy maydonlarni to\'ldiring';
    }
    if (!examData.start_date || !examData.end_date) {
      return 'Boshlanish va tugash vaqtini kiriting';
    }
    if (new Date(examData.start_date).getTime() >= new Date(examData.end_date).getTime()) {
      return 'Boshlanish vaqti tugash vaqtidan kichik bo\'lishi kerak';
    }
    if (questions.length === 0) {
      return 'Kamida 1 ta savol qo\'shing';
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text.trim()) {
        return `${i + 1}-savol matni bo\'sh bo\'lmasligi kerak`;
      }

      if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
        const validAnswers = question.answers.filter((a) => a.text.trim());
        if (validAnswers.length < 2) {
          return `${i + 1}-savolda kamida 2 ta variant bo\'lishi kerak`;
        }
        if (!validAnswers.some((a) => a.is_correct)) {
          return `${i + 1}-savolda kamida 1 ta to\'g\'ri javob bo\'lishi kerak`;
        }
      }
    }

    return null;
  };

  const syncQuestions = async (targetExamId: number) => {
    if (isEditMode) {
      const oldQuestionsResponse = await authFetch(API_ENDPOINTS.EXAM_QUESTIONS(targetExamId));
      const oldQuestionsData = await oldQuestionsResponse.json().catch(() => []);

      if (!oldQuestionsResponse.ok) {
        throw new Error('Eski savollarni olishda xatolik yuz berdi');
      }

      const oldQuestions = Array.isArray(oldQuestionsData) ? oldQuestionsData : (oldQuestionsData.results || []);
      for (const oldQuestion of oldQuestions) {
        const deleteResponse = await authFetch(API_ENDPOINTS.EXAM_QUESTION_DETAIL(oldQuestion.id), {
          method: 'DELETE',
        });

        if (!deleteResponse.ok) {
          throw new Error('Eski savollarni o\'chirishda xatolik yuz berdi');
        }
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
      if (!questionResponse.ok) {
        throw new Error(questionData?.detail || `${qIndex + 1}-savolni saqlashda xatolik`);
      }

      const createdQuestionId = questionData.id;
      if (!createdQuestionId) {
        throw new Error('Yaratilgan savol ID qaytmadi');
      }

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
          if (!answerResponse.ok) {
            throw new Error(answerData?.detail || `${qIndex + 1}-savol variantlarini saqlashda xatolik`);
          }
        }
      }
    }
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

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
        {
          method: isEditMode ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || 'Imtihonni saqlashda xatolik yuz berdi');
      }

      const savedExamId = data.id;
      if (!savedExamId) {
        throw new Error('Imtihon ID qaytmadi');
      }

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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/exams`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Imtihonni tahrirlash' : 'Yangi imtihon yaratish'}
            </h1>
            <p className="text-sm text-muted-foreground">Imtihon ma'lumotlari va savollarni kiriting</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeStep === 'info' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveStep('info')}
            className="gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Asosiy ma'lumotlar
          </Button>
          <Button
            variant={activeStep === 'questions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveStep('questions')}
            className="gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Savollar ({questions.length})
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        ) : (
          <>
            {activeStep === 'info' && (
              <div className="space-y-5">
                <Card className="border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Asosiy ma'lumotlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Imtihon nomi *</Label>
                        <Input
                          placeholder="Masalan: Matematika yakuniy imtihon"
                          value={examData.title}
                          onChange={(e) => setExamData((prev) => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Tavsif</Label>
                        <Textarea
                          placeholder="Imtihon haqida qisqacha..."
                          value={examData.description}
                          onChange={(e) => setExamData((prev) => ({ ...prev, description: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fan nomi *</Label>
                        <Input
                          placeholder="Masalan: Matematika"
                          value={examData.subject}
                          onChange={(e) => setExamData((prev) => ({ ...prev, subject: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hashtag</Label>
                        <Input
                          placeholder="#math_final"
                          value={examData.hashtag}
                          onChange={(e) => setExamData((prev) => ({ ...prev, hashtag: e.target.value }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Guruhlar *
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => toggleGroup(group.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                            selectedGroups.includes(group.id)
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                          }`}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                    {selectedGroups.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">{selectedGroups.length} ta guruh tanlandi</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Vaqt va baholash
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Boshlanish sanasi *</Label>
                        <Input
                          type="datetime-local"
                          value={examData.start_date}
                          onChange={(e) => setExamData((prev) => ({ ...prev, start_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tugash sanasi *</Label>
                        <Input
                          type="datetime-local"
                          value={examData.end_date}
                          onChange={(e) => setExamData((prev) => ({ ...prev, end_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Davomiyligi (daqiqa)</Label>
                        <Input
                          type="number"
                          value={examData.duration_minutes}
                          onChange={(e) => setExamData((prev) => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>O'tish bali (%)</Label>
                        <Input
                          type="number"
                          value={examData.passing_score}
                          onChange={(e) => setExamData((prev) => ({ ...prev, passing_score: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Har bir savol bali</Label>
                        <Input
                          type="number"
                          value={examData.question_score}
                          onChange={(e) => setExamData((prev) => ({ ...prev, question_score: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Umumiy ball</Label>
                        <Input
                          type="number"
                          value={examData.total_points}
                          onChange={(e) => setExamData((prev) => ({ ...prev, total_points: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ko'rsatiladigan savollar soni</Label>
                        <Input
                          type="number"
                          value={examData.num_questions_to_show}
                          onChange={(e) => setExamData((prev) => ({ ...prev, num_questions_to_show: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={examData.status} onValueChange={(v) => setExamData((prev) => ({ ...prev, status: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="published">Faol</SelectItem>
                            <SelectItem value="open">Ochiq</SelectItem>
                            <SelectItem value="closed">Yopiq</SelectItem>
                            <SelectItem value="expired">Muddati o'tgan</SelectItem>
                            <SelectItem value="archived">Arxivlangan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={examData.show_results_immediately}
                          onCheckedChange={(v) => setExamData((prev) => ({ ...prev, show_results_immediately: v }))}
                        />
                        <Label className="text-sm">Natijalarni darhol ko'rsatish</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={examData.shuffled_questions}
                          onCheckedChange={(v) => setExamData((prev) => ({ ...prev, shuffled_questions: v }))}
                        />
                        <Label className="text-sm">Savollarni aralashtirish</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={() => setActiveStep('questions')} className="gap-2">
                    Keyingi: Savollar
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {activeStep === 'questions' && (
              <div className="space-y-5">
                {questions.map((question) => (
                  <Card key={question.localId} className="border-border/50 overflow-hidden">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                          <span className="text-sm font-bold text-primary">#{question.order}</span>
                          <Select
                            value={question.question_type}
                            onValueChange={(v) => updateQuestion(question.localId, 'question_type', v as QuestionType)}
                          >
                            <SelectTrigger className="h-7 w-auto text-xs border-none bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Ko'p tanlovli</SelectItem>
                              <SelectItem value="true_false">To'g'ri / Noto'g'ri</SelectItem>
                              <SelectItem value="short_answer">Qisqa javob</SelectItem>
                              <SelectItem value="essay">Insho</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeQuestion(question.localId)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Savol matni</Label>
                        <Textarea
                          placeholder="Savolni kiriting..."
                          value={question.text}
                          onChange={(e) => updateQuestion(question.localId, 'text', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Izoh (ixtiyoriy)</Label>
                        <Input
                          placeholder="To'g'ri javob izohi..."
                          value={question.explanation}
                          onChange={(e) => updateQuestion(question.localId, 'explanation', e.target.value)}
                        />
                      </div>

                      {(question.question_type === 'multiple_choice' || question.question_type === 'true_false') && (
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Javob variantlari</Label>
                          <div className="space-y-2">
                            {question.answers.map((answer, aIndex) => (
                              <div key={answer.localId} className="flex items-center gap-2">
                                <button
                                  onClick={() => updateAnswer(question.localId, answer.localId, 'is_correct', true)}
                                  className={`shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
                                    answer.is_correct
                                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400'
                                      : 'border-border text-muted-foreground hover:border-primary/50'
                                  }`}
                                  title={answer.is_correct ? "To'g'ri javob" : "To'g'ri deb belgilash"}
                                >
                                  {answer.is_correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-40" />}
                                </button>
                                <span className="text-xs text-muted-foreground font-mono w-5">{String.fromCharCode(65 + aIndex)}</span>
                                <Input
                                  placeholder={`${aIndex + 1}-variant`}
                                  value={answer.text}
                                  onChange={(e) => updateAnswer(question.localId, answer.localId, 'text', e.target.value)}
                                  className="flex-1"
                                />
                                {question.answers.length > 2 && (
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => removeAnswer(question.localId, answer.localId)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            {question.answers.length < 6 && (
                              <Button variant="outline" size="sm" className="w-full border-dashed text-xs gap-1.5 mt-1" onClick={() => addAnswer(question.localId)}>
                                <Plus className="h-3 w-3" />Variant qo'shish
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <button
                  onClick={addQuestion}
                  className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-all duration-200 group"
                >
                  <div className="h-12 w-12 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Plus className="h-6 w-6 group-hover:text-primary" />
                  </div>
                  <span className="text-sm font-medium">Yangi savol qo'shish</span>
                  <span className="text-xs text-muted-foreground">Jami: {questions.length} ta savol</span>
                </button>

                <div className="flex items-center justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveStep('info')} className="gap-2" disabled={saving}>
                    <ArrowLeft className="h-4 w-4" />
                    Orqaga
                  </Button>
                  <Button onClick={handleSave} className="gap-2" disabled={saving}>
                    <Save className="h-4 w-4" />
                    {saving ? 'Saqlanmoqda...' : 'Saqlash'}
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
