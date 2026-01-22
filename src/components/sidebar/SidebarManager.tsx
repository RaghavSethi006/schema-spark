import { useSchemaStore } from '@/lib/store';
import { EntityEditorPanel } from './EntityEditorPanel';
import { RelationshipEditorPanel } from './RelationshipEditorPanel';
import { Database, Diamond } from 'lucide-react';

/**
 * Context-aware sidebar that switches panels based on selection.
 * - Entity selected → EntityEditorPanel
 * - Relationship selected → RelationshipEditorPanel
 * - Nothing selected → Empty state
 */
export const SidebarManager = () => {
  const { selectedEntityId, selectedRelationshipId } = useSchemaStore();

  // Relationship takes priority when selected
  if (selectedRelationshipId) {
    return <RelationshipEditorPanel />;
  }

  // Entity panel (includes empty state)
  if (selectedEntityId) {
    return <EntityEditorPanel />;
  }

  // Nothing selected
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
        <Diamond className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-medium mb-2">Select an Element</h3>
      <p className="text-sm text-muted-foreground max-w-[200px]">
        Click on an entity or relationship in the canvas to edit its properties
      </p>
      <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Database className="w-3.5 h-3.5" />
          <span>Entity</span>
        </div>
        <div className="flex items-center gap-1">
          <Diamond className="w-3.5 h-3.5" />
          <span>Relationship</span>
        </div>
      </div>
    </div>
  );
};
