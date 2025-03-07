
import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarCollapsibleItemProps {
  icon: ReactNode;
  label: string;
  isOpen: boolean;
  isActive: boolean;
  children: ReactNode;
  onOpenChange: (isOpen: boolean) => void;
}

const SidebarCollapsibleItem = ({ 
  icon, 
  label, 
  isOpen, 
  isActive, 
  children, 
  onOpenChange 
}: SidebarCollapsibleItemProps) => {
  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={onOpenChange}
      className="w-full"
    >
      <CollapsibleTrigger className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-sm cursor-pointer ${
        isActive
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-muted-foreground hover:bg-gray-100'
      }`}>
        <div className="flex items-center">
          {icon}
          <span>{label}</span>
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-5 space-y-1 mt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SidebarCollapsibleItem;
