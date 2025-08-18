import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to clients admin after a short delay
    const timer = setTimeout(() => {
      navigate('/clients');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="p-12 text-center max-w-md">
        <div className="bg-primary rounded-lg p-4 w-fit mx-auto mb-6">
          <Users className="h-12 w-12 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Clients Admin</h1>
        <p className="text-muted-foreground mb-8">
          Internal dashboard for managing client relationships and data
        </p>
        <Button 
          onClick={() => navigate('/clients')}
          className="w-full"
        >
          Access Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          Redirecting automatically...
        </p>
      </Card>
    </div>
  );
};

export default Index;
