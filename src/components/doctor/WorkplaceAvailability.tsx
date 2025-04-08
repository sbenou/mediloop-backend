
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase';
import { fetchDoctorWorkplaces } from '@/services/workplaceService';
import { Workplace } from '@/types/workplace';
import { Loader2, Clock, Plus, Save, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Availability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  workplace_id: string;
  doctor_id: string;
}

const daysOfWeek = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const WorkplaceAvailability: React.FC = () => {
  const { user } = useAuth();
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string>('');
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load workplaces and availabilities
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Fetch doctor's workplaces
        const workplaceData = await fetchDoctorWorkplaces(user.id);
        setWorkplaces(workplaceData);
        
        // Set default selected workplace to primary
        const primaryWorkplace = workplaceData.find(w => w.is_primary);
        if (primaryWorkplace) {
          setSelectedWorkplaceId(primaryWorkplace.id);
          await loadAvailabilities(primaryWorkplace.id);
        }
      } catch (error) {
        console.error('Error loading workplace data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load workplace data',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user?.id]);

  // Load availabilities for a specific workplace
  const loadAvailabilities = async (workplaceId: string) => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('workplace_id', workplaceId)
        .order('day_of_week')
        .order('start_time');
        
      if (error) throw error;
      
      // Transform data to match our Availability interface
      const formattedData: Availability[] = (data || []).map(item => ({
        id: item.id,
        day_of_week: item.day_of_week,
        start_time: item.start_time || '',
        end_time: item.end_time || '',
        workplace_id: workplaceId,
        doctor_id: user.id,
      }));
      
      setAvailabilities(formattedData);
    } catch (error) {
      console.error('Error loading availabilities:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load availability data',
      });
    }
  };

  // Handle workplace change
  const handleWorkplaceChange = async (workplaceId: string) => {
    setSelectedWorkplaceId(workplaceId);
    await loadAvailabilities(workplaceId);
  };

  // Add new availability slot
  const addAvailability = () => {
    if (!user?.id || !selectedWorkplaceId) return;
    
    const newAvailability: Availability = {
      day_of_week: 1, // Monday as default
      start_time: '09:00',
      end_time: '17:00',
      workplace_id: selectedWorkplaceId,
      doctor_id: user.id,
    };
    
    setAvailabilities([...availabilities, newAvailability]);
  };

  // Remove an availability slot
  const removeAvailability = (index: number) => {
    const updatedAvailabilities = [...availabilities];
    updatedAvailabilities.splice(index, 1);
    setAvailabilities(updatedAvailabilities);
  };

  // Update availability field
  const updateAvailability = (index: number, field: keyof Availability, value: any) => {
    const updatedAvailabilities = [...availabilities];
    updatedAvailabilities[index] = {
      ...updatedAvailabilities[index],
      [field]: value,
    };
    setAvailabilities(updatedAvailabilities);
  };

  // Save availabilities
  const saveAvailabilities = async () => {
    if (!user?.id || !selectedWorkplaceId) return;
    
    setIsSaving(true);
    try {
      // Prepare data for upsert
      const toUpsert = availabilities.map(a => ({
        id: a.id, // If existing, will update; if new, will be inserted
        day_of_week: a.day_of_week,
        start_time: a.start_time,
        end_time: a.end_time,
        workplace_id: a.workplace_id,
        doctor_id: a.doctor_id,
      }));
      
      // Get IDs of current availabilities to find deleted ones
      const currentIds = availabilities
        .filter(a => a.id)
        .map(a => a.id) as string[];
        
      // Delete removed availabilities
      if (currentIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('doctor_availability')
          .delete()
          .eq('doctor_id', user.id)
          .eq('workplace_id', selectedWorkplaceId)
          .not('id', 'in', `(${currentIds.join(',')})`);
          
        if (deleteError) throw deleteError;
      }
      
      // Upsert current availabilities
      const { error: upsertError } = await supabase
        .from('doctor_availability')
        .upsert(toUpsert);
        
      if (upsertError) throw upsertError;
      
      // Reload data
      await loadAvailabilities(selectedWorkplaceId);
      
      toast({
        title: 'Success',
        description: 'Availability schedule saved successfully',
      });
    } catch (error) {
      console.error('Error saving availabilities:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save availability schedule',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workplace Availability</CardTitle>
          <CardDescription>Set your availability schedule for each workplace</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-primary" />
          <CardTitle>Workplace Availability</CardTitle>
        </div>
        <CardDescription>Set your availability schedule for each workplace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Workplace Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Workplace</label>
            <Select
              value={selectedWorkplaceId}
              onValueChange={handleWorkplaceChange}
              disabled={workplaces.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a workplace" />
              </SelectTrigger>
              <SelectContent>
                {workplaces.map(workplace => (
                  <SelectItem key={workplace.id} value={workplace.id}>
                    {workplace.name}
                    {workplace.is_primary && (
                      <Badge variant="secondary" className="ml-2">Primary</Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedWorkplaceId && (
            <>
              {/* Availability Schedule */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Availability Schedule</h3>
                  <Button 
                    onClick={addAvailability} 
                    size="sm" 
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Time Slot
                  </Button>
                </div>
                
                {availabilities.length > 0 ? (
                  <div className="space-y-3">
                    {availabilities.map((availability, index) => (
                      <div 
                        key={availability.id || index} 
                        className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center p-3 border rounded-md"
                      >
                        <Select
                          value={availability.day_of_week.toString()}
                          onValueChange={(value) => updateAvailability(index, 'day_of_week', parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map(day => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="time"
                          value={availability.start_time}
                          onChange={(e) => updateAvailability(index, 'start_time', e.target.value)}
                          className="w-32"
                        />
                        
                        <Input
                          type="time"
                          value={availability.end_time}
                          onChange={(e) => updateAvailability(index, 'end_time', e.target.value)}
                          className="w-32"
                        />
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeAvailability(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center border rounded-md border-dashed">
                    <p className="text-sm text-muted-foreground mb-2">No availability set for this workplace</p>
                    <Button 
                      onClick={addAvailability} 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add Time Slot
                    </Button>
                  </div>
                )}
                
                {availabilities.length > 0 && (
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={saveAvailabilities}
                      disabled={isSaving}
                      className="flex items-center gap-1"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Schedule
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
          
          {workplaces.length === 0 && (
            <div className="p-8 text-center border rounded-md border-dashed">
              <p className="text-sm text-muted-foreground mb-2">No workplaces added yet</p>
              <p className="text-xs text-muted-foreground">
                Add a workplace in the Workplace Selection section first
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkplaceAvailability;
