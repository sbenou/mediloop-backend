
import { useCountrySelection } from "@/hooks/useCountrySelection";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import CountryOption from "@/components/country/CountryOption";
import CountrySelectorOverlay from "@/components/country/CountrySelectorOverlay";

const CountrySelector = () => {
  const {
    open,
    setOpen,
    selectedCountry,
    setSelectedCountry,
    selectionComplete,
    handleSelectCountry,
    AVAILABLE_COUNTRIES
  } = useCountrySelection();

  return (
    <>
      <CountrySelectorOverlay open={open} />
      <Dialog 
        open={open} 
        onOpenChange={(newOpenState) => {
          console.log("Dialog onOpenChange called with:", newOpenState);
          if (!newOpenState) {
            // Allow closing only if selection is complete
            if (selectionComplete) {
              setOpen(false);
            } else {
              console.log("CountrySelector: Preventing dialog from closing, no country selected");
              setOpen(true);
            }
          } else {
            setOpen(true);
          }
        }} 
        modal={true}
      >
        <DialogContent 
          className="sm:max-w-md z-[100001]" 
          forceMount
          onInteractOutside={(e) => {
            e.preventDefault();
            console.log("CountrySelector: Outside interaction prevented");
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            console.log("CountrySelector: Escape key prevented");
          }}
        >
          <DialogTitle>Select Your Country</DialogTitle>
          <DialogDescription>
            Please select your country to help us show relevant doctors and pharmacies in your area.
          </DialogDescription>
          
          <RadioGroup 
            value={selectedCountry} 
            onValueChange={setSelectedCountry}
            className="grid gap-4 my-4"
          >
            {AVAILABLE_COUNTRIES.map((country) => (
              <CountryOption 
                key={country.code}
                code={country.code}
                name={country.name}
              />
            ))}
          </RadioGroup>
          
          <div className="flex justify-end mt-4">
            <Button onClick={handleSelectCountry}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CountrySelector;
