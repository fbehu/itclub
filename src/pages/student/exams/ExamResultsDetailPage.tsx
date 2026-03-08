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
  isCorrect: boolean;
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
    { id: 1, isCorrect: true },
    { id: 2, isCorrect: false },
    { id: 3, isCorrect: true },
    { id: 4, isCorrect: true },
    { id: 5, isCorrect: false },
    { id: 6, isCorrect: true },
    { id: 7, isCorrect: true },
    { id: 8, isCorrect: false },
    { id: 9, isCorrect: true },
    { id: 10, isCorrect: true },
    { id: 11, isCorrect: false },
    { id: 12, isCorrect: true },
    { id: 13, isCorrect: true },
    { id: 14, isCorrect: true },
    { id: 15, isCorrect: false },
    { id: 16, isCorrect: true },
    { id: 17, isCorrect: true },
    { id: 18, isCorrect: true },
    { id: 19, isCorrect: false },
    { id: 20, isCorrect: true },
    { id: 21, isCorrect: true },
    { id: 22, isCorrect: false },
    { id: 23, isCorrect: true },
    { id: 24, isCorrect: true },
    { id: 25, isCorrect: true },
    { id: 26, isCorrect: false },
    { id: 27, isCorrect: true },
    { id: 28, isCorrect: true },
    { id: 29, isCorrect: false },
    { id: 30, isCorrect: true },
  ],
  categoryStats: [
    { category: 'Asoslar', correct: 4, total: 5 },
    { category: "Ma'lumot tuzilmalari", correct: 4, total: 5 },
    { category: 'Funksiyalar', correct: 5, total: 7 },
    { category: 'Boshqaruv', correct: 2, total: 4 },
    { category: 'Modullar', correct: 2, total: 3 },
    { category: 'OOP', correct: 2, total: 4 },
    { category: 'Xatoliklar', correct: 1, total: 1 },
    { category: 'Fayllar', correct: 1, total: 1 },
  ]
};

export default function ExamResultsDetailPage() {
  const navigate = useNavigate();
  const [result] = useState<MockExamResult>(MOCK_EXAM_RESULT);

  const chartData = [
    { name: "To'g'ri", value: result.correctAnswers, fill: 'hsl(var(--primary))' },
    { name: "Noto'g'ri", value: result.totalQuestions - result.correctAnswers, fill: 'hsl(var(--destructive))' }
  ];

  const getScoreStatus = (percentage: number) => {
    if (percentage >= 80) return { label: "A'lo", color: 'bg-primary/10 text-primary' };
    if (percentage >= 70) return { label: 'Yaxshi', color: 'bg-accent text-accent-foreground' };
    if (percentage >= 60) return { label: "O'rta", color: 'bg-secondary text-secondary-foreground' };
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

        {/* Questions Grid - Big Squares */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Savollar natijalari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
              {result.questions.map((q) => (
                <div
                  key={q.id}
                  className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all
                    ${q.isCorrect
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-destructive/10 border-destructive/30'
                    }`}
                >
                  <span className="text-sm font-bold text-muted-foreground mb-1">{q.id}</span>
                  {q.isCorrect
                    ? <CheckCircle className="h-6 w-6 text-primary" />
                    : <XCircle className="h-6 w-6 text-destructive" />
                  }
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>To'g'ri ({result.correctAnswers})</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Noto'g'ri ({result.totalQuestions - result.correctAnswers})</span>
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
