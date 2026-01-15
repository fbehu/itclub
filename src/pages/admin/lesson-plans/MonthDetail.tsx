import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Plus, BookOpen, FileText, Image, Paperclip, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { AddLessonDialog } from './AddLessonDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface DayLesson {
  id: string;
  date: string;
  day: number;
  topic: string;
  description: string; // HTML content
  files: { name: string; url: string; type: string }[];
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

// Demo lessons
const demoLessons: DayLesson[] = [
  {
    id: '1',
    date: '2026-01-06',
    day: 6,
    topic: 'Python asoslari',
    description: '<h3>Kirish</h3><p>Python dasturlash tiliga kirish. O\'zgaruvchilar va ma\'lumot turlari.</p><img src="https://via.placeholder.com/400x200" alt="Python" /><h3>Mashqlar</h3><ul><li>Hello World dasturi</li><li>O\'zgaruvchilar bilan ishlash</li></ul>',
    files: [
      { name: 'python_basics.pdf', url: '#', type: 'pdf' },
      { name: 'examples.zip', url: '#', type: 'archive' }
    ]
  },
  {
    id: '2',
    date: '2026-01-08',
    day: 8,
    topic: 'Shartli operatorlar',
    description: '<h3>if-else operatorlari</h3><p>Shartli operatorlar yordamida dastur oqimini boshqarish.</p>',
    files: [
      { name: 'conditionals.pdf', url: '#', type: 'pdf' }
    ]
  },
  {
    id: '3',
    date: '2026-01-13',
    day: 13,
    topic: 'Sikllar',
    description: '<h3>for va while sikllari</h3><p>Takrorlanuvchi amallarni bajarish uchun sikllardan foydalanish.</p>',
    files: []
  },
  {
    id: '4',
    date: '2026-01-15',
    day: 15,
    topic: 'Funksiyalar',
    description: '<h3>Funksiyalar yaratish</h3><p>Kodni qayta ishlatish uchun funksiyalar yaratish va chaqirish.</p>',
    files: [
      { name: 'functions_guide.pdf', url: '#', type: 'pdf' },
      { name: 'practice_tasks.docx', url: '#', type: 'document' }
    ]
  }
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function MonthDetail() {
  const { planId, monthId } = useParams<{ planId: string; monthId: string }>();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<DayLesson[]>(demoLessons);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<DayLesson | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<DayLesson | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [year, month] = (monthId || '2026-01').split('-').map(Number);
  const daysInMonth = getDaysInMonth(year, month);
  const monthName = monthNames[String(month).padStart(2, '0')] || '';

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, [monthId]);

  const handleAddLesson = (lesson: Omit<DayLesson, 'id'>) => {
    const newLesson: DayLesson = {
      ...lesson,
      id: Date.now().toString()
    };
    setLessons([...lessons, newLesson]);
    toast.success('Dars qo\'shildi');
    setAddDialogOpen(false);
    setSelectedDay(null);
  };

  const handleEditLesson = (lesson: DayLesson) => {
    setLessons(lessons.map(l => l.id === lesson.id ? lesson : l));
    toast.success('Dars yangilandi');
    setEditLesson(null);
  };

  const handleDeleteLesson = () => {
    if (selectedLesson) {
      setLessons(lessons.filter(l => l.id !== selectedLesson.id));
      toast.success('Dars o\'chirildi');
      setDeleteDialogOpen(false);
      setSelectedLesson(null);
    }
  };

  const getLessonForDay = (day: number): DayLesson | undefined => {
    return lessons.find(l => l.day === day);
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

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/lesson-plans/${planId}`)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{monthName} {year}</h1>
              <p className="text-muted-foreground mt-1">Kunlik darslar</p>
            </div>
          </div>
          <Button onClick={() => { setSelectedDay(null); setAddDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Dars qo'shish
          </Button>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dars jadvali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty cells for first day offset */}
              {Array.from({ length: new Date(year, month - 1, 1).getDay() === 0 ? 6 : new Date(year, month - 1, 1).getDay() - 1 }, (_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const lesson = getLessonForDay(day);
                const isToday = new Date().getDate() === day && 
                               new Date().getMonth() + 1 === month && 
                               new Date().getFullYear() === year;
                
                return (
                  <div
                    key={day}
                    className={`
                      aspect-square border rounded-lg p-1 sm:p-2 cursor-pointer transition-all
                      hover:border-primary hover:shadow-md
                      ${lesson ? 'bg-primary/10 border-primary/30' : 'bg-background'}
                      ${isToday ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => {
                      if (lesson) {
                        navigate(`/admin/lesson-plans/${planId}/lesson/${lesson.id}`);
                      } else {
                        setSelectedDay(day);
                        setAddDialogOpen(true);
                      }
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                        {day}
                      </span>
                      {lesson && (
                        <div className="mt-1 flex-1 min-h-0">
                          <div className="hidden sm:block">
                            <p className="text-xs text-primary font-medium truncate">
                              {lesson.topic}
                            </p>
                            {lesson.files.length > 0 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Paperclip className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {lesson.files.length}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="sm:hidden flex justify-center">
                            <BookOpen className="w-3 h-3 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Lessons List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Darslar ro'yxati</h2>
          {lessons.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Darslar topilmadi</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Kalendardagi kunni bosib yoki yuqoridagi tugma orqali dars qo'shing
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {lessons.sort((a, b) => a.day - b.day).map(lesson => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{lesson.day}-kun</Badge>
                            <h3 className="font-semibold truncate">{lesson.topic}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: lesson.description.replace(/<[^>]*>/g, ' ').slice(0, 100) + '...' }}
                          />
                          {lesson.files.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <Paperclip className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {lesson.files.length} ta fayl
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/lesson-plans/${planId}/lesson/${lesson.id}`)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditLesson(lesson)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLesson(lesson);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Lesson Dialog */}
      <AddLessonDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        year={year}
        month={month}
        selectedDay={selectedDay}
        onSubmit={handleAddLesson}
      />

      {/* Edit Lesson Dialog */}
      {editLesson && (
        <AddLessonDialog
          open={!!editLesson}
          onOpenChange={(open) => !open && setEditLesson(null)}
          year={year}
          month={month}
          selectedDay={editLesson.day}
          lesson={editLesson}
          onSubmit={(lesson) => handleEditLesson({ ...lesson, id: editLesson.id })}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Darsni o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedLesson?.topic}" darsini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
