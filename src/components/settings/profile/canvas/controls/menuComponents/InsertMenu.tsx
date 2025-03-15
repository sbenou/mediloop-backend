
import React from 'react';
import { MenubarItem, MenubarSeparator } from "@/components/ui/menubar";
import { Square, Circle, Minus, Type, CalendarDays, CheckSquare } from "lucide-react";

interface InsertMenuProps {
  handleAddShape: (shape: 'circle' | 'rectangle' | 'line') => void;
  handleAddText: () => void;
  handleAddDateField?: () => void;
  handleAddCheckbox?: (checked: boolean) => void;
}

const InsertMenu: React.FC<InsertMenuProps> = ({
  handleAddShape,
  handleAddText,
  handleAddDateField,
  handleAddCheckbox
}) => {
  return (
    <>
      <MenubarItem onClick={() => handleAddShape('rectangle')}>
        <Square className="mr-2 h-4 w-4" />
        Rectangle
      </MenubarItem>
      <MenubarItem onClick={() => handleAddShape('circle')}>
        <Circle className="mr-2 h-4 w-4" />
        Circle
      </MenubarItem>
      <MenubarItem onClick={() => handleAddShape('line')}>
        <Minus className="mr-2 h-4 w-4" />
        Line
      </MenubarItem>
      <MenubarItem onClick={handleAddText}>
        <Type className="mr-2 h-4 w-4" />
        Text
      </MenubarItem>
      <MenubarSeparator />
      {handleAddDateField && (
        <MenubarItem onClick={handleAddDateField}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Date Field
        </MenubarItem>
      )}
      {handleAddCheckbox && (
        <>
          <MenubarItem onClick={() => handleAddCheckbox(false)}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Checkbox (Unchecked)
          </MenubarItem>
          <MenubarItem onClick={() => handleAddCheckbox(true)}>
            <CheckSquare className="mr-2 h-4 w-4 text-primary" />
            Checkbox (Checked)
          </MenubarItem>
        </>
      )}
    </>
  );
};

export default InsertMenu;
