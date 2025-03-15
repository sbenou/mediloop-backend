
import React, { ReactNode } from 'react';
import { 
  MenubarMenu, 
  MenubarTrigger, 
  MenubarContent
} from "@/components/ui/menubar";

interface MenuSectionProps {
  title: string;
  children: ReactNode;
}

const MenuSection: React.FC<MenuSectionProps> = ({ title, children }) => {
  return (
    <MenubarMenu>
      <MenubarTrigger className="font-medium">{title}</MenubarTrigger>
      <MenubarContent>
        {children}
      </MenubarContent>
    </MenubarMenu>
  );
};

export default MenuSection;
