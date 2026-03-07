import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import ExamStartButton from './ExamStartButton';

export interface Exam {
  id: number;
  title: string;
  course_name: string;
  start_time: string;
  end_time: string;
  status: 'not_started' | 'available' | 'finished';
}

const statusConfig = {
  not_started: { label: 'Boshlanmagan', className: 'bg-muted text-muted-foreground' },
  available: { label: 'Mavjud', className: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30' },
  finished: { label: 'Yakunlangan', className: 'bg-secondary text-secondary-foreground' },
};

export default function ExamCard({ exam }: { exam: Exam }) {
  const cfg = statusConfig[exam.status];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-semibold text-foreground truncate">{exam.title}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{exam.course_name}</span>
            </div>
          </div>
          <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{format(new Date(exam.start_time), 'dd.MM.yyyy')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{format(new Date(exam.start_time), 'HH:mm')} – {format(new Date(exam.end_time), 'HH:mm')}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <ExamStartButton
            examId={exam.id}
            startTime={exam.start_time}
            endTime={exam.end_time}
            status={exam.status}
          />
        </div>
      </CardContent>
    </Card>
  );
}
