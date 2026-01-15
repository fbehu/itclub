import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TodayLessonCardProps {
  groupId: string;
  userRole: 'teacher' | 'student';
}

// Demo: Today's lesson
const demoTodayLesson = {
  id: '1',
  topic: 'Python asoslari',
  planName: 'Backend Development',
  date: new Date().toISOString().split('T')[0]
};

export function TodayLessonCard({ groupId, userRole }: TodayLessonCardProps) {
  const navigate = useNavigate();
  const todayLesson = demoTodayLesson; // In real app, fetch from API

  if (!todayLesson) return null;

  const handleClick = () => {
    if (userRole === 'teacher') {
      navigate(`/teacher/lesson/${todayLesson.id}`);
    }
    // Students don't navigate, just see the topic
  };

  return (
    <Card 
      className={`bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 ${userRole === 'teacher' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={userRole === 'teacher' ? handleClick : undefined}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Bugungi dars
                </Badge>
              </div>
              {userRole === 'student' ? (
                <p className="font-medium text-foreground">
                  Bugungi mavzu: {todayLesson.topic}
                </p>
              ) : (
                <>
                  <h3 className="font-semibold text-foreground">{todayLesson.topic}</h3>
                  <p className="text-sm text-muted-foreground">{todayLesson.planName}</p>
                </>
              )}
            </div>
          </div>
          {userRole === 'teacher' && (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
