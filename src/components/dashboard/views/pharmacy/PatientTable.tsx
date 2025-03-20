import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecoilValue } from 'recoil';
import { userAvatarState } from '@/store/user/atoms';

interface PatientTableProps {
  patients: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
  }>;
  isLoading: boolean;
  onViewPatient: (patientId: string) => void;
  limit?: number;
}

const PatientTable: React.FC<PatientTableProps> = ({ 
  patients, 
  isLoading, 
  onViewPatient,
  limit 
}) => {
  // Get user avatar from Recoil state
  const userAvatar = useRecoilValue(userAvatarState);
  
  // Split full name into first and last name
  const getNameParts = (fullName: string) => {
    const parts = fullName ? fullName.split(' ') : ['', ''];
    const lastName = parts.length > 1 ? parts.pop() || '' : '';
    const firstName = parts.join(' ');
    return { firstName, lastName };
  };

  const displayPatients = limit ? patients.slice(0, limit) : patients;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Avatar</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <Skeleton className="h-8 w-full mx-auto" />
              </TableCell>
            </TableRow>
          ) : displayPatients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No patients found.
              </TableCell>
            </TableRow>
          ) : (
            displayPatients.map((patient) => {
              const { firstName, lastName } = getNameParts(patient.full_name || '');
              
              // Determine which avatar URL to use
              // If this patient is the logged-in user (matches ID in avatar URL), use global avatar
              const avatarUrl = userAvatar && 
                userAvatar.includes(`/${patient.id}/`) ? 
                userAvatar : patient.avatar_url;
                
              return (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl || undefined} alt={patient.full_name || 'Patient'} />
                      <AvatarFallback>{firstName.charAt(0)}{lastName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>{firstName}</TableCell>
                  <TableCell>{lastName}</TableCell>
                  <TableCell>{new Date(patient.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewPatient(patient.id)}
                      className="text-primary"
                    >
                      View
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default PatientTable;
