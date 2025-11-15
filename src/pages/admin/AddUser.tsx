import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/QRScanner';

export default function AddUser() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    surname: '',
    lastname: '',
    username: '',
    password: '',
    phone_number: '',
    tg_username: '',
    level: '',
    course: '',
    direction: '',
    uuid: '',
    photo: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQRScan = (decodedText: string) => {
    setFormData((prev) => ({ ...prev, uuid: decodedText }));
    toast({
      title: 'QR kod muvaffaqiyatli skanerlandi',
      description: `UUID: ${decodedText}`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would save the user data
    toast({
      title: 'Foydalanuvchi qo\'shildi',
      description: 'Yangi foydalanuvchi muvaffaqiyatli qo\'shildi',
    });
    navigate('/dashboard/admin/users');
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/admin/users')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Yangi foydalanuvchi qo'shish</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Foydalanuvchi ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="surname">Ism *</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastname">Familya *</Label>
                  <Input
                    id="lastname"
                    value={formData.lastname}
                    onChange={(e) => handleInputChange('lastname', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Parol *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Telefon raqam *</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="+998901234567"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tg_username">Telegram username</Label>
                  <Input
                    id="tg_username"
                    placeholder="@username"
                    value={formData.tg_username}
                    onChange={(e) => handleInputChange('tg_username', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Level tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Boshlang'ich (Yashil)</SelectItem>
                      <SelectItem value="intermediate">O'rta (Sariq)</SelectItem>
                      <SelectItem value="advanced">Yuksak (Qizil)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Kurs *</Label>
                  <Select value={formData.course} onValueChange={(value) => handleInputChange('course', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kurs tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kurs 1">Kurs 1</SelectItem>
                      <SelectItem value="Kurs 2">Kurs 2</SelectItem>
                      <SelectItem value="Kurs 3">Kurs 3</SelectItem>
                      <SelectItem value="Kurs 4">Kurs 4</SelectItem>
                      <SelectItem value="Kurs 5">Kurs 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direction">Yo'nalish *</Label>
                  <Input
                    id="direction"
                    value={formData.direction}
                    onChange={(e) => handleInputChange('direction', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Rasm URL</Label>
                  <Input
                    id="photo"
                    type="url"
                    value={formData.photo}
                    onChange={(e) => handleInputChange('photo', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uuid">UUID (QR kod orqali) *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="uuid"
                      value={formData.uuid}
                      onChange={(e) => handleInputChange('uuid', e.target.value)}
                      required
                      readOnly
                    />
                    <QRScanner onScanSuccess={handleQRScan} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/admin/users')}
                >
                  Bekor qilish
                </Button>
                <Button type="submit">
                  Saqlash
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
