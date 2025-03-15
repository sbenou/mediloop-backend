
import React from 'react';
import { MenubarItem, MenubarSeparator } from "@/components/ui/menubar";
import { Layers, RotateCw, RotateCcw } from "lucide-react";

interface AdvancedMenuProps {
  handleBringForward?: () => void;
  handleSendBackward?: () => void;
  handleBringToFront?: () => void;
  handleSendToBack?: () => void;
  handleRotate: (angle: number) => void;
}

const AdvancedMenu: React.FC<AdvancedMenuProps> = ({
  handleBringForward,
  handleSendBackward,
  handleBringToFront,
  handleSendToBack,
  handleRotate
}) => {
  return (
    <>
      {/* Layer Management */}
      {handleBringForward && handleSendBackward && handleBringToFront && handleSendToBack && (
        <>
          <MenubarItem onClick={handleBringForward}>
            <Layers className="mr-2 h-4 w-4" />
            Bring Forward
          </MenubarItem>
          <MenubarItem onClick={handleSendBackward}>
            <Layers className="mr-2 h-4 w-4" />
            Send Backward
          </MenubarItem>
          <MenubarItem onClick={handleBringToFront}>
            <Layers className="mr-2 h-4 w-4" />
            Bring to Front
          </MenubarItem>
          <MenubarItem onClick={handleSendToBack}>
            <Layers className="mr-2 h-4 w-4" />
            Send to Back
          </MenubarItem>
          <MenubarSeparator />
        </>
      )}
      
      {/* Rotation */}
      <MenubarItem onClick={() => handleRotate(90)}>
        <RotateCw className="mr-2 h-4 w-4" />
        Rotate 90° Clockwise
      </MenubarItem>
      <MenubarItem onClick={() => handleRotate(-90)}>
        <RotateCcw className="mr-2 h-4 w-4" />
        Rotate 90° Counter-Clockwise
      </MenubarItem>
    </>
  );
};

export default AdvancedMenu;
