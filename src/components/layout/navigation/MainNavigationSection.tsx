import { Link } from 'react-router-dom';
import { NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent } from "@/components/ui/navigation-menu";
import { useTranslation } from 'react-i18next';

export const MainNavigationSection = () => {
  const { t } = useTranslation();
  
  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>{t('navigation.main.menu')}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className="grid w-[400px] gap-3 p-4">
          <Link 
            to="/products"
            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <div className="text-sm font-medium leading-none">{t('navigation.main.products')}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {t('navigation.main.browseProducts')}
            </p>
          </Link>
          <Link 
            to="/services"
            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <div className="text-sm font-medium leading-none">{t('navigation.main.services')}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {t('navigation.main.discoverServices')}
            </p>
          </Link>
          <Link 
            to="/become-partner"
            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <div className="text-sm font-medium leading-none">{t('navigation.main.becomePartner')}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {t('navigation.main.joinNetwork')}
            </p>
          </Link>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};