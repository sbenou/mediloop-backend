
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Profile, DoctorWorkplace } from '@/types/supabase';
import { Loader2 } from 'lucide-react';

interface Workplace {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

const DoctorWorkplaceSelection = () => {
  const { profile, user } = useAuth();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchWorkplaces();
    fetchCurrentWorkplace();
  }, [user?.id]);

  const fetchWorkplaces = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch all clinics/medical offices
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, city')
        .eq('role', 'clinic')
        .order('full_name');

      if (error) {
        throw error;
      }

      const formattedWorkplaces = data.map(workplace => ({
        id: workplace.id,
        name: workplace.full_name || 'Unnamed Clinic',
        city: workplace.city
      }));

      setWorkplaces(formattedWorkplaces);
    } catch (error) {
      console.error('Error fetching workplaces:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load workplaces."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentWorkplace = async () => {
    if (!user?.id) return;

    try {
      // Use edge function instead of direct query to avoid TypeScript issues
      const response = await fetch('https://hrrlefgnhkbzuwyklejj.functions.supabase.co/upsert-doctor-workplace', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch workplace');
      }
      
      const data = await response.json();
      if (data && data.workplace_id) {
        setSelectedWorkplaceId(data.workplace_id);
      }
    } catch (error) {
      console.error('Error fetching current workplace:', error);
    }
  };

  const handleWorkplaceChange = async (workplaceId: string) => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      setSelectedWorkplaceId(workplaceId);

      // Use the edge function instead of RPC
      const response = await fetch('https://hrrlefgnhkbzuwyklejj.functions.supabase.co/upsert-doctor-workplace', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          userId: user.id, 
          workplaceId: workplaceId 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown error occurred');
      }

      toast({
        title: "Success",
        description: "Workplace updated successfully."
      });
    } catch (error) {
      console.error('Error updating workplace:', error);
      // Revert selection on error
      fetchCurrentWorkplace();
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update workplace."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workplace Selection</CardTitle>
        <CardDescription>
          Choose the clinic or medical office where you practice.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Workplace</label>
              <Select
                value={selectedWorkplaceId || ''}
                onValueChange={handleWorkplaceChange}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a workplace" />
                </SelectTrigger>
                <SelectContent>
                  {workplaces.length > 0 ? (
                    workplaces.map((workplace) => (
                      <SelectItem key={workplace.id} value={workplace.id}>
                        {workplace.name} {workplace.city ? `(${workplace.city})` : ''}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No workplaces available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedWorkplaceId && (
              <div className="text-sm text-muted-foreground">
                Your selected workplace will appear on your prescriptions and patient documents.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorWorkplaceSelection;
