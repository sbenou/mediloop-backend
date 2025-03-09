import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  is_blocked: boolean | null;
  is_active?: boolean;
  joined_date?: string;
  pharmacy_name: string | null;
  pharmacy_logo_url: string | null;
}

interface PharmacyStaffProps {
  pharmacyId: string;
}

const PharmacyStaff = ({ pharmacyId }: PharmacyStaffProps) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPharmacyStaff();
  }, [pharmacyId]);

  const fetchPharmacyStaff = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_pharmacies')
        .select(`
          user_id,
          profiles:user_id (
            id, 
            full_name, 
            email, 
            avatar_url, 
            role,
            is_blocked,
            pharmacy_name,
            pharmacy_logo_url
          )
        `)
        .eq('pharmacy_id', pharmacyId);

      if (error) {
        console.error('Error fetching pharmacy staff:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load pharmacy staff",
        });
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        // Transform the data to match StaffMember interface
        const staffMembers: StaffMember[] = data
          .filter(item => item.profiles && typeof item.profiles === 'object')
          .map(item => {
            const profile = item.profiles as any;
            return {
              id: profile.id || '',
              user_id: item.user_id || '',
              full_name: profile.full_name || '',
              email: profile.email || '',
              avatar_url: profile.avatar_url || null,
              role: profile.role || '',
              is_blocked: profile.is_blocked || false,
              pharmacy_name: profile.pharmacy_name || null,
              pharmacy_logo_url: profile.pharmacy_logo_url || null
            };
          });
        
        setStaffMembers(staffMembers);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchPharmacyStaff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading staff",
      });
      setIsLoading(false);
    }
  };

  const handleRemoveStaff = async (userId: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('user_pharmacies')
        .delete()
        .eq('user_id', userId)
        .eq('pharmacy_id', pharmacyId);

      if (error) {
        console.error('Error removing staff:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove staff member",
        });
      } else {
        toast({
          title: "Success",
          description: "Staff member removed successfully",
        });
        fetchPharmacyStaff(); // Refresh staff list
      }
    } catch (error) {
      console.error('Error in handleRemoveStaff:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while removing staff",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staffMembers.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search staff by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading staff...
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableCaption>A list of staff members in your pharmacy.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell className="font-medium">{member.full_name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{member.role}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveStaff(member.user_id)}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PharmacyStaff;
