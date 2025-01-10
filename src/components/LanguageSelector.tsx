import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import { Globe } from "lucide-react";
import { Button } from "./ui/button";
import ReactCountryFlag from "react-country-flag";

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', countryCode: 'GB' },
    { code: 'fr', name: 'Français', countryCode: 'FR' },
    { code: 'de', name: 'Deutsch', countryCode: 'DE' },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className="cursor-pointer flex items-center gap-2"
          >
            <span className="flex items-center justify-center w-4 h-4">
              <ReactCountryFlag 
                countryCode={lang.countryCode}
                svg
                style={{
                  width: '16px',
                  height: '16px',
                }}
              />
            </span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;