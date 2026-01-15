import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface LessonPlan {
  id: string;
  name: string;
  start_month: string;
  end_month: string;
  groups: { id: string; name: string }[];
  created_at: string;
}

interface MonthData {
  year: number;
  month: number;
  name: string;
  lessonsCount: number;
}

const monthNames: Record<number, string> = {
  1: 'Yanvar',
  2: 'Fevral',
  3: 'Mart',
  4: 'Aprel',
  5: 'May',
  6: 'Iyun',
  7: 'Iyul',
  8: 'Avgust',
  9: 'Sentabr',
  10: 'Oktabr',
  11: 'Noyabr',
  12: 'Dekabr'
};

// Demo lesson plan
const demoLessonPlan: LessonPlan = {
  id: '1',
  name: 'Backend Development',
  start_month: '2026-01',
  end_month: '2026-03',
  groups: [{ id: '1', name: 'Savodxonlik 1' }, { id: '2', name: 'Web Development' }],
  created_at: '2026-01-10T10:00:00Z'
};

function getMonthsBetween(start: string, end: string): MonthData[] {
  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  
  const months: MonthData[] = [];
  let year = startYear;
  let month = startMonth;
  
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push({
      year,
      month,
      name: monthNames[month],
      lessonsCount: Math.floor(Math.random() * 15) + 5 // Demo: random count
    });
    
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return months;
}

export default function LessonPlanDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [months, setMonths] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo: Load lesson plan
    setTimeout(() => {
      setLessonPlan(demoLessonPlan);
      setMonths(getMonthsBetween(demoLessonPlan.start_month, demoLessonPlan.end_month));
      setLoading(false);
    }, 500);
  }, [planId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lessonPlan) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4 sm:p-6">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Dars reja topilmadi</p>
            <Button onClick={() => navigate('/admin/lesson-plans')} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ortga
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/lesson-plans')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{lessonPlan.name}</h1>
            <p className="text-muted-foreground mt-1">Dars reja ma'lumotlari</p>
          </div>
        </div>

        {/* Plan Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Umumiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dars reja</p>
                  <p className="font-semibold">{lessonPlan.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Davomiyligi</p>
                  <p className="font-semibold">{months.length} oy</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Yaratilgan</p>
                  <p className="font-semibold">{new Date(lessonPlan.created_at).toLocaleDateString('uz-UZ')}</p>
                </div>
              </div>
            </div>

            {lessonPlan.groups.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Guruhlar:</p>
                <div className="flex flex-wrap gap-2">
                  {lessonPlan.groups.map(group => (
                    <Badge key={group.id} variant="secondary">
                      {group.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Months Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Oylar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {months.map((month) => (
              <Card
                key={`${month.year}-${month.month}`}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/admin/lesson-plans/${planId}/month/${month.year}-${String(month.month).padStart(2, '0')}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{month.name}</h3>
                        <p className="text-sm text-muted-foreground">{month.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{month.lessonsCount} dars</Badge>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
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
