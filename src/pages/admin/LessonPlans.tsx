import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, BookOpen, Calendar, Trash2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { CreateLessonPlanDialog } from './lesson-plans/CreateLessonPlanDialog';
import { EditLessonPlanDialog } from './lesson-plans/EditLessonPlanDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LessonPlan {
  id: string;
  name: string;
  start_month: string;
  end_month: string;
  groups: { id: string; name: string }[];
  created_at: string;
}

// Demo data
const demoLessonPlans: LessonPlan[] = [
  {
    id: '1',
    name: 'Backend Development',
    start_month: '2026-01',
    end_month: '2026-03',
    groups: [{ id: '1', name: 'Savodxonlik 1' }, { id: '2', name: 'Web Development' }],
    created_at: '2026-01-10T10:00:00Z'
  },
  {
    id: '2',
    name: 'Frontend Mastery',
    start_month: '2026-02',
    end_month: '2026-04',
    groups: [{ id: '3', name: 'Frontend Group' }],
    created_at: '2026-01-12T14:00:00Z'
  },
  {
    id: '3',
    name: 'Cybersecurity Basics',
    start_month: '2026-01',
    end_month: '2026-02',
    groups: [],
    created_at: '2026-01-15T09:00:00Z'
  }
];

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

function formatMonthRange(start: string, end: string): string {
  const [startYear, startMonth] = start.split('-');
  const [endYear, endMonth] = end.split('-');
  
  const startName = monthNames[startMonth] || startMonth;
  const endName = monthNames[endMonth] || endMonth;
  
  if (startYear === endYear) {
    return `${startName} - ${endName} ${startYear}`;
  }
  return `${startName} ${startYear} - ${endName} ${endYear}`;
}

function getMonthCount(start: string, end: string): number {
  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);
  
  return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
}

export default function LessonPlans() {
  const navigate = useNavigate();
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(demoLessonPlans);
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);

  const filteredPlans = lessonPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (newPlan: Omit<LessonPlan, 'id' | 'created_at'>) => {
    const plan: LessonPlan = {
      ...newPlan,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    setLessonPlans([...lessonPlans, plan]);
    toast.success('Dars reja yaratildi');
    setCreateDialogOpen(false);
  };

  const handleEdit = (updatedPlan: LessonPlan) => {
    setLessonPlans(lessonPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    toast.success('Dars reja yangilandi');
    setEditDialogOpen(false);
    setSelectedPlan(null);
  };

  const handleDelete = () => {
    if (selectedPlan) {
      setLessonPlans(lessonPlans.filter(p => p.id !== selectedPlan.id));
      toast.success('Dars reja o\'chirildi');
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dars rejalar</h1>
            <p className="text-muted-foreground mt-1">Dars rejalarini boshqaring</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Yangi dars reja
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Dars reja qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lesson Plans Grid */}
        {filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">Dars rejalar topilmadi</p>
                <p className="text-sm text-muted-foreground mt-1">Yangi dars reja yaratish uchun yuqoridagi tugmani bosing</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatMonthRange(plan.start_month, plan.end_month)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{getMonthCount(plan.start_month, plan.end_month)} oy</span>
                  </div>
                  
                  {plan.groups.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.groups.slice(0, 3).map(group => (
                        <Badge key={group.id} variant="secondary" className="text-xs">
                          {group.name}
                        </Badge>
                      ))}
                      {plan.groups.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.groups.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-muted-foreground">
                      {new Date(plan.created_at).toLocaleDateString('uz-UZ')}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/lesson-plans/${plan.id}`);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(plan);
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

      {/* Create Dialog */}
      <CreateLessonPlanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      {selectedPlan && (
        <EditLessonPlanDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          lessonPlan={selectedPlan}
          onSubmit={handleEdit}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dars rejani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedPlan?.name}" dars rejasini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
