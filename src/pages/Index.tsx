import { AppLayout } from '@/components/layout/AppLayout';
import { DiagramCanvas } from '@/components/diagram/DiagramCanvas';
import { EntityEditor } from '@/components/sidebar/EntityEditor';
import { ReactFlowProvider } from '@xyflow/react';

const Index = () => {
  return (
    <ReactFlowProvider>
      <AppLayout sidebar={<EntityEditor />}>
        <DiagramCanvas />
      </AppLayout>
    </ReactFlowProvider>
  );
};

export default Index;
