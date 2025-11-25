import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Pencil, Trash2, ChevronLeft, ChevronRight, Eye, KeyRound, Lock, LockOpen, Search, Filter } from 'lucide-react';
import { useAuth, User } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import EditUserDialog from './EditUserDialog';
import ViewUserDialog from './ViewUserDialog';
import ChangePasswordDialog from './ChangePasswordDialog';

interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

export default function UserManagement() {
  const navigate = useNavigate();
  const { user, updateUser, deleteUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [changingPasswordUser, setChangingPasswordUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [orderBy, setOrderBy] = useState<string>('-created_at');
  const itemsPerPage = 20;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, searchQuery, isActiveFilter, roleFilter, levelFilter, orderBy]);

  const fetchUsers = async (page: number) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (page > 1) params.append('page', page.toString());
      if (searchQuery) params.append('search', searchQuery);
      if (isActiveFilter !== 'all') params.append('is_active', isActiveFilter);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (levelFilter !== 'all') params.append('level', levelFilter);
      if (orderBy) params.append('ordering', orderBy);
      
      const queryString = params.toString();
      const url = queryString 
        ? `${API_ENDPOINTS.USERS_LIST}?${queryString}`
        : API_ENDPOINTS.USERS_LIST;
        
      const response = await authFetch(url, { method: 'GET' });

      if (!response.ok) {
        throw new Error('Foydalanuvchilarni yuklashda xatolik');
      }

      const data: UsersResponse = await response.json();
      const filteredUsers = data.results.filter(u => u.role === null);
      setUsers(filteredUsers.length > 0 ? filteredUsers : data.results);
      setTotalCount(data.count);

    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Foydalanuvchilarni yuklashda xatolik',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (userToEdit: User) => setEditingUser(userToEdit);

  const handleSave = (id: string, data: Partial<User>) => {
    updateUser(id, data);
    setUsers(users.map(u => u.id === id ? { ...u, ...data } : u));
    toast({
      title: 'Saqlandi',
      description: 'Foydalanuvchi ma\'lumotlari yangilandi',
    });
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const formData = new FormData();
      formData.append("is_active", (!currentStatus).toString()); // booleanni stringga o'tkazamiz

      const response = await authFetch(`/users/users/${userId}/`, {
        method: 'PATCH',
        body: formData, // JSON o'rniga FormData yuboramiz
      });

      if (!response.ok) {
        throw new Error('Holatni o\'zgartirishda xatolik');
      }

      // State-dagi foydalanuvchini yangilash
      setUsers(users.map(u => u.id === userId ? { ...u, is_active: !currentStatus } : u));

      toast({
        title: 'Muvaffaqiyatli',
        description: !currentStatus ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi bloklandi',
      });

      fetchUsers(currentPage); // optional, sahifani yangilash
    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Holatni o\'zgartirishda xatolik',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingUserId) return;

    try {
      const response = await authFetch(`/users/users/${deletingUserId}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Foydalanuvchini o\'chirishda xatolik');
      }

      // State-dan o'chirish
      setUsers(users.filter(u => u.id !== deletingUserId));

      toast({
        title: 'O\'chirildi',
        description: 'Foydalanuvchi muvaffaqiyatli o\'chirildi',
      });

      setDeletingUserId(null);
    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Foydalanuvchini o\'chirishda xatolik',
        variant: 'destructive',
      });
    }
  };


  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'expert': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelText = (level?: string) => {
    switch (level) {
      case 'beginner': return 'Boshlang\'ich';
      case 'intermediate': return 'O\'rta';
      case 'expert': return 'Ekspert';
      default: return level;
    }
  };



  const getRoleColor = (level?: string) => {
    switch (level) {
      case 'student': return 'bg-green-500';
      case 'admin': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleText = (level?: string) => {
    switch (level) {
      case 'student': return 'Student';
      case 'admin': return 'Admin';
      default: return level;
    }
  };



  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Foydalanuvchilar</h1>
          <Button onClick={() => navigate('/dashboard/admin/add-user')} title="Foydalanuvchi qo'shish">
            <UserPlus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Yangi foydalanuvchi</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ism, username yoki telefon..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>

              {/* Active Filter */}
              <Select value={isActiveFilter} onValueChange={(value) => {
                setIsActiveFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Holat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="true">Faol</SelectItem>
                  <SelectItem value="false">Faol emas</SelectItem>
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={(value) => {
                setRoleFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              {/* Level Filter */}
              <Select value={levelFilter} onValueChange={(value) => {
                setLevelFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Daraja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barchasi</SelectItem>
                  <SelectItem value="beginner">Boshlang'ich</SelectItem>
                  <SelectItem value="intermediate">O'rta</SelectItem>
                  <SelectItem value="expert">Ekspert</SelectItem>
                </SelectContent>
              </Select>

              {/* Order By */}
              <Select value={orderBy} onValueChange={(value) => {
                setOrderBy(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Saralash" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_at">Oxirgi qo'shilgan</SelectItem>
                  <SelectItem value="created_at">Birinchi qo'shilgan</SelectItem>
                  <SelectItem value="first_name">Ism bo'yicha</SelectItem>
                  <SelectItem value="-coins">Tangalar bo'yicha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Barcha foydalanuvchilar ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <p className="text-muted-foreground">Yuklanmoqda...</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Ism</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Kurs</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Yo'nalish</TableHead>
                        <TableHead>Tangalar</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead className="text-right">Amallar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                          <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                          <TableCell>{student.username}</TableCell>
                          <TableCell>{student.phone_number}</TableCell>
                          <TableCell>{student.course}</TableCell>
                          <TableCell>
                            <Badge className={getLevelColor(student.level)}>{getLevelText(student.level)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(student.role)}>{getRoleText(student.role)}</Badge>
                          </TableCell>
                          <TableCell>{student.direction}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="gap-1">
                              <span className="text-yellow-500">⭐</span>
                              {student.coins || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={student.is_active ? 'default' : 'destructive'}
                              size="sm"
                              onClick={() => handleToggleActive(student.id, student.is_active || false)}
                            >
                              {student.is_active ? (
                                <>
                                  <LockOpen className="h-3 w-3 mr-1" />
                                  Faol
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3 mr-1" />
                                  Bloklangan
                                </>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="ghost" size="icon" onClick={() => setViewingUser(student)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setChangingPasswordUser(student)}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(student)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeletingUserId(student.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {users.map((student, index) => (
                    <Card key={student.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-primary">#{(currentPage - 1) * itemsPerPage + index + 1}</span>
                            </div>
                            <h3 className="font-semibold text-base">{student.first_name} {student.last_name}</h3>
                            <p className="text-sm text-muted-foreground">{student.username}</p>
                            <p className="text-sm text-muted-foreground">{student.phone_number}</p>
                            <p className="text-sm text-muted-foreground">{student.course}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setViewingUser(student)}
                            className="flex-1 min-w-0"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Ko'rish</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setChangingPasswordUser(student)}
                            className="flex-1 min-w-0"
                          >
                            <KeyRound className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Parol</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(student)}
                            className="flex-1 min-w-0"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Tahrir</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDeletingUserId(student.id)}
                            className="flex-1 min-w-0"
                          >
                            <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                            <span className="hidden sm:inline text-destructive">O'chirish</span>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground">
                    Sahifa {currentPage} dan {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Oldingi</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      <span className="hidden sm:inline">Keyingi</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ViewUserDialog
        user={viewingUser}
        open={!!viewingUser}
        onOpenChange={(open) => !open && setViewingUser(null)}
      />

      <ChangePasswordDialog
        userId={changingPasswordUser?.id || ''}
        userName={changingPasswordUser ? `${changingPasswordUser.first_name} ${changingPasswordUser.last_name}` : ''}
        open={!!changingPasswordUser}
        onOpenChange={(open) => !open && setChangingPasswordUser(null)}
      />

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        onSave={handleSave}
      />

      <AlertDialog open={!!deletingUserId} onOpenChange={(open) => !open && setDeletingUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Foydalanuvchini o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amalni bekor qilib bo'lmaydi. Foydalanuvchi butunlay o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
