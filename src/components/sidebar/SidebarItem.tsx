
import { ReactNode } from "react";

interface SidebarItemProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem = ({ icon, label, isActive, onClick }: SidebarItemProps) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-3 py-2 rounded-md text-sm cursor-pointer ${
        isActive
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:bg-gray-100'
      }`}
    >
      <div className="flex items-center w-full space-x-4">
        <div className="flex items-center">
          {icon}
        </div>
        <span className="flex-1">{label}</span>
      </div>
    </div>
  );
};

export default SidebarItem;
