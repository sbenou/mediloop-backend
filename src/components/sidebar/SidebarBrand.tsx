
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileIcon } from "lucide-react";

const SidebarBrand = () => {
  return (
    <div className="p-4 border-b">
      <div className="flex items-center space-x-2">
        <Avatar className="h-10 w-10 rounded-md">
          <AvatarImage 
            src="/lovable-uploads/187ef6ec-1e9e-4364-af00-215ade5361d3.png" 
            alt="Mediloop" 
            className="rounded-md"
          />
          <AvatarFallback className="rounded-md text-white bg-[#9b87f5]">
            <FileIcon className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-sm">Mediloop</h3>
          <p className="text-xs text-muted-foreground">Healthcare Platform</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarBrand;
