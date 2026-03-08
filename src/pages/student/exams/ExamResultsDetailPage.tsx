import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Trophy, CheckCircle, XCircle, Clock, BookOpen, TrendingUp,
  ChevronLeft, Download, Share2, BarChart3
} from 'lucide-react';
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
    {
      id: 1,
      text: 'Python dasturlash tilida o\'zgaruvchi e\'lon qilish uchun qaysi kalit so\'z ishlatiladi?',
      yourAnswer: 'c',
      correctAnswer: 'c',
      isCorrect: true,
      category: 'Asoslar'
    },
    {
      id: 2,
      text: 'Quyidagilardan qaysi biri Python\'da ro\'yxat (list) yaratish usuli?',
      yourAnswer: 'a',
      correctAnswer: 'b',
      isCorrect: false,
      category: 'Ma\'lumot tuzilmalari'
    },
    {
      id: 3,
      text: 'Python\'da funksiya yaratish uchun qaysi kalit so\'z ishlatiladi?',
      yourAnswer: 'c',
      correctAnswer: 'c',
      isCorrect: true,
      category: 'Funksiyalar'
    },
    {
      id: 4,
      text: 'Python\'da "Hello World" ni konsolga chiqarish uchun qaysi funksiya ishlatiladi?',
      yourAnswer: 'b',
      correctAnswer: 'b',
      isCorrect: true,
      category: 'Asoslar'
    },
    {
      id: 5,
      text: 'Python\'da tsikl yaratish uchun qaysi kalit so\'zlar ishlatiladi?',
      yourAnswer: 'd',
      correctAnswer: 'a',
      isCorrect: false,
      category: 'Boshqaruv operatorlari'
    },
  ],
  categoryStats: [
    { category: 'Asoslar', correct: 2, total: 3 },
    { category: 'Ma\'lumot tuzilmalari', correct: 1, total: 2 },
    { category: 'Funksiyalar', correct: 1, total: 1 },
    { category: 'Boshqaruv operatorlari', correct: 0, total: 1 },
  ]
};

const chartData = [
  { name: 'To\'g\'ri', value: 21, fill: '#10b981' },
  { name: 'Noto\'g\'ri', value: 9, fill: '#ef4444' }
];

export default function ExamResultsDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [result] = useState<MockExamResult>(MOCK_EXAM_RESULT);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

  const getScoreStatus = (percentage: number) => {
    if (percentage >= 80) return { label: 'A\'lo', color: 'bg-green-500/10 text-green-600 dark:text-green-400' };
    if (percentage >= 70) return { label: 'Yaxshi', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' };
    if (percentage >= 60) return { label: 'O\'rta', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' };
    return { label: 'Yetarli emas', color: 'bg-red-500/10 text-red-600 dark:text-red-400' };
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
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Score Circle */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-primary to-primary/60 p-1 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-background flex flex-col items-center justify-center">
                    <Trophy className="h-8 w-8 text-primary mb-2" />
                    <span className="text-4xl font-bold text-foreground">{result.percentage}</span>
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Badge className={`mt-4 ${status.color}`}>
                  {status.label}
                </Badge>
              </div>

              {/* Stats */}
              <div className="space-y-4 lg:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-muted-foreground">To'g'ri javoblar</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">{result.correctAnswers}</span>
                      <span className="text-muted-foreground">/{result.totalQuestions}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-xs font-medium text-muted-foreground">Noto'g'ri javoblar</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-foreground">{result.totalQuestions - result.correctAnswers}</span>
                      <span className="text-muted-foreground">/{result.totalQuestions}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-muted-foreground">Sarflangan vaqt</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {timeTaken} <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-card border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-muted-foreground">Topshirish vaqti</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {format(new Date(result.submittedAt), 'dd.MM.yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Javoblar taqsimoti
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ta`, 'Savolar']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Kategoriya bo'yicha natijalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={result.categoryStats}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="correct" fill="#10b981" name="To'g'ri" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="total" fill="#e5e7eb" name="Jami" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Questions Review */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Savollar va javoblar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.questions.map((question) => (
              <div
                key={question.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  question.isCorrect
                    ? 'border-green-500/30 bg-green-500/5 hover:bg-green-500/10'
                    : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
                } ${expandedQuestion === question.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-muted-foreground">Savol {question.id}</span>
                      <Badge variant="outline" className="text-xs">
                        {question.category}
                      </Badge>
                      {question.isCorrect ? (
                        <Badge className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          To'g'ri
                        </Badge>
                      ) : (
                        <Badge className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30">
                          <XCircle className="h-3 w-3 mr-1" />
                          Noto'g'ri
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{question.text}</p>
                  </div>
                </div>

                {expandedQuestion === question.id && (
                  <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <span className="text-xs font-semibold text-muted-foreground block mb-1">
                          Sizning javobingiz
                        </span>
                        <p className="text-sm font-medium text-foreground">
                          {question.yourAnswer?.toUpperCase() || 'Javob berilmadi'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-card border border-border">
                        <span className="text-xs font-semibold text-muted-foreground block mb-1">
                          To'g'ri javob
                        </span>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {question.correctAnswer?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center sm:justify-end">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/student/exams')}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Imtihonlarga qaytish
          </Button>
          <Button className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Barcha natijalar
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
