
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const ViewAllActivitiesButton: React.FC = () => {
  const navigate = useNavigate();
  
  const handleViewAll = () => {
    navigate("/activities");
  };
  
  return (
    <div className="p-3 mt-auto border-t">
      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleViewAll}
      >
        View all activities
      </Button>
    </div>
  );
};
