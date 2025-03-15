
import React from 'react';
import { MenubarItem, MenubarSeparator, MenubarCheckboxItem } from "@/components/ui/menubar";
import { RotateCcw, RotateCw, Grid } from "lucide-react";

interface EditMenuProps {
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  handleToggleGrid: () => void;
  showGrid: boolean;
}

const EditMenu: React.FC<EditMenuProps> = ({
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  handleToggleGrid,
  showGrid
}) => {
  return (
    <>
      <MenubarItem onClick={handleUndo} disabled={!canUndo}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Undo
      </MenubarItem>
      <MenubarItem onClick={handleRedo} disabled={!canRedo}>
        <RotateCw className="mr-2 h-4 w-4" />
        Redo
      </MenubarItem>
      <MenubarSeparator />
      <MenubarCheckboxItem checked={showGrid} onCheckedChange={handleToggleGrid}>
        <Grid className="mr-2 h-4 w-4" />
        Show Grid
      </MenubarCheckboxItem>
    </>
  );
};

export default EditMenu;
