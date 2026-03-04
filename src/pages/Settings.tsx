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
import { Lock, Globe, Moon, LogOut, Sparkles, Snowflake, Flower2, Sun, Leaf, Palette, GlassWater } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSeason, Season } from '@/contexts/SeasonContext';
import { useGlassTheme } from '@/contexts/GlassThemeContext';

const seasonOptions: { key: Season; label: string; emoji: string; description: string; icon: typeof Snowflake; gradient: string }[] = [
  { key: 'default', label: 'Standart', emoji: '🎨', description: 'Asosiy ko\'rinish', icon: Palette, gradient: 'from-indigo-500 to-blue-500' },
  { key: 'winter', label: 'Qish', emoji: '❄️', description: 'Muzli va sovuq', icon: Snowflake, gradient: 'from-cyan-400 to-blue-500' },
  { key: 'spring', label: 'Bahor', emoji: '🌸', description: 'Gullar va tabiat', icon: Flower2, gradient: 'from-green-400 to-emerald-500' },
  { key: 'summer', label: 'Yoz', emoji: '☀️', description: 'Issiq va yorqin', icon: Sun, gradient: 'from-orange-400 to-amber-500' },
  { key: 'autumn', label: 'Kuz', emoji: '🍂', description: 'Iliq va qulay', icon: Leaf, gradient: 'from-orange-500 to-red-500' },
];

const SettingsPageContent = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const { season, setSeason } = useSeason();
  const { glassEnabled, setGlassEnabled } = useGlassTheme();

  const handleSeason = (newSeason: Season) => {
    setSeason(newSeason);
    const opt = seasonOptions.find(o => o.key === newSeason);
    toast({
      title: 'Fasl o\'zgartirildi',
      description: `${opt?.emoji} ${opt?.label} tema aktivlashtirildi`,
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
          {/* Fasl Tema */}
          <Card className="card-modern overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Fasl tema
              </CardTitle>
              <CardDescription>Tizimning fasl temasini o'zgartiring — ranglar va effektlar o'zgaradi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {seasonOptions.map((opt) => {
                  const Icon = opt.icon;
                  const active = season === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSeason(opt.key)}
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-300 group ${
                        active
                          ? 'border-primary bg-primary/10 shadow-glow scale-[1.02]'
                          : 'border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      {active && (
                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                      )}
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${opt.gradient} text-white transition-transform duration-200 group-hover:scale-110`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">{opt.description}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Ko'rinish */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-primary" />
                Ko'rinish
              </CardTitle>
              <CardDescription>Tizim ko'rinishini sozlang</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                  <span className="font-medium">Tungi rejim</span>
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

          {/* Glassmorphism - faqat student uchun */}
          {user?.role === 'student' && (
            <Card className="card-modern overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GlassWater className="h-5 w-5 text-primary" />
                  Glassmorphism dizayn
                </CardTitle>
                <CardDescription>iOS 18 uslubidagi shisha effektli dizaynni yoqing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                  <Label htmlFor="glass-mode" className="flex flex-col gap-1">
                    <span className="font-medium">Shisha dizayn</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Barcha elementlar shaffof shisha ko'rinishida bo'ladi
                    </span>
                  </Label>
                  <Switch
                    id="glass-mode"
                    checked={glassEnabled}
                    onCheckedChange={(checked) => {
                      setGlassEnabled(checked);
                      toast({
                        title: checked ? '🔮 Glassmorphism yoqildi' : '🎨 Oddiy dizayn',
                        description: checked 
                          ? 'Shisha effektli dizayn aktivlashtirildi' 
                          : 'Standart dizaynga qaytildi',
                      });
                    }}
                  />
                </div>
                {glassEnabled && (
                  <div className="p-4 rounded-2xl glass-card">
                    <p className="text-sm text-muted-foreground text-center">
                      ✨ Glassmorphism dizayn faol
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Xavfsizlik */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Xavfsizlik
              </CardTitle>
              <CardDescription>Akkaunt xavfsizligi sozlamalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <Label htmlFor="two-factor" className="flex flex-col gap-1">
                  <span className="font-medium">Ikki bosqichli autentifikatsiya</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Qo'shimcha xavfsizlik qatlami
                  </span>
                </Label>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Tez orada
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Til va Mintaqa */}
          <Card className="card-modern">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Til va mintaqa
              </CardTitle>
              <CardDescription>Til va mintaqa sozlamalari</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
                <Label className="flex flex-col gap-1">
                  <span className="font-medium">Til</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Hozirgi til: O'zbekcha
                  </span>
                </Label>
                <Button variant="outline" size="sm" className="rounded-xl">
                  Tez orada
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chiqish */}
          <Card className="card-modern border-destructive/20 bg-destructive/5">
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
                  <Button variant="destructive" className="w-full sm:w-auto rounded-xl">
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default function Settings() {
  return <SettingsPageContent />;
}
