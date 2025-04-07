
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, MapPin, MoreVertical, Edit } from "lucide-react";
import PharmacyInfo from "@/components/pharmacy/PharmacyInfo";
import PharmacyHours from "@/components/pharmacy/PharmacyHours";
import PharmacyMap from "@/components/pharmacy/PharmacyMap";
import PharmacyImageUpload from "./PharmacyImageUpload";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface PharmacyData {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string | null;
  hours: string | null;
  logo_url?: string | null;
}

interface PharmacyProfileContentProps {
  pharmacyData: PharmacyData;
  userId?: string;
  onLogoUpdate: (url: string) => void;
}

const PharmacyProfileContent: React.FC<PharmacyProfileContentProps> = ({ 
  pharmacyData, 
  userId,
  onLogoUpdate
}) => {
  const [isPharmacyInfoEditing, setIsPharmacyInfoEditing] = useState(false);
  const [isHoursEditing, setIsHoursEditing] = useState(false);

  const handleEditPharmacyInfo = () => {
    setIsPharmacyInfoEditing(true);
    toast({
      title: "Edit Pharmacy Info",
      description: "You can now edit your pharmacy information"
    });
  };

  const handleEditHours = () => {
    setIsHoursEditing(true);
    toast({
      title: "Edit Opening Hours",
      description: "You can now edit your pharmacy opening hours"
    });
  };

  return (
    <ScrollArea className="h-[calc(100vh-300px)] pr-4">
      {/* Add consistent header at the top of content area */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Pharmacy Details</h3>
      </div>
      
      {/* Pharmacy Image Section */}
      <PharmacyImageUpload 
        pharmacyId={pharmacyData.id}
        logoUrl={pharmacyData.logo_url}
        onImageUpdate={onLogoUpdate}
        userId={userId}
      />

      {/* Pharmacy Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Pharmacy Details Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Pharmacy Information
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditPharmacyInfo}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Information
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription>
              Contact details and address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PharmacyInfo 
              pharmacy={pharmacyData} 
              isEditing={isPharmacyInfoEditing}
              setIsEditing={setIsPharmacyInfoEditing}
            />
          </CardContent>
        </Card>

        {/* Opening Hours */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Opening Hours
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditHours}>
                    <Edit className="h-4 w-4 mr-2" /> Edit Hours
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription>
              When your pharmacy is open
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PharmacyHours 
              hours={pharmacyData.hours} 
              pharmacyId={pharmacyData.id}
              isEditing={isHoursEditing}
              setIsEditing={setIsHoursEditing}
            />
          </CardContent>
        </Card>

        {/* Location Map */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5" />
              Location
            </CardTitle>
            <CardDescription>
              Pharmacy location on map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PharmacyMap pharmacy={pharmacyData} />
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default PharmacyProfileContent;
