import { useState } from 'react';
import { MoreVertical, Download, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

interface ImportResult {
  created?: string[];
  updated?: string[];
  errors?: Array<{ row: number; detail: string }>;
  created_count?: number;
  updated_count?: number;
  error_count?: number;
}

interface ExcelImportExportMenuProps {
  onImportSuccess?: () => void;
}

export default function ExcelImportExportMenu({ onImportSuccess }: ExcelImportExportMenuProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleTemplateDownload = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.USERS_EXPORT_TEMPLATE}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Shablon yuklab olib bo\'lmadi');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'foydalanuvchilar_shablon.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast({
        title: 'Muvaffaqiyat',
        description: 'Shablon yuklab olindi',
      });
    } catch (error) {
      toast({
        title: 'Xato',
        description: 'Shablonni yuklab olib bo\'lmadi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.USERS_EXPORT}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Eksport xatosi');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `foydalanuvchilar_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

      toast({
        title: 'Muvaffaqiyat',
        description: 'Foydalanuvchilar eksport qilindi',
      });
    } catch (error) {
      toast({
        title: 'Xato',
        description: 'Foydalanuvchilarni eksport qilib bo\'lmadi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Fayl turini tekshir (Excel yoki CSV)
      const isValidFile = 
        file.name.endsWith('.xlsx') || 
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv');

      if (!isValidFile) {
        toast({
          title: 'Xato',
          description: 'Faqat Excel (.xlsx, .xls) yoki CSV fayllarni tanlashingiz mumkin',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      setImportResult(null);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.USERS_IMPORT}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      // API response'ni save qilamiz (xato bo'lsa ham)
      setImportResult(data);

      if (!response.ok) {
        throw new Error(data.message || 'Fayl import qilib bo\'lmadi');
      }

      // API response format tekshir
      const createdCount = data.created?.length || data.created_count || 0;
      const updatedCount = data.updated?.length || data.updated_count || 0;
      const errorsCount = data.errors?.length || data.error_count || 0;

      // Agar xato bo'lsa, xato ko'rsatamiz
      if (errorsCount > 0 && createdCount === 0 && updatedCount === 0) {
        throw new Error('Xatolar bor');
      }

      // Muvaffaqiyat xabari
      const message = [];
      if (createdCount > 0) message.push(`✓ ${createdCount} qo'shildi`);
      if (updatedCount > 0) message.push(`✓ ${updatedCount} yangilandi`);
      if (errorsCount > 0) message.push(`⚠️ ${errorsCount} xato`);

      toast({
        title: 'Natija',
        description: message.length > 0 ? message.join(', ') : 'Import yakunlandi',
      });

      // Agar qo'shilgan yoki yangilangan bo'lsa, users'ni refresh qilish
      if ((createdCount > 0 || updatedCount > 0) && onImportSuccess) {
        onImportSuccess();
        // 2 sekund keyin dialog yopamiz
        setTimeout(() => {
          setShowUploadDialog(false);
          setImportResult(null);
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: 'Xato',
        description: error.message || 'Fayl import qilib bo\'lmadi',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleTemplateDownload} disabled={isLoading}>
            <FileText className="h-4 w-4 mr-2" />
            <span>Shablonni yuklab olish</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleExport} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            <span>Hammasini eksport qilish</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowUploadDialog(true)} disabled={isLoading}>
            <Upload className="h-4 w-4 mr-2" />
            <span>Excel faylini import qilish</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Upload Dialog */}
      <AlertDialog open={showUploadDialog} onOpenChange={(open) => {
        if (!open) {
          setImportResult(null);
        }
        setShowUploadDialog(open);
      }}>
        <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Excel faylini import qilish</AlertDialogTitle>
            <AlertDialogDescription>
              Excel (.xlsx, .xls) yoki CSV faylini tanlang
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Import Results */}
          {importResult && (
            <div className="space-y-3 my-4">
              {/* Summary */}
              <Alert className={importResult.errors && importResult.errors.length > 0 && importResult.created?.length === 0 && importResult.updated?.length === 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                <CheckCircle2 className={`h-4 w-4 ${importResult.errors && importResult.errors.length > 0 && importResult.created?.length === 0 && importResult.updated?.length === 0 ? 'text-red-600' : 'text-green-600'}`} />
                <AlertDescription className="ml-2">
                  <div className="space-y-1 text-sm">
                    {importResult.created && importResult.created.length > 0 && (
                      <p>✓ <strong>{importResult.created.length}</strong> yangi foydalanuvchi qo'shildi</p>
                    )}
                    {importResult.updated && importResult.updated.length > 0 && (
                      <p>✓ <strong>{importResult.updated.length}</strong> foydalanuvchi yangilandi</p>
                    )}
                    {importResult.errors && importResult.errors.length > 0 && (
                      <p className="text-red-600">✗ <strong>{importResult.errors.length}</strong> xato</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Errors List */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-600">Xatolar ({importResult.errors.length})</span>
                  </div>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className="text-xs text-red-700 bg-white p-2 rounded border border-red-100">
                        <span className="font-semibold">Satr {error.row}:</span> {error.detail}
                      </div>
                    ))}
                    {importResult.errors.length > 10 && (
                      <div className="text-xs text-red-600 p-2 italic">
                        va yana {importResult.errors.length - 10} ta xato...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Input */}
          {!importResult && (
            <div className="border-2 border-dashed rounded-lg p-6 hover:bg-accent/50 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                disabled={isLoading}
                className="hidden"
                id="file-input"
              />
              <label
                htmlFor="file-input"
                className="w-full flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="h-8 w-8 text-blue-600" />
                <span className="text-sm font-medium">Fayl tanlash uchun bosing</span>
                <span className="text-xs text-muted-foreground">
                  .xlsx, .xls yoki .csv fayllar
                </span>
              </label>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
