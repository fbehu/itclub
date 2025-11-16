import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  trigger?: React.ReactNode;
}

export default function QRScanner({ onScanSuccess, trigger }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('upload');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScanSuccess(decodedText);
          stopScanning();
          setIsOpen(false);
        },
        (errorMessage) => {
          // Ignore errors during scanning
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("qr-reader-file");
      const result = await html5QrCode.scanFile(file, true);
      onScanSuccess(result);
      setIsOpen(false);
    } catch (err) {
      console.error("Error scanning file:", err);
      alert("QR kod topilmadi. Iltimos, boshqa rasm yuklang.");
    }
  };

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isOpen, scanMode]);

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsOpen(true)}
        >
          <Camera className="mr-2 h-4 w-4" />
          QR kod skanerlash
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR kodni skanerlang</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'upload' ? 'default' : 'outline'}
                onClick={() => setScanMode('upload')}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Rasm yuklash
              </Button>
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                onClick={() => setScanMode('camera')}
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Kamera
              </Button>
            </div>

            {scanMode === 'camera' ? (
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="qr-file">QR kod rasmi</Label>
                <Input
                  id="qr-file"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <div id="qr-reader-file" className="hidden" />
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="mr-2 h-4 w-4" />
              Bekor qilish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
