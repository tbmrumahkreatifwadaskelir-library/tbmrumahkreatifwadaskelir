import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps<T extends { id: number }> {
  value: number | null;
  onChange: (value: number) => void;
  onSearchChange?: (query: string) => void;
  data: T[];
  isLoading?: boolean;
  placeholder?: string;
  getOptionLabel?: (item: T) => string;
  disabled?: boolean;
}

export function Combobox<T extends { id: number }>({
  value,
  onChange,
  onSearchChange,
  data,
  isLoading,
  placeholder = "Pilih Data",
  getOptionLabel,
  disabled,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);

  const selected = data.find((item) => item.id === value);

  const defaultOptionLabel = (item: T) => {
    if ("name" in item) {
      return (item as unknown as { name: string }).name;
    }
    return `ID: ${item.id}`;
  };

  const labelFetcher = getOptionLabel ?? defaultOptionLabel;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between w-full font-normal"
          disabled={disabled}
        >
          {selected ? labelFetcher(selected) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cari..."
            onValueChange={(value) => {
              if (onSearchChange) {
                onSearchChange(value);
              }
            }}
          />
          <CommandList>
            {isLoading && (
              <CommandItem disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memuat...
              </CommandItem>
            )}
            {!isLoading && data.length === 0 && (
              <CommandEmpty>Tidak ditemukan</CommandEmpty>
            )}
            {data.map((item) => (
              <CommandItem
                key={item.id}
                value={String(item.id)}
                onSelect={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {labelFetcher(item)}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
