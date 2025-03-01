
import UnifiedLayout from "@/components/layout/UnifiedLayout";
import { useAuth } from "@/hooks/auth/useAuth";

const UnifiedProfilePage = () => {
  const { profile } = useAuth();

  return (
    <UnifiedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || 'User'}</h1>
          <p className="text-muted-foreground">Here's an overview of your healthcare information</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-lg mb-2">Prescriptions</h3>
            <p className="text-muted-foreground text-sm">Total active prescriptions</p>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>
          
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-lg mb-2">Orders</h3>
            <p className="text-muted-foreground text-sm">Total orders placed</p>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>
          
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-lg mb-2">Doctors</h3>
            <p className="text-muted-foreground text-sm">Connected healthcare providers</p>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>
          
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h3 className="font-medium text-lg mb-2">Teleconsultations</h3>
            <p className="text-muted-foreground text-sm">Upcoming appointments</p>
            <p className="text-4xl font-bold mt-2">0</p>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default UnifiedProfilePage;
