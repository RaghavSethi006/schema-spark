import { useState } from 'react';
import { 
  Database, 
  Menu, 
  X, 
  RotateCcw, 
  FileJson,
  Github,
  Info,
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
import { useSchemaStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header = ({ isSidebarOpen, onToggleSidebar }: HeaderProps) => {
  const { schema, setSchemaName, resetSchema } = useSchemaStore();
  const [isEditingName, setIsEditingName] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg text-gradient hidden sm:inline">
            ERForge
          </span>
        </div>

        {/* Project Name */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
          {isEditingName ? (
            <Input
              value={schema.name}
              onChange={(e) => setSchemaName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              className="h-7 w-40 text-sm"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {schema.name}
            </button>
          )}
          <FileJson className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Reset Button */}
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
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

        {/* Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="md:hidden"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>
    </header>
  );
};
