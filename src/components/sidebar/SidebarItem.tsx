
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
      className={`flex items-center px-3 py-2 pl-10 rounded-md text-sm cursor-pointer ${
        isActive
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:bg-gray-100'
      }`}
    >
      {/* Use fixed width for icon and align center */}
      <div className="flex items-center" style={{ width: 28, minWidth: 28, justifyContent: "center" }}>
        {icon}
      </div>
      <span className="ml-3 flex-1 text-left">{label}</span>
    </div>
  );
};

export default SidebarItem;
