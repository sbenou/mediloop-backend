
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, UserPlus, PenSquare, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import UserAvatar from "../user-menu/UserAvatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/auth/useAuth";

interface User {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
}

interface StaffMember {
  id: string;
  user: User;
  role: string;
}

interface PharmacyStaffProps {
  pharmacyId: string;
}

const PharmacyStaff = ({ pharmacyId }: PharmacyStaffProps) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();

  useEffect(() => {
    fetchStaff();
  }, [pharmacyId]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In doctor mode, there's no real staff, so we can just show the doctor
      if (profile?.role === 'doctor') {
        if (profile) {
          setStaff([{
            id: 'self',
            user: {
              id: profile.id,
              full_name: profile.full_name,
              email: profile.email,
              role: 'doctor',
              avatar_url: profile.avatar_url
            },
            role: 'Primary Doctor'
          }]);
        }
        setLoading(false);
        return;
      }

      // For pharmacy, fetch actual staff
      const { data, error } = await supabase
        .from('pharmacy_team_members')
        .select(`
          id,
          role,
          profiles:user_id(
            id,
            full_name,
            email,
            role,
            avatar_url
          )
        `)
        .eq('pharmacy_id', pharmacyId)
        .is('deleted_at', null);

      if (error) {
        console.error("Error fetching staff:", error);
        setError("Failed to load staff members");
        return;
      }
      
      // Transform the data to match our expected format
      const formattedStaff = data
        .filter(item => item.profiles) // Ensure we have valid profile data
        .map(item => ({
          id: item.id,
          role: item.role,
          user: {
            id: item.profiles.id,
            full_name: item.profiles.full_name,
            email: item.profiles.email,
            role: item.profiles.role,
            avatar_url: item.profiles.avatar_url
          }
        }));
        
      setStaff(formattedStaff);
    } catch (err) {
      console.error("Error in staff fetch:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = () => {
    // Add staff functionality would go here
    toast({
      title: "Coming Soon",
      description: "Staff management functionality is under development."
    });
  };

  const handleEditStaff = (id: string) => {
    // Edit staff functionality would go here
    toast({
      title: "Coming Soon",
      description: "Staff editing functionality is under development."
    });
  };

  const handleRemoveStaff = async (id: string) => {
    if (id === 'self') {
      toast({
        variant: "destructive",
        title: "Cannot Remove",
        description: "You cannot remove yourself from the staff."
      });
      return;
    }
    
    try {
      // For now, we'll use soft delete via a Supabase function
      const { error } = await supabase.rpc('soft_delete_team_member', {
        member_id: id
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Staff member has been removed."
      });
      
      // Refresh the staff list
      fetchStaff();
    } catch (err) {
      console.error("Error removing staff:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove staff member."
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Staff Management</CardTitle>
        <Button onClick={handleAddStaff} variant="outline" size="sm" className="h-8">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Staff
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {staff.length > 0 ? (
          <div className="space-y-4">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <UserAvatar 
                    userProfile={{
                      id: member.user.id,
                      full_name: member.user.full_name || '',
                      avatar_url: member.user.avatar_url,
                      role: member.user.role || ''
                    }} 
                  />
                  <div>
                    <p className="font-medium">{member.user.full_name || 'Unnamed Staff'}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <p className="text-xs text-muted-foreground">{member.user.email}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditStaff(member.id)}
                    title="Edit staff member"
                  >
                    <PenSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveStaff(member.id)}
                    title="Remove staff member"
                    className="hover:text-red-500"
                    disabled={member.id === 'self'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No staff members found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click the "Add Staff" button to invite team members.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PharmacyStaff;
