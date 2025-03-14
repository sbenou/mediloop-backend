
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UserPlus, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { TeamMemberDialog } from "./team/TeamMemberDialog";
import { usePharmacyTeam } from "./team/usePharmacyTeam";

interface PharmacyStaffProps {
  pharmacyId: string;
  entityType?: 'doctor' | 'pharmacy';
}

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
}

const PharmacyStaff: React.FC<PharmacyStaffProps> = ({ pharmacyId, entityType = 'pharmacy' }) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    addUserOpen,
    setAddUserOpen,
    handleAddMember,
    phoneValue,
    setPhoneValue,
    nokPhoneValue,
    setNokPhoneValue,
    teamMembers,
  } = usePharmacyTeam(pharmacyId);

  useEffect(() => {
    // Use the team members data from the hook since it's already loaded
    if (teamMembers.length > 0) {
      setStaffMembers(teamMembers);
      setLoading(false);
    } else {
      fetchStaffMembers();
    }
  }, [teamMembers]);

  const fetchStaffMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_pharmacies')
        .select('user_id')
        .eq('pharmacy_id', pharmacyId);

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(item => item.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, is_blocked')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        if (profilesData) {
          const members = profilesData.map(profile => ({
            id: profile.id,
            full_name: profile.full_name || 'Unknown',
            email: profile.email || 'No email',
            role: profile.role || 'N/A',
            is_active: !profile.is_blocked,
          }));
          setStaffMembers(members);
        }
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load staff members",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: string) => {
    toast({
      title: "View Staff Member",
      description: `Viewing staff member with ID: ${id}`,
    });
  };

  const handleEdit = (id: string) => {
    toast({
      title: "Edit Staff Member",
      description: `Editing staff member with ID: ${id}`,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      // Just showing a toast for now, but would implement actual deletion logic
      toast({
        title: "Success",
        description: "Staff member terminated successfully (mock)",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to terminate staff member",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Staff Management</h3>
        <Button onClick={() => setAddUserOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : staffMembers.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No staff members found</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">{staff.full_name}</TableCell>
                  <TableCell>{staff.email}</TableCell>
                  <TableCell>{staff.role}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${staff.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {staff.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button onClick={() => handleView(staff.id)} size="icon" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleEdit(staff.id)} size="icon" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => handleDelete(staff.id)} size="icon" variant="ghost" className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TeamMemberDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        onSubmit={handleAddMember}
        phoneValue={phoneValue}
        setPhoneValue={setPhoneValue}
        nokPhoneValue={nokPhoneValue}
        setNokPhoneValue={setNokPhoneValue}
        entityType={entityType}
      />
    </div>
  );
};

export default PharmacyStaff;
