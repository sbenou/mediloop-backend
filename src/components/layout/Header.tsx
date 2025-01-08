import { Link } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  session: any;
  showUserMenu?: boolean;
  showBackLink?: boolean;
}

const Header = ({ session, showUserMenu = true, showBackLink = false }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            {showBackLink ? (
              <Link to="/" className="flex items-center text-primary hover:text-primary/80">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            ) : (
              <Link to="/">
                <img 
                  src="/lovable-uploads/1d4b50b5-2725-470b-a070-5227c3aa24b6.png" 
                  alt="LuxMed Logo" 
                  className="h-16" // Increased from h-12 to h-16
                />
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {showUserMenu ? (
              session ? (
                <UserMenu />
              ) : (
                <Link 
                  to="/login" 
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  Connection
                </Link>
              )
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;