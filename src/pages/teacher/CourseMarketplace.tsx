import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import {
  ArrowLeft,
  Search,
  Users,
  AlertCircle,
  Loader2,
  BookOpen,
  Zap,
} from 'lucide-react';

interface Course {
  id: number;
  name: string;
  description?: string;
  monthly_price: string | number;
  monthly_discount_price: string | number;
  course_duration: number;
  groups_list: number[];
  enrollment_count?: number;
  created_at?: string;
}

export default function CourseMarketplace() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/courses/');
      if (response.ok) {
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : data.results || []);
      } else {
        toast.error('Kurslarni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Kurslarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalCourses: courses.length,
    activeEnrollments: courses.reduce(
      (sum, c) => sum + (c.enrollment_count || 0),
      0
    ),
    totalStudents: courses.reduce(
      (sum, c) => sum + (c.groups_list?.length || 0),
      0
    ),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/profile')}
              className="h-10 w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Kurslar
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Barcha kurslarni ko'rish va statistika
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami Kurslar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {courses.length > 0 ? 'Faol kurslar' : 'Kurs yo\'q'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami Ro'yxatlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {stats.activeEnrollments}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Barcha kurslar bo'yicha
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Jami Guruhlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalStudents}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Dars beruvchi guruhlar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Kurs nomini izlang..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Yuklanmoqda...</span>
            </CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Hozircha kurslar yo'q</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  "{searchTerm}" bo'yicha kurslar topilmadi
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card
                key={course.id}
                className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-500 overflow-hidden"
              >
                <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        Kurs ID: {course.id}
                      </p>
                    </div>
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  {/* Description */}
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Prices */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Oylik
                      </p>
                      <p className="font-bold text-purple-600 dark:text-purple-400">
                        {Number(
                          course.monthly_discount_price
                        ).toLocaleString('uz-UZ')}{' '}
                        so'm
                      </p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Davom
                      </p>
                      <p className="font-bold text-orange-600 dark:text-orange-400">
                        {course.course_duration} oy
                      </p>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      Umumiy Narx
                    </p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {(
                        Number(course.monthly_discount_price) *
                        course.course_duration
                      ).toLocaleString('uz-UZ')}{' '}
                      so'm
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{course.groups_list?.length || 0} guruh</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span>{course.enrollment_count || 0} ro'yxat</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {/* Removed - teachers can only view course information */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
