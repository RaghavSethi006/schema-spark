import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, Settings2, Code2, Shield, FolderTree } from 'lucide-react';
import { ExportConfig } from '@/lib/export/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ExportOptionsPanelProps {
  config: ExportConfig;
  onChange: (updates: Partial<ExportConfig>) => void;
}

export const ExportOptionsPanel = ({
  config,
  onChange,
}: ExportOptionsPanelProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    generation: true,
    naming: false,
    boilerplate: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-2">
      {/* Code Generation */}
      <Collapsible
        open={openSections.generation}
        onOpenChange={() => toggleSection('generation')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Code Generation</span>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              openSections.generation && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="controllers" className="text-sm">
              Generate Controllers/Routes
            </Label>
            <Switch
              id="controllers"
              checked={config.generateControllers}
              onCheckedChange={(checked) =>
                onChange({ generateControllers: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="services" className="text-sm">
              Generate Services
            </Label>
            <Switch
              id="services"
              checked={config.generateServices}
              onCheckedChange={(checked) =>
                onChange({ generateServices: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="tests" className="text-sm">
              Generate Tests
            </Label>
            <Switch
              id="tests"
              checked={config.generateTests}
              onCheckedChange={(checked) => onChange({ generateTests: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="migrations" className="text-sm">
              Generate Migrations
            </Label>
            <Switch
              id="migrations"
              checked={config.generateMigrations}
              onCheckedChange={(checked) =>
                onChange({ generateMigrations: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="readme" className="text-sm">
              Generate README
            </Label>
            <Switch
              id="readme"
              checked={config.generateReadme}
              onCheckedChange={(checked) =>
                onChange({ generateReadme: checked })
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Naming Conventions */}
      <Collapsible
        open={openSections.naming}
        onOpenChange={() => toggleSection('naming')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Naming & Structure</span>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              openSections.naming && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-3 space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Naming Convention</Label>
            <Select
              value={config.namingConvention}
              onValueChange={(value: 'snake_case' | 'camelCase' | 'PascalCase') =>
                onChange({ namingConvention: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snake_case">snake_case</SelectItem>
                <SelectItem value="camelCase">camelCase</SelectItem>
                <SelectItem value="PascalCase">PascalCase</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="pluralize" className="text-sm">
              Pluralize Table Names
            </Label>
            <Switch
              id="pluralize"
              checked={config.tablePluralizer}
              onCheckedChange={(checked) =>
                onChange({ tablePluralizer: checked })
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Boilerplate & Features */}
      <Collapsible
        open={openSections.boilerplate}
        onOpenChange={() => toggleSection('boilerplate')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Boilerplate & Features</span>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              openSections.boilerplate && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 px-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="auth" className="text-sm">
              Include Auth Boilerplate
            </Label>
            <Switch
              id="auth"
              checked={config.includeAuthBoilerplate}
              onCheckedChange={(checked) =>
                onChange({ includeAuthBoilerplate: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="cors" className="text-sm">
              Include CORS Setup
            </Label>
            <Switch
              id="cors"
              checked={config.includeCorsSetup}
              onCheckedChange={(checked) =>
                onChange({ includeCorsSetup: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="swagger" className="text-sm">
              Include Swagger/OpenAPI
            </Label>
            <Switch
              id="swagger"
              checked={config.includeSwaggerDocs}
              onCheckedChange={(checked) =>
                onChange({ includeSwaggerDocs: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="docker" className="text-sm">
              Generate Dockerfile
            </Label>
            <Switch
              id="docker"
              checked={config.generateDocker}
              onCheckedChange={(checked) =>
                onChange({ generateDocker: checked })
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
