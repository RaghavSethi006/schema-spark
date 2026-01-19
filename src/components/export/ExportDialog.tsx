import { useState, useRef } from 'react';
import {
  Download,
  FileJson,
  Upload,
  Save,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Package,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSchemaStore } from '@/lib/store';
import { validateSchema } from '@/lib/schema';
import { exportAsZip, exportSchema, importSchema } from '@/lib/export';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const ExportDialog = () => {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<'success' | 'error' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { schema, setSchema } = useSchemaStore();
  const validationErrors = validateSchema(schema);
  const criticalErrors = validationErrors.filter(e => e.type === 'error');
  const warnings = validationErrors.filter(e => e.type === 'warning');

  const handleExportZip = async () => {
    setIsExporting(true);
    setExportResult(null);
    
    try {
      const result = await exportAsZip(schema);
      
      if (result.success) {
        setExportResult('success');
        toast.success('Project exported successfully!');
      } else {
        setExportResult('error');
        toast.error(result.message, {
          description: result.errors?.join(', '),
        });
      }
    } catch (error) {
      setExportResult('error');
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJson = () => {
    exportSchema(schema);
    toast.success('Schema exported as JSON');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedSchema = await importSchema(file);
      setSchema(importedSchema);
      toast.success('Schema imported successfully');
      setOpen(false);
    } catch (error) {
      toast.error('Failed to import schema');
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Download className="w-4 h-4" />
          Export Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Export Backend Project
          </DialogTitle>
          <DialogDescription>
            Generate a complete Python FastAPI backend from your database design.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Validation Status */}
          <div className={cn(
            'p-4 rounded-lg border',
            criticalErrors.length > 0
              ? 'bg-destructive/10 border-destructive/30'
              : 'bg-success/10 border-success/30'
          )}>
            <div className="flex items-start gap-3">
              {criticalErrors.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium',
                  criticalErrors.length > 0 ? 'text-destructive' : 'text-success'
                )}>
                  {criticalErrors.length > 0
                    ? `${criticalErrors.length} validation error${criticalErrors.length > 1 ? 's' : ''}`
                    : 'Schema is valid'}
                </p>
                {criticalErrors.length > 0 && (
                  <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                    {criticalErrors.slice(0, 3).map((error, i) => (
                      <li key={i}>• {error.message}</li>
                    ))}
                    {criticalErrors.length > 3 && (
                      <li>• And {criticalErrors.length - 3} more...</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Schema Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground">Entities</p>
              <p className="text-xl font-bold">{schema.entities.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground">Relations</p>
              <p className="text-xl font-bold">{schema.relations.length}</p>
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Export Options</h4>
            
            {/* Python FastAPI Export */}
            <button
              onClick={handleExportZip}
              disabled={isExporting || criticalErrors.length > 0 || schema.entities.length === 0}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'group'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">Python + FastAPI + SQLite</p>
                  <p className="text-sm text-muted-foreground">
                    Complete backend with CRUD operations, ready to run
                  </p>
                </div>
              </div>
            </button>

            {/* JSON Schema Export */}
            <button
              onClick={handleExportJson}
              className={cn(
                'w-full p-4 rounded-lg border text-left transition-all',
                'hover:border-muted-foreground/50 hover:bg-muted/50',
                'group'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
                  <FileJson className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Export JSON Schema</p>
                  <p className="text-sm text-muted-foreground">
                    Save your design for later editing
                  </p>
                </div>
              </div>
            </button>
          </div>

          <Separator />

          {/* Import */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Import</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2"
            >
              <Upload className="w-4 h-4" />
              Import JSON Schema
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
