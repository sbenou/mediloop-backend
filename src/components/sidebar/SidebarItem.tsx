
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
      className={`flex items-center px-3 py-2 pl-10 text-sm cursor-pointer relative ${
        isActive
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:bg-gray-100'
      }`}
    >
      {/* Add vertical line for active state that spans full height */}
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#9b87f5]"></div>
      )}
      {/* Use fixed width for icon and align center */}
      <div className="flex items-center" style={{ width: 28, minWidth: 28, justifyContent: "center" }}>
        {icon}
      </div>
      <span className="ml-3 flex-1 text-left">{label}</span>
    </div>
  );
};

export default SidebarItem;
