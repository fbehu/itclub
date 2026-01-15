import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, FileText, Download, Image, File, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
}

interface DayLesson {
  id: string;
  date: string;
  day: number;
  topic: string;
  description: string;
  files: FileAttachment[];
}

const monthNames: Record<string, string> = {
  '01': 'Yanvar',
  '02': 'Fevral',
  '03': 'Mart',
  '04': 'Aprel',
  '05': 'May',
  '06': 'Iyun',
  '07': 'Iyul',
  '08': 'Avgust',
  '09': 'Sentabr',
  '10': 'Oktabr',
  '11': 'Noyabr',
  '12': 'Dekabr'
};

// Demo lesson
const demoLesson: DayLesson = {
  id: '1',
  date: '2026-01-06',
  day: 6,
  topic: 'Python asoslari',
  description: `
    <h3>Kirish</h3>
    <p>Python dasturlash tiliga kirish. O'zgaruvchilar va ma'lumot turlari haqida asosiy tushunchalar.</p>
    <img src="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800" alt="Python" style="max-width: 100%; border-radius: 8px; margin: 16px 0;" />
    
    <h3>O'zgaruvchilar</h3>
    <p>Python tilida o'zgaruvchilar quyidagicha e'lon qilinadi:</p>
    <pre style="background: #f4f4f4; padding: 12px; border-radius: 4px; overflow-x: auto;">
name = "Asliddin"
age = 25
is_student = True
    </pre>
    
    <h3>Ma'lumot turlari</h3>
    <ul>
      <li><strong>str</strong> - matn (string)</li>
      <li><strong>int</strong> - butun son (integer)</li>
      <li><strong>float</strong> - o'nlik son</li>
      <li><strong>bool</strong> - mantiqiy qiymat (True/False)</li>
      <li><strong>list</strong> - ro'yxat</li>
      <li><strong>dict</strong> - lug'at</li>
    </ul>
    
    <h3>Mashqlar</h3>
    <ol>
      <li>Hello World dasturi yozing</li>
      <li>O'zgaruvchilar bilan ishlang</li>
      <li>Turli ma'lumot turlarini sinab ko'ring</li>
    </ol>
  `,
  files: [
    { name: 'python_basics.pdf', url: '#', type: 'pdf' },
    { name: 'examples.zip', url: '#', type: 'archive' },
    { name: 'screenshot.png', url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=200', type: 'image' }
  ]
};

export default function LessonView() {
  const { planId, lessonId } = useParams<{ planId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<DayLesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Demo: Load lesson
    setTimeout(() => {
      setLesson(demoLesson);
      setLoading(false);
    }, 500);
  }, [lessonId]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5 text-green-500" />;
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      default: return <File className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatDate = (date: string) => {
    const [year, month, day] = date.split('-');
    return `${day} ${monthNames[month]} ${year}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!lesson) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4 sm:p-6">
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Dars topilmadi</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Ortga
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline" className="text-sm">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(lesson.date)}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">{lesson.topic}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Dars mazmuni
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: lesson.description }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Files */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Qo'shimcha materiallar</CardTitle>
              </CardHeader>
              <CardContent>
                {lesson.files.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Qo'shimcha fayllar mavjud emas
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lesson.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {getFileIcon(file.type)}
                          <span className="text-sm truncate">{file.name}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
