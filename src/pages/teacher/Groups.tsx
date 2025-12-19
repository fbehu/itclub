import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Users } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { EditGroupDialog } from '../admin/groups/EditGroupDialog';
import { AddStudentsDialog } from '../admin/groups/AddStudentsDialog';

interface Group {
  id: string;
  name: string;
  smena: string;
  start_time: string;
  student_count: number;
  created_at: string;
}

export default function TeacherGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = useState(false);
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
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
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
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="text-lg">{group.name}</span>
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
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Smena:</span>
                    <span className="font-medium">{group.smena}</span>
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
                    O'quvchilarni ko'rish
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
      </div>
    </DashboardLayout>
  );
}
