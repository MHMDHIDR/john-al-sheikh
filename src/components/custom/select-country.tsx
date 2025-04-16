import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { countryNames } from "@/lib/list-of-countries";
import { cn } from "@/lib/utils";

type SelectCountryProps = {
  nationality: string | null | undefined;
  setNationality: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SelectCountry({
  nationality,
  setNationality,
  placeholder = "إختر الجنسية...",
  className,
}: SelectCountryProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // just for building
  console.log("searchValue", searchValue);

  // Find the selected country label
  const selectedCountry = nationality
    ? countryNames.find(country => country.code === nationality)
    : undefined;

  // Handle clicking outside the popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-right cursor-pointer",
            !nationality && "text-foreground",
            className,
          )}
        >
          {selectedCountry ? selectedCountry.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" ref={popoverRef} align="start">
        <Command dir="rtl" className="bg-white">
          <CommandInput
            placeholder="ابحث عن الجنسية..."
            onValueChange={setSearchValue}
            className="text-right"
          />
          <CommandEmpty className="text-center py-2">لا توجد نتائج</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {countryNames.map(country => (
              <CommandItem
                key={country.code}
                value={country.label}
                onSelect={() => {
                  setNationality(country.code);
                  setOpen(false);
                }}
                className="text-right cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    nationality === country.code ? "opacity-100" : "opacity-0",
                  )}
                />
                {country.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
