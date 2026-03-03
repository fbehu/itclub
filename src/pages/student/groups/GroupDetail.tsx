import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Clock, Users, Calendar, User, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import StudentAttendance from '@/pages/student/Attendance';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  photo?: string;
  phone_number?: string;
  level?: string;
}

interface Group {
  id: string;
  name: string;
  start_time: string;
  end_time?: string;
  class_days?: string[];
  teacher?: Teacher;
  sub_teachers?: Teacher[]; // ✅ Added sub_teachers
  student_count?: number;
  created_at: string;
  telegram_link?: string;
}

export default function StudentGroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadGroupInfo();
    }
  }, [groupId]);

  const loadGroupInfo = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUP_DETAIL(groupId));
      
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
      } else {
        toast.error('Guruh ma\'lumotlarini yuklashda xatolik');
        navigate('/dashboard/student');
      }
    } catch (error) {
      console.error('Error loading group info:', error);
      toast.error('Guruh ma\'lumotlarini yuklashda xatolik');
      navigate('/dashboard/student');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      'Du': 'Dushanba',
      'Se': 'Seshanba',
      'Chor': 'Chorshanba',
      'Pa': 'Payshanba',
      'Ju': 'Juma',
      'Sha': 'Shanba',
      'Yak': 'Yakshanba'
    };
    return days[day] || day;
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

  if (!group) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md border-red-500/50 bg-red-500/5">
            <CardContent className="pt-6">
              <p className="text-red-500 text-center font-medium">Guruh topilmadi</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/profile')}
              className="hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
              <p className="text-sm text-muted-foreground">Guruh detallari va davomat</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Left Column - Guruh Ma'lumotlari */}
          <div className="lg:col-span-1 w-full">
            {/* Guruh Info Card */}
            <Card className="border-none bg-gradient-to-br from-white to-gray-50 dark:from-slate-900/90 dark:to-slate-800/90 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Guruh Ma'lumotlari</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vaqt */}
                {group.start_time && group.end_time && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Dars vaqti</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {group.start_time} - {group.end_time}
                      </p>
                    </div>
                  </div>
                )}

                {/* Dars kunlari */}
                {group.class_days && group.class_days.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      Dars kunlari
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.class_days.map((day, idx) => (
                        <Badge key={idx} variant="outline" className="bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30">
                          {getDayName(day)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* O'qituvchi */}
                {group.teacher && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">O'qituvchi</p>
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarImage src={group.teacher.photo || undefined} />
                        <AvatarFallback className="bg-amber-500 text-white">
                          {(group.teacher.first_name || '')[0]}{(group.teacher.last_name || '')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                          {group.teacher.first_name} {group.teacher.last_name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">@{group.teacher.username}</p>
                      </div>
                    </div>
                    {group.teacher.phone_number && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <a href={`tel:${group.teacher.phone_number}`} className="hover:text-blue-600 dark:hover:text-blue-400 truncate">
                          {group.teacher.phone_number}
                        </a>
                      </div>
                    )}

                    {group.telegram_link && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <Button
                          variant="link"
                          className="text-sky-600 dark:text-sky-400 p-0"
                          onClick={() => window.open(group.telegram_link, '_blank')}
                        >
                          <MessageCircle className="w-4 h-4 inline-block mr-1" /> Telegram guruhga o'tish
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Yordamchi O'qituvchilar */}
                {group.sub_teachers && group.sub_teachers.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Yordamchi O'qituvchilar</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.sub_teachers.map((subTeacher) => (
                        <div key={subTeacher.id} className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-200 dark:border-purple-500/20">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              <AvatarImage src={subTeacher.photo || undefined} />
                              <AvatarFallback className="bg-purple-500 text-white">
                                {(subTeacher.first_name || '')[0]}{(subTeacher.last_name || '')[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                                {subTeacher.first_name} {subTeacher.last_name}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">@{subTeacher.username}</p>
                            </div>
                          </div>
                          {subTeacher.phone_number && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{subTeacher.phone_number}</span>
                            </div>
                          )}  
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* O'quvchilar soni */}
                {group.student_count !== undefined && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-slate-600 dark:text-slate-400">GuruhcdaGuruhcdaGuruhcdaGuruhcdaGuruhcdaGuruhcdaGuruhcdaGuruhcda</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{group.student_count} ta o'quvchi</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Davomat */}
          <div className="lg:col-span-2 w-full">
            {groupId && (
              <StudentAttendance 
                groupId={groupId}
                isGroupView={true}
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


