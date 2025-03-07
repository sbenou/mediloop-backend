
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
      {icon}
      {label}
    </div>
  );
};

export default SidebarItem;
