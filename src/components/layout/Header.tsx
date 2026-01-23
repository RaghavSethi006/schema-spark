import { useState } from 'react';
import { 
  Database, 
  Menu, 
  X, 
  RotateCcw, 
  FileJson,
  Home,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ExportDialog } from '@/components/export/ExportDialog';
import { AppMenu } from '@/components/menu/AppMenu';
import { useSchemaStore } from '@/lib/store';
import { useProjectStore } from '@/lib/projectStore';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header = ({ isSidebarOpen, onToggleSidebar }: HeaderProps) => {
  const { schema, setSchemaName, resetSchema } = useSchemaStore();
  const { hasUnsavedChanges, setHomeScreen, sidebarCollapsed } = useProjectStore();
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        {/* Logo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={() => setHomeScreen(true)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <span className="font-bold text-sm text-gradient hidden sm:inline">
                ERForge
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>Home</TooltipContent>
        </Tooltip>

        {/* Desktop App Menu */}
        <div className="hidden md:block">
          <AppMenu 
            onToggleSidebar={onToggleSidebar} 
            isSidebarCollapsed={sidebarCollapsed}
          />
        </div>

        <div className="h-4 w-px bg-border hidden md:block" />

        {/* Project Name */}
        <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/50">
          {isEditingName ? (
            <Input
              value={schema.name}
              onChange={(e) => setSchemaName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              className="h-6 w-36 text-xs"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-xs font-medium hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {schema.name}
              {hasUnsavedChanges && (
                <Circle className="w-2 h-2 fill-warning text-warning" />
              )}
            </button>
          )}
          <FileJson className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Reset Button */}
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Reset Schema</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Schema?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all entities and relationships. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={resetSchema} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Export Button */}
        <ExportDialog />

        {/* Sidebar Toggle (Mobile) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="md:hidden h-8 w-8 p-0"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
};
