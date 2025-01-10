import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import { Globe, GbFlag, FrFlag, DeFlag } from "lucide-react";
import { Button } from "./ui/button";

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: GbFlag },
    { code: 'fr', name: 'Français', flag: FrFlag },
    { code: 'de', name: 'Deutsch', flag: DeFlag },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => {
          const FlagIcon = lang.flag;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className="cursor-pointer flex items-center gap-2"
            >
              <FlagIcon className="h-4 w-4" />
              {lang.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;