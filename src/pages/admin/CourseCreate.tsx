import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Loader, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/authFetch';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function CourseCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_months: '',
    price: '',
    discount_price: '',
    is_active: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For price fields, remove any non-numeric characters
    if ((name === 'price' || name === 'discount_price') && value) {
      const numericValue = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Format number with thousand separators for display
  const formatDisplayNumber = (num: string) => {
    if (!num) return '';
    return Number(num).toLocaleString('uz-UZ');
  };

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Rasm hajmi 5MB dan kam bo\'lishi kerak');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Faqat rasm fayllari qabul qilinadi');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === 'true' ? true : false
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Kurs nomini kiriting');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Tavsifni kiriting');
      return;
    }

    if (!formData.duration_months) {
      toast.error('Davomiylikni kiriting');
      return;
    }

    if (!formData.price) {
      toast.error('Narxni kiriting');
      return;
    }

    if (!formData.discount_price) {
      toast.error('Chegirma narxini kiriting');
      return;
    }

    try {
      setSaving(true);
      const durationMonths = parseInt(formData.duration_months);

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('duration_months', durationMonths.toString());
      formDataToSend.append('monthly_price', formData.price);
      formDataToSend.append('monthly_discount_price', formData.discount_price);
      formDataToSend.append('is_active', formData.is_active.toString());
      
      // Add image if present
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await authFetch('/courses/create/', {
        method: 'POST',
        body: formDataToSend,
        // Don't set Content-Type header - browser will set it with boundary
      });

      if (response.ok) {
        toast.success('Kurs yaratildi');
        navigate('/dashboard/admin/courses');
      } else {
        toast.error('Kursni yaratishda xatolik');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Kursni yaratishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/admin/courses')}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Yangi Kurs Yaratish</h1>
            <p className="text-sm text-muted-foreground mt-1">Yangi kurs qo'shish uchun ma'lumotlarni to'ldiring</p>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 Asosiy Ma'lumot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Course Image */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Kurs rasmi (ixtiyoriy)
                  </label>
                  {imagePreview ? (
                    <div className="relative max-w-xs">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border-2 border-emerald-300 dark:border-emerald-700"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={removeImage}
                        className="absolute top-2 right-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition max-w-xs">
                      <label className="flex flex-col items-center justify-center w-full cursor-pointer">
                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium text-foreground">Rasm tanlang yoki shu yerga tashlang</span>
                        <span className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF (max 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Course Name */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Kurs nomi *
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masalan: Web Development 101"
                    className="bg-white dark:bg-slate-700"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Tavsif *
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Kurs haqida batafsil ma'lumot yozing..."
                    className="min-h-32 bg-white dark:bg-slate-700"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Duration */}
            <Card className="bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💰 Narx va Davomiyligi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Labels Updated */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Duration */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Davomiyligi (oylar) *
                    </label>
                    <Input
                      name="duration_months"
                      type="number"
                      value={formData.duration_months}
                      onChange={handleInputChange}
                      placeholder="3"
                      className="bg-white dark:bg-slate-700"
                    />
                  </div>

                  {/* Price - Updated label */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Oylik narxi (so'm) *
                    </label>
                    <Input
                      name="price"
                      type="text"
                      value={formatDisplayNumber(formData.price)}
                      onChange={handleInputChange}
                      placeholder="500 000"
                      className="bg-white dark:bg-slate-700"
                    />
                  </div>
                </div>

                {/* Discount Price - Updated label */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Oylik chegirma narxi (so'm) *
                  </label>
                  <Input
                    name="discount_price"
                    type="text"
                    value={formatDisplayNumber(formData.discount_price)}
                    onChange={handleInputChange}
                    placeholder="400 000"
                    className="bg-white dark:bg-slate-700"
                  />
                </div>

                {/* Price Preview - Show monthly prices only */}
                {formData.price && formData.discount_price && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase">Oylik narxlar</p>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Doimiy</p>
                          <p className="font-semibold">{Number(formData.price).toLocaleString('uz-UZ')} so'm</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Chegirma</p>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {Number(formData.discount_price).toLocaleString('uz-UZ')} so'm
                          </p>
                        </div>
                      </div>

                      {/* Discount info */}
                      <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800">
                        <span className="font-medium text-xs">Chegirma foizi:</span>
                        <span className="font-semibold text-red-600">
                          {Math.round(((Number(formData.price) - Number(formData.discount_price)) / Number(formData.price)) * 100)}%
                        </span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground pt-2 border-t border-blue-200 dark:border-blue-800">
                        Jami narx = oylik narx × {formData.duration_months} oy (serverda hisoblanadi)
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-base">✅ Holati</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.is_active ? 'true' : 'false'}
                  onValueChange={(value) => handleSelectChange('is_active', value)}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Faol</SelectItem>
                    <SelectItem value="false">Noactive</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Help Info */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-base">💡 Maslahat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  • <strong>Oylik narxi</strong> kiriting, umumiy narx avtomatik hisoblanadi
                </p>
                <p>
                  • Misol: 3 oy, oylik 100,000 so'm = 300,000 so'm jami
                </p>
                <p>
                  • Chegirma ham oylik, jami chegirma avtomatik hisoblanadi
                </p>
                <p>
                  • Kurs nomini aniq va tushunarli qilib yozing
                </p>
                <p>
                  • Chegirma oylik narxidan kam bo'lishi kerak
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2 sticky top-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Yaratilmoqda...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Kurs Yaratish
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/admin/courses')}
                className="w-full"
              >
                Bekor qilish
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
