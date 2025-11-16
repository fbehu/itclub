import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRScanner from '@/components/QRScanner';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { User } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle2, Mail, Phone, GraduationCap, Award, Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function QRScannerPage() {
  const { user: currentUser } = useAuth();
  const [scannedUser, setScannedUser] = useState<User | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleScanSuccess = async (decodedText: string) => {
    setError('');
    setScannedUser(null);
    setIsLoading(true);

    // QR kod ma'lumotini tekshirish - 7 ta harfdan oshmasligi kerak
    if (decodedText.length > 7) {
      setError('Bunday ma\'lumot mavjud emas. QR kod 7 ta belgidan oshmasligi kerak.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authFetch(`${API_ENDPOINTS.CHECK_USER}?uuid=${decodedText}`, {
        method: 'GET',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Bazada bunday foydalanuvchi mavjud emas');
        } else {
          setError('Ma\'lumotni tekshirishda xatolik yuz berdi');
        }
        setIsLoading(false);
        return;
      }

      const userData = await response.json();

      // Backend array qaytarayotgan bo'lsa → birinchi elementni olish kerak
      if (Array.isArray(userData) && userData.length > 0) {
        setScannedUser(userData[0]);
      } else {
        setError("Ma'lumot topilmadi");
      }

    } catch (err) {
      console.error('QR scan error:', err);
      setError('Ma\'lumotni tekshirishda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelText = (level?: string) => {
    switch (level) {
      case 'beginner': return 'Boshlang\'ich';
      case 'intermediate': return 'O\'rta';
      case 'expert': return 'Ekspert';
      default: return level || '-';
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const d = new Date(dateString);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${year}.${month}.${day}   ${hours}:${minutes}`;
  };



  if (currentUser?.role !== 'admin') return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">QR Kod Skaner</h1>
            <p className="text-muted-foreground mt-1">
              Talaba QR kodini skanerlang va ma'lumotlarini ko'ring
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Scanner Section */}
          <Card>
            <CardHeader>
              <CardTitle>QR Kod Skanerlash</CardTitle>
              <CardDescription>
                Talaba QR kodini kamera orqali skanerlang
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <QRScanner 
                  onScanSuccess={handleScanSuccess}
                  trigger={
                    <Card className="w-full h-64 flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors border-2 border-dashed">
                      <div className="text-center">
                        <div className="text-6xl mb-4">📷</div>
                        <p className="text-lg font-medium">QR Kod Skanerlash</p>
                        <p className="text-sm text-muted-foreground">Bosing va kamerani yoqing</p>
                      </div>
                    </Card>
                  }
                />
              </div>

              {isLoading && (
                <Alert>
                  <AlertDescription>
                    Ma'lumotlar tekshirilmoqda...
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {scannedUser && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Foydalanuvchi topildi!
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* User Info Section */}
          {scannedUser && (
            <Card className="lg:col-span-2 p-6">
              <CardHeader>
                <CardTitle className="text-3xl font-bold">Talaba Ma'lumotlari</CardTitle>
              </CardHeader>

              <CardContent className="space-y-8">

                {/* Avatar + QR */}
                <div className="flex flex-col md:flex-row items-center gap-10">
                  
                  {/* Talaba rasmi */}
                  <div className="flex flex-col items-center">
                    <Avatar className="h-40 w-40 border-4 border-primary shadow-xl">
                      <AvatarImage src={scannedUser.photo} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
                        {scannedUser.first_name?.[0]}{scannedUser.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-lg mt-3 font-semibold">
                      Talaba rasmi
                    </p>
                  </div>

                  {/* QR KOD rasmi */}
                  <div className="flex flex-col items-center">
                    <img 
                      src={scannedUser.image_qrkod}
                      alt="QR Kod"
                      className="h-40 w-40 object-contain border-4 border-dashed rounded-xl shadow-md"
                    />
                    <p className="text-lg mt-3 font-semibold">
                      QR Kod rasmi
                    </p>
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 space-y-2">
                    <h2 className="text-3xl font-bold">
                      {scannedUser.first_name} {scannedUser.last_name}
                    </h2>
                    <p className="text-muted-foreground text-lg">@{scannedUser.username}</p>

                    <Badge className={`mt-3 px-3 py-1 text-base ${getLevelColor(scannedUser.level)}`}>
                      {getLevelText(scannedUser.level)}
                    </Badge>
                  </div>

                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">

                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Aloqa ma'lumotlari</h3>

                    <div className="flex items-center gap-3 text-lg">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span><span className="font-medium">UUID:</span> {scannedUser.uuid}</span>
                    </div>
                    <div className="flex items-center gap-3 text-lg">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span><span className="font-medium">Username:</span> {scannedUser.username}</span>
                    </div>

                    <div className="flex items-center gap-3 text-lg">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <span><span className="font-medium">Telefon:</span> {scannedUser.phone_number}</span>
                    </div>
                    <div className="flex items-center gap-3 text-lg">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span><span className="font-medium">Telegram:</span> {scannedUser.tg_username || "mavjud emas"}</span>
                    </div>

                    {scannedUser.tg_username && (
                      <div className="flex items-center gap-3 text-lg">
                        <span className="font-medium">Telegram:</span>
                        <span>@{scannedUser.tg_username}</span>
                      </div>
                    )}
                  </div>

                  {/* Academic Info */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">O‘quv ma’lumotlari</h3>

                    <div className="flex items-center gap-3 text-lg">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <span><span className="font-medium">Kurs:</span> {scannedUser.course}</span>
                    </div>

                    <div className="flex items-center gap-3 text-lg">
                      <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      <span><span className="font-medium">Yo‘nalish:</span> {scannedUser.direction}</span>
                    </div>

                    <div className="flex items-center gap-3 text-lg">
                      <Award className="h-5 w-5 text-muted-foreground" />
                      <span><span className="font-medium">Darajasi:</span> {scannedUser.level}</span>
                    </div>                    

                    <div className="flex items-center gap-3 text-lg">
                      <Coins className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">Tangalar:</span>
                      <Badge variant="secondary" className="px-3 py-1 text-base">
                        ⭐ {scannedUser.coins}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">Holat:</span>
                    <Badge
                      variant={scannedUser.is_active ? "default" : "destructive"}
                      className="text-lg px-4 py-1"
                    >
                      {scannedUser.is_active ? "Faol" : "Bloklangan"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-lg mt-3">
                    <span className="font-medium">Qo'shilgan vaqt:</span>
                    <span>{formatDate(scannedUser.created_at)}</span>
                  </div>

                  <div className="flex items-center justify-between text-lg mt-3">
                    <span className="font-medium">Oxirgi marta yangilangan:</span>
                    <span>{formatDate(scannedUser.updated_at)}</span>
                  </div>
                </div>


                {/* Certificates */}
                <div className="pt-6 border-t">
                  <h3 className="text-xl font-semibold mb-3">Sertifikatlar</h3>
                  <Alert className="py-6 text-center">
                    <AlertDescription className="text-lg text-muted-foreground">
                      📄 Sertifikatlar tez orada qo'shiladi
                    </AlertDescription>
                  </Alert>
                </div>

              </CardContent>
            </Card>
          )}

          {/* Empty State when no user scanned */}
          {!scannedUser && !error && !isLoading && (
            <Card>
              <CardContent className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-muted-foreground">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-lg">QR kodni skanerlang</p>
                  <p className="text-sm">Talaba ma'lumotlari bu yerda ko'rsatiladi</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
