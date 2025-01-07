import { Link } from 'react-router-dom';
import UserMenu from '@/components/UserMenu';

interface HeaderProps {
  session: any;
}

const Header = ({ session }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {session ? (
              <UserMenu />
            ) : (
              <Link 
                to="/login" 
                className="text-primary hover:text-primary/80 transition-colors"
              >
                Connection
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;