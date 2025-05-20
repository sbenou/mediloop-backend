
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { CartButton } from './navigation/CartButton';
import MainNavigation from './navigation/MainNavigation';
import MobileMenu from './navigation/MobileMenu';
import { useAuth } from '@/hooks/auth/useAuth';
import CurrencySelector from '@/components/CurrencySelector';
import LanguageSelector from '@/components/LanguageSelector';
import { NotificationBell } from '@/components/NotificationBell';
import { TenantDisplay } from '@/components/tenant/TenantDisplay';

const UnifiedHeader = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <MobileMenu />
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/lovable-uploads/1d4b50b5-2725-470b-a070-5227c3aa24b6.png"
              alt="MediLoop"
              className="h-8 w-auto"
            />
          </Link>
          <div className="ml-4">
            <TenantDisplay />
          </div>
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
          <CartButton />
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
