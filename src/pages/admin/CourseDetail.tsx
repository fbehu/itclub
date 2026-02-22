import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Clock, Users, DollarSign, Tag, BookOpen, Percent, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import DashboardLayout from '@/components/DashboardLayout';

interface CourseDetail {
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
  groups?: Group[];
}

interface Group {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  class_days: string[];
  student_count: number;
  room?: {
    id: string;
    name: string;
    floor?: number;
  };
  teacher?: {
    id: string;
    first_name: string;
    last_name: string;
    phone_number: string;
  };
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const response = await authFetch(`/courses/${courseId}/`);
      const data = await response.json();
      setCourse(data);
      
      // Fetch group details if we have group IDs
      if (data.groups_list && data.groups_list.length > 0) {
        await fetchGroupDetails(data.groups_list);
      }
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Kursni yuklashda xatolik');
      navigate('/dashboard/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async (groupIds: number[]) => {
    try {
      const groupDetailsPromises = groupIds.map(id =>
        authFetch(`/groups/${id}/`).then(res => res.json())
      );
      const groupsData = await Promise.all(groupDetailsPromises);
      setGroups(groupsData);
    } catch (error) {
      console.error('Error loading group details:', error);
      toast.error('Guruh ma\'lumotlarini yuklashda xatolik');
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-4">Kurs topilmadi</p>
            <Button onClick={() => navigate('/dashboard/admin/courses')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kurslar ro'yxatiga qaytish
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const monthlyDiscount = Number(course.monthly_price) - Number(course.monthly_discount_price);
  const monthlyDiscountPercent = ((monthlyDiscount / Number(course.monthly_price)) * 100).toFixed(1);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header with back button */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/dashboard/admin/courses')}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{course.name}</h1>
              <p className="text-sm text-muted-foreground mt-1">Kurs batafsil ma'lumotlari</p>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/dashboard/admin/courses/${courseId}/edit`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Tahrirlash
          </Button>
        </div>

        {/* Course Image and Quick Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Image */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden bg-white dark:bg-slate-800">
              <div className="w-full h-64 bg-gradient-to-br from-blue-400 to-blue-600 relative overflow-hidden">
                {course.image ? (
                  <img
                    src={course.image}
                    alt={course.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-white/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge 
                    className={course.is_active ? 'bg-green-500' : 'bg-red-500'}
                  >
                    {course.is_active ? '✅ Faol' : '❌ Noactive'}
                  </Badge>
                </div>
              </div>

              {/* Quick Stats */}
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Davomiyligi</p>
                      <p className="font-bold">{course.duration_months} oy</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Guruhlar</p>
                      <p className="font-bold">{course.groups_list?.length || 0} ta</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Tavsifi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {course.description || 'Tavsif kiritilmagan'}
                </p>
              </CardContent>
            </Card>

            {/* Pricing - Marketing Focused */}
            <Card className="bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-emerald-900/20 border-2 border-emerald-300 dark:border-emerald-700 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white pb-4">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <DollarSign className="w-6 h-6" />
                  Narx va To'lov Shartlari
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  {/* Main Price Display - Monthly First */}
                  {Number(course.monthly_discount_price) < Number(course.monthly_price) ? (
                    // With Discount
                    <div className="relative">
                      {/* Discount Badge - Outside Card */}
                      <div className="absolute -top-6 -right-2 bg-gradient-to-r from-red-500 to-pink-600 text-white px-5 py-2 rounded-full font-bold shadow-xl transform rotate-12 z-10 whitespace-nowrap">
                        -{monthlyDiscountPercent}%
                      </div>
                      
                      <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-slate-700 dark:to-slate-700/50 rounded-xl p-6 border-2 border-emerald-400 dark:border-emerald-600 shadow-lg">


                      {/* Original Monthly Price (Small) */}
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-1">Oylik doimiy narxi</p>
                        <p className="text-sm line-through text-slate-400 dark:text-slate-500 font-medium">
                          {Number(course.monthly_price).toLocaleString('uz-UZ')} so'm
                        </p>
                      </div>

                      {/* Discount Monthly Price (Large - Hero) */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400">
                          {Number(course.monthly_discount_price).toLocaleString('uz-UZ')}
                        </span>
                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">so'm/oy</span>
                      </div>

                      {/* Savings Amount */}
                      <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-700">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          💰 Oylik tejashlar: {(Number(course.monthly_price) - Number(course.monthly_discount_price)).toLocaleString('uz-UZ')} so'm
                        </p>
                      </div>
                      </div>
                    </div>
                  ) : (
                    // Without Discount
                    <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-700 dark:to-slate-700/50 rounded-xl p-6 border-2 border-blue-300 dark:border-blue-600 shadow-lg">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold mb-2">Oylik narxi</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-blue-600 dark:text-blue-400">
                          {Number(course.monthly_price).toLocaleString('uz-UZ')}
                        </span>
                        <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">so'm/oy</span>
                      </div>
                    </div>
                  )}

                  {/* Payment Options Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Monthly Payment */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                      <p className="text-xs text-purple-600 dark:text-purple-400 uppercase font-bold tracking-wider mb-2">Oylik to'lov</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        {Number(course.monthly_discount_price).toLocaleString('uz-UZ')}
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">so'm / oy</p>
                    </div>

                    {/* Duration */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wider mb-2">Davomiyligi</p>
                      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                        {course.duration_months || 'N/A'}
                      </p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">oy</p>
                    </div>
                  </div>

                  {/* Total Prices Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Total Regular Price */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                      <p className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Jami (doimiy)</p>
                      <p className="text-xl font-bold text-slate-700 dark:text-slate-300 line-through">
                        {Number(course.total_price).toLocaleString('uz-UZ')}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">so'm</p>
                    </div>

                    {/* Total Discount Price */}
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 rounded-lg p-4 border border-cyan-200 dark:border-cyan-700">
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 uppercase font-bold tracking-wider mb-1">Jami (chegirma)</p>
                      <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300">
                        {Number(course.total_discount_price).toLocaleString('uz-UZ')}
                      </p>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">so'm</p>
                    </div>

                    {/* Final Price - CTA */}
                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 dark:from-emerald-600 dark:to-cyan-600 text-white rounded-lg p-4 shadow-lg">
                      <p className="text-xs font-semibold opacity-90 uppercase mb-1">To'lash</p>
                      <p className="text-2xl font-black">
                        {Number(course.final_price).toLocaleString('uz-UZ')}
                      </p>
                      <p className="text-xs font-semibold opacity-90 mt-1">so'm</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Groups Section */}
        <Card className="bg-white dark:bg-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Shu kursga tegishli guruhlar
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {groups.length || 0} ta guruh
            </p>
          </CardHeader>
          <CardContent>
            {groups && groups.length > 0 ? (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-3">{group.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {/* Time */}
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <div>
                              <p className="text-xs text-muted-foreground">Dars vaqti</p>
                              <p className="font-medium">
                                {group.start_time} - {group.end_time}
                              </p>
                            </div>
                          </div>

                          {/* Days */}
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                            <div>
                              <p className="text-xs text-muted-foreground">Dars kunlari</p>
                              <p className="font-medium">
                                {Array.isArray(group.class_days)
                                  ? group.class_days.join(', ')
                                  : group.class_days}
                              </p>
                            </div>
                          </div>

                          {/* Room */}
                          {group.room && (
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <div>
                                <p className="text-xs text-muted-foreground">Xona</p>
                                <p className="font-medium">{group.room.name}</p>
                              </div>
                            </div>
                          )}

                          {/* Teacher */}
                          {group.teacher && (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              <div>
                                <p className="text-xs text-muted-foreground">O'qituvchi</p>
                                <p className="font-medium">
                                  {group.teacher.first_name} {group.teacher.last_name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  Shu kursga tegishli guruh yo'q
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
