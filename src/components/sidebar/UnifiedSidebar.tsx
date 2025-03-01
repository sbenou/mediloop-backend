
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { Home, User, ShoppingBag, FileText, Settings, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import UserAvatar from "../user-menu/UserAvatar";

const UnifiedSidebar = () => {
  const { userRole, profile } = useAuth();
  const location = useLocation();

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      label: 'Dashboard',
      icon: <Home className="w-5 h-5 mr-3" />,
      path: '/dashboard',
      active: isLinkActive('/dashboard')
    },
    {
      label: 'Profile',
      icon: <User className="w-5 h-5 mr-3" />,
      path: '/profile',
      active: isLinkActive('/profile') || isLinkActive('/unified-profile')
    },
    {
      label: 'Orders',
      icon: <ShoppingBag className="w-5 h-5 mr-3" />,
      path: '/my-orders',
      active: isLinkActive('/my-orders')
    },
    {
      label: 'My Prescriptions',
      icon: <FileText className="w-5 h-5 mr-3" />,
      path: '/my-prescriptions',
      active: isLinkActive('/my-prescriptions')
    },
    {
      label: 'Teleconsultations',
      icon: <Calendar className="w-5 h-5 mr-3" />,
      path: '/teleconsultations',
      active: isLinkActive('/teleconsultations')
    },
    {
      label: 'Settings',
      icon: <Settings className="w-5 h-5 mr-3" />,
      path: '/settings',
      active: isLinkActive('/settings')
    }
  ];

  return (
    <aside className="w-64 border-r bg-white h-screen flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Mediloop</h3>
            <p className="text-xs text-muted-foreground">Healthcare Platform</p>
          </div>
        </div>
      </div>
      
      {/* Sidebar Sections */}
      <div className="flex-1 overflow-auto py-4">
        <div className="px-3 mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Platform</p>
        </div>
        
        <nav className="space-y-1 px-2">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${
                item.active 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-muted-foreground hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      
      {/* User Profile */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <UserAvatar userProfile={profile} />
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{profile?.email || 'user@example.com'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default UnifiedSidebar;
