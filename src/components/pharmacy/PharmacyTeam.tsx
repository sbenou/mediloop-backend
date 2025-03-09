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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreVertical, Edit, Trash2, UserPlus, UserMinus, AlertTriangle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import UserAvatar from "@/components/user-menu/UserAvatar";
import { UserProfile } from "@/types/user";

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
  is_blocked: boolean | null;
  is_active: boolean;
  joined_date: string;
  pharmacy_name: string | null;
  pharmacy_logo_url: string | null;
  role_id: string | null;
  date_of_birth: string | null;
  city: string | null;
  auth_method: string | null;
  doctor_stamp_url: string | null;
  doctor_signature_url: string | null;
  cns_card_front: string | null;
  cns_card_back: string | null;
  cns_number: string | null;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  license_number: string | null;
}

interface PharmacyTeamProps {
  pharmacyId: string;
}

const PharmacyTeam: React.FC<PharmacyTeamProps> = ({ pharmacyId }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isBlockingUser, setIsBlockingUser] = useState(false);
  const [userToBlock, setUserToBlock] = useState<TeamMember | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPharmacyUsers();
  }, [pharmacyId]);

  const fetchPharmacyUsers = async () => {
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
            pharmacy_logo_url,
            role_id,
            date_of_birth,
            city,
            auth_method,
            doctor_stamp_url,
            doctor_signature_url,
            cns_card_front,
            cns_card_back,
            cns_number,
            deleted_at,
            created_at,
            updated_at,
            license_number
          )
        `)
        .eq('pharmacy_id', pharmacyId);

      if (error) {
        console.error('Error fetching pharmacy users:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load pharmacy team members",
        });
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const teamMembers: TeamMember[] = data
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
              is_active: true,
              joined_date: new Date().toISOString(),
              pharmacy_name: profile.pharmacy_name || null,
              pharmacy_logo_url: profile.pharmacy_logo_url || null,
              role_id: profile.role_id || null,
              date_of_birth: profile.date_of_birth || null,
              city: profile.city || null,
              auth_method: profile.auth_method || null,
              doctor_stamp_url: profile.doctor_stamp_url || null,
              doctor_signature_url: profile.doctor_signature_url || null,
              cns_card_front: profile.cns_card_front || null,
              cns_card_back: profile.cns_card_back || null,
              cns_number: profile.cns_number || null,
              deleted_at: profile.deleted_at || null,
              created_at: profile.created_at || null,
              updated_at: profile.updated_at || null,
              license_number: profile.license_number || null
            };
          });
        
        setTeamMembers(teamMembers);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchPharmacyUsers:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while loading team members",
      });
      setIsLoading(false);
    }
  };

  const handleAddMember = async () => {
    setIsAddingMember(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newMemberEmail)
        .single();

      if (profileError) {
        console.error('Error checking profile:', profileError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check user profile",
        });
        return;
      }

      if (!profileData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User with this email does not exist",
        });
        return;
      }

      const { data: existingRelation, error: relationError } = await supabase
        .from('user_pharmacies')
        .select('*')
        .eq('user_id', profileData.id)
        .eq('pharmacy_id', pharmacyId)
        .maybeSingle();

      if (relationError) {
        console.error('Error checking existing relation:', relationError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check existing team relation",
        });
        return;
      }

      if (existingRelation) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User is already part of this pharmacy team",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from('user_pharmacies')
        .insert([{ user_id: profileData.id, pharmacy_id: pharmacyId }]);

      if (insertError) {
        console.error('Error adding member:', insertError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add user to the pharmacy team",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User added to the pharmacy team successfully",
      });

      fetchPharmacyUsers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while adding the user",
      });
    } finally {
      setIsAddingMember(false);
      setNewMemberEmail('');
    }
  };

  const handleBlockUser = (member: TeamMember) => {
    setIsBlockingUser(true);
    setUserToBlock(member);
  };

  const confirmBlockUser = async () => {
    if (!userToBlock) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: true })
        .eq('id', userToBlock.id);

      if (error) {
        console.error('Error blocking user:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to block user",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User blocked successfully",
      });

      fetchPharmacyUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while blocking the user",
      });
    } finally {
      setIsBlockingUser(false);
      setUserToBlock(null);
    }
  };

  const handleUnblockUser = async (member: TeamMember) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: false })
        .eq('id', member.id);

      if (error) {
        console.error('Error unblocking user:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to unblock user",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User unblocked successfully",
      });

      fetchPharmacyUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while unblocking the user",
      });
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    try {
      const { error } = await supabase
        .from('user_pharmacies')
        .delete()
        .eq('user_id', member.user_id)
        .eq('pharmacy_id', pharmacyId);

      if (error) {
        console.error('Error removing member:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove user from the pharmacy team",
        });
        return;
      }

      toast({
        title: "Success",
        description: "User removed from the pharmacy team successfully",
      });

      fetchPharmacyUsers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while removing the user",
      });
    }
  };

  if (isLoading) {
    return <p>Loading team members...</p>;
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Enter the email address of the user you want to add to the team.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleAddMember} disabled={isAddingMember}>
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableCaption>A list of your pharmacy team members.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.map((member) => (
            <TableRow key={member.user_id}>
              <TableCell>
                <UserAvatar userProfile={member} size="sm" />
              </TableCell>
              <TableCell>{member.full_name}</TableCell>
              <TableCell>{member.email}</TableCell>
              <TableCell>{member.role}</TableCell>
              <TableCell>
                {member.is_blocked ? (
                  <Badge variant="destructive">Blocked</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {member.is_blocked ? (
                      <DropdownMenuItem onClick={() => handleUnblockUser(member)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Unblock User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleBlockUser(member)}>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Block User
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleRemoveMember(member)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isBlockingUser} onOpenChange={setIsBlockingUser}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Are you sure you want to block this user? This will prevent them from accessing the pharmacy.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <p className="text-sm text-gray-500">
              This action is irreversible.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsBlockingUser(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmBlockUser}>
              Block User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PharmacyTeam;
