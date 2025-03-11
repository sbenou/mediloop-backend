
import { useState, useEffect } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandList, CommandItem, CommandGroup, CommandInput } from "@/components/ui/command";
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import flags from 'react-phone-number-input/flags';
import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";
import { getCountryCallingCode } from 'react-phone-number-input';
import AddressFields from "@/components/address/AddressFields";

interface PatientSectionProps {
  form: UseFormReturn<any>;
}

const PatientSection = ({ form }: PatientSectionProps) => {
  // Phone state
  const [phoneValue, setPhoneValue] = useState('');
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const [countrySelectOpen, setCountrySelectOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  useEffect(() => {
    if (phoneValue) {
      const valid = isValidPhoneNumber(phoneValue);
      setIsPhoneValid(valid);
      form.setValue('patientPhone', phoneValue, { 
        shouldValidate: true,
        shouldDirty: true 
      });
    }
  }, [phoneValue, form]);

  const CountrySelectButton = ({ 
    country, 
    countries, 
    flags, 
    onClick 
  }: any) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex h-10 w-auto items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {country && (
          <span className="flex items-center">
            {flags[country] && <span className="mr-2">{flags[country]()}</span>}
            <span>+{getCountryCallingCode(country)}</span>
          </span>
        )}
        <ChevronsUpDown className="h-4 w-4 ml-2 opacity-50 shrink-0" />
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg text-primary">Patient Details</h3>
      <FormField
        control={form.control}
        name="patientName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Patient Name</FormLabel>
            <FormControl>
              <Input {...field} className="bg-accent/5" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="patientPhone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Patient Phone</FormLabel>
            <FormControl>
              <div className={cn(
                "flex rounded-md border border-input bg-accent/5 ring-offset-background focus-within:ring-1 focus-within:ring-primary",
                !isPhoneValid && phoneValue && "border-destructive focus-within:ring-destructive"
              )}>
                <Popover open={countrySelectOpen} onOpenChange={setCountrySelectOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center">
                      <PhoneInput
                        flags={flags}
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="LU"
                        value={phoneValue}
                        onChange={(value) => {
                          setPhoneValue(value || '');
                        }}
                        className="flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        countrySelectComponent={CountrySelectButton}
                        countrySelectProps={{
                          unicodeFlags: true,
                          dropdownClass: "bg-popover text-popover-foreground shadow-md rounded-md border border-input overflow-hidden py-1.5",
                          buttonClass: "border-0 bg-transparent",
                          arrowClass: "opacity-50 w-3 h-3",
                          searchable: false,
                        }}
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search country..."
                        value={countrySearch}
                        onValueChange={setCountrySearch}
                        className="h-9"
                      />
                      <CommandList>
                        <CommandGroup>
                          {Object.entries(flags)
                            .filter(([code]) => {
                              if (!countrySearch) return true;
                              const country = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase());
                              return country?.toLowerCase().includes(countrySearch.toLowerCase());
                            })
                            .map(([code, Flag]) => {
                              const countryName = new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase()) || 'Unknown Country';
                              return (
                                <CommandItem
                                  key={code}
                                  onSelect={() => {
                                    const inputEl = document.querySelector('input[type="tel"]') as HTMLInputElement;
                                    if (inputEl) {
                                      setPhoneValue(`+${getCountryCallingCode(code as any)}${phoneValue.replace(/^\+\d+/, '')}`);
                                    }
                                    setCountrySelectOpen(false);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                                >
                                  <span className="flex-shrink-0">
                                    {Flag && <Flag title={countryName || ''} />}
                                  </span>
                                  <span className="ml-2">
                                    {countryName}
                                  </span>
                                  <span className="ml-auto text-sm text-muted-foreground">
                                    +{getCountryCallingCode(code as any)}
                                  </span>
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              {!isPhoneValid && phoneValue && (
                <p className="text-sm font-medium text-destructive mt-1">Please enter a valid phone number for the selected country</p>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Replace the previous address field and dialog with AddressFields component */}
      <div className="space-y-4">
        <h4 className="font-medium">Patient Address</h4>
        <AddressFields 
          form={form} 
          prefix="patient" 
        />
      </div>
    </div>
  );
};

export default PatientSection;
