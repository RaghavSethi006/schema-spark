import { useState, useEffect, useCallback } from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarCheckboxItem,
  MenubarTrigger,
} from '@/components/ui/menubar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  useProjectStore, 
  exportProjectFile,
  importProjectFile,
} from '@/lib/projectStore';
import { useSchemaStore } from '@/lib/store';
import { exportAsZip, exportSchema } from '@/lib/export';
import { toast } from 'sonner';

interface AppMenuProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const AppMenu = ({ onToggleSidebar, isSidebarCollapsed }: AppMenuProps) => {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const { 
    currentProject,
    hasUnsavedChanges,
    recentProjects,
    createNewProject,
    openProject,
    closeProject,
    saveProject,
    setHomeScreen,
    toggleSidebar,
    autosaveEnabled,
    setAutosaveEnabled,
  } = useProjectStore();
  
  const { schema, setSchema, resetSchema } = useSchemaStore();

  // Handle unsaved changes confirmation
  const confirmAction = useCallback((action: () => void) => {
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
      setShowUnsavedDialog(true);
    } else {
      action();
    }
  }, [hasUnsavedChanges]);

  // File operations
  const handleNew = () => {
    confirmAction(() => {
      createNewProject();
      setSchema(useProjectStore.getState().currentProject!.schema);
    });
  };

  const handleOpen = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.erforge,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        confirmAction(async () => {
          try {
            const project = await importProjectFile(file);
            openProject(project);
            setSchema(project.schema);
            toast.success('Project opened successfully');
          } catch (error) {
            toast.error('Failed to open project file');
          }
        });
      }
    };
    input.click();
  };

  const handleOpenRecent = (projectId: string) => {
    confirmAction(() => {
      const autosaveData = localStorage.getItem(`erforge-autosave-${projectId}`);
      if (autosaveData) {
        try {
          const project = JSON.parse(autosaveData);
          openProject(project);
          setSchema(project.schema);
        } catch {
          toast.error('Failed to open recent project');
        }
      }
    });
  };

  const handleSave = () => {
    if (!currentProject) return;
    
    // Update project with current schema
    currentProject.schema = schema;
    const saved = saveProject();
    if (saved) {
      localStorage.setItem(`erforge-autosave-${saved.id}`, JSON.stringify(saved));
      toast.success('Project saved');
    }
  };

  const handleSaveAs = () => {
    if (!currentProject) return;
    currentProject.schema = schema;
    exportProjectFile(currentProject);
    toast.success('Project exported');
  };

  const handleExportSQL = async () => {
    const result = await exportAsZip(schema);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleExportJSON = () => {
    exportSchema(schema);
    toast.success('Schema exported as JSON');
  };

  const handleClose = () => {
    confirmAction(() => {
      closeProject();
      resetSchema();
    });
  };

  const handleHome = () => {
    confirmAction(() => {
      setHomeScreen(true);
    });
  };

  // Edit operations
  const handleUndo = () => {
    // TODO: Implement undo
    toast.info('Undo not yet implemented');
  };

  const handleRedo = () => {
    // TODO: Implement redo
    toast.info('Redo not yet implemented');
  };

  // View operations
  const handleToggleSidebar = () => {
    toggleSidebar();
    onToggleSidebar?.();
  };

  const handleZoomIn = () => {
    // TODO: Implement zoom
    toast.info('Use mouse wheel to zoom');
  };

  const handleZoomOut = () => {
    // TODO: Implement zoom
    toast.info('Use mouse wheel to zoom');
  };

  const handleResetLayout = () => {
    // TODO: Reset layout
    toast.info('Layout reset');
  };

  const handleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  // Help
  const handleDocs = () => {
    window.open('https://docs.lovable.dev', '_blank');
  };

  const handleShortcuts = () => {
    toast.info('Keyboard shortcuts: Ctrl+S (Save), Ctrl+N (New), Ctrl+O (Open)');
  };

  const handleAbout = () => {
    toast.info('ERForge v1.0 - Visual Entity-Relationship Diagram Tool');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      
      if (isMod && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (isMod && e.key === 'n') {
        e.preventDefault();
        handleNew();
      } else if (isMod && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (isMod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (isMod && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'F11') {
        e.preventDefault();
        handleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [schema, currentProject, hasUnsavedChanges]);

  return (
    <>
      <Menubar className="border-0 bg-transparent h-8">
        {/* File Menu */}
        <MenubarMenu>
          <MenubarTrigger className="text-xs font-normal px-2 py-1 cursor-pointer">File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleNew}>
              New Project
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleOpen}>
              Open...
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            
            {recentProjects.length > 0 && (
              <MenubarSub>
                <MenubarSubTrigger>Open Recent</MenubarSubTrigger>
                <MenubarSubContent>
                  {recentProjects.slice(0, 5).map((project) => (
                    <MenubarItem 
                      key={project.id}
                      onClick={() => handleOpenRecent(project.id)}
                    >
                      {project.name}
                    </MenubarItem>
                  ))}
                </MenubarSubContent>
              </MenubarSub>
            )}
            
            <MenubarSeparator />
            
            <MenubarItem onClick={handleSave} disabled={!currentProject}>
              Save
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleSaveAs} disabled={!currentProject}>
              Save As...
              <MenubarShortcut>⇧⌘S</MenubarShortcut>
            </MenubarItem>
            
            <MenubarSeparator />
            
            <MenubarSub>
              <MenubarSubTrigger disabled={!currentProject}>Export</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem onClick={handleExportSQL}>
                  Python/FastAPI (.zip)
                </MenubarItem>
                <MenubarItem onClick={handleExportJSON}>
                  JSON Schema (.json)
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            
            <MenubarSeparator />
            
            <MenubarItem onClick={handleClose} disabled={!currentProject}>
              Close Project
            </MenubarItem>
            <MenubarItem onClick={handleHome}>
              Home Screen
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Edit Menu */}
        <MenubarMenu>
          <MenubarTrigger className="text-xs font-normal px-2 py-1 cursor-pointer">Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleUndo}>
              Undo
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleRedo}>
              Redo
              <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarCheckboxItem 
              checked={autosaveEnabled}
              onCheckedChange={setAutosaveEnabled}
            >
              Autosave
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        {/* View Menu */}
        <MenubarMenu>
          <MenubarTrigger className="text-xs font-normal px-2 py-1 cursor-pointer">View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem 
              checked={!isSidebarCollapsed}
              onCheckedChange={handleToggleSidebar}
            >
              Sidebar
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleZoomIn}>
              Zoom In
              <MenubarShortcut>⌘+</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleZoomOut}>
              Zoom Out
              <MenubarShortcut>⌘-</MenubarShortcut>
            </MenubarItem>
            <MenubarItem onClick={handleResetLayout}>
              Reset Layout
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleFullscreen}>
              Fullscreen
              <MenubarShortcut>F11</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Help Menu */}
        <MenubarMenu>
          <MenubarTrigger className="text-xs font-normal px-2 py-1 cursor-pointer">Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleDocs}>
              Documentation
            </MenubarItem>
            <MenubarItem onClick={handleShortcuts}>
              Keyboard Shortcuts
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={handleAbout}>
              About ERForge
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to save before continuing?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowUnsavedDialog(false);
              setPendingAction(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={() => {
                setShowUnsavedDialog(false);
                pendingAction?.();
                setPendingAction(null);
              }}
            >
              Don't Save
            </AlertDialogAction>
            <AlertDialogAction onClick={() => {
              handleSave();
              setShowUnsavedDialog(false);
              pendingAction?.();
              setPendingAction(null);
            }}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
