
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
      className={`flex items-center px-3 py-2 pl-13 rounded-md text-sm cursor-pointer ${
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

export default SidebarSubItem;
