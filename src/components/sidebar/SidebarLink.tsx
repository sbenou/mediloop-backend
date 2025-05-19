
import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}

const SidebarLink = ({ icon, label, onClick, active = false }: SidebarLinkProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm w-full text-left",
        "transition-colors hover:bg-muted",
        active ? "bg-muted font-medium" : "text-muted-foreground"
      )}
    >
      <span className="flex shrink-0 items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </button>
  );
};

export default SidebarLink;
