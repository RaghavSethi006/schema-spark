import { Check, ChevronDown, Monitor, Server } from 'lucide-react';
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
import { PlatformType } from '@/lib/export/types';
import { getAllPlatformAdapters } from '@/lib/export/platforms';
import { useState } from 'react';

const platformIcons: Record<string, typeof Server> = {
  nodejs: Server,
  electron: Monitor,
};

interface PlatformSelectorProps {
  value: PlatformType;
  onChange: (value: PlatformType) => void;
  disabled?: boolean;
  supportedPlatforms?: PlatformType[];
}

export const PlatformSelector = ({
  value,
  onChange,
  disabled,
  supportedPlatforms,
}: PlatformSelectorProps) => {
  const [open, setOpen] = useState(false);
  const allPlatforms = getAllPlatformAdapters();

  const platforms = supportedPlatforms
    ? allPlatforms.filter((p) => supportedPlatforms.includes(p.id))
    : allPlatforms;

  const selected = platforms.find((p) => p.id === value);
  const Icon = selected ? (platformIcons[selected.id] || Server) : Server;

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
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span>{selected.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-muted-foreground" />
              <span>Select platform...</span>
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search platforms..." />
          <CommandList>
            <CommandEmpty>No platform found.</CommandEmpty>
            <CommandGroup heading="Platforms">
              {platforms.map((platform) => {
                const PIcon = platformIcons[platform.id] || Server;
                return (
                  <CommandItem
                    key={platform.id}
                    value={platform.id}
                    onSelect={() => {
                      onChange(platform.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === platform.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <PIcon className="w-4 h-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span>{platform.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {platform.description}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
