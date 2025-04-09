
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save, MapPin, Clock } from "lucide-react";
import DoctorInfo from "@/components/doctor/DoctorInfo";
import DoctorHours from "@/components/doctor/DoctorHours";
import DoctorMap from "@/components/doctor/DoctorMap";
import ProfessionalImageUpload from "@/components/pharmacy/profile/ProfessionalImageUpload";

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

interface DoctorProfileContentProps {
  doctorData: ProfileData;
  userId?: string;
  onLogoUpdate: (newLogoUrl: string) => void;
}

const DoctorProfileContent: React.FC<DoctorProfileContentProps> = ({
  doctorData,
  userId,
  onLogoUpdate
}) => {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);

  return (
    <div className="space-y-6">
      {/* Secondary Header */}
      <div className="flex items-center">
        <h2 className="text-2xl font-semibold">Doctor Profile</h2>
      </div>
      
      <Card className="flex items-center justify-center overflow-hidden">
        <CardContent className="p-0 w-full h-full">
          <ProfessionalImageUpload 
            entityId={doctorData.id}
            entityType="doctor"
            logoUrl={doctorData.logo_url} 
            onImageUpdate={onLogoUpdate}
            userId={userId}
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Doctor Information Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Doctor Information</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditingInfo(!isEditingInfo)}
            >
              {isEditingInfo ? (
                <Save className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <DoctorInfo 
              doctor={doctorData} 
              isEditing={isEditingInfo} 
              setIsEditing={setIsEditingInfo} 
            />
          </CardContent>
        </Card>
        
        {/* Consultation Hours Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary" />
              <CardTitle>Consultation Hours</CardTitle>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditingHours(!isEditingHours)}
            >
              {isEditingHours ? (
                <Save className="h-4 w-4" />
              ) : (
                <Edit className="h-4 w-4" />
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <DoctorHours 
              hours={doctorData.hours} 
              doctorId={doctorData.id}
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
          <DoctorMap doctor={doctorData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorProfileContent;
