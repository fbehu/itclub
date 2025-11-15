import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { GraduationCap } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard/profile');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="text-center space-y-6 p-8 animate-fade-in">
        <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
          <GraduationCap className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Talaba Boshqaruv Tizimi
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          O'z profilingiz va statistikalaringizni boshqaring
        </p>
        <Button 
          size="lg" 
          onClick={() => navigate('/login')}
          className="animate-scale-in"
        >
          Tizimga kirish
        </Button>
      </div>
    </div>
  );
};

export default Index;
