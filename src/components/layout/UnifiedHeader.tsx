
import React from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function UnifiedHeader() {
  const { isAuthenticated, profile } = useAuth();
  const { state } = useCart();
  const navigate = useNavigate();

  const totalItems = state.items.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="https://hrrlefgnhkbzuwyklejj.supabase.co/storage/v1/object/public/media/logo.png" 
              alt="Logo" 
              className="h-8 w-8"
            />
            <span className="hidden font-bold sm:inline-block">
              HealthPlatform
            </span>
          </Link>

          <Link to="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Products
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            About
          </Link>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Contact
          </Link>
          
          {import.meta.env.DEV && (
            <Link 
              to="/dev-tools"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Dev Tools
            </Link>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && profile ? (
            <>
              <Link to="/profile" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                {profile.full_name}
              </Link>
              <Link to="/cart" className="relative">
                <ShoppingCart className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-secondary text-secondary-foreground rounded-full px-1 text-xs">
                    {totalItems}
                  </span>
                )}
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Link to="/signup" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
