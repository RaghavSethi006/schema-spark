import { useState, useMemo, useEffect } from 'react';
import {
  Download,
  FileJson,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Package,
  Settings2,
  Eye,
  Layers,
  Database,
  Code,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSchemaStore } from '@/lib/store';
import { validateSchema } from '@/lib/schema';
import { exportSchema, importSchema } from '@/lib/export';
import { ExportConfig, GeneratedFile } from '@/lib/export/types';
import { defaultExportConfig, generateProjectFiles, exportProjectAsZip } from '@/lib/export/pipeline';
import { getFrameworkAdapter } from '@/lib/export/frameworks';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { FrameworkSelector } from './FrameworkSelector';
import { DatabaseSelector } from './DatabaseSelector';
import { ExportPresets } from './ExportPresets';
import { ExportOptionsPanel } from './ExportOptionsPanel';
import { FilePreview } from './FilePreview';
import { useRef } from 'react';

export const AdvancedExportDialog = () => {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('configure');
  const [config, setConfig] = useState<ExportConfig>(defaultExportConfig);
  const [excludedFiles, setExcludedFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { schema } = useSchemaStore();
  const validationErrors = validateSchema(schema);
  const criticalErrors = validationErrors.filter((e) => e.type === 'error');

  // Update project name from schema
  useEffect(() => {
    if (schema.name) {
      setConfig((prev) => ({ ...prev, projectName: schema.name }));
    }
  }, [schema.name]);

  // Get supported databases for selected framework
  const frameworkAdapter = useMemo(() => {
    try {
      return getFrameworkAdapter(config.framework);
    } catch {
      return null;
    }
  }, [config.framework]);

  // Generate preview files
  const previewFiles = useMemo<GeneratedFile[]>(() => {
    if (schema.entities.length === 0) return [];
    try {
      return generateProjectFiles(schema, config);
    } catch (e) {
      console.error('Preview generation error:', e);
      return [];
    }
  }, [schema, config]);

  // Filter out excluded files
  const exportableFiles = useMemo(() => {
    return previewFiles.filter((f) => !excludedFiles.has(f.path));
  }, [previewFiles, excludedFiles]);

  const handleConfigChange = (updates: Partial<ExportConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const handlePresetSelect = (presetConfig: ExportConfig) => {
    setConfig({ ...presetConfig, projectName: schema.name || presetConfig.projectName });
    toast.success('Preset applied');
  };

  const handleToggleExclude = (path: string) => {
    setExcludedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportProjectAsZip(schema, config);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message, {
          description: result.errors?.join(', '),
        });
      }
    } catch (error) {
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
      useSchemaStore.getState().setSchema(importedSchema);
      toast.success('Schema imported successfully');
      setOpen(false);
    } catch (error) {
      toast.error('Failed to import schema');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-export-trigger>
          <Download className="w-4 h-4" />
          Export Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Export Backend Project
          </DialogTitle>
          <DialogDescription>
            Generate production-ready backend code from your ER model.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configure" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Configure
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview ({previewFiles.length})
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto py-4">
            {/* Configure Tab */}
            <TabsContent value="configure" className="m-0 space-y-4">
              {/* Validation Status */}
              <div
                className={cn(
                  'p-4 rounded-lg border',
                  criticalErrors.length > 0
                    ? 'bg-destructive/10 border-destructive/30'
                    : 'bg-accent/50 border-accent'
                )}
              >
                <div className="flex items-start gap-3">
                  {criticalErrors.length > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={cn(
                        'font-medium',
                        criticalErrors.length > 0 ? 'text-destructive' : 'text-primary'
                      )}
                    >
                      {criticalErrors.length > 0
                        ? `${criticalErrors.length} validation error${criticalErrors.length > 1 ? 's' : ''}`
                        : 'Schema is valid'}
                    </p>
                    {criticalErrors.length > 0 && (
                      <ul className="mt-1 text-sm text-muted-foreground">
                        {criticalErrors.slice(0, 2).map((error, i) => (
                          <li key={i}>• {error.message}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-2 text-sm">
                    <Badge variant="secondary">
                      {schema.entities.length} entities
                    </Badge>
                    <Badge variant="secondary">
                      {schema.relations.length} relations
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Framework & Database Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Code className="w-4 h-4 text-muted-foreground" />
                      Framework
                    </label>
                  </div>
                  <FrameworkSelector
                    value={config.framework}
                    onChange={(framework) => handleConfigChange({ framework })}
                  />
                  {frameworkAdapter && (
                    <p className="text-xs text-muted-foreground">
                      ORM: {frameworkAdapter.features.orm}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      Database
                    </label>
                  </div>
                  <DatabaseSelector
                    value={config.database}
                    onChange={(database) => handleConfigChange({ database })}
                    supportedDatabases={frameworkAdapter?.supportedDatabases}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Quick Presets:</span>
                <ExportPresets
                  onSelect={handlePresetSelect}
                  currentConfig={config}
                />
              </div>

              <Separator />

              {/* Export Options */}
              <ExportOptionsPanel config={config} onChange={handleConfigChange} />
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="m-0">
              {schema.entities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Package className="w-12 h-12 mb-4 opacity-50" />
                  <p>Add entities to preview generated files</p>
                </div>
              ) : (
                <FilePreview
                  files={previewFiles}
                  excludedFiles={excludedFiles}
                  onToggleExclude={handleToggleExclude}
                />
              )}
            </TabsContent>

            {/* Import Tab */}
            <TabsContent value="import" className="m-0 space-y-4">
              <div className="p-6 border-2 border-dashed rounded-lg text-center">
                <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                <h4 className="font-medium mb-2">Import JSON Schema</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Load a previously exported schema file
                </p>
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
                >
                  Choose File
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <Separator />

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="ghost" size="sm" onClick={handleExportJson}>
            <FileJson className="w-4 h-4 mr-2" />
            Export JSON Only
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={
                isExporting ||
                criticalErrors.length > 0 ||
                schema.entities.length === 0
              }
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export {exportableFiles.length} Files
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
