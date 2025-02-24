import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';

const ConnectionMenu = () => {
  const { t } = useTranslation();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="text-primary hover:text-primary/80 transition-colors">
        Connection
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/login?role=patient" className="w-full">
            I am a patient
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/login?role=pharmacist" className="w-full">
            I am a pharmacist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/login?role=doctor" className="w-full">
            I am a doctor
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/login?role=delivery" className="w-full">
            I am a delivery man
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ConnectionMenu;