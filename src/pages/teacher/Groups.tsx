import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Users, ChevronRight, Eye, Clock, Calendar, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { EditGroupDialog } from '../admin/groups/EditGroupDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Group {
  id: string;
  name: string;
  smena: string;
  start_time: string;
  end_time?: string;
  class_days?: string | string[];
  student_count: number;
  created_at: string;
  telegram_link?: string;
}

export default function TeacherGroups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSubTeacher = user?.role === 'sub_teacher';
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUPS);
      const data = await response.json();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Guruhlar</h1>
            <p className="text-muted-foreground mt-1">O'quvchilar guruhlarini boshqarish</p>
          </div>
        </div>

        {groups.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Guruhlar topilmadi</p>
              <p className="text-sm text-muted-foreground mt-1">Admin tizimda yangi guruh yaratilishi kerak</p>
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
                      <TableHead className="font-bold">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Kunlari
                        </div>
                      </TableHead>
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
                            {group.smena && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {group.smena}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-md bg-blue-100">
                              <Clock className="w-4 h-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="font-medium">{group.start_time}</p>
                              <p className="text-xs text-muted-foreground">{group.end_time || '-'}</p>
                            </div>
                          </div>
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
                                : Array.isArray(group.class_days) && group.class_days.map((day, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                      {day}
                                    </Badge>
                                  ))
                              }
                            </div>
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
                              onClick={() => navigate(`/dashboard/teacher/groups/${group.id}`)}
                              title="Ko'rish"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            {!isSubTeacher && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="hover:bg-amber-100"
                                onClick={() => {
                                  setSelectedGroup(group as any);
                                  setEditDialogOpen(true);
                                }}
                                title="Tahrirlash"
                              >
                                <Edit className="w-4 h-4 text-amber-600" />
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

        {selectedGroup && (
          <EditGroupDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            group={selectedGroup as any}
            onSuccess={loadGroups}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
