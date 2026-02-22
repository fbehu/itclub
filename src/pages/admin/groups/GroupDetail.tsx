import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Plus, Edit, Trash2, Clock, Users, Calendar, User, Phone, GraduationCap } from 'lucide-react';
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

interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  photo?: string;
  phone_number?: string;
  level?: string;
  tg_username?: string;
}

interface Group {
  id: string;
  name: string;
  smena: string;
  start_time: string;
  end_time?: string;
  class_days?: string[];
  teacher?: Teacher;
  created_at: string;
  updated_at?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone_number?: string;
  coins?: number;
  level?: string;
  parent_phone_number?: string;
  photo?: string;
}

interface StudentsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Student[];
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const itemsPerPage = 20;
  
  // Dialogs
  const [addStudentsDialogOpen, setAddStudentsDialogOpen] = useState(false);
  const [changeGroupDialogOpen, setChangeGroupDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Load group info only (fast)
  const loadGroupInfo = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GROUP_DETAIL(groupId));
      
      if (response.ok) {
        const data = await response.json();
        setGroup(data);
      }
    } catch (error) {
      console.error('Error loading group info:', error);
      toast.error('Guruh ma\'lumotlarini yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  // Load students with pagination from API
  const loadStudents = async (page: number = 1, search: string = '') => {
    if (!groupId) return;
    
    try {
      setLoadingStudents(true);
      let url = `${API_ENDPOINTS.GROUP_STUDENTS(groupId)}`;
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (search) {
        params.append('search', search);
        params.append('page', '1'); // Reset to page 1 when searching
      } else {
        params.append('page', String(page));
      }
      
      params.append('page_size', String(itemsPerPage));
      
      const response = await authFetch(`${url}?${params.toString()}`);
      
      if (response.ok) {
        const data: any = await response.json();
        
        // Handle nested structure: data.results.students
        let studentsList: Student[] = [];
        if (data.results?.students && Array.isArray(data.results.students)) {
          studentsList = data.results.students;
        } else if (Array.isArray(data.results)) {
          studentsList = data.results;
        } else if (Array.isArray(data)) {
          studentsList = data;
        }
        
        setStudents(studentsList);
        
        // Get total count from nested or flat structure
        let totalCount = 0;
        if (data.results?.count !== undefined) {
          totalCount = data.results.count;
        } else if (data.count !== undefined) {
          totalCount = data.count;
        }
        
        setTotalStudents(totalCount);
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
      } else {
        setStudents([]);
        setTotalStudents(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('O\'quvchilarni yuklashda xatolik');
      setStudents([]);
      setTotalStudents(0);
      setTotalPages(1);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadGroupInfo();
  }, [groupId]);

  useEffect(() => {
    loadStudents(currentPage, '');
  }, [groupId, currentPage]);

  const handleRemoveStudent = async () => {
    if (!selectedStudent || !groupId) return;
    
    try {
      const response = await authFetch(`${API_ENDPOINTS.GROUP_STUDENTS(groupId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: selectedStudent.id
        })
      });
      
      if (response.ok) {
        toast.success('O\'quvchi guruhdan o\'chirildi');
        loadStudents(currentPage);
        loadGroupInfo();
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

  // API already filters, no need for local filtering
  const filteredStudents = Array.isArray(students) ? students : [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadStudents(page, '');
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
      <div className="mx-auto p-4 sm:p-6 space-y-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">O'quvchilar</p>
                  <p className="font-semibold">{totalStudents} ta</p>
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
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tugash vaqti</p>
                  <p className="font-semibold">{group.end_time}</p>
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

            {/* Class Days */}
            {group.class_days && (
              <div className="border-t pt-4 mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Dars kunlari</h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(group.class_days) && group.class_days.map((day, idx) => (
                    <Badge key={idx} variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Teacher Info */}
            {group.teacher && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">O'qituvchi</h3>
                <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={group.teacher.photo || undefined} />
                    <AvatarFallback className="text-lg">
                      {(group.teacher.first_name || '')[0]}{(group.teacher.last_name || '')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{group.teacher.first_name || ''} {group.teacher.last_name || ''}</p>
                        <p className="text-sm text-muted-foreground">@{group.teacher.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Telefon</p>
                        <p className="font-medium">{group.teacher.phone_number || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Darajasi</p>
                        <p className="font-medium">{group.teacher.level || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg">O'quvchilar ro'yxati</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Jami: {totalStudents} ta o'quvchi
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Qidirish (Ism, Familya, Username)..."
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    setCurrentPage(1);
                    
                    // Clear previous timeout
                    if (searchTimeout) {
                      clearTimeout(searchTimeout);
                    }
                    
                    // Set new timeout for search
                    if (value.trim().length > 0) {
                      const timeout = setTimeout(() => {
                        loadStudents(1, value);
                      }, 500); // 500ms delay
                      setSearchTimeout(timeout);
                    } else {
                      // Load without search if empty
                      loadStudents(1, '');
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="text-center py-12">
                <div className="text-lg text-muted-foreground">O'quvchilar yuklanmoqda...</div>
              </div>
            ) : students.length === 0 ? (
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
                        <TableHead>O'quvchi</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Ball</TableHead>
                        <TableHead>Darajasi</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={student.photo || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(student.first_name || '')[0]}{(student.last_name || '')[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">
                                {student.first_name || ''} {student.last_name || ''}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">@{student.username}</Badge>
                          </TableCell>
                          <TableCell>{student.phone_number || '-'}</TableCell>
                          <TableCell>{student.coins || '0'}</TableCell>
                          <TableCell>{student.level || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setChangeGroupDialogOpen(true);
                                }}
                                title="Guruhni o'zgartirish"
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
                                title="Guruhdan o'chirish"
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
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let page: number;
                          if (totalPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            page = totalPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
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
        onSuccess={() => {
          loadStudents(currentPage);
          loadGroupInfo();
        }}
      />

      {/* Change Group Dialog */}
      {selectedStudent && (
        <ChangeStudentGroupDialog
          open={changeGroupDialogOpen}
          onOpenChange={setChangeGroupDialogOpen}
          student={selectedStudent}
          currentGroupId={groupId!}
          onSuccess={() => {
            loadStudents(currentPage);
            loadGroupInfo();
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
