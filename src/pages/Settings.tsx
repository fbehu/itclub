import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Bell, Lock, Globe, Moon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSave = () => {
    toast({
      title: 'Saqlandi',
      description: 'Sozlamalar muvaffaqiyatli saqlandi',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sozlamalar</h1>
          <p className="text-muted-foreground mt-2">Tizim sozlamalarini boshqaring</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                Ko'rinish
              </CardTitle>
              <CardDescription>Tizim ko'rinishini sozlang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                  <span>Tungi rejim</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Qorong'i ranglardan foydalanish
                  </span>
                </Label>
                <Switch
                  id="dark-mode"
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Xavfsizlik
              </CardTitle>
              <CardDescription>Akkaunt xavfsizligi sozlamalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor" className="flex flex-col gap-1">
                  <span>Ikki bosqichli autentifikatsiya</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Qo'shimcha xavfsizlik qatlami
                  </span>
                </Label>
                {/* <Switch id="two-factor" /> */}
                <Button variant="outline" size="sm">
                  {/* O'zgartirish */} Tez orada
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Til va mintaqa
              </CardTitle>
              <CardDescription>Til va mintaqa sozlamalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex flex-col gap-1">
                  <span>Til</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Hozirgi til: O'zbekcha
                  </span>
                </Label>
                <Button variant="outline" size="sm">
                  {/* O'zgartirish */} Tez orada
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <LogOut className="h-5 w-5" />
                Akkauntdan chiqish
              </CardTitle>
              <CardDescription>Tizimdan chiqish va sessiyani yakunlash</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <LogOut className="h-4 w-4 mr-2" />
                    Chiqish
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Chiqishni tasdiqlang</AlertDialogTitle>
                    <AlertDialogDescription>
                      Siz tizimdan chiqmoqchisiz. Bu amalni bekor qilib bo'lmaydi. Davom etmoqchisiz?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLogout}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Chiqish
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave}>
              Saqlash
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
