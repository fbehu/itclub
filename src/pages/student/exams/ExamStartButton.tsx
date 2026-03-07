import { Button } from '@/components/ui/button';
import { Play, Lock, CheckCircle } from 'lucide-react';

interface ExamStartButtonProps {
  examId: number;
  startTime: string;
  endTime: string;
  status: 'not_started' | 'available' | 'finished';
}

export default function ExamStartButton({ examId, startTime, endTime, status }: ExamStartButtonProps) {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);
  const isTimeValid = now >= start && now <= end;
  const canStart = status === 'available' && isTimeValid;

  const handleStart = () => {
    if (!canStart) return;
    const token = localStorage.getItem('access_token') || '';
    const url = `https://exam.onedu.uz/start/${examId}?token=${encodeURIComponent(token)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (status === 'finished') {
    return (
      <Button disabled variant="secondary" size="sm" className="gap-2">
        <CheckCircle className="h-4 w-4" />
        Yakunlangan
      </Button>
    );
  }

  if (!canStart) {
    return (
      <Button disabled variant="outline" size="sm" className="gap-2">
        <Lock className="h-4 w-4" />
        {status === 'not_started' ? 'Boshlanmagan' : 'Vaqt tugagan'}
      </Button>
    );
  }

  return (
    <Button onClick={handleStart} size="sm" className="gap-2">
      <Play className="h-4 w-4" />
      Imtihonni boshlash
    </Button>
  );
}
