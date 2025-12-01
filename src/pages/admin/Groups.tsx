import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { CreateGroupDialog } from './groups/CreateGroupDialog';
import { EditGroupDialog } from './groups/EditGroupDialog';
import { AddStudentsDialog } from './groups/AddStudentsDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Group {
  id: string;
  name: string;
  semester: string;
  class_days: string[];
  start_time: string;
  student_count: number;
  created_at: string;
}

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const getDaysText = (days: string[]) => {
    const dayMap: Record<string, string> = {
      monday: 'Dush',
      tuesday: 'Sesh',
      wednesday: 'Chor',
      thursday: 'Pay',
      friday: 'Juma',
      saturday: 'Shan',
      sunday: 'Yak'
    };
    return days.map(d => dayMap[d] || d).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Guruhlar</h1>
          <p className="text-muted-foreground mt-1">O'quvchilar guruhlarini boshqarish</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Yangi guruh
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Guruhlar topilmadi</p>
            <p className="text-sm text-muted-foreground mt-1">Yangi guruh yaratish uchun yuqoridagi tugmani bosing</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-lg">{group.name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedGroup(group);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setSelectedGroup(group);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Semestr:</span>
                  <span className="font-medium">{group.semester}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dars kunlari:</span>
                  <span className="font-medium">{getDaysText(group.class_days)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Boshlanish vaqti:</span>
                  <span className="font-medium">{group.start_time}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">O'quvchilar:</span>
                  <span className="font-medium">{group.student_count} ta</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    setSelectedGroup(group);
                    setAddStudentsDialogOpen(true);
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  O'quvchilarni boshqarish
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateGroupDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadGroups}
      />

      {selectedGroup && (
        <>
          <EditGroupDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            group={selectedGroup}
            onSuccess={loadGroups}
          />

          <AddStudentsDialog
            open={addStudentsDialogOpen}
            onOpenChange={setAddStudentsDialogOpen}
            group={selectedGroup}
            onSuccess={loadGroups}
          />
        </>
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
  );
}
