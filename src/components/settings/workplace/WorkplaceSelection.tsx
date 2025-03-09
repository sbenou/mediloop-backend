
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface WorkplaceSelectionProps {
  userId?: string;
  userRole: string;
  redirectAfterSelection?: boolean;
  onComplete?: () => void;
}

interface Workplace {
  id: string;
  name: string;
  address?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  hours?: string;
  license_number?: string;
}

interface LocationState {
  isNewSignup?: boolean;
  userId?: string;
  userRole?: string;
}

const WorkplaceSelection = ({ userId, userRole, redirectAfterSelection = false, onComplete }: WorkplaceSelectionProps) => {
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locationState = location.state as LocationState || {};
  
  // If userId is not passed directly, try to get it from location state (useful for redirects)
  const effectiveUserId = userId || locationState.userId;
  const effectiveUserRole = userRole || locationState.userRole;
  const isPharmacistSignup = locationState.isNewSignup && effectiveUserRole === 'pharmacist';
  const isDoctorSignup = locationState.isNewSignup && effectiveUserRole === 'doctor';
  
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
  });

  // Fetch workplaces based on user role
  const { data: workplaces, isLoading } = useQuery({
    queryKey: ['workplaces', effectiveUserRole],
    queryFn: async () => {
      if (effectiveUserRole === 'pharmacist') {
        // Fetch pharmacies
        const { data, error } = await supabase
          .from('pharmacies')
          .select('*');
        
        if (error) throw error;
        return data || [];
      } else if (effectiveUserRole === 'doctor') {
        // Fetch doctors
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, city, license_number')
          .eq('role', 'doctor');
        
        if (error) throw error;
        
        // Map to match workplace interface
        return (data || []).map(doctor => ({
          id: doctor.id,
          name: doctor.full_name || '',
          city: doctor.city || '',
          license_number: doctor.license_number || ''
        }));
      }
      
      return [];
    },
  });

  // Mutation to set a user's workplace
  const setWorkplaceMutation = useMutation({
    mutationFn: async (workplaceId: string) => {
      const targetUserId = effectiveUserId || session?.user?.id;
      if (!targetUserId) throw new Error('No user ID available');

      console.log(`Setting ${effectiveUserRole} workplace for user:`, targetUserId, "workplace:", workplaceId);

      if (effectiveUserRole === 'pharmacist') {
        const { error } = await supabase
          .from('user_pharmacies')
          .upsert([
            { user_id: targetUserId, pharmacy_id: workplaceId }
          ]);

        if (error) throw error;
      } else if (effectiveUserRole === 'doctor') {
        // For doctors, directly insert/update in the doctor_workplaces table
        // Since we can't use the table name directly, we'll use a raw SQL query
        const { error } = await supabase.rpc(
          'upsert_doctor_workplace', 
          { 
            p_user_id: targetUserId, 
            p_workplace_id: workplaceId
          }
        );

        if (error) throw error;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      if (effectiveUserRole === 'pharmacist') {
        queryClient.invalidateQueries({ queryKey: ['userPharmacy'] });
      } else if (effectiveUserRole === 'doctor') {
        queryClient.invalidateQueries({ queryKey: ['userDoctor'] });
      }
      
      toast({
        title: `${effectiveUserRole === 'pharmacist' ? 'Pharmacy' : 'Doctor Workplace'} Selected`,
        description: "Your workplace has been set successfully.",
      });
      
      if (onComplete) {
        onComplete();
      } else if (redirectAfterSelection || isPharmacistSignup || isDoctorSignup) {
        navigate('/', { replace: true });
      }
    },
    onError: (error) => {
      console.error('Error setting workplace:', error);
      toast({
        title: "Error",
        description: `Failed to set your ${effectiveUserRole === 'pharmacist' ? 'pharmacy' : 'doctor workplace'}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSelectWorkplace = (workplaceId: string) => {
    setSelectedWorkplaceId(workplaceId);
  };

  const handleConfirmSelection = () => {
    if (selectedWorkplaceId) {
      console.log(`Confirming ${effectiveUserRole} workplace selection:`, selectedWorkplaceId);
      setWorkplaceMutation.mutate(selectedWorkplaceId);
    } else {
      toast({
        title: "No Selection",
        description: `Please select a ${effectiveUserRole === 'pharmacist' ? 'pharmacy' : 'workplace'} first.`,
        variant: "destructive",
      });
    }
  };

  // Get the appropriate display fields based on role
  const getWorkplaceDisplayInfo = (workplace: Workplace) => {
    if (effectiveUserRole === 'pharmacist') {
      return {
        title: workplace.name,
        subtitle: workplace.address ? `${workplace.address}, ${workplace.city || ''}` : workplace.city || '',
        extra: workplace.phone || ''
      };
    } else if (effectiveUserRole === 'doctor') {
      return {
        title: workplace.name,
        subtitle: workplace.city || '',
        extra: workplace.license_number ? `License: ${workplace.license_number}` : ''
      };
    }
    
    return { title: workplace.name, subtitle: '', extra: '' };
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Loading {effectiveUserRole === 'pharmacist' ? 'pharmacies' : 'workplaces'}...</div>
        ) : (
          <div className="space-y-4">
            {workplaces && workplaces.length > 0 ? (
              <div className="grid gap-4">
                {workplaces.map(workplace => {
                  const { title, subtitle, extra } = getWorkplaceDisplayInfo(workplace);
                  return (
                    <div 
                      key={workplace.id}
                      className={`p-4 border rounded-md cursor-pointer transition-colors ${
                        selectedWorkplaceId === workplace.id ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                      }`}
                      onClick={() => handleSelectWorkplace(workplace.id)}
                    >
                      <h3 className="font-medium">{title}</h3>
                      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                      {extra && <p className="text-sm">{extra}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p>No {effectiveUserRole === 'pharmacist' ? 'pharmacies' : 'workplaces'} found. Please contact support.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => {
          if (onComplete) onComplete();
          else navigate('/');
        }}>
          Skip for now
        </Button>
        <Button 
          onClick={handleConfirmSelection}
          disabled={!selectedWorkplaceId || setWorkplaceMutation.isPending}
        >
          {setWorkplaceMutation.isPending ? "Saving..." : "Confirm Selection"}
        </Button>
      </div>
    </div>
  );
};

export default WorkplaceSelection;
