import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { UserPlus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Mock data - in real app this would come from database
  const [users] = useState([
    {
      id: 'e4c9b8f1-5a2d-4e3c-9b1f-6d8a7c5e4b3a',
      username: 'student',
      surname: 'Karimov',
      lastname: 'Aziz',
      phone_number: '+998901234567',
      level: 'intermediate',
      course: 'Kurs 2',
      direction: 'Dasturiy injinering',
    }
  ]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Boshlang\'ich';
      case 'intermediate':
        return 'O\'rta';
      case 'advanced':
        return 'Yuksak';
      default:
        return level;
    }
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Foydalanuvchilar</h1>
          <Button onClick={() => navigate('/dashboard/admin/add-user')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Yangi foydalanuvchi
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Barcha foydalanuvchilar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ism</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Kurs</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Yo'nalish</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">
                      {student.surname} {student.lastname}
                    </TableCell>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>{student.phone_number}</TableCell>
                    <TableCell>{student.course}</TableCell>
                    <TableCell>
                      <Badge className={getLevelColor(student.level)}>
                        {getLevelText(student.level)}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.direction}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
