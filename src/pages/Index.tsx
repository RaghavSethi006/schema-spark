import { AppLayout } from '@/components/layout/AppLayout';
import { DiagramCanvas } from '@/components/diagram/DiagramCanvas';
import { SidebarManager } from '@/components/sidebar/SidebarManager';
import { ReactFlowProvider } from '@xyflow/react';

const Index = () => {
  return (
    <ReactFlowProvider>
      <AppLayout sidebar={<SidebarManager />}>
        <DiagramCanvas />
      </AppLayout>
    </ReactFlowProvider>
  );
};

export default Index;
