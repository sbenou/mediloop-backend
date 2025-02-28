
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserMenu from "../UserMenu";
import { Button } from "../ui/button";
import { ChevronLeft, Bell, ShoppingCart } from "lucide-react";
import NotificationBell from "../NotificationBell";
import CartButton from "./navigation/CartButton";
import { MainNavigation } from "./navigation/MainNavigation";

interface HeaderProps {
  showUserMenu?: boolean;
  showBackLink?: boolean;
  onBackClick?: () => void;
}

const Header = ({ showUserMenu = true, showBackLink = false, onBackClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center justify-start gap-4">
          {showBackLink && (
            <Button variant="ghost" size="icon" onClick={handleBackClick}>
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          <Link to="/" className="font-semibold text-lg flex items-center gap-2">
            <img src="/favicon.ico" alt="Logo" className="w-6 h-6" />
            Mediloop
          </Link>
          
          <div className="hidden md:flex ml-6">
            <MainNavigation />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <CartButton isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
          {showUserMenu && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default Header;
