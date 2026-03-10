import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Answer {
  id: string;
  text: string;
  is_correct: boolean;
  order: number;
}

interface Question {
  id: string;
  text: string;
  question_type: 'multiple_choice' | 'short_answer' | 'essay';
  order: number;
  explanation: string;
  answers: Answer[];
}

const mockGroups = [
  { id: 1, name: 'A1' },
  { id: 2, name: 'A2' },
  { id: 3, name: 'B1' },
  { id: 4, name: 'B2' },
  { id: 5, name: 'C1' },
];

export default function ExamCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'manager' ? '/dashboard/manager' : user?.role === 'teacher' || user?.role === 'sub_teacher' ? '/dashboard/teacher' : '/dashboard/admin';

  const [examData, setExamData] = useState({
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
  });

  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeStep, setActiveStep] = useState<'info' | 'questions'>('info');

  const toggleGroup = (id: number) => {
    setSelectedGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const addQuestion = () => {
    const newQ: Question = {
      id: `q_${Date.now()}`,
      text: '',
      question_type: 'multiple_choice',
      order: questions.length + 1,
      explanation: '',
      answers: [
        { id: `a_${Date.now()}_1`, text: '', is_correct: true, order: 1 },
        { id: `a_${Date.now()}_2`, text: '', is_correct: false, order: 2 },
        { id: `a_${Date.now()}_3`, text: '', is_correct: false, order: 3 },
        { id: `a_${Date.now()}_4`, text: '', is_correct: false, order: 4 },
      ],
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const updateQuestion = (qId: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const removeQuestion = (qId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== qId).map((q, i) => ({ ...q, order: i + 1 })));
  };

  const addAnswer = (qId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        answers: [...q.answers, {
          id: `a_${Date.now()}`,
          text: '',
          is_correct: false,
          order: q.answers.length + 1,
        }],
      };
    }));
  };

  const updateAnswer = (qId: string, aId: string, field: string, value: any) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        answers: q.answers.map(a => {
          if (a.id !== aId) return a;
          return { ...a, [field]: value };
        }).map(a => {
          // If setting is_correct to true, uncheck others for multiple_choice
          if (field === 'is_correct' && value === true && q.question_type === 'multiple_choice') {
            return a.id === aId ? { ...a, is_correct: true } : { ...a, is_correct: false };
          }
          return a;
        }),
      };
    }));
  };

  const removeAnswer = (qId: string, aId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return {
        ...q,
        answers: q.answers.filter(a => a.id !== aId).map((a, i) => ({ ...a, order: i + 1 })),
      };
    }));
  };

  const handleSave = () => {
    if (!examData.title || !examData.subject || selectedGroups.length === 0) {
      toast.error('Iltimos, barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    if (questions.length === 0) {
      toast.error('Kamida 1 ta savol qo\'shing');
      return;
    }
    // Mock save
    toast.success('Imtihon muvaffaqiyatli yaratildi!');
    navigate(`${basePath}/exams`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/exams`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Yangi imtihon yaratish</h1>
            <p className="text-sm text-muted-foreground">Imtihon ma'lumotlari va savollarni kiriting</p>
          </div>
        </div>

        {/* Step tabs */}
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

        {activeStep === 'info' && (
          <div className="space-y-5">
            {/* Basic Info */}
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
                    <Input placeholder="Masalan: Matematika yakuniy imtihon" value={examData.title} onChange={e => setExamData(prev => ({ ...prev, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Tavsif</Label>
                    <Textarea placeholder="Imtihon haqida qisqacha..." value={examData.description} onChange={e => setExamData(prev => ({ ...prev, description: e.target.value }))} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fan nomi *</Label>
                    <Input placeholder="Masalan: Matematika" value={examData.subject} onChange={e => setExamData(prev => ({ ...prev, subject: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Hashtag</Label>
                    <Input placeholder="#math_final" value={examData.hashtag} onChange={e => setExamData(prev => ({ ...prev, hashtag: e.target.value }))} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Groups */}
            <Card className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Guruhlar *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {mockGroups.map(group => (
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

            {/* Time & Scoring */}
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
                    <Input type="datetime-local" value={examData.start_date} onChange={e => setExamData(prev => ({ ...prev, start_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tugash sanasi *</Label>
                    <Input type="datetime-local" value={examData.end_date} onChange={e => setExamData(prev => ({ ...prev, end_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Davomiyligi (daqiqa)</Label>
                    <Input type="number" value={examData.duration_minutes} onChange={e => setExamData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>O'tish bali (%)</Label>
                    <Input type="number" value={examData.passing_score} onChange={e => setExamData(prev => ({ ...prev, passing_score: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Har bir savol bali</Label>
                    <Input type="number" value={examData.question_score} onChange={e => setExamData(prev => ({ ...prev, question_score: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Umumiy ball</Label>
                    <Input type="number" value={examData.total_points} onChange={e => setExamData(prev => ({ ...prev, total_points: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ko'rsatiladigan savollar soni</Label>
                    <Input type="number" value={examData.num_questions_to_show} onChange={e => setExamData(prev => ({ ...prev, num_questions_to_show: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={examData.status} onValueChange={v => setExamData(prev => ({ ...prev, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Faol</SelectItem>
                        <SelectItem value="open">Ochiq</SelectItem>
                        <SelectItem value="closed">Yopiq</SelectItem>
                        <SelectItem value="archived">Arxivlangan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="flex items-center gap-3">
                    <Switch checked={examData.show_results_immediately} onCheckedChange={v => setExamData(prev => ({ ...prev, show_results_immediately: v }))} />
                    <Label className="text-sm">Natijalarni darhol ko'rsatish</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={examData.shuffled_questions} onCheckedChange={v => setExamData(prev => ({ ...prev, shuffled_questions: v }))} />
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
            {/* Questions list */}
            {questions.map((question, qIndex) => (
              <Card key={question.id} className="border-border/50 overflow-hidden">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      <span className="text-sm font-bold text-primary">#{question.order}</span>
                      <Select
                        value={question.question_type}
                        onValueChange={v => updateQuestion(question.id, 'question_type', v)}
                      >
                        <SelectTrigger className="h-7 w-auto text-xs border-none bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Ko'p tanlovli</SelectItem>
                          <SelectItem value="short_answer">Qisqa javob</SelectItem>
                          <SelectItem value="essay">Insho</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => removeQuestion(question.id)}>
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
                      onChange={e => updateQuestion(question.id, 'text', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Izoh (ixtiyoriy)</Label>
                    <Input
                      placeholder="To'g'ri javob izohi..."
                      value={question.explanation}
                      onChange={e => updateQuestion(question.id, 'explanation', e.target.value)}
                    />
                  </div>

                  {question.question_type === 'multiple_choice' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Javob variantlari</Label>
                      <div className="space-y-2">
                        {question.answers.map((answer, aIndex) => (
                          <div key={answer.id} className="flex items-center gap-2">
                            <button
                              onClick={() => updateAnswer(question.id, answer.id, 'is_correct', true)}
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
                              onChange={e => updateAnswer(question.id, answer.id, 'text', e.target.value)}
                              className="flex-1"
                            />
                            {question.answers.length > 2 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => removeAnswer(question.id, answer.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {question.answers.length < 6 && (
                          <Button variant="outline" size="sm" className="w-full border-dashed text-xs gap-1.5 mt-1" onClick={() => addAnswer(question.id)}>
                            <Plus className="h-3 w-3" />Variant qo'shish
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Add question button */}
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

            {/* Save buttons */}
            <div className="flex items-center justify-between pt-4">
              <Button variant="outline" onClick={() => setActiveStep('info')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Orqaga
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Saqlash
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
