
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertCircle, UserPlus, PenSquare, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import UserAvatar from "../user-menu/UserAvatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/auth/useAuth";
import { UserProfile } from "@/types/user";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";

interface StaffProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
}

interface StaffMember {
  id: string;
  user: StaffProfile;
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
      const { data, error: queryError } = await supabase
        .from('pharmacy_team_members')
        .select(`
          id,
          role,
          user_id,
          pharmacy_id
        `)
        .eq('pharmacy_id', pharmacyId)
        .is('deleted_at', null);

      if (queryError) {
        console.error("Error fetching staff:", queryError);
        setError("Failed to load staff members");
        setLoading(false);
        return;
      }
      
      if (!data || data.length === 0) {
        setStaff([]);
        setLoading(false);
        return;
      }

      // Now fetch the user profiles separately
      const userIds = data.map(item => item.user_id).filter(Boolean);
      
      if (userIds.length === 0) {
        setStaff([]);
        setLoading(false);
        return;
      }
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role,
          avatar_url
        `)
        .in('id', userIds);
        
      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        setError("Failed to load staff profiles");
        setLoading(false);
        return;
      }
      
      // Map profiles to team members
      const formattedStaff = data.map(member => {
        const userProfile = profiles?.find(profile => profile.id === member.user_id);
        
        if (!userProfile) return null;
        
        return {
          id: member.id,
          role: member.role,
          user: {
            id: userProfile.id,
            full_name: userProfile.full_name,
            email: userProfile.email,
            role: userProfile.role,
            avatar_url: userProfile.avatar_url
          }
        };
      }).filter(Boolean) as StaffMember[];
        
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <UserAvatar 
                        userProfile={{
                          id: member.user.id,
                          full_name: member.user.full_name || '',
                          avatar_url: member.user.avatar_url,
                          role: member.user.role || '',
                          role_id: null, // Adding missing required properties
                          email: member.user.email,
                          date_of_birth: null,
                          city: null,
                          auth_method: null,
                          is_blocked: null,
                          doctor_stamp_url: null,
                          doctor_signature_url: null,
                          cns_card_front: null,
                          cns_card_back: null,
                          cns_number: null,
                          deleted_at: null,
                          created_at: null,
                          updated_at: null,
                          license_number: null
                        }} 
                      />
                      <span>{member.user.full_name || 'Unnamed Staff'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
