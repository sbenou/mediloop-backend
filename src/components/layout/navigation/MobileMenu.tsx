
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileMenu = ({ isOpen, onOpenChange }: MobileMenuProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px]">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 space-y-4">
          <Link to="/products" className="block px-4 py-2 hover:bg-accent rounded-md">
            Products
          </Link>
          <Link to="/services" className="block px-4 py-2 hover:bg-accent rounded-md">
            Services
          </Link>
          <Link to="/become-partner" className="block px-4 py-2 hover:bg-accent rounded-md">
            Become Partner
          </Link>
          <Link to="/about-us" className="block px-4 py-2 hover:bg-accent rounded-md">
            About Us
          </Link>
          <Link to="/why-luxmed" className="block px-4 py-2 hover:bg-accent rounded-md">
            Why Luxmed
          </Link>
          <Link to="/how-it-works" className="block px-4 py-2 hover:bg-accent rounded-md">
            How It Works
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
