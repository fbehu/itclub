import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function Statistics() {
  const { user } = useAuth();

  const stats = [
    {
      title: "O'rtacha ball",
      value: "4.5",
      icon: Award,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Darslar soni",
      value: "42",
      icon: BookOpen,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "O'quv soatlari",
      value: "320",
      icon: Clock,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "O'sish",
      value: "+12%",
      icon: TrendingUp,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const recentActivities = [
    { course: "Dasturlash asoslari", grade: 5, date: "2024-01-15" },
    { course: "Ma'lumotlar bazasi", grade: 4, date: "2024-01-14" },
    { course: "Web dasturlash", grade: 5, date: "2024-01-13" },
    { course: "Algoritimlar", grade: 4, date: "2024-01-12" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-bold">Statistika</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover-scale">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-full`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>So'nggi natijalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{activity.course}</p>
                      <p className="text-sm text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{activity.grade}</span>
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Semestr taraqqiyoti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Darslar</span>
                  <span className="text-sm text-muted-foreground">35/42</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '83%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Topshiriqlar</span>
                  <span className="text-sm text-muted-foreground">28/32</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '87.5%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Imtihonlar</span>
                  <span className="text-sm text-muted-foreground">4/6</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: '66.6%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
