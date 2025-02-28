
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserMenu from "../UserMenu";
import { Button } from "../ui/button";
import { ChevronLeft, Bell, ShoppingCart, Globe } from "lucide-react";
import NotificationBell from "../NotificationBell";
import CartButton from "./navigation/CartButton";
import { MainNavigation } from "./navigation/MainNavigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  showUserMenu?: boolean;
  showBackLink?: boolean;
  onBackClick?: () => void;
}

const Header = ({ showUserMenu = true, showBackLink = false, onBackClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" }
  ];

  const handleLanguageChange = (langCode: string) => {
    setCurrentLanguage(langCode);
    // Here you would typically update the i18n language context
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
          
          {/* Language Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80 transition-colors">
                <Globe className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-0">
              <div className="p-2">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between ${
                      currentLanguage === lang.code ? "bg-accent" : "hover:bg-accent"
                    }`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    {lang.name}
                    {currentLanguage === lang.code && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        Active
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Connection button (only shown when user is not authenticated) */}
          {!showUserMenu && (
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Connection
            </button>
          )}
          
          <CartButton isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
          {showUserMenu && <UserMenu />}
        </div>
      </div>
    </header>
  );
};

export default Header;
