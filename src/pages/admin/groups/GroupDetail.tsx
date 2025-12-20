import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Plus, Edit, Trash2, Clock, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { AddStudentsToGroupDialog } from './AddStudentsToGroupDialog';
import { ChangeStudentGroupDialog } from './ChangeStudentGroupDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Group {
  id: string;
  name: string;
  smena: string;
  start_time: string;
  student_count: number;
  created_at: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  direction: string;
  phone?: string;
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Dialogs
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = useState(false);
  const [changeGroupDialogOpen, setChangeGroupDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const loadGroupData = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      const [groupRes, studentsRes] = await Promise.all([
        authFetch(API_ENDPOINTS.GROUP_DETAIL(groupId)),
        authFetch(API_ENDPOINTS.GROUP_STUDENTS(groupId))
      ]);
      
      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroup(groupData);
      }
      
      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData.students || studentsData.results || studentsData);
      }
    } catch (error) {
      console.error('Error loading group data:', error);
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const handleRemoveStudent = async () => {
    if (!selectedStudent || !groupId) return;
    
    try {
      const response = await authFetch(`${API_ENDPOINTS.GROUP_STUDENTS(groupId)}${selectedStudent.id}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('O\'quvchi guruhdan o\'chirildi');
        loadGroupData();
        setDeleteDialogOpen(false);
        setSelectedStudent(null);
      } else {
        toast.error('O\'quvchini o\'chirishda xatolik');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      toast.error('O\'quvchini o\'chirishda xatolik');
    }
  };

  // Filter students
  const filteredStudents = students.filter(student =>
    student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
        <div className="container mx-auto p-4 sm:p-6">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Guruh topilmadi</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{group.name}</h1>
              <p className="text-muted-foreground mt-1">Guruh ma'lumotlari</p>
            </div>
          </div>
          <Button onClick={() => setAddStudentsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            O'quvchi qo'shish
          </Button>
        </div>

        {/* Group Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Guruh ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">O'quvchilar</p>
                  <p className="font-semibold">{students.length} ta</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Smena</p>
                  <p className="font-semibold">{group.smena}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Boshlanish vaqti</p>
                  <p className="font-semibold">{group.start_time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Yaratilgan</p>
                  <p className="font-semibold">{new Date(group.created_at).toLocaleDateString('uz-UZ')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="text-lg">O'quvchilar ro'yxati</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Qidirish..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">O'quvchilar topilmadi</p>
                <p className="text-sm text-muted-foreground mt-1">Guruhga o'quvchi qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Ism Familiya</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Yo'nalish</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {student.first_name} {student.last_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">@{student.username}</Badge>
                          </TableCell>
                          <TableCell>{student.direction || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setChangeGroupDialogOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Students Dialog */}
      <AddStudentsToGroupDialog
        open={addStudentsDialogOpen}
        onOpenChange={setAddStudentsDialogOpen}
        groupId={groupId!}
        groupName={group.name}
        existingStudentIds={students.map(s => s.id)}
        onSuccess={loadGroupData}
      />

      {/* Change Group Dialog */}
      {selectedStudent && (
        <ChangeStudentGroupDialog
          open={changeGroupDialogOpen}
          onOpenChange={setChangeGroupDialogOpen}
          student={selectedStudent}
          currentGroupId={groupId!}
          onSuccess={() => {
            loadGroupData();
            setSelectedStudent(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>O'quvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedStudent?.first_name} {selectedStudent?.last_name}" ni guruhdan o'chirishni xohlaysizmi?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveStudent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
