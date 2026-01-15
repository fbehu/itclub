import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Group {
  id: string;
  name: string;
}

interface LessonPlan {
  id: string;
  name: string;
  start_month: string;
  end_month: string;
  groups: { id: string; name: string }[];
  created_at: string;
}

interface EditLessonPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonPlan: LessonPlan;
  onSubmit: (plan: LessonPlan) => void;
}

const months = [
  { value: '01', label: 'Yanvar' },
  { value: '02', label: 'Fevral' },
  { value: '03', label: 'Mart' },
  { value: '04', label: 'Aprel' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Iyun' },
  { value: '07', label: 'Iyul' },
  { value: '08', label: 'Avgust' },
  { value: '09', label: 'Sentabr' },
  { value: '10', label: 'Oktabr' },
  { value: '11', label: 'Noyabr' },
  { value: '12', label: 'Dekabr' }
];

const years = ['2024', '2025', '2026', '2027', '2028'];

// Demo groups
const demoGroups: Group[] = [
  { id: '1', name: 'Savodxonlik 1' },
  { id: '2', name: 'Web Development' },
  { id: '3', name: 'Frontend Group' },
  { id: '4', name: 'Backend Group' },
  { id: '5', name: 'Cybersecurity' }
];

export function EditLessonPlanDialog({ open, onOpenChange, lessonPlan, onSubmit }: EditLessonPlanDialogProps) {
  const [name, setName] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groups] = useState<Group[]>(demoGroups);

  useEffect(() => {
    if (lessonPlan) {
      setName(lessonPlan.name);
      const [sy, sm] = lessonPlan.start_month.split('-');
      const [ey, em] = lessonPlan.end_month.split('-');
      setStartYear(sy);
      setStartMonth(sm);
      setEndYear(ey);
      setEndMonth(em);
      setSelectedGroups(lessonPlan.groups.map(g => g.id));
    }
  }, [lessonPlan]);

  const handleSubmit = () => {
    if (!name.trim() || !startMonth || !endMonth) {
      return;
    }

    const start = `${startYear}-${startMonth}`;
    const end = `${endYear}-${endMonth}`;

    if (new Date(`${end}-01`) < new Date(`${start}-01`)) {
      return;
    }

    const selectedGroupsData = groups.filter(g => selectedGroups.includes(g.id));

    onSubmit({
      ...lessonPlan,
      name: name.trim(),
      start_month: start,
      end_month: end,
      groups: selectedGroupsData
    });
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dars rejani tahrirlash</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Dars reja nomi</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Backend Development"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Boshlanish oyi</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={startMonth} onValueChange={setStartMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Oy" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={startYear} onValueChange={setStartYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Yil" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>Tugash oyi</Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={endMonth} onValueChange={setEndMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Oy" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={endYear} onValueChange={setEndYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Yil" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Groups */}
          <div className="space-y-2">
            <Label>Guruhlar (ixtiyoriy)</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {groups.map(group => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <label
                      htmlFor={`edit-group-${group.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {group.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !startMonth || !endMonth}>
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
