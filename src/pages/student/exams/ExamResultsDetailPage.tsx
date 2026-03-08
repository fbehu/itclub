import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Trophy, CheckCircle, XCircle, Clock, BookOpen, TrendingUp,
  ChevronLeft, Download, Share2, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';
import DashboardLayout from '@/components/DashboardLayout';

interface Question {
  id: number;
  text: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  category: string;
}

interface MockExamResult {
  id: number;
  title: string;
  course: string;
  score: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  duration: number;
  submittedAt: string;
  startedAt: string;
  questions: Question[];
  categoryStats: { category: string; correct: number; total: number }[];
}

const MOCK_EXAM_RESULT: MockExamResult = {
  id: 1,
  title: 'Python asoslari — Yakuniy imtihon',
  course: 'Python dasturlash',
  score: 72,
  percentage: 72,
  correctAnswers: 21,
  totalQuestions: 30,
  duration: 45,
  submittedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  startedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  questions: [
    { id: 1, text: 'Python dasturlash tilida o\'zgaruvchi e\'lon qilish uchun qaysi kalit so\'z ishlatiladi?', yourAnswer: 'c', correctAnswer: 'c', isCorrect: true, category: 'Asoslar' },
    { id: 2, text: 'Quyidagilardan qaysi biri Python\'da ro\'yxat (list) yaratish usuli?', yourAnswer: 'a', correctAnswer: 'b', isCorrect: false, category: 'Ma\'lumot tuzilmalari' },
    { id: 3, text: 'Python\'da funksiya yaratish uchun qaysi kalit so\'z ishlatiladi?', yourAnswer: 'c', correctAnswer: 'c', isCorrect: true, category: 'Funksiyalar' },
    { id: 4, text: 'Python\'da "Hello World" ni konsolga chiqarish uchun qaysi funksiya ishlatiladi?', yourAnswer: 'b', correctAnswer: 'b', isCorrect: true, category: 'Asoslar' },
    { id: 5, text: 'Python\'da tsikl yaratish uchun qaysi kalit so\'zlar ishlatiladi?', yourAnswer: 'd', correctAnswer: 'a', isCorrect: false, category: 'Boshqaruv operatorlari' },
    { id: 6, text: 'Python\'da lug\'at (dictionary) yaratish usuli?', yourAnswer: 'a', correctAnswer: 'a', isCorrect: true, category: 'Ma\'lumot tuzilmalari' },
    { id: 7, text: 'Python\'da if-else sintaksisi qanday?', yourAnswer: 'b', correctAnswer: 'b', isCorrect: true, category: 'Boshqaruv operatorlari' },
    { id: 8, text: 'Python\'da string metodlari qaysi?', yourAnswer: 'c', correctAnswer: 'a', isCorrect: false, category: 'Asoslar' },
    { id: 9, text: 'Python\'da modul import qilish?', yourAnswer: 'a', correctAnswer: 'a', isCorrect: true, category: 'Modullar' },
    { id: 10, text: 'Python\'da xatoliklarni ushlash?', yourAnswer: 'b', correctAnswer: 'b', isCorrect: true, category: 'Xatoliklar' },
    { id: 11, text: 'Python OOP - class yaratish?', yourAnswer: 'a', correctAnswer: 'c', isCorrect: false, category: 'OOP' },
    { id: 12, text: 'Python\'da lambda funksiyalar?', yourAnswer: 'c', correctAnswer: 'c', isCorrect: true, category: 'Funksiyalar' },
    { id: 13, text: 'Python\'da file operations?', yourAnswer: 'b', correctAnswer: 'b', isCorrect: true, category: 'Fayllar' },
    { id: 14, text: 'Python\'da list comprehension?', yourAnswer: 'a', correctAnswer: 'a', isCorrect: true, category: 'Ma\'lumot tuzilmalari' },
    { id: 15, text: 'Python\'da decorator nima?', yourAnswer: 'd', correctAnswer: 'b', isCorrect: false, category: 'Funksiyalar' },
    { id: 16, text: 'Python\'da generator nima?', yourAnswer: 'a', correctAnswer: 'a', isCorrect: true, category: 'Funksiyalar' },
    { id: 17, text: 'Python\'da set yaratish?', yourAnswer: 'b', correctAnswer: 'b', isCorrect: true, category: 'Ma\'lumot tuzilmalari' },
    { id: 18, text: 'Python\'da tuple nima?', yourAnswer: 'c', correctAnswer: 'c', isCorrect: true, category: 'Ma\'lumot tuzilmalari' },
    { id: 19, text: 'Python\'da while loop?', yourAnswer: 'a', correctAnswer: 'b', isCorrect: false, category: 'Boshqaruv operatorlari' },
    { id: 20, text: 'Python\'da break va continue?', yourAnswer: 'b', correctAnswer: 'b', isCorrect: true, category: 'Boshqaruv operatorlari' },
    { id: 21, text: 'Python\'da map funksiyasi?', yourAnswer: 'a', correctAnswer: 'a', isCorrect: true, category: 'Funksiyalar' },
    { id: 22, text: 'Python\'da filter funksiyasi?', yourAnswer: 'c', correctAnswer: 'a', isCorrect: false, category: 'Funksiyalar' },
    { id: 23, text: 'Python\'da zip funksiyasi?', yourAnswer: 'b', correctAnswer: 'b', isCorrect: true, category: 'Funksiyalar' },
    { id: 24, text: 'Python\'da enumerate?', yourAnswer: 'a', correctAnswer: 'a', isCorrect: true, category: 'Asoslar' },
    { id: 25, text: 'Python\'da inheritance?', yourAnswer: 'c', correctAnswer: 'c', isCorrect: true, category: 'OOP' },
    { id: 26, text: 'Python\'da polymorphism?', yourAnswer: 'b', correctAnswer: 'a', isCorrect: false, category: 'OOP' },
    { id: 27, text: 'Python\'da encapsulation?', yourAnswer: 'a', correctAnswer: 'a', isCorrect: true, category: 'OOP' },
    { id: 28, text: 'Python\'da pip nima?', yourAnswer: 'b', correctAnswer: 'b', isCorrect: true, category: 'Modullar' },
    { id: 29, text: 'Python\'da virtualenv?', yourAnswer: 'a', correctAnswer: 'c', isCorrect: false, category: 'Modullar' },
    { id: 30, text: 'Python versiyalarini tekshirish?', yourAnswer: 'a', correctAnswer: 'a', isCorrect: true, category: 'Asoslar' },
  ],
  categoryStats: [
    { category: 'Asoslar', correct: 4, total: 5 },
    { category: 'Ma\'lumot tuzilmalari', correct: 4, total: 5 },
    { category: 'Funksiyalar', correct: 5, total: 7 },
    { category: 'Boshqaruv operatorlari', correct: 2, total: 4 },
    { category: 'Modullar', correct: 2, total: 3 },
    { category: 'OOP', correct: 2, total: 4 },
    { category: 'Xatoliklar', correct: 1, total: 1 },
    { category: 'Fayllar', correct: 1, total: 1 },
  ]
};

const chartData = [
  { name: 'To\'g\'ri', value: MOCK_EXAM_RESULT.correctAnswers, fill: 'hsl(var(--primary))' },
  { name: 'Noto\'g\'ri', value: MOCK_EXAM_RESULT.totalQuestions - MOCK_EXAM_RESULT.correctAnswers, fill: 'hsl(var(--destructive))' }
];

export default function ExamResultsDetailPage() {
  const navigate = useNavigate();
  const [result] = useState<MockExamResult>(MOCK_EXAM_RESULT);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getScoreStatus = (percentage: number) => {
    if (percentage >= 80) return { label: 'A\'lo', color: 'bg-primary/10 text-primary' };
    if (percentage >= 70) return { label: 'Yaxshi', color: 'bg-accent text-accent-foreground' };
    if (percentage >= 60) return { label: 'O\'rta', color: 'bg-secondary text-secondary-foreground' };
    return { label: 'Yetarli emas', color: 'bg-destructive/10 text-destructive' };
  };

  const status = getScoreStatus(result.percentage);
  const timeTaken = Math.floor((new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/student/exam-results')}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{result.title}</h1>
              <p className="text-muted-foreground text-sm mt-1">{result.course}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Yuklab olish</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Ulashish</span>
            </Button>
          </div>
        </div>

        {/* Main Score Card */}
        <Card className="border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Score Circle */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-36 h-36 rounded-full border-4 border-primary/20 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <Trophy className="h-6 w-6 text-primary mb-1" />
                    <span className="text-4xl font-bold text-foreground">{result.percentage}</span>
                    <span className="text-xs text-muted-foreground">foiz</span>
                  </div>
                </div>
                <Badge className={`mt-4 ${status.color}`}>{status.label}</Badge>
              </div>

              {/* Stats */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">To'g'ri</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{result.correctAnswers}</span>
                  <span className="text-muted-foreground">/{result.totalQuestions}</span>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs font-medium text-muted-foreground">Noto'g'ri</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{result.totalQuestions - result.correctAnswers}</span>
                  <span className="text-muted-foreground">/{result.totalQuestions}</span>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Vaqt</span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{timeTaken}</span>
                  <span className="text-sm text-muted-foreground ml-1">min</span>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Topshirildi</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {format(new Date(result.submittedAt), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Javoblar taqsimoti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Kategoriya bo'yicha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={result.categoryStats} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.5rem' }} />
                  <Legend />
                  <Bar dataKey="correct" fill="hsl(var(--primary))" name="To'g'ri" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="total" fill="hsl(var(--muted))" name="Jami" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Questions Answer Grid Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Savollar jadvali</CardTitle>
              <div className="flex gap-1 bg-muted rounded-lg p-0.5">
                <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode('grid')}>
                  Jadval
                </Button>
                <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode('list')}>
                  Ro'yxat
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'grid' ? (
              /* Grid / Table view */
              <div className="space-y-4">
                {/* Quick overview grid */}
                <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5">
                  {result.questions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                      className={`relative h-10 w-full rounded-lg text-xs font-bold flex items-center justify-center transition-all border-2 hover:scale-105
                        ${q.isCorrect 
                          ? 'bg-primary/10 border-primary/30 text-primary' 
                          : 'bg-destructive/10 border-destructive/30 text-destructive'
                        }
                        ${expandedQuestion === q.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                      `}
                    >
                      <span className="text-[10px]">{q.id}</span>
                      <span className="absolute -top-1 -right-1">
                        {q.isCorrect 
                          ? <CheckCircle className="h-3.5 w-3.5 text-primary fill-primary/20" />
                          : <XCircle className="h-3.5 w-3.5 text-destructive fill-destructive/20" />
                        }
                      </span>
                    </button>
                  ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                    <span>To'g'ri ({result.correctAnswers})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    <span>Noto'g'ri ({result.totalQuestions - result.correctAnswers})</span>
                  </div>
                </div>

                {/* Table view */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs w-10">#</th>
                          <th className="text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs">Savol</th>
                          <th className="text-center py-2.5 px-3 font-semibold text-muted-foreground text-xs w-20">Javob</th>
                          <th className="text-center py-2.5 px-3 font-semibold text-muted-foreground text-xs w-20">To'g'ri</th>
                          <th className="text-center py-2.5 px-3 font-semibold text-muted-foreground text-xs w-16">Natija</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.questions.map((q, i) => (
                          <tr key={q.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                            <td className="py-2.5 px-3 text-xs font-medium text-muted-foreground">{q.id}</td>
                            <td className="py-2.5 px-3 text-xs text-foreground max-w-[300px] truncate">{q.text}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold
                                ${q.isCorrect ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}
                              `}>
                                {q.yourAnswer.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold bg-primary/10 text-primary">
                                {q.correctAnswer.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {q.isCorrect 
                                ? <CheckCircle className="h-5 w-5 text-primary mx-auto" />
                                : <XCircle className="h-5 w-5 text-destructive mx-auto" />
                              }
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* List view */
              <div className="space-y-3">
                {result.questions.map((question) => (
                  <div
                    key={question.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      question.isCorrect
                        ? 'border-primary/20 bg-primary/[0.02] hover:bg-primary/5'
                        : 'border-destructive/20 bg-destructive/[0.02] hover:bg-destructive/5'
                    } ${expandedQuestion === question.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-muted-foreground">#{question.id}</span>
                          <Badge variant="outline" className="text-[10px]">{question.category}</Badge>
                        </div>
                        <p className="text-sm text-foreground">{question.text}</p>
                      </div>
                      <div className="shrink-0">
                        {question.isCorrect 
                          ? <CheckCircle className="h-6 w-6 text-primary" />
                          : <XCircle className="h-6 w-6 text-destructive" />
                        }
                      </div>
                    </div>

                    {expandedQuestion === question.id && (
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Sizning javobingiz</span>
                          <p className={`text-sm font-bold ${question.isCorrect ? 'text-primary' : 'text-destructive'}`}>
                            {question.yourAnswer?.toUpperCase() || '—'}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-card border border-border">
                          <span className="text-[10px] font-semibold text-muted-foreground block mb-1">To'g'ri javob</span>
                          <p className="text-sm font-bold text-primary">{question.correctAnswer?.toUpperCase()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center sm:justify-end pb-4">
          <Button variant="outline" onClick={() => navigate('/dashboard/student/exams')} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Imtihonlarga qaytish
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
