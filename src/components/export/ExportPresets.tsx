import { Check, ChevronDown, Bookmark, Star } from 'lucide-react';
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
import { ExportPreset, ExportConfig } from '@/lib/export/types';
import { builtInPresets } from '@/lib/export/pipeline';
import { useState } from 'react';

interface ExportPresetsProps {
  onSelect: (config: ExportConfig) => void;
  currentConfig?: ExportConfig;
}

export const ExportPresets = ({ onSelect, currentConfig }: ExportPresetsProps) => {
  const [open, setOpen] = useState(false);

  const isPresetActive = (preset: ExportPreset) => {
    if (!currentConfig) return false;
    return (
      preset.config.framework === currentConfig.framework &&
      preset.config.database === currentConfig.database
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="w-4 h-4" />
          Presets
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search presets..." />
          <CommandList>
            <CommandEmpty>No preset found.</CommandEmpty>
            <CommandGroup heading="Built-in Presets">
              {builtInPresets.map((preset) => (
                <CommandItem
                  key={preset.id}
                  value={preset.id}
                  onSelect={() => {
                    onSelect(preset.config);
                    setOpen(false);
                  }}
                  className="flex items-start gap-2 py-2"
                >
                  <Check
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      isPresetActive(preset) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-amber-500" />
                      <span className="font-medium">{preset.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {preset.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
