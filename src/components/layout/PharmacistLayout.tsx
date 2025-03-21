
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PharmacistSidebar from "@/components/sidebar/PharmacistSidebar";
import EnhancedUserMenu from "@/components/user-menu/EnhancedUserMenu";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Search, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface PharmacistLayoutProps {
  children: React.ReactNode;
}

const PharmacistLayout = ({ children }: PharmacistLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    // Handle window resize for mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <PharmacistSidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetTrigger asChild className="md:hidden absolute top-4 left-4 z-50">
          <Button variant="ghost" size="icon">
            {isSidebarOpen ? <X /> : <Menu />}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <PharmacistSidebar />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={cn(
          "bg-white shadow-sm h-16 flex items-center justify-end px-4 md:px-6",
          isMobile && "pl-16" // Add padding when mobile sidebar button is shown
        )}>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-9 pr-4 py-2 text-sm rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 w-[200px] md:w-[300px]"
              />
            </div>
            <NotificationBell />
            <EnhancedUserMenu />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto hover-scroll main-content-scroll">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PharmacistLayout;
