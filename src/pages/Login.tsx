import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (login(username, password)) {
      toast({
        title: "Kirish muvaffaqiyatli!",
        description: "Xush kelibsiz!",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Xato",
        description: "Login yoki parol noto'g'ri",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-2">
            <LogIn className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Tizimga kirish</CardTitle>
          <CardDescription>
            Login va parolingizni kiriting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Login</Label>
              <Input
                id="username"
                type="text"
                placeholder="student yoki admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Kirish
            </Button>
          </form>
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm space-y-2">
            <p className="font-semibold text-muted-foreground">Test login ma'lumotlari:</p>
            <div className="space-y-1 text-muted-foreground">
              <p>Student: <span className="font-mono">student / student123</span></p>
              <p>Admin: <span className="font-mono">admin / admin123</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
