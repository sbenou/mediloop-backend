import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import { Button } from "./ui/button";
import ReactCountryFlag from "react-country-flag";

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', countryCode: 'GB' },
    { code: 'fr', name: 'Français', countryCode: 'FR' },
    { code: 'de', name: 'Deutsch', countryCode: 'DE' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-2 h-9 px-3"
        >
          <span className="flex items-center justify-center w-4 h-4">
            <ReactCountryFlag 
              countryCode={currentLanguage.countryCode}
              svg
              style={{
                width: '16px',
                height: '16px',
              }}
            />
          </span>
          <span className="hidden sm:inline-block">
            {currentLanguage.name}
          </span>
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