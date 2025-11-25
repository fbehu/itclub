import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Lock, Globe, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Saqlandi',
      description: 'Sozlamalar muvaffaqiyatli saqlandi',
    });
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
