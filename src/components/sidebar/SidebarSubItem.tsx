
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
      className={`flex items-center px-3 py-3.5 pl-14 text-sm cursor-pointer relative ${
        isActive
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:bg-gray-100'
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#9b87f5]"></div>
      )}
      <div className="flex items-center" style={{ width: 28, minWidth: 28, justifyContent: "center" }}>
        {icon}
      </div>
      <span className="ml-3 flex-1 text-left">{label}</span>
    </div>
  );
};

export default SidebarSubItem;
