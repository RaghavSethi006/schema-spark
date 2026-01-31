import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ERSchema, createEmptySchema } from './schema';
import { v4 as uuid } from 'uuid';

// Project file format (.schemaspark)
export interface ProjectFile {
  version: '1.0';
  id: string;
  name: string;
  description?: string;
  schema: ERSchema;
  uiState: {
    zoom: number;
    panX: number;
    panY: number;
    sidebarWidth: number;
    sidebarPosition: 'left' | 'right';
    sidebarCollapsed: boolean;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    lastOpenedAt: string;
    isTemplate?: boolean;
    isReadOnlyTemplate?: boolean;
    tags?: string[];
    author?: string;
  };
}

export interface RecentProject {
  id: string;
  name: string;
  lastOpenedAt: string;
  filePath?: string;
  thumbnailData?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'official' | 'user' | 'community';
  projectData: ProjectFile;
  thumbnailUrl?: string;
  tags: string[];
}

// Default templates
export const OFFICIAL_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start with an empty canvas',
    category: 'official',
    tags: ['starter'],
    projectData: createProjectFile('Untitled Project'),
  },
  {
    id: 'auth-system',
    name: 'Authentication System',
    description: 'User, Session, Role, and Permission entities',
    category: 'official',
    tags: ['auth', 'users', 'roles'],
    projectData: createAuthTemplate(),
  },
  {
    id: 'lms',
    name: 'Learning Management System',
    description: 'Course, Student, Enrollment, and Grade entities',
    category: 'official',
    tags: ['education', 'lms', 'courses'],
    projectData: createLMSTemplate(),
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Product, Order, Customer, and Payment entities',
    category: 'official',
    tags: ['store', 'products', 'orders'],
    projectData: createEcommerceTemplate(),
  },
  {
    id: 'crm',
    name: 'CRM System',
    description: 'Contact, Company, Deal, and Activity entities',
    category: 'official',
    tags: ['crm', 'sales', 'contacts'],
    projectData: createCRMTemplate(),
  },
];

function createProjectFile(name: string, schema?: ERSchema): ProjectFile {
  const now = new Date().toISOString();
  return {
    version: '1.0',
    id: uuid(),
    name,
    schema: schema || createEmptySchema(),
    uiState: {
      zoom: 1,
      panX: 0,
      panY: 0,
      sidebarWidth: 320,
      sidebarPosition: 'right',
      sidebarCollapsed: false,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    },
  };
}

function createAuthTemplate(): ProjectFile {
  const project = createProjectFile('Authentication System');
  project.schema.name = 'Authentication System';
  project.schema.entities = [
    {
      id: uuid(),
      name: 'User',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'password_hash', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
      ],
      position: { x: 100, y: 100 },
    },
    {
      id: uuid(),
      name: 'Role',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
      ],
      position: { x: 400, y: 100 },
    },
    {
      id: uuid(),
      name: 'Permission',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'resource', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
      ],
      position: { x: 700, y: 100 },
    },
  ];
  project.metadata.isTemplate = true;
  project.metadata.tags = ['auth', 'users', 'roles'];
  return project;
}

function createLMSTemplate(): ProjectFile {
  const project = createProjectFile('Learning Management System');
  project.schema.name = 'Learning Management System';
  project.schema.entities = [
    {
      id: uuid(),
      name: 'Student',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
      ],
      position: { x: 100, y: 100 },
    },
    {
      id: uuid(),
      name: 'Course',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'credits', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
      ],
      position: { x: 400, y: 100 },
    },
    {
      id: uuid(),
      name: 'Instructor',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'department', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
      ],
      position: { x: 700, y: 100 },
    },
  ];
  project.metadata.isTemplate = true;
  project.metadata.tags = ['education', 'lms', 'courses'];
  return project;
}

function createEcommerceTemplate(): ProjectFile {
  const project = createProjectFile('E-Commerce Store');
  project.schema.name = 'E-Commerce Store';
  project.schema.entities = [
    {
      id: uuid(),
      name: 'Product',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'price', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'stock', type: 'integer', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
      ],
      position: { x: 100, y: 100 },
    },
    {
      id: uuid(),
      name: 'Customer',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
      ],
      position: { x: 400, y: 100 },
    },
    {
      id: uuid(),
      name: 'Order',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'total', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'status', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'created_at', type: 'datetime', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
      ],
      position: { x: 700, y: 100 },
    },
  ];
  project.metadata.isTemplate = true;
  project.metadata.tags = ['store', 'products', 'orders'];
  return project;
}

function createCRMTemplate(): ProjectFile {
  const project = createProjectFile('CRM System');
  project.schema.name = 'CRM System';
  project.schema.entities = [
    {
      id: uuid(),
      name: 'Contact',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'email', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'phone', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
      ],
      position: { x: 100, y: 100 },
    },
    {
      id: uuid(),
      name: 'Company',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'name', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'industry', type: 'string', isPrimaryKey: false, isNullable: true, isUnique: false, isForeignKey: false },
      ],
      position: { x: 400, y: 100 },
    },
    {
      id: uuid(),
      name: 'Deal',
      fields: [
        { id: uuid(), name: 'id', type: 'uuid', isPrimaryKey: true, isNullable: false, isUnique: true, isForeignKey: false },
        { id: uuid(), name: 'title', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'value', type: 'float', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
        { id: uuid(), name: 'stage', type: 'string', isPrimaryKey: false, isNullable: false, isUnique: false, isForeignKey: false },
      ],
      position: { x: 700, y: 100 },
    },
  ];
  project.metadata.isTemplate = true;
  project.metadata.tags = ['crm', 'sales', 'contacts'];
  return project;
}

interface ProjectStore {
  // Current project state
  currentProject: ProjectFile | null;
  hasUnsavedChanges: boolean;
  isHomeScreen: boolean;

  // Recent projects (persisted)
  recentProjects: RecentProject[];
  userTemplates: ProjectTemplate[];

  // UI state
  sidebarWidth: number;
  sidebarPosition: 'left' | 'right';
  sidebarCollapsed: boolean;

  // Autosave
  lastAutosave: string | null;
  autosaveEnabled: boolean;

  // Actions
  createNewProject: (name?: string) => void;
  createFromTemplate: (template: ProjectTemplate) => void;
  openProject: (project: ProjectFile) => void;
  closeProject: () => void;
  saveProject: () => ProjectFile | null;
  markAsChanged: () => void;

  // Recent projects
  addToRecent: (project: RecentProject) => void;
  removeFromRecent: (id: string) => void;
  clearRecentProjects: () => void;

  // Templates
  saveAsTemplate: (name: string, description: string, tags: string[]) => void;
  deleteUserTemplate: (id: string) => void;

  // UI actions
  setSidebarWidth: (width: number) => void;
  setSidebarPosition: (position: 'left' | 'right') => void;
  toggleSidebar: () => void;
  setHomeScreen: (show: boolean) => void;

  // Autosave
  performAutosave: () => void;
  setAutosaveEnabled: (enabled: boolean) => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      currentProject: null,
      hasUnsavedChanges: false,
      isHomeScreen: true,
      recentProjects: [],
      userTemplates: [],
      sidebarWidth: 320,
      sidebarPosition: 'right',
      sidebarCollapsed: false,
      lastAutosave: null,
      autosaveEnabled: true,

      createNewProject: (name = 'Untitled Project') => {
        const project = createProjectFile(name);
        set({
          currentProject: project,
          hasUnsavedChanges: false,
          isHomeScreen: false,
        });
      },

      createFromTemplate: (template) => {
        const project = JSON.parse(JSON.stringify(template.projectData)) as ProjectFile;
        project.id = uuid();
        project.metadata.createdAt = new Date().toISOString();
        project.metadata.updatedAt = new Date().toISOString();
        project.metadata.lastOpenedAt = new Date().toISOString();
        project.metadata.isTemplate = false;
        project.metadata.isReadOnlyTemplate = false;
        set({
          currentProject: project,
          hasUnsavedChanges: false,
          isHomeScreen: false,
        });
      },

      openProject: (project) => {
        project.metadata.lastOpenedAt = new Date().toISOString();
        set({
          currentProject: project,
          hasUnsavedChanges: false,
          isHomeScreen: false,
        });
        get().addToRecent({
          id: project.id,
          name: project.name,
          lastOpenedAt: project.metadata.lastOpenedAt,
        });
      },

      closeProject: () => {
        set({
          currentProject: null,
          hasUnsavedChanges: false,
          isHomeScreen: true,
        });
      },

      saveProject: () => {
        const { currentProject } = get();
        if (!currentProject) return null;

        currentProject.metadata.updatedAt = new Date().toISOString();
        set({ hasUnsavedChanges: false });
        return currentProject;
      },

      markAsChanged: () => {
        set({ hasUnsavedChanges: true });
      },

      addToRecent: (project) => {
        set((state) => {
          const filtered = state.recentProjects.filter(p => p.id !== project.id);
          return {
            recentProjects: [project, ...filtered].slice(0, 10)
          };
        });
      },

      removeFromRecent: (id) => {
        set((state) => ({
          recentProjects: state.recentProjects.filter(p => p.id !== id),
        }));
      },

      clearRecentProjects: () => {
        set({ recentProjects: [] });
      },

      saveAsTemplate: (name, description, tags) => {
        const { currentProject } = get();
        if (!currentProject) return;

        const template: ProjectTemplate = {
          id: uuid(),
          name,
          description,
          category: 'user',
          tags,
          projectData: JSON.parse(JSON.stringify(currentProject)),
        };
        template.projectData.metadata.isTemplate = true;

        set((state) => ({
          userTemplates: [...state.userTemplates, template],
        }));
      },

      deleteUserTemplate: (id) => {
        set((state) => ({
          userTemplates: state.userTemplates.filter(t => t.id !== id),
        }));
      },

      setSidebarWidth: (width) => {
        set({ sidebarWidth: width });
      },

      setSidebarPosition: (position) => {
        set({ sidebarPosition: position });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setHomeScreen: (show) => {
        set({ isHomeScreen: show });
      },

      performAutosave: () => {
        const { currentProject, hasUnsavedChanges, autosaveEnabled } = get();
        if (!currentProject || !hasUnsavedChanges || !autosaveEnabled) return;

        const saved = get().saveProject();
        if (saved) {
          set({ lastAutosave: new Date().toISOString() });
          // Store in localStorage
          localStorage.setItem(`schemaspark-autosave-${saved.id}`, JSON.stringify(saved));
        }
      },

      setAutosaveEnabled: (enabled) => {
        set({ autosaveEnabled: enabled });
      },
    }),
    {
      name: 'schemaspark-project-store',
      partialize: (state) => ({
        recentProjects: state.recentProjects,
        userTemplates: state.userTemplates,
        sidebarWidth: state.sidebarWidth,
        sidebarPosition: state.sidebarPosition,
        autosaveEnabled: state.autosaveEnabled,
      } as ProjectStore),
    }
  )
);

// File export/import utilities
export const exportProjectFile = (project: ProjectFile): void => {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.schemaspark`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importProjectFile = (file: File): Promise<ProjectFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const project = JSON.parse(content) as ProjectFile;

        // Validate
        if (!project.version || !project.id || !project.schema) {
          throw new Error('Invalid project file format');
        }

        resolve(project);
      } catch (error) {
        reject(new Error('Failed to parse project file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
