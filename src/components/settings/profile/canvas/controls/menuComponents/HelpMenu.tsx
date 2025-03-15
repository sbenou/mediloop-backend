
import React from 'react';
import { MenubarItem } from "@/components/ui/menubar";
import { ShieldQuestion } from "lucide-react";

const HelpMenu: React.FC = () => {
  return (
    <MenubarItem>
      <ShieldQuestion className="mr-2 h-4 w-4" />
      How to use
    </MenubarItem>
  );
};

export default HelpMenu;
