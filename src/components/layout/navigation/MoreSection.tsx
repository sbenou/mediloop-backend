
import { Link } from 'react-router-dom';
import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { Info, HelpCircle, Settings, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const MoreSection = () => {
  const { t } = useTranslation();
  
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{t('common.navigation.more')}</NavigationMenuTrigger>
      <NavigationMenuContent className="flex justify-center">
        <div className="w-[200px] p-4">
          <nav className="flex flex-col space-y-2">
            <Link 
              to="/about-us"
              className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground text-sm"
            >
              <Info className="h-4 w-4" />
              <span>{t('common.navigation.aboutUs')}</span>
            </Link>
            <Link 
              to="/why-luxmed"
              className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground text-sm"
            >
              <HelpCircle className="h-4 w-4" />
              <span>{t('common.navigation.whyLuxmed')}</span>
            </Link>
            <Link 
              to="/how-it-works"
              className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground text-sm"
            >
              <Settings className="h-4 w-4" />
              <span>{t('common.navigation.howItWorks')}</span>
            </Link>
            <Link 
              to="/why-we-care"
              className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground text-sm"
            >
              <Heart className="h-4 w-4" />
              <span>{t('common.navigation.whyWeCare')}</span>
            </Link>
          </nav>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
