import { ReactNode, useEffect, useRef, useState } from 'react';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose, PanelLeft, PanelRight } from 'lucide-react';
import { useProjectStore } from '@/lib/projectStore';
import { cn } from '@/lib/utils';

interface ResizableLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
}

export const ResizableLayout = ({ children, sidebar }: ResizableLayoutProps) => {
  const { 
    sidebarPosition, 
    sidebarCollapsed, 
    sidebarWidth,
    toggleSidebar,
    setSidebarWidth,
    setSidebarPosition,
  } = useProjectStore();

  const [panelSize, setPanelSize] = useState(25);
  const panelGroupRef = useRef<any>(null);

  // Convert pixel width to percentage on mount
  useEffect(() => {
    const containerWidth = window.innerWidth;
    const initialSize = Math.max(15, Math.min(40, (sidebarWidth / containerWidth) * 100));
    setPanelSize(initialSize);
  }, []);

  const handleResize = (sizes: number[]) => {
    const sidebarSize = sidebarPosition === 'left' ? sizes[0] : sizes[1];
    setPanelSize(sidebarSize);
    
    // Convert percentage to pixels for storage
    const containerWidth = window.innerWidth;
    const newWidth = (sidebarSize / 100) * containerWidth;
    setSidebarWidth(Math.round(newWidth));
  };

  const handleToggle = () => {
    toggleSidebar();
  };

  const handleSwitchPosition = () => {
    setSidebarPosition(sidebarPosition === 'left' ? 'right' : 'left');
  };

  // Sidebar panel component
  const SidebarPanel = (
    <ResizablePanel 
      defaultSize={panelSize}
      minSize={15}
      maxSize={40}
      collapsible
      collapsedSize={0}
      className={cn(
        "transition-all duration-200",
        sidebarCollapsed && "!min-w-0"
      )}
    >
      <div className={cn(
        "h-full bg-sidebar border-sidebar-border flex flex-col",
        sidebarPosition === 'left' ? 'border-r' : 'border-l',
        sidebarCollapsed && 'hidden'
      )}>
        {/* Sidebar Header with controls */}
        <div className="h-10 px-2 flex items-center justify-between border-b border-sidebar-border bg-sidebar/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitchPosition}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title={`Move to ${sidebarPosition === 'left' ? 'right' : 'left'}`}
          >
            {sidebarPosition === 'left' ? (
              <PanelRight className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            title="Collapse sidebar"
          >
            {sidebarPosition === 'left' ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          {sidebar}
        </div>
      </div>
    </ResizablePanel>
  );

  // Main content panel
  const MainPanel = (
    <ResizablePanel defaultSize={sidebarCollapsed ? 100 : 100 - panelSize}>
      <div className="h-full relative">
        {/* Collapsed sidebar toggle */}
        {sidebarCollapsed && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className={cn(
              "absolute top-2 z-10 h-8 gap-1.5 text-xs bg-card/90 backdrop-blur-sm",
              sidebarPosition === 'left' ? 'left-2' : 'right-2'
            )}
          >
            {sidebarPosition === 'left' ? (
              <>
                <PanelLeft className="w-3.5 h-3.5" />
                Show Sidebar
              </>
            ) : (
              <>
                Show Sidebar
                <PanelRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        )}
        
        {children}
      </div>
    </ResizablePanel>
  );

  return (
    <ResizablePanelGroup 
      ref={panelGroupRef}
      direction="horizontal" 
      onLayout={handleResize}
      className="h-full"
    >
      {sidebarPosition === 'left' ? (
        <>
          {!sidebarCollapsed && SidebarPanel}
          {!sidebarCollapsed && <ResizableHandle withHandle />}
          {MainPanel}
        </>
      ) : (
        <>
          {MainPanel}
          {!sidebarCollapsed && <ResizableHandle withHandle />}
          {!sidebarCollapsed && SidebarPanel}
        </>
      )}
    </ResizablePanelGroup>
  );
};
