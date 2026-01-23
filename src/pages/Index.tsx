import { useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DiagramCanvas } from '@/components/diagram/DiagramCanvas';
import { SidebarManager } from '@/components/sidebar/SidebarManager';
import { HomeScreen } from '@/components/home/HomeScreen';
import { useProjectStore } from '@/lib/projectStore';
import { useSchemaStore } from '@/lib/store';
import { ReactFlowProvider } from '@xyflow/react';

const Index = () => {
  const { isHomeScreen, currentProject, hasUnsavedChanges, performAutosave, autosaveEnabled } = useProjectStore();
  const { schema } = useSchemaStore();

  // Autosave every 30 seconds
  useEffect(() => {
    if (currentProject && autosaveEnabled) {
      const timer = setInterval(() => {
        if (hasUnsavedChanges) {
          currentProject.schema = schema;
          performAutosave();
        }
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [currentProject, hasUnsavedChanges, autosaveEnabled, schema, performAutosave]);

  // Warn before closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (isHomeScreen) {
    return <HomeScreen />;
  }

  return (
    <ReactFlowProvider>
      <AppLayout sidebar={<SidebarManager />}>
        <DiagramCanvas />
      </AppLayout>
    </ReactFlowProvider>
  );
};

export default Index;
