
import { ReactNode } from "react";

interface SidebarSubItemProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarSubItem = ({ icon, label, isActive, onClick }: SidebarSubItemProps) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-3 py-2 rounded-md text-sm cursor-pointer ${
        isActive
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center">
        <div className="flex items-center mr-4">  {/* Increased margin from mr-3 to mr-4 */}
          {icon}
        </div>
        <span>{label}</span>
      </div>
    </div>
  );
};

export default SidebarSubItem;
