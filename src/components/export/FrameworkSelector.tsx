import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FrameworkType } from '@/lib/export/types';
import { getAllFrameworkAdapters } from '@/lib/export/frameworks';
import { useState } from 'react';

// Language icons/colors
const languageConfig: Record<string, { color: string; label: string }> = {
  python: { color: 'bg-yellow-500', label: 'Python' },
  typescript: { color: 'bg-blue-500', label: 'TypeScript' },
  javascript: { color: 'bg-yellow-400', label: 'JavaScript' },
  java: { color: 'bg-red-500', label: 'Java' },
  csharp: { color: 'bg-purple-500', label: 'C#' },
  php: { color: 'bg-indigo-500', label: 'PHP' },
  ruby: { color: 'bg-red-600', label: 'Ruby' },
  rust: { color: 'bg-orange-600', label: 'Rust' },
  go: { color: 'bg-cyan-500', label: 'Go' },
  elixir: { color: 'bg-purple-600', label: 'Elixir' },
};

interface FrameworkSelectorProps {
  value: FrameworkType;
  onChange: (value: FrameworkType) => void;
  disabled?: boolean;
}

export const FrameworkSelector = ({
  value,
  onChange,
  disabled,
}: FrameworkSelectorProps) => {
  const [open, setOpen] = useState(false);
  const frameworks = getAllFrameworkAdapters();
  const selected = frameworks.find((f) => f.id === value);

  // Group by language
  const grouped = frameworks.reduce((acc, fw) => {
    const lang = fw.language;
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(fw);
    return acc;
  }, {} as Record<string, typeof frameworks>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selected ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  languageConfig[selected.language]?.color || 'bg-muted'
                )}
              />
              <span>{selected.name}</span>
              <span className="text-muted-foreground text-xs">
                ({languageConfig[selected.language]?.label})
              </span>
            </div>
          ) : (
            'Select framework...'
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search frameworks..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            {Object.entries(grouped).map(([lang, fws]) => (
              <CommandGroup
                key={lang}
                heading={
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        languageConfig[lang]?.color || 'bg-muted'
                      )}
                    />
                    {languageConfig[lang]?.label || lang}
                  </div>
                }
              >
                {fws.map((fw) => (
                  <CommandItem
                    key={fw.id}
                    value={fw.id}
                    onSelect={() => {
                      onChange(fw.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === fw.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{fw.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {fw.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
