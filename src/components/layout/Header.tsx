
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User } from 'lucide-react';

const Header: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Healthcare Platform</h1>
        
        <div className="flex items-center gap-4">
          {profile && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium">{profile.full_name}</span>
              <span className="text-xs text-gray-500 capitalize">({profile.role})</span>
            </div>
          )}
          
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
