
import { ReactNode } from "react";

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
}

const SidebarSection = ({ title, children }: SidebarSectionProps) => {
  return (
    <>
      <div className="px-3 mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-left">{title}</p>
      </div>
      <nav className="space-y-1 px-2">
        {children}
      </nav>
    </>
  );
};

export default SidebarSection;
