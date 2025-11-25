import { useState, useEffect, useRef } from 'react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Search, Users } from 'lucide-react';
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
  first_name: string;
  last_name: string;
  phone_number?: string;
}
const messageTemplates = {
  registered: {
    title: 'Ro\'yxatdan o\'tdingiz',
    template:
      'Tabriklaymiz, {name}!\n' +
      'Siz University of Business and Science Student Union tarkibidagi IT Clubga muvaffaqiyatli ro\'yxatdan o\'tdingiz.\n' +
      'IT Club - UBS\n'
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
      'Telegram: t.me/Cyber31_13' +
      'IT Club - UBS\n'
  },

  absent: {
    title: 'Darsga kelmagan',
    template:
      'Hurmatli {name},\n' +
      'Siz {date} sanasidagi darsga kelmadingiz. Iltimos, keyingi darslarga qatnashing.\n\n' +
      'IT Club - UBS'
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
    setLoading(true);
    
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
          hasMore = !!data.next;
          page++;
        } else {
          hasMore = false;
        }
      }
      
      setStudents(allStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: 'Xatolik',
        description: 'Talabalar ro\'yxatini yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
        const personalizedMessage = message
          .replace(/{name}/g, `${student.first_name} ${student.last_name}`)
          .replace(/{username}/g, student.id)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">SMS Yuborish</h1>
        <p className="text-muted-foreground mt-2">Talabalarga SMS xabar yuborish</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5" />
                Statistika
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Jami talabalar:</span>
                  <span className="font-semibold text-foreground">{students.length}</span>
                </div>
                
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="text-muted-foreground">Filtered:</span>
                  <span className="font-semibold text-foreground">{filteredStudents.length}</span>
                </div>
                
                <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-blue-700 dark:text-blue-300">Tanlangan:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">{selectedStudents.size}</span>
                </div>

                {selectedStudents.size > 0 && (
                  <div className="flex justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <span className="text-green-700 dark:text-green-300">Yuborish uchun tayyor:</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">{selectedStudents.size}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedStudents.size > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSelectedStudents(new Set())}
              >
                Barchangi bekor qilish
              </Button>
            )}
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students Selection */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">O'quvchilarni tanlang</h2>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all" className="cursor-pointer text-sm">
                    Barchasini
                  </Label>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ism yoki telefon raqam bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea 
                className="h-[400px] rounded-md border border-border p-4"
                ref={scrollAreaRef}
              >
                <div className="space-y-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
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
                        <p className="font-medium text-foreground">
                          {student.first_name} {student.last_name}
                        </p>
                        {student.phone_number && (
                          <p className="text-sm text-muted-foreground">{student.phone_number}</p>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Card>

          {/* Message Template & Sending */}
          <Card className="p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Xabar shabloni</h2>

              <div>
                <Label htmlFor="template">Shablon tanlang</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Shablon tanlang" />
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

              <div>
                <Label htmlFor="message">Xabar matni</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Xabar matnini kiriting"
                  className="min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {'{name}'} - Talaba ismi, {'{username}'} - Login, {'{date}'} - Sana
                </p>
              </div>

              <div>
                <Label htmlFor="send-time">Yuborish vaqti</Label>
                <input
                  id="send-time"
                  type="datetime-local"
                  value={sendTime}
                  onChange={(e) => setSendTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <Button
                onClick={handleSendSMS}
                disabled={sending || selectedStudents.size === 0}
                className="w-full"
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" />
                SMS Yuborish
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Sending Overlay */}
      {sending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="p-8 max-w-md w-full mx-4 text-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-foreground">
              SMS xabarlar yuborilmoqda
            </h3>
            <p className="text-muted-foreground">
              Iltimos, saytdan chiqmay turing
            </p>
            <div className="text-2xl font-bold text-primary">
              {sentCount} / {totalToSend}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
