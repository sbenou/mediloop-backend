
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
import { 
  fetchAllWorkplaces, 
  fetchDoctorWorkplaces, 
  updatePrimaryWorkplace, 
  addDoctorWorkplace, 
  removeDoctorWorkplace 
} from '@/services/workplaceService';
import { Workplace, WorkplaceType } from '@/types/workplace';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const workplaceTypeLabels: Record<WorkplaceType, string> = {
  cabinet: 'Cabinet',
  clinic: 'Clinic',
  hospital: 'Hospital',
  pharmacy: 'Pharmacy',
  other: 'Other'
};

const DoctorWorkplaceSelection = () => {
  const { profile, user } = useAuth();
  const [allWorkplaces, setAllWorkplaces] = useState<Workplace[]>([]);
  const [userWorkplaces, setUserWorkplaces] = useState<Workplace[]>([]);
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [useMultipleWorkplaces, setUseMultipleWorkplaces] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('primary');
  const [availableWorkplaces, setAvailableWorkplaces] = useState<Workplace[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [workplaceToAdd, setWorkplaceToAdd] = useState<string | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [workplaceToRemove, setWorkplaceToRemove] = useState<Workplace | null>(null);

  useEffect(() => {
    fetchWorkplacesData();
  }, [user?.id]);

  const fetchWorkplacesData = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Fetch all workplaces
      const workplacesData = await fetchAllWorkplaces();
      setAllWorkplaces(workplacesData);
      
      // Fetch the workplaces this doctor is associated with
      const doctorWorkplaces = await fetchDoctorWorkplaces(user.id);
      setUserWorkplaces(doctorWorkplaces);
      
      // Set selected workplace to the primary one
      const primaryWorkplace = doctorWorkplaces.find(w => w.is_primary);
      if (primaryWorkplace) {
        setSelectedWorkplaceId(primaryWorkplace.id);
      }
      
      // Set multiple workplaces flag based on association count
      setUseMultipleWorkplaces(doctorWorkplaces.length > 1);
      
      // Calculate available workplaces (those not already associated)
      const doctorWorkplaceIds = new Set(doctorWorkplaces.map(w => w.id));
      setAvailableWorkplaces(workplacesData.filter(w => !doctorWorkplaceIds.has(w.id)));
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

  const handlePrimaryWorkplaceChange = async (workplaceId: string) => {
    if (!user?.id) return;
    
    try {
      setIsSaving(true);
      setSelectedWorkplaceId(workplaceId);
      
      // Update the primary workplace
      const success = await updatePrimaryWorkplace(user.id, workplaceId);
      
      if (!success) {
        throw new Error('Failed to update primary workplace');
      }

      // Refresh the workplace data
      await fetchWorkplacesData();

      toast({
        title: "Success",
        description: "Primary workplace updated successfully."
      });
    } catch (error) {
      console.error('Error updating primary workplace:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update workplace."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWorkplace = async () => {
    if (!user?.id || !workplaceToAdd) return;
    
    try {
      setIsSaving(true);
      
      // If this is the first workplace, make it primary
      const isPrimary = userWorkplaces.length === 0;
      
      // Add the workplace
      const success = await addDoctorWorkplace(user.id, workplaceToAdd, isPrimary);
      
      if (!success) {
        throw new Error('Failed to add workplace');
      }

      // Refresh the workplace data
      await fetchWorkplacesData();

      toast({
        title: "Success",
        description: "Workplace added successfully."
      });
      
      // Close the dialog
      setAddDialogOpen(false);
      setWorkplaceToAdd(null);
    } catch (error) {
      console.error('Error adding workplace:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add workplace."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveWorkplace = async () => {
    if (!user?.id || !workplaceToRemove) return;
    
    try {
      setIsSaving(true);
      
      // Remove the workplace
      const success = await removeDoctorWorkplace(user.id, workplaceToRemove.id);
      
      if (!success) {
        throw new Error('Failed to remove workplace');
      }

      // Refresh the workplace data
      await fetchWorkplacesData();

      toast({
        title: "Success",
        description: "Workplace removed successfully."
      });
      
      // Close the dialog
      setRemoveDialogOpen(false);
      setWorkplaceToRemove(null);
    } catch (error: any) {
      console.error('Error removing workplace:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove workplace."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMultipleWorkplaces = (checked: boolean) => {
    setUseMultipleWorkplaces(checked);
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
          onValueChange={handlePrimaryWorkplaceChange}
          disabled={isSaving}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a workplace" />
          </SelectTrigger>
          <SelectContent>
            {userWorkplaces.length > 0 ? (
              userWorkplaces.map((workplace) => (
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
          Your selected primary workplace will appear on your prescriptions and patient documents.
        </div>
      )}
    </div>
  );

  const renderAdditionalWorkplacesTab = () => (
    <div className="space-y-4">
      <div className="mt-2 mb-6">
        <p className="text-sm text-muted-foreground">
          Manage additional workplaces where you practice. You will be able to switch between them when writing prescriptions.
        </p>
      </div>

      {/* List of current workplaces */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Your Workplaces</h3>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Add Workplace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Workplace</DialogTitle>
                <DialogDescription>
                  Select a workplace to add to your practice locations.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <Select
                  value={workplaceToAdd || ''}
                  onValueChange={setWorkplaceToAdd}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a workplace" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkplaces.length > 0 ? (
                      availableWorkplaces.map((workplace) => (
                        <SelectItem key={workplace.id} value={workplace.id}>
                          {workplace.name} {workplace.city ? `(${workplace.city})` : ''} 
                          {getWorkplaceTypeDisplay(workplace)}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No additional workplaces available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleAddWorkplace} 
                  disabled={!workplaceToAdd || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : 'Add Workplace'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3">
          {userWorkplaces.map(workplace => (
            <div 
              key={workplace.id} 
              className="p-3 border rounded-lg flex justify-between items-center"
            >
              <div>
                <div className="font-medium flex items-center">
                  {workplace.name}
                  {workplace.is_primary && (
                    <Badge variant="secondary" className="ml-2">Primary</Badge>
                  )}
                  {getWorkplaceTypeDisplay(workplace)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {workplace.address}, {workplace.city} {workplace.postal_code}
                </div>
              </div>

              <div className="flex space-x-2">
                {!workplace.is_primary && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setWorkplaceToRemove(workplace);
                      setRemoveDialogOpen(true);
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {userWorkplaces.length === 0 && (
            <div className="p-8 text-center border rounded-md border-dashed">
              <p className="text-sm text-muted-foreground">
                You haven't added any workplaces yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Confirmation dialog for removing a workplace
  const RemoveWorkplaceDialog = () => (
    <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove Workplace</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this workplace from your practice locations?
            This won't delete the workplace itself.
          </DialogDescription>
        </DialogHeader>

        {workplaceToRemove && (
          <div className="py-4">
            <div className="p-3 border rounded-lg">
              <div className="font-medium">{workplaceToRemove.name}</div>
              <div className="text-sm text-muted-foreground">
                {workplaceToRemove.address}, {workplaceToRemove.city} {workplaceToRemove.postal_code}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="destructive"
            onClick={handleRemoveWorkplace} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : 'Remove Workplace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

        {/* Confirmation dialog for removing a workplace */}
        <RemoveWorkplaceDialog />
      </CardContent>
    </Card>
  );
};

export default DoctorWorkplaceSelection;
