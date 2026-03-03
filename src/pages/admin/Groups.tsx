import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Clock, Calendar, Eye, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { CreateGroupDialog } from './groups/CreateGroupDialog';
import { EditGroupDialog } from './groups/EditGroupDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_number?: string;
  photo?: string;
  level?: string;
  role?: string;
}

interface Group {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  class_days: string | string[];
  student_count: number;
  created_at: string;
  telegram_link?: string;
  teacher?: string | Teacher;
  sub_teachers?: Teacher[]; // ✅ Added sub_teachers field
  course?: {
    id: number;
    name: string;
    description: string;
    duration_months: number;
    monthly_price: string;
    monthly_discount_price: string;
    total_price: number;
    total_discount_price: number;
    final_price: number;
    image: string;
    is_active: boolean;
  };
  room?: {
    id: number;
    name: string;
    room_number?: string;
    floor?: number;
    capacity?: number; // ✅ Added capacity
  };
}

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const basePath = user?.role === 'manager' ? '/dashboard/manager' : '/dashboard/admin';
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUPS);
      const data = await response.json();
      console.log('Loaded groups:', data.results || data); // Debug
      setGroups(data.results || data);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Guruhlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    try {
      const response = await authFetch(API_ENDPOINTS.GROUP_DETAIL(selectedGroup.id), {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Guruh o\'chirildi');
        loadGroups();
        setDeleteDialogOpen(false);
        setSelectedGroup(null);
      } else {
        toast.error('Guruhni o\'chirishda xatolik');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Guruhni o\'chirishda xatolik');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Guruhlar</h1>
          <p className="text-muted-foreground mt-1">O'quvchilar guruhlarini boshqarish</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto" disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Yuklanmoqda...' : 'Yangi guruh'}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
        </div>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Guruhlar topilmadi</p>
            <p className="text-sm text-muted-foreground mt-1">Yangi guruh yaratish uchun yuqoridagi tugmani bosing</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Guruhlar ro'yxati
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Jami: {groups.length} ta guruh</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12 font-bold">#</TableHead>
                    <TableHead className="font-bold">Guruh nomi</TableHead>
                    <TableHead className="font-bold">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Vaqti
                      </div>
                    </TableHead>
                    <TableHead className="font-bold">Kurs</TableHead>
                    <TableHead className="font-bold">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Kunlari
                      </div>
                    </TableHead>
                    <TableHead className="font-bold">Xona</TableHead>
                    <TableHead className="font-bold">Ustoz</TableHead>
                    <TableHead className="font-bold">Yordamchilar</TableHead>
                    <TableHead className="font-bold text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4" />
                        O'quvchilar
                      </div>
                    </TableHead>
                    <TableHead className="font-bold text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group, index) => (
                    <TableRow key={group.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold text-primary">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-base">{group.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-md bg-blue-100">
                            <Clock className="w-4 h-4 text-blue-700" />
                          </div>
                          <div>
                            <p className="font-medium">{group.start_time}</p>
                            <p className="text-xs text-muted-foreground">{group.end_time}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {group.course ? (
                          <button
                            onClick={() => {
                              navigate(`/dashboard/admin/courses/${group.course.id}`);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors"
                          >
                            <span className="font-medium text-purple-700 hover:text-purple-900">
                              {group.course.name}
                            </span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Kurs yo'q</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.class_days && (
                          <div className="flex flex-wrap gap-1">
                            {typeof group.class_days === 'string'
                              ? group.class_days.split(',').map((day, idx) => (
                                  <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                    {day.trim()}
                                  </Badge>
                                ))
                              : (Array.isArray(group.class_days) 
                                  ? group.class_days.map((day, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                      {day}
                                    </Badge>
                                  ))
                                  : null
                                )
                            }
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.room ? (
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{group.room.name}</p>
                            {group.room.floor && (
                              <p className="text-xs text-muted-foreground">{group.room.floor}-qavat</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Belgilanmagan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.teacher && typeof group.teacher === 'object' ? (
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {group.teacher.first_name} {group.teacher.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">@{group.teacher.username}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Belgilanmagan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {group.sub_teachers && group.sub_teachers.length > 0 ? (
                          <div className="space-y-1">
                            {group.sub_teachers.map((teacher) => (
                              <div key={teacher.id} className="text-xs">
                                <p className="font-medium">{teacher.first_name} {teacher.last_name}</p>
                                <p className="text-muted-foreground">@{teacher.username}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Yo'q</span> 
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-purple-100">
                            <span className="font-bold text-purple-700 text-sm">
                              {group.student_count || 0}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {group.telegram_link && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-sky-100"
                              onClick={() => window.open(group.telegram_link, '_blank')}
                              title="Telegram guruh"
                            >
                              <MessageCircle className="w-4 h-4 text-sky-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-blue-100"
                            onClick={() => navigate(`${basePath}/groups/${group.id}`)}
                            title="Ko'rish"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="hover:bg-amber-100"
                            onClick={() => {
                              console.log('Edit group:', group); // Debug - check what data we're passing
                              setSelectedGroup(group);
                              setEditDialogOpen(true);
                            }}
                            title="Tahrirlash"
                          >
                            <Edit className="w-4 h-4 text-amber-600" />
                          </Button>
                          {user?.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hover:bg-red-100"
                              onClick={() => {
                                setSelectedGroup(group);
                                setDeleteDialogOpen(true);
                              }}
                              title="O'chirish"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadGroups}
      />

      {selectedGroup && (
        <EditGroupDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          group={selectedGroup}
          onSuccess={loadGroups}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Guruhni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedGroup?.name}" guruhini o'chirishni xohlaysizmi? Bu amalni bekor qilib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </DashboardLayout>
  );
}