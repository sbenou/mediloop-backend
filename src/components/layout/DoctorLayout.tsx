
import { useState, useEffect } from "react";
import UnifiedSidebar from "@/components/sidebar/UnifiedSidebar";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import UnifiedHeader from "./UnifiedHeader";

interface DoctorLayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

const DoctorLayout = ({ children, hideHeader = false }: DoctorLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <UnifiedSidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild className="md:hidden absolute top-20 left-4 z-50">
            <Button variant="ghost" size="icon">
              {isSidebarOpen ? <X /> : <Menu />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px] mt-16">
            <UnifiedSidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {!hideHeader && <UnifiedHeader />}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <ScrollArea className="h-full w-full">
              {children}
            </ScrollArea>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DoctorLayout;
