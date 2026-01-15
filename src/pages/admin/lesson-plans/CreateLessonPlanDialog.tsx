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

interface LessonPlanInput {
  name: string;
  start_month: string;
  end_month: string;
  groups: { id: string; name: string }[];
}

interface CreateLessonPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (plan: LessonPlanInput) => void;
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

export function CreateLessonPlanDialog({ open, onOpenChange, onSubmit }: CreateLessonPlanDialogProps) {
  const [name, setName] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('2026');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('2026');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groups] = useState<Group[]>(demoGroups);

  const handleSubmit = () => {
    if (!name.trim() || !startMonth || !endMonth) {
      return;
    }

    const start = `${startYear}-${startMonth}`;
    const end = `${endYear}-${endMonth}`;

    // Validate end is after or equal to start
    if (new Date(`${end}-01`) < new Date(`${start}-01`)) {
      return;
    }

    const selectedGroupsData = groups.filter(g => selectedGroups.includes(g.id));

    onSubmit({
      name: name.trim(),
      start_month: start,
      end_month: end,
      groups: selectedGroupsData
    });

    // Reset form
    setName('');
    setStartMonth('');
    setEndMonth('');
    setSelectedGroups([]);
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
          <DialogTitle>Yangi dars reja yaratish</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Dars reja nomi</Label>
            <Input
              id="name"
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

          {/* Groups (Optional) */}
          <div className="space-y-2">
            <Label>Guruhlar (ixtiyoriy)</Label>
            <ScrollArea className="h-32 border rounded-md p-2">
              <div className="space-y-2">
                {groups.map(group => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={selectedGroups.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <label
                      htmlFor={`group-${group.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {group.name}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              Guruhlarni tanlashingiz shart emas. Keyinroq ham qo'shishingiz mumkin.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Bekor qilish
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !startMonth || !endMonth}>
            Yaratish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
