
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, Phone, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import UserAvatar from "../user-menu/UserAvatar";
import { UserProfile } from "@/types/user";

interface PharmacyTeamProps {
  pharmacyId: string;
  entityType?: 'pharmacy' | 'doctor';
}

interface TeamMember extends UserProfile {
  teamRole?: string;
}

const PharmacyTeam = ({ pharmacyId, entityType = 'pharmacy' }: PharmacyTeamProps) => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, [pharmacyId]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (entityType === 'doctor') {
        // For doctors, just fetch their profile
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', pharmacyId)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setTeam([{
            ...data,
            teamRole: 'Primary Doctor'
          }]);
        }
      } else {
        // For pharmacies, fetch the team
        const { data, error } = await supabase
          .from('pharmacy_team_members')
          .select(`
            id,
            role,
            profiles:user_id(*)
          `)
          .eq('pharmacy_id', pharmacyId)
          .is('deleted_at', null);
        
        if (error) {
          throw error;
        }

        // Transform data to expected format
        const formattedTeam = data
          .filter(item => item.profiles) // Filter out any items without profile data
          .map(item => ({
            ...item.profiles,
            teamRole: item.role
          }));

        setTeam(formattedTeam);
      }
    } catch (err) {
      console.error("Error fetching team:", err);
      setError("Failed to load team members");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Team</CardTitle>
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
    <div className="container mx-auto px-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{entityType === 'doctor' ? 'Doctor' : 'Pharmacy'} Team</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : team.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.map((member) => (
                <div key={member.id} className="bg-white border rounded-md shadow-sm p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <UserAvatar 
                      userProfile={member} 
                    />
                    <div>
                      <h3 className="font-medium">{member.full_name || 'Team Member'}</h3>
                      <p className="text-sm text-muted-foreground">{member.teamRole || member.role || 'Staff'}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    {member.email && (
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${member.email}`} className="hover:underline">
                          {member.email}
                        </a>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${member.phone}`} className="hover:underline">
                          {member.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No team members found.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Team information will be displayed here when available.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyTeam;
