import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, BookOpen, Users, Clock, DollarSign, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import DashboardLayout from '@/components/DashboardLayout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Course {
  id: string | number;
  name: string;
  description: string;
  duration_months: number;
  monthly_price: string | number;
  monthly_discount_price: string | number;
  total_price: number;
  total_discount_price: number;
  final_price: number;
  image: string;
  is_active: boolean;
  created_at: string;
  groups_list?: number[];
}

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/courses/');
      const data = await response.json();
      setCourses(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Kurslarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;

    try {
      const response = await authFetch(`/courses/${selectedCourse.id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Kurs o\'chirildi');
        loadCourses();
        setDeleteDialogOpen(false);
        setSelectedCourse(null);
      } else {
        toast.error('Kursni o\'chirishda xatolik');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Kursni o\'chirishda xatolik');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Kurslar</h1>
            <p className="text-sm text-muted-foreground mt-1">Kurslarni boshqarish va ko'rish</p>
          </div>
          <Button 
            onClick={() => navigate('/dashboard/admin/courses/create')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yangi Kurs
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Qidirish</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Kurs nomi yoki tavsifini qidiring..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course) => (
              <Card 
                key={course.id} 
                className="hover:shadow-lg transition-shadow overflow-hidden bg-white dark:bg-slate-800 cursor-pointer group"
                onClick={() => navigate(`/dashboard/admin/courses/${course.id}`)}
              >
                {/* Course Image */}
                <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-blue-600 relative overflow-hidden group-hover:brightness-110 transition-all">
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-purple-600 group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge 
                      className={course.is_active ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                    >
                      {course.is_active ? 'Faol' : 'Noactive'}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2 text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {course.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Course Details */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Duration */}
                    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Davomiyligi</p>
                        <p className="font-semibold text-sm">{course.duration_months} oy</p>
                      </div>
                    </div>

                    {/* Groups Count */}
                    <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-xs text-muted-foreground">Guruhlar</p>
                        <p className="font-semibold text-sm">{course.groups_list?.length || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Oylik:</span>
                      <span className="font-semibold">{Number(course.monthly_price).toLocaleString('uz-UZ')} so'm</span>
                    </div>
                    
                    {Number(course.monthly_discount_price) < Number(course.monthly_price) && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-600 dark:text-green-400">Chegirma:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {Number(course.monthly_discount_price).toLocaleString('uz-UZ')} so'm
                        </span>
                      </div>
                    )}

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-muted-foreground mb-1">Jami to'lov:</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {Number(course.final_price).toLocaleString('uz-UZ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">so'm</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/admin/courses/${course.id}/edit`);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Tahrirlash
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourse(course);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      O'chirish
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white dark:bg-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground mb-1">Hech qanday kurs topilmadi</p>
              <p className="text-sm text-muted-foreground text-center">
                {searchTerm 
                  ? `"${searchTerm}" bo'yicha kurs topilmadi`
                  : 'Yangi kurs yaratish uchun tugmani bosing'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => navigate('/dashboard/admin/courses/create')}
                  className="mt-4"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yangi Kurs
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Kursni o'chirishni tasdiqlang</AlertDialogTitle>
              <AlertDialogDescription>
                "{selectedCourse?.name}" kursini o'chirishni tasdiqlaysizmi? Bu amalni bekor qilib bo'lmaydi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCourse}
                className="bg-destructive hover:bg-destructive/90"
              >
                O'chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
