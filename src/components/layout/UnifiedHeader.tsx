
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import CartButton from './navigation/CartButton';
import { MainNavigation } from './navigation/MainNavigation';
import MobileMenu from './navigation/MobileMenu';
import { useAuth } from '@/hooks/auth/useAuth';
import { CurrencySelector } from '@/components/CurrencySelector';
import LanguageSelector from '@/components/LanguageSelector';
import NotificationBell from '@/components/NotificationBell';
import { TenantDisplay } from '@/components/tenant/TenantDisplay';
import { NavigationMenu } from "@/components/ui/navigation-menu";

const UnifiedHeader = () => {
  const { isAuthenticated } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <MobileMenu 
            isOpen={isMobileMenuOpen} 
            onOpenChange={setIsMobileMenuOpen} 
          />
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/lovable-uploads/187ef6ec-1e9e-4364-af00-215ade5361d3.png"
              alt="Mediloop"
              className="h-8 w-auto"
            />
          </Link>
          <TenantDisplay />
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex">
            <MainNavigation />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex md:items-center md:gap-4">
            <LanguageSelector />
            <CurrencySelector />
            {isAuthenticated && <NotificationBell />}
          </div>
          <CartButton 
            isOpen={isCartOpen} 
            onOpenChange={setIsCartOpen} 
          />
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button variant="default" size="sm">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="default" size="sm">
                Log In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;
