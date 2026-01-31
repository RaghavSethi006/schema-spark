import { useState } from 'react';
import {
  Plus,
  FileJson,
  Clock,
  Folder,
  Search,
  Grid,
  List,
  Star,
  Trash2,
  Upload,
  Database,
  ShoppingCart,
  Users,
  GraduationCap,
  Briefcase,
  LayoutTemplate,
  FolderOpen,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useProjectStore,
  OFFICIAL_TEMPLATES,
  importProjectFile,
  ProjectTemplate,
} from '@/lib/projectStore';
import { useSchemaStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  'blank': <Plus className="w-6 h-6" />,
  'auth-system': <Users className="w-6 h-6" />,
  'lms': <GraduationCap className="w-6 h-6" />,
  'ecommerce': <ShoppingCart className="w-6 h-6" />,
  'crm': <Briefcase className="w-6 h-6" />,
};

export const HomeScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    recentProjects,
    userTemplates,
    createNewProject,
    createFromTemplate,
    openProject,
    removeFromRecent,
    setHomeScreen,
  } = useProjectStore();

  const { setSchema } = useSchemaStore();

  const handleCreateNewProject = () => {
    createNewProject();
    setSchema(useProjectStore.getState().currentProject!.schema);
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    createFromTemplate(template);
    setSchema(useProjectStore.getState().currentProject!.schema);
  };

  const handleFileImport = async (file: File) => {
    try {
      const project = await importProjectFile(file);
      openProject(project);
      setSchema(project.schema);
    } catch (error) {
      console.error('Failed to import project:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const projectFile = files.find(f => f.name.endsWith('.schemaspark') || f.name.endsWith('.json'));
    if (projectFile) {
      handleFileImport(projectFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  const allTemplates = [...OFFICIAL_TEMPLATES, ...userTemplates];
  const filteredTemplates = allTemplates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRecent = recentProjects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-background",
        isDragOver && "ring-2 ring-primary ring-inset"
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <img src="/favicon.png" alt="Schema Spark Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-2xl font-bold text-gradient">Schema Spark</h1>
              <p className="text-sm text-muted-foreground">Visual Entity-Relationship Diagram Tool</p>
            </div>
          </div>

          {/* Search and View Toggle */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects and templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Tabs defaultValue="start" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="start" className="gap-2">
                <Plus className="w-4 h-4" />
                New
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-2">
                <Clock className="w-4 h-4" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <LayoutTemplate className="w-4 h-4" />
                Templates
              </TabsTrigger>
            </TabsList>

            {/* New Project Tab */}
            <TabsContent value="start" className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Blank Project */}
                <button
                  onClick={handleCreateNewProject}
                  className="group p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-1">Blank Project</h3>
                  <p className="text-sm text-muted-foreground">Start with an empty canvas</p>
                </button>

                {/* Open File */}
                <label className="group p-6 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer text-left">
                  <input
                    type="file"
                    accept=".schemaspark,.json"
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                  <div className="w-12 h-12 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
                    <FolderOpen className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold mb-1">Open Project</h3>
                  <p className="text-sm text-muted-foreground">Open an existing .schemaspark file</p>
                </label>

                {/* Drag & Drop */}
                <div
                  className={cn(
                    "p-6 rounded-xl border-2 border-dashed transition-all text-left",
                    isDragOver
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  )}
                >
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">Drag & Drop</h3>
                  <p className="text-sm text-muted-foreground">Drop a project file here</p>
                </div>
              </div>

              {/* Popular Templates */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Popular Templates</h2>
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "flex flex-col"
                )}>
                  {OFFICIAL_TEMPLATES.slice(1).map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      viewMode={viewMode}
                      onSelect={() => handleTemplateSelect(template)}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Recent Projects Tab */}
            <TabsContent value="recent" className="space-y-4">
              {filteredRecent.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Recent Projects</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Projects you open will appear here
                  </p>
                  <Button onClick={handleCreateNewProject}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                </div>
              ) : (
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "flex flex-col"
                )}>
                  {filteredRecent.map((project) => (
                    <RecentProjectCard
                      key={project.id}
                      project={project}
                      viewMode={viewMode}
                      onRemove={() => removeFromRecent(project.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-6">
              {/* Official Templates */}
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-warning" />
                  Official Templates
                </h2>
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid'
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "flex flex-col"
                )}>
                  {filteredTemplates
                    .filter(t => t.category === 'official')
                    .map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        viewMode={viewMode}
                        onSelect={() => handleTemplateSelect(template)}
                      />
                    ))}
                </div>
              </div>

              {/* User Templates */}
              {userTemplates.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    My Templates
                  </h2>
                  <div className={cn(
                    "gap-4",
                    viewMode === 'grid'
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                      : "flex flex-col"
                  )}>
                    {filteredTemplates
                      .filter(t => t.category === 'user')
                      .map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          viewMode={viewMode}
                          onSelect={() => handleTemplateSelect(template)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

// Template Card Component
const TemplateCard = ({
  template,
  viewMode,
  onSelect,
}: {
  template: ProjectTemplate;
  viewMode: 'grid' | 'list';
  onSelect: () => void;
}) => {
  const icon = TEMPLATE_ICONS[template.id] || <FileJson className="w-6 h-6" />;

  if (viewMode === 'list') {
    return (
      <button
        onClick={onSelect}
        className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{template.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{template.description}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          {template.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      className="group p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
    >
      <div className="w-10 h-10 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
        <span className="text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </span>
      </div>
      <h3 className="font-semibold mb-1 truncate">{template.name}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{template.description}</p>
      <div className="flex flex-wrap gap-1">
        {template.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px]">
            {tag}
          </Badge>
        ))}
      </div>
    </button>
  );
};

// Recent Project Card Component
const RecentProjectCard = ({
  project,
  viewMode,
  onRemove,
}: {
  project: { id: string; name: string; lastOpenedAt: string };
  viewMode: 'grid' | 'list';
  onRemove: () => void;
}) => {
  const { openProject, setHomeScreen } = useProjectStore();
  const { setSchema } = useSchemaStore();

  const handleOpen = () => {
    // Try to load from autosave
    const autosaveData = localStorage.getItem(`schemaspark-autosave-${project.id}`);
    if (autosaveData) {
      try {
        const savedProject = JSON.parse(autosaveData);
        openProject(savedProject);
        setSchema(savedProject.schema);
      } catch {
        console.error('Failed to load autosaved project');
      }
    }
  };

  const timeAgo = formatDistanceToNow(new Date(project.lastOpenedAt), { addSuffix: true });

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/30 transition-all group">
        <button onClick={handleOpen} className="flex items-center gap-4 flex-1 text-left">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FileJson className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{project.name}</h3>
            <p className="text-xs text-muted-foreground">Opened {timeAgo}</p>
          </div>
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group relative p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all">
      <button onClick={handleOpen} className="w-full text-left">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-3">
          <FileJson className="w-5 h-5 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-1 truncate">{project.name}</h3>
        <p className="text-xs text-muted-foreground">Opened {timeAgo}</p>
      </button>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};
