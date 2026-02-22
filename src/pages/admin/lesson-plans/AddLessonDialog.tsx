import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, FileText, Image, File } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileAttachment {
  name: string;
  url: string;
  type: string;
}

interface DayLesson {
  date: string;
  day: number;
  topic: string;
  description: string;
  files: FileAttachment[];
}

interface AddLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  selectedDay: number | null;
  lesson?: DayLesson & { id: string };
  onSubmit: (lesson: DayLesson) => void;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function AddLessonDialog({ 
  open, 
  onOpenChange, 
  year, 
  month, 
  selectedDay,
  lesson,
  onSubmit 
}: AddLessonDialogProps) {
  const [day, setDay] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileAttachment[]>([]);

  const daysInMonth = getDaysInMonth(year, month);
  const isEditing = !!lesson;

  useEffect(() => {
    if (lesson) {
      setDay(String(lesson.day));
      setTopic(lesson.topic);
      setDescription(lesson.description);
      setFiles(lesson.files);
    } else if (selectedDay) {
      setDay(String(selectedDay));
    } else {
      setDay('');
      setTopic('');
      setDescription('');
      setFiles([]);
    }
  }, [lesson, selectedDay, open]);

  const handleSubmit = () => {
    if (!day || !topic.trim()) {
      return;
    }

    const date = `${year}-${String(month).padStart(2, '0')}-${day.padStart(2, '0')}`;

    onSubmit({
      date,
      day: parseInt(day),
      topic: topic.trim(),
      description,
      files
    });

    // Reset form
    setDay('');
    setTopic('');
    setDescription('');
    setFiles([]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      const newFiles: FileAttachment[] = Array.from(uploadedFiles).map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.includes('image') ? 'image' : 
              file.type.includes('pdf') ? 'pdf' : 
              file.type.includes('document') ? 'document' : 'file'
      }));
      setFiles([...files, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Darsni tahrirlash' : 'Yangi dars qo\'shish'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {/* Day Selection */}
            <div className="space-y-2">
              <Label htmlFor="day">Kun</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Kunni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1}-kun
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Mavzu</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Dars mavzusini kiriting"
              />
            </div>

            {/* Description (HTML) */}
            <div className="space-y-2">
              <Label htmlFor="description">Tavsif (HTML formatida)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="<h3>Mavzu sarlavhasi</h3><p>Dars haqida ma'lumot...</p>"
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                HTML teglaridan foydalanishingiz mumkin: &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;img&gt;, va h.k.
              </p>
            </div>

            {/* Preview */}
            {description && (
              <div className="space-y-2">
                <Label>Ko'rinishi</Label>
                <div 
                  className="border rounded-lg p-4 bg-muted/30 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            )}

            {/* Files */}
            <div className="space-y-2">
              <Label>Qo'shimcha fayllar</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Fayllarni yuklash uchun bosing
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, Word, rasmlar va boshqa fayllar
                  </p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2 mt-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={!day || !topic.trim()}>
            {isEditing ? 'Saqlash' : 'Qo\'shish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
