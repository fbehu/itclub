import { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/DashboardLayout';

export default function Profile() {
  const { user } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDownloadQR = async () => {
    if (qrRef.current) {
      try {
        const dataUrl = await toPng(qrRef.current, { quality: 1 });
        const link = document.createElement('a');
        link.download = `qr-${user?.id}.png`;
        link.href = dataUrl;
        link.click();
        toast({
          title: "Muvaffaqiyatli!",
          description: "QR kod yuklab olindi",
        });
      } catch (error) {
        toast({
          title: "Xato",
          description: "QR kodni yuklab olishda xatolik",
          variant: "destructive",
        });
      }
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">Mening Profilim</h1>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="border-b pb-2">
                  <p className="text-sm text-muted-foreground">Telefon raqam</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
                
                {user.course && (
                  <div className="border-b pb-2">
                    <p className="text-sm text-muted-foreground">Kurs</p>
                    <p className="font-medium">{user.course}</p>
                  </div>
                )}

                {user.direction && (
                  <div className="border-b pb-2">
                    <p className="text-sm text-muted-foreground">Yo'nalish</p>
                    <p className="font-medium">{user.direction}</p>
                  </div>
                )}

                {user.telegram && (
                  <div className="border-b pb-2">
                    <p className="text-sm text-muted-foreground">Telegram</p>
                    <p className="font-medium">@{user.telegram}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle>QR Kod</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                ref={qrRef} 
                className="bg-white p-6 rounded-lg inline-flex flex-col items-center gap-4"
              >
                <QRCode
                  value={user.id}
                  size={200}
                  level="H"
                />
                <p className="text-sm font-mono text-gray-800">ID: {user.id}</p>
              </div>
              <Button onClick={handleDownloadQR} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                QR kodni yuklab olish
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
