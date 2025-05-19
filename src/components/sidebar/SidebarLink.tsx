
import React from "react";

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  icon,
  label,
  onClick,
  active = false,
}) => {
  return (
    <button
      className={`flex items-center w-full px-3 py-2 text-sm rounded-md transition-colors ${
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      }`}
      onClick={onClick}
    >
      <div className="mr-3">{icon}</div>
      <span>{label}</span>
    </button>
  );
};

export default SidebarLink;
