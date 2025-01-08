import Header from '@/components/layout/Header';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const Services = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  return (
    <div>
      <Header session={session} />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center">Services</h1>
        <p className="text-center mt-4 text-muted-foreground">Under Construction</p>
      </div>
    </div>
  );
};

export default Services;