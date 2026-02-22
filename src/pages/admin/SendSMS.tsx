import { useState, useEffect, useRef } from 'react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import DashboardLayout from '@/components/DashboardLayout';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Search, Users, MessageSquare, Settings, CheckCircle2, AlertCircle, Info, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Student {
  id: string;
  uuid?: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}
const messageTemplates = {
  registered: {
    title: 'Ro\'yxatdan o\'tdingiz',
    template:
      'Tabriklaymiz, {name}!\n' +
      'Siz Universe Campus-dan muvaffaqiyatli ro\'yxatdan o\'tdingiz.\n' +
      'Universe - Campus\n'
  },

  not_registered: {
    title: 'Ro\'yxatdan o\'tolmadingiz',
    template:
      'Hurmatli {name},\n' +
      'Afsuski, siz University of Business and Science Student Union tarkibidagi IT Clubga ro\'yxatdan o\'tolmadingiz.\n' +
      'Qo\'shimcha ma\'lumot yoki qayta ariza uchun biz bilan bog\'lanishingiz mumkin.\n\n' +
      'Aloqa: +998 90 074 87 37\n' +
      'Telegram: t.me/Cyber31_13\n' +
      'IT Club - UBS\n'
  },

  login_info: {
    title: 'Login va parol haqida',
    template:
      'Hurmatli {name},\n' +
      'Sizning platformaga kirish ma\'lumotlaringiz quyidagicha:\n' +
      'Login: {username}\n' +
      'Parol: {password}\n\n' +
      'Aloqa: +998 90 074 87 37\n' +
      'Telegram: t.me/Cyber31_13\n' +
      'IT Club - UBS\n'
  },

  absent: {
    title: 'Darsga kelmagan',
    template:
      "Salommm) Siz bugun darsga kelmadingiz. Ko\'p dars qoldiryapsiz. Dars qoldirmaslikka harakat qiling!) \n" +
      "Campusda ko\'rishguncha:)\n"
  },
  
  payment: {
    title: 'To\'lov qilinganda',
    template:
      "Universe campus: Hisobingizga {amount} UZS qabul qilindi.\n" +
      "Turi: {type}\n" +
      "FIO: {name}\n" +
      "Guruh: {group}\n" +
      "To'lov sanasi: {date}\n"
  }
};


export default function SendSMS() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sendTime, setSendTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [totalToSend, setTotalToSend] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAllStudents();
    
    // Set default send time to now
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setSendTime(localISOTime);
  }, []);

  const loadAllStudents = async () => {
    setUsersLoading(true);
    
    try {
      let allStudents: Student[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const url = `${API_ENDPOINTS.USERS_LIST}?page=${page}`;
        const response = await authFetch(url);
        if (response.ok) {
          const data = await response.json();
          const newStudents = data.results || [];
          allStudents = [...allStudents, ...newStudents];
          
          // Update UI immediately after each page loads
          setStudents(allStudents);
          
          hasMore = !!data.next;
          page++;
        } else {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: 'Xatolik',
        description: 'Talabalar ro\'yxatini yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    const filtered = students.filter(student => {
      const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
      const phone = student.phone_number?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      return fullName.includes(query) || phone.includes(query);
    });
    setFilteredStudents(filtered);
  }, [students, searchQuery]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents);
    if (checked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setMessage(messageTemplates[templateKey as keyof typeof messageTemplates].template);
  };

  const handleSendSMS = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: 'Xatolik',
        description: 'Kamida bitta talaba tanlang',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Xatolik',
        description: 'Xabar matnini kiriting',
        variant: 'destructive',
      });
      return;
    }

    if (!sendTime) {
      toast({
        title: 'Xatolik',
        description: 'Yuborish vaqtini belgilang',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    setSentCount(0);
    setTotalToSend(selectedStudents.size);

    const selectedStudentsList = students.filter(s => selectedStudents.has(s.id));
    let successCount = 0;

    for (const student of selectedStudentsList) {
      try {
        // Filter phone number: remove +998 prefix, keep only digits
        const phonePassword = (student.phone_number || '')
          .replace(/\D/g, '') // Remove all non-digits
          .replace(/^998/, ''); // Remove country code if present
        
        // Format username: ITC + padded index
        const studentIndex = students.findIndex(s => s.id === student.id) + 1;
        const username = `ITC${String(studentIndex).padStart(3, '0')}`;

        const personalizedMessage = message
          .replace(/{name}/g, `${student.first_name} ${student.last_name}`)
          .replace(/{username}/g, student.uuid || username)
          .replace(/{password}/g, phonePassword)
          .replace(/{date}/g, new Date().toLocaleDateString('uz-UZ'));

        const response = await authFetch(API_ENDPOINTS.SEND_SMS, {
          method: 'POST',
          body: JSON.stringify({
            user_id: student.id,
            user_name: `${student.first_name} ${student.last_name}`,
            phone_number: student.phone_number || '',
            message: personalizedMessage,
            send_time: new Date(sendTime).toISOString(),
            status: 'waiting',
          }),
        });

        if (response.ok) {
          successCount++;
          setSentCount(successCount);
        }
      } catch (error) {
        console.error(`Error sending SMS to ${student.first_name}:`, error);
      }
    }

    setSending(false);
    
    toast({
      title: 'Muvaffaqiyatli!',
      description: `${successCount} ta talabaga SMS xabar yuborildi`,
    });

    // Reset form
    setSelectedStudents(new Set());
    setMessage('');
    setSelectedTemplate('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        
        .animate-fade {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-slide-left {
          animation: slideInLeft 0.5s ease-out forwards;
        }
        
        .animate-slide-right {
          animation: slideInRight 0.5s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .card-hover {
          transition: all 0.3s ease;
        }

        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="animate-fade">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              SMS Yuborish
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 ml-0 sm:ml-5 text-base">
            Talabalarga shaxsiyashtirilgan SMS xabar yuborish paneli
          </p>
        </div>

        {/* Demo/Beta Status Banner */}
        <div className="animate-fade" style={{ animationDelay: '0.1s' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Demo Mode */}
            <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="p-4 sm:p-5 flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 text-sm sm:text-base mb-1">
                    📱 Demo Rejim
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    SMS xabarlar haqiqiy turda yuborilmaydi. Faqat sinov uchun ishlaydi.
                  </p>
                </div>
              </div>
            </Card>

            {/* Beta Testing */}
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
              <div className="p-4 sm:p-5 flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0 mt-0.5">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm sm:text-base mb-1">
                    ⚡ Beta Sinov Rejimi
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Tizim beta sinov rejimida ishlaydi. Xatoliklar yuz berishi mumkin.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Statistics */}
          <div className="lg:col-span-1 animate-slide-left">
            <div className="sticky top-6 space-y-6">
              {/* Main Stats Card */}
              <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 backdrop-blur-sm overflow-hidden card-hover">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
                
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Statistika</h3>
                  </div>
                  
                  {/* Jami talabalar */}
                  <div className="bg-white/60 dark:bg-white/5 border border-blue-200/50 dark:border-white/10 rounded-xl p-4 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Jami talabalar</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{students.length}</p>
                    <div className="h-1 bg-slate-300 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                      <div className="h-full w-full bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    </div>
                  </div>

                  {/* Filtered */}
                  <div className="bg-white/60 dark:bg-white/5 border border-amber-200/50 dark:border-white/10 rounded-xl p-4 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Natijalangan</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{filteredStudents.length}</p>
                    <div className="h-1 bg-slate-300 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                        style={{ width: `${filteredStudents.length > 0 ? (filteredStudents.length / students.length) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tanlangan */}
                  <div className={`rounded-xl p-4 border transition-all ${
                    selectedStudents.size > 0 
                      ? 'bg-blue-100 dark:bg-gradient-to-br dark:from-blue-500/20 dark:to-blue-400/10 border-blue-300 dark:border-blue-500/50' 
                      : 'bg-white/60 dark:bg-white/5 border-blue-200/50 dark:border-white/10'
                  }`}>
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                      {selectedStudents.size > 0 ? '✓ Tanlangan' : 'Tanlangan'}
                    </p>
                    <p className={`text-3xl font-bold transition-colors ${
                      selectedStudents.size > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {selectedStudents.size}
                    </p>
                    {selectedStudents.size > 0 && (
                      <div className="h-1 bg-blue-300 dark:bg-blue-500/30 rounded-full mt-3 overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                      </div>
                    )}
                  </div>

                  {/* Yuborish uchun tayyor */}
                  {selectedStudents.size > 0 && (
                    <div className="bg-gradient-to-br from-emerald-100 dark:from-emerald-500/20 to-green-50 dark:to-green-400/10 border border-emerald-300 dark:border-emerald-500/50 rounded-xl p-4 animate-float">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider">Yuborish uchun tayyor</p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{selectedStudents.size}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Clear Selection Button */}
              {selectedStudents.size > 0 && (
                <Button
                  variant="outline"
                  className="w-full border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                  onClick={() => setSelectedStudents(new Set())}
                >
                  Barchani bekor qilish
                </Button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Students Selection Card */}
            <Card className="border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 backdrop-blur-sm overflow-hidden card-hover animate-slide-right" style={{ animationDelay: '0.1s' }}>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">O'quvchilarni tanlang</h2>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30">
                    <Checkbox
                      id="select-all"
                      checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                      Barchasini
                    </Label>
                  </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ism, familya yoki telefon bo'yicha qidirish..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                </div>

                {/* Students List */}
                <ScrollArea className="h-[450px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4">
                  <div className="space-y-2">
                    {filteredStudents.length === 0 && !usersLoading ? (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-slate-600 dark:text-slate-400">Talabalar topilmadi</p>
                      </div>
                    ) : usersLoading && filteredStudents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                        <p className="text-slate-600 dark:text-slate-400">Talabalar yuklanmoqda...</p>
                      </div>
                    ) : (
                      <>
                        {filteredStudents.map((student, index) => (
                          <div
                            key={student.id}
                            className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
                              selectedStudents.has(student.id)
                                ? 'bg-blue-500/10 border border-blue-500/30 dark:bg-blue-500/5'
                                : 'bg-white dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                            }`}
                            style={{ animationDelay: `${index * 20}ms` }}
                          >
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={selectedStudents.has(student.id)}
                              onCheckedChange={(checked) =>
                                handleSelectStudent(student.id, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`student-${student.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                                {student.first_name} {student.last_name}
                              </p>
                              {student.phone_number && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  📱 {student.phone_number}
                                </p>
                              )}
                            </Label>
                            {selectedStudents.has(student.id) && (
                              <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                        {usersLoading && filteredStudents.length > 0 && (
                          <div className="flex items-center justify-center p-4">
                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Yana talabalar yuklanmoqda...</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Card>

            {/* Message Template & Settings Card */}
            <Card className="border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 backdrop-blur-sm overflow-hidden card-hover animate-slide-right" style={{ animationDelay: '0.2s' }}>
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Xabar va sozlamalar</h2>
                </div>

                {/* Template Selection */}
                <div className="space-y-3">
                  <Label htmlFor="template" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    📋 Xabar shablonini tanlang
                  </Label>
                  <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                    <SelectTrigger id="template" className="h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                      <SelectValue placeholder="Shablonni tanlang..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(messageTemplates).map(([key, template]) => (
                        <SelectItem key={key} value={key}>
                          {template.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Text */}
                <div className="space-y-3">
                  <Label htmlFor="message" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    ✏️ Xabar matni
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Xabar matnini kiriting..."
                    className="min-h-[180px] bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 resize-none focus:border-purple-500 dark:focus:border-purple-400"
                  />
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                      <span className="font-semibold">💡 Shablonlar:</span><br/>
                      • <code className="bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded text-[11px]">{'{'} name{'}'}</code> - Talaba ismi<br/>
                      • <code className="bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded text-[11px]">{'{'} username{'}'}</code> - Login<br/>
                      • <code className="bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded text-[11px]">{'{'} date{'}'}</code> - Bugungi sana
                    </p>
                  </div>
                </div>

                {/* Send Time */}
                <div className="space-y-3">
                  <Label htmlFor="send-time" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    ⏰ Yuborish vaqti
                  </Label>
                  <input
                    id="send-time"
                    type="datetime-local"
                    value={sendTime}
                    onChange={(e) => setSendTime(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-purple-500 dark:focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendSMS}
                  disabled={sending || selectedStudents.size === 0 || !message.trim()}
                  size="lg"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group"
                >
                  <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  SMS Yuborish ({selectedStudents.size} talaba)
                </Button>

                {selectedStudents.size === 0 && !message.trim() && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      ⚠️ Talaba va xabar matnini tanlang
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Sending Progress Overlay */}
        {sending && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20"></div>
                <Loader2 className="h-16 w-16 animate-spin text-blue-600 dark:text-blue-400 mx-auto relative" />
              </div>
              
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                  SMS yuborilmoqda
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Iltimos, sahifada qoling
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Jarayon:</p>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {sentCount} / {totalToSend}
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${(sentCount / totalToSend) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
