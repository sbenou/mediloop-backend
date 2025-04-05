
import React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ViewAllActivitiesButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-auto pt-4 border-t">
      <Button 
        variant="ghost" 
        className="w-full justify-between"
        onClick={() => navigate("/activities")}
      >
        View all activities
        <ExternalLink className="h-4 w-4" />
      </Button>
    </div>
  );
};
