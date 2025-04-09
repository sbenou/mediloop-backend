
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Store, MoreVertical } from "lucide-react";
import PharmacyInfo from "@/components/pharmacy/PharmacyInfo";
import PharmacyHours from "@/components/pharmacy/PharmacyHours";
import PharmacyMap from "@/components/pharmacy/PharmacyMap";
import ProfessionalImageUpload from "./ProfessionalImageUpload";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ProfileData {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  hours: string | null;
  logo_url?: string | null;
  email?: string;
}

interface PharmacyProfileContentProps {
  pharmacyData: ProfileData;
  userId?: string;
  onLogoUpdate: (newLogoUrl: string) => void;
}

const PharmacyProfileContent: React.FC<PharmacyProfileContentProps> = ({
  pharmacyData,
  userId,
  onLogoUpdate
}) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);

  return (
    <div className="space-y-6">
      {/* Secondary Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Pharmacy Profile</h3>
      </div>
      
      <Card className="flex items-center justify-center overflow-hidden">
        <CardContent className="p-0 w-full h-full">
          <ProfessionalImageUpload 
            entityId={pharmacyData.id}
            entityType="pharmacy"
            logoUrl={pharmacyData.logo_url} 
            onImageUpdate={onLogoUpdate}
            userId={userId}
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pharmacy Information Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Store className="h-5 w-5 text-primary" />
              <CardTitle>Pharmacy Information</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditingInfo(!isEditingInfo)}>
                  {isEditingInfo ? "Cancel Edit" : "Edit Information"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <PharmacyInfo 
              pharmacy={pharmacyData} 
              isEditing={isEditingInfo} 
              setIsEditing={setIsEditingInfo} 
            />
          </CardContent>
        </Card>
        
        {/* Opening Hours Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle>Opening Hours</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditingHours(!isEditingHours)}>
                  {isEditingHours ? "Cancel Edit" : "Edit Hours"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <PharmacyHours 
              hours={pharmacyData.hours} 
              pharmacyId={pharmacyData.id}
              isEditing={isEditingHours}
              setIsEditing={setIsEditingHours}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Location Card */}
      <Card>
        <CardHeader className="flex flex-row items-center">
          <MapPin className="h-5 w-5 mr-2 text-primary" />
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent>
          <PharmacyMap pharmacy={pharmacyData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PharmacyProfileContent;
