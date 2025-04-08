
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { supabase } from "@/lib/supabase";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { fetchAllWorkplaces, updatePrimaryWorkplace } from '@/services/workplaceService';
import { Workplace, WorkplaceType } from '@/types/workplace';
import { Badge } from '@/components/ui/badge';

const workplaceTypeLabels: Record<WorkplaceType, string> = {
  cabinet: 'Cabinet',
  clinic: 'Clinic',
  hospital: 'Hospital',
  pharmacy: 'Pharmacy',
  other: 'Other'
};

const DoctorWorkplaceSelection = () => {
  const { profile, user } = useAuth();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [useMultipleWorkplaces, setUseMultipleWorkplaces] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('primary');
  const [selectedWorkplaces, setSelectedWorkplaces] = useState<string[]>([]);

  useEffect(() => {
    fetchWorkplacesData();
    fetchCurrentWorkplace();
    checkIfUsingMultipleWorkplaces();
  }, [user?.id]);

  const checkIfUsingMultipleWorkplaces = async () => {
    if (!user?.id) return;

    try {
      // For now, we'll just check if the user has more than one workplace
      // In the future, we can add a specific setting for this
      const { data, error } = await supabase
        .from('doctor_workplaces')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setUseMultipleWorkplaces(data && data.length > 1);
    } catch (error) {
      console.error('Error checking multiple workplaces setting:', error);
    }
  };

  const fetchWorkplacesData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Use the service function to fetch workplaces
      const workplacesData = await fetchAllWorkplaces();
      setWorkplaces(workplacesData);
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
      // Use edge function to get current workplace
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
        setSelectedWorkplaces([data.workplace_id]);
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
      
      // Use the service function to update workplace
      const success = await updatePrimaryWorkplace(user.id, workplaceId);
      
      if (!success) {
        throw new Error('Failed to update workplace');
      }

      toast({
        title: "Success",
        description: "Primary workplace updated successfully."
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

  const toggleMultipleWorkplaces = (checked: boolean) => {
    setUseMultipleWorkplaces(checked);
    // In the future, we'll save this preference to the database
    // For now, we'll just update the UI state
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const getWorkplaceTypeDisplay = (workplace: Workplace) => {
    if (!workplace.workplace_type) return null;
    
    const typeLabel = workplaceTypeLabels[workplace.workplace_type as WorkplaceType] || workplace.workplace_type;
    
    return (
      <Badge variant="outline" className="ml-2">
        {typeLabel}
      </Badge>
    );
  };

  const renderPrimaryWorkplaceTab = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Primary Workplace</label>
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
                  {getWorkplaceTypeDisplay(workplace)}
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
  );

  const renderAdditionalWorkplacesTab = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground mb-4">
          Select additional workplaces where you practice. You will be able to switch between them when writing prescriptions.
        </p>

        {/* This would be replaced with a multi-select component in the future */}
        <div className="text-sm">
          This feature will be implemented in a future update. Currently, only the primary workplace is available.
        </div>
      </div>
    </div>
  );

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
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="multiple-workplaces" 
                checked={useMultipleWorkplaces} 
                onCheckedChange={toggleMultipleWorkplaces} 
              />
              <Label htmlFor="multiple-workplaces">I practice at multiple workplaces</Label>
            </div>

            {useMultipleWorkplaces ? (
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                  <TabsTrigger value="primary">Primary Workplace</TabsTrigger>
                  <TabsTrigger value="additional">Additional Workplaces</TabsTrigger>
                </TabsList>
                <TabsContent value="primary" className="pt-4">
                  {renderPrimaryWorkplaceTab()}
                </TabsContent>
                <TabsContent value="additional" className="pt-4">
                  {renderAdditionalWorkplacesTab()}
                </TabsContent>
              </Tabs>
            ) : (
              renderPrimaryWorkplaceTab()
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DoctorWorkplaceSelection;
