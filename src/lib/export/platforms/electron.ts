// Electron Platform Adapter
import { PlatformAdapter } from '../types/platforms';
import { GeneratedFile, CanonicalIR, toSnakeCase, toKebabCase, toPascalCase, toCamelCase } from '../types/core';
import { FrameworkAdapter } from '../types/frameworks';
import { DatabaseAdapter } from '../types/databases';
import { ExportConfig } from '../types/config';

export const electronAdapter: PlatformAdapter = {
  id: 'electron',
  name: 'Electron',
  description: 'Cross-platform desktop applications',
  features: {
    ipc: true,
    filesystem: true,
    nativeModules: true,
    multiProcess: true,
    hotReload: true,
    bundling: true,
  },
  supportedFrameworks: ['express'],
  supportedDatabases: ['sqlite', 'postgresql', 'mysql'],
  
  generateProjectStructure(ir, frameworkAdapter, dbAdapter, config) {
    const files: GeneratedFile[] = [];
    const projectName = toKebabCase(config.projectName);
    const base = projectName;
    
    // Main process entry
    files.push({
      path: `${base}/src/main/index.ts`,
      content: generateMainProcess(ir, config),
      type: 'config',
    });
    
    // Preload script with IPC bridge
    files.push({
      path: `${base}/src/preload/index.ts`,
      content: generatePreloadScript(ir, config),
      type: 'config',
    });
    
    // IPC handlers
    files.push({
      path: `${base}/src/main/ipc/handlers.ts`,
      content: generateIPCHandlers(ir, config),
      type: 'controller',
    });
    
    // IPC type definitions
    files.push({
      path: `${base}/src/shared/ipc-types.ts`,
      content: generateIPCTypes(ir, config),
      type: 'schema',
    });
    
    // Database layer in main process
    files.push({
      path: `${base}/src/main/db/index.ts`,
      content: generateDBLayer(ir, dbAdapter, config),
      type: 'model',
    });
    
    // Models
    ir.tables.forEach(table => {
      files.push({
        path: `${base}/src/main/models/${toSnakeCase(table.originalName)}.ts`,
        content: generateElectronModel(table, dbAdapter, config),
        type: 'model',
      });
    });
    
    // Services with business logic
    ir.tables.forEach(table => {
      files.push({
        path: `${base}/src/main/services/${toSnakeCase(table.originalName)}.service.ts`,
        content: generateElectronService(table, ir, config),
        type: 'service',
      });
    });
    
    // Renderer API client (typed)
    files.push({
      path: `${base}/src/renderer/api/index.ts`,
      content: generateRendererAPI(ir, config),
      type: 'other',
    });
    
    return files;
  },
  
  generatePackageJson(config) {
    const projectName = toKebabCase(config.projectName);
    
    const pkg = {
      name: projectName,
      version: '1.0.0',
      description: `${config.projectName} - Electron Desktop Application`,
      main: 'dist/main/index.js',
      scripts: {
        start: 'electron .',
        dev: 'concurrently "npm run dev:main" "npm run dev:renderer"',
        'dev:main': 'tsc -w -p tsconfig.main.json',
        'dev:renderer': 'vite',
        build: 'npm run build:main && npm run build:renderer',
        'build:main': 'tsc -p tsconfig.main.json',
        'build:renderer': 'vite build',
        package: 'electron-builder',
        test: 'vitest',
      },
      dependencies: {
        'better-sqlite3': '^9.0.0',
      },
      devDependencies: {
        electron: '^28.0.0',
        'electron-builder': '^24.0.0',
        typescript: '^5.0.0',
        '@types/node': '^20.0.0',
        '@types/better-sqlite3': '^7.6.8',
        vite: '^5.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        concurrently: '^8.0.0',
        vitest: '^1.0.0',
      },
      build: {
        appId: `com.${projectName}.app`,
        productName: config.projectName,
        directories: {
          output: 'release',
        },
        files: [
          'dist/**/*',
          'node_modules/**/*',
        ],
      },
    };
    
    return {
      path: `${projectName}/package.json`,
      content: JSON.stringify(pkg, null, 2),
      type: 'config',
    };
  },
  
  generateTsConfig(config) {
    const projectName = toKebabCase(config.projectName);
    
    const mainConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        outDir: './dist/main',
        rootDir: './src/main',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
      },
      include: ['src/main/**/*', 'src/shared/**/*', 'src/preload/**/*'],
    };
    
    return {
      path: `${projectName}/tsconfig.main.json`,
      content: JSON.stringify(mainConfig, null, 2),
      type: 'config',
    };
  },
  
  generateBuildConfig(config) {
    const projectName = toKebabCase(config.projectName);
    
    return [
      {
        path: `${projectName}/electron-builder.yml`,
        content: `appId: com.${projectName}.app
productName: ${config.projectName}
directories:
  output: release
  buildResources: resources
files:
  - dist/**/*
  - node_modules/**/*
mac:
  category: public.app-category.developer-tools
  target: dmg
win:
  target: nsis
linux:
  target: AppImage
`,
        type: 'config',
      },
    ];
  },
  
  generateScripts(config) {
    return [];
  },
};

// Helper functions
function generateMainProcess(ir: CanonicalIR, config: ExportConfig): string {
  return `import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { initDatabase } from './db';
import { registerIPCHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  // Initialize database
  await initDatabase();
  
  // Register IPC handlers
  registerIPCHandlers();
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
`;
}

function generatePreloadScript(ir: CanonicalIR, config: ExportConfig): string {
  const channels = ir.tables.map(t => {
    const name = toCamelCase(t.originalName);
    return [
      `'${name}:getAll'`,
      `'${name}:getById'`,
      `'${name}:create'`,
      `'${name}:update'`,
      `'${name}:delete'`,
    ];
  }).flat();

  return `import { contextBridge, ipcRenderer } from 'electron';

const validChannels = [
  ${channels.join(',\n  ')}
] as const;

type ValidChannel = typeof validChannels[number];

const api = {
  invoke: async <T>(channel: ValidChannel, ...args: unknown[]): Promise<T> => {
    if (!validChannels.includes(channel)) {
      throw new Error(\`Invalid channel: \${channel}\`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  
  on: (channel: ValidChannel, callback: (...args: unknown[]) => void) => {
    if (!validChannels.includes(channel)) {
      throw new Error(\`Invalid channel: \${channel}\`);
    }
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  
  off: (channel: ValidChannel, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

// Type augmentation for renderer
declare global {
  interface Window {
    electronAPI: typeof api;
  }
}
`;
}

function generateIPCHandlers(ir: CanonicalIR, config: ExportConfig): string {
  const imports = ir.tables.map(t => {
    const serviceName = toCamelCase(t.originalName) + 'Service';
    const fileName = toSnakeCase(t.originalName);
    return `import { ${serviceName} } from '../services/${fileName}.service';`;
  }).join('\n');
  
  const handlers = ir.tables.map(t => {
    const name = toCamelCase(t.originalName);
    const serviceName = name + 'Service';
    
    return `
  // ${toPascalCase(t.originalName)} handlers
  ipcMain.handle('${name}:getAll', async () => {
    return ${serviceName}.getAll();
  });
  
  ipcMain.handle('${name}:getById', async (_, id: string) => {
    return ${serviceName}.getById(id);
  });
  
  ipcMain.handle('${name}:create', async (_, data) => {
    return ${serviceName}.create(data);
  });
  
  ipcMain.handle('${name}:update', async (_, id: string, data) => {
    return ${serviceName}.update(id, data);
  });
  
  ipcMain.handle('${name}:delete', async (_, id: string) => {
    return ${serviceName}.delete(id);
  });`;
  }).join('\n');

  return `import { ipcMain } from 'electron';
${imports}

export function registerIPCHandlers() {
${handlers}
}
`;
}

function generateIPCTypes(ir: CanonicalIR, config: ExportConfig): string {
  const types = ir.tables.map(t => {
    const name = toPascalCase(t.originalName);
    const fields = t.columns.map(c => {
      const tsType = mapToTSType(c.type);
      return `  ${toCamelCase(c.originalName)}${c.nullable ? '?' : ''}: ${tsType};`;
    }).join('\n');
    
    return `export interface ${name} {
${fields}
}

export interface Create${name}Input {
${t.columns.filter(c => !c.autoIncrement && !c.primaryKey).map(c => {
  const tsType = mapToTSType(c.type);
  return `  ${toCamelCase(c.originalName)}${c.nullable ? '?' : ''}: ${tsType};`;
}).join('\n')}
}

export interface Update${name}Input {
${t.columns.filter(c => !c.primaryKey).map(c => {
  const tsType = mapToTSType(c.type);
  return `  ${toCamelCase(c.originalName)}?: ${tsType};`;
}).join('\n')}
}`;
  }).join('\n\n');

  return `// Auto-generated IPC types - DO NOT EDIT
${types}
`;
}

function generateDBLayer(ir: CanonicalIR, dbAdapter: DatabaseAdapter, config: ExportConfig): string {
  return `import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function getDB(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initDatabase(): Promise<void> {
  const dbPath = path.join(app.getPath('userData'), '${toSnakeCase(config.projectName)}.db');
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // Run migrations
  await runMigrations();
}

async function runMigrations(): Promise<void> {
  // Create tables
${ir.tables.map(t => {
  const columns = t.columns.map(c => {
    let col = `${c.name} ${mapToSQLiteType(c.type)}`;
    if (c.primaryKey) col += ' PRIMARY KEY';
    if (c.autoIncrement) col += ' AUTOINCREMENT';
    if (!c.nullable && !c.primaryKey) col += ' NOT NULL';
    if (c.unique) col += ' UNIQUE';
    return col;
  }).join(', ');
  return `  db.exec(\`CREATE TABLE IF NOT EXISTS ${t.name} (${columns})\`);`;
}).join('\n')}
  
  console.log('Database initialized');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
}
`;
}

function generateElectronModel(table: any, dbAdapter: DatabaseAdapter, config: ExportConfig): string {
  const name = toPascalCase(table.originalName);
  const fields = table.columns.map((c: any) => {
    const tsType = mapToTSType(c.type);
    return `  ${toCamelCase(c.originalName)}${c.nullable ? '?' : ''}: ${tsType};`;
  }).join('\n');

  return `import { getDB } from '../db';

export interface ${name} {
${fields}
}

export const ${name}Model = {
  tableName: '${table.name}',
  
  findAll(): ${name}[] {
    const db = getDB();
    return db.prepare('SELECT * FROM ${table.name}').all() as ${name}[];
  },
  
  findById(id: string): ${name} | undefined {
    const db = getDB();
    return db.prepare('SELECT * FROM ${table.name} WHERE id = ?').get(id) as ${name} | undefined;
  },
  
  create(data: Omit<${name}, 'id'>): ${name} {
    const db = getDB();
    const id = crypto.randomUUID();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    db.prepare(\`INSERT INTO ${table.name} (id, \${keys.join(', ')}) VALUES (?, \${placeholders})\`)
      .run(id, ...values);
    
    return { id, ...data } as ${name};
  },
  
  update(id: string, data: Partial<${name}>): ${name} | undefined {
    const db = getDB();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(k => \`\${k} = ?\`).join(', ');
    
    db.prepare(\`UPDATE ${table.name} SET \${setClause} WHERE id = ?\`)
      .run(...values, id);
    
    return this.findById(id);
  },
  
  delete(id: string): boolean {
    const db = getDB();
    const result = db.prepare('DELETE FROM ${table.name} WHERE id = ?').run(id);
    return result.changes > 0;
  },
};
`;
}

function generateElectronService(table: any, ir: CanonicalIR, config: ExportConfig): string {
  const name = toPascalCase(table.originalName);
  const modelName = name + 'Model';
  const fileName = toSnakeCase(table.originalName);

  return `import { ${modelName}, ${name} } from '../models/${fileName}';

export const ${toCamelCase(table.originalName)}Service = {
  async getAll(): Promise<${name}[]> {
    return ${modelName}.findAll();
  },
  
  async getById(id: string): Promise<${name} | null> {
    const result = ${modelName}.findById(id);
    return result || null;
  },
  
  async create(data: Omit<${name}, 'id'>): Promise<${name}> {
    // Add validation logic here based on relationship rules
    return ${modelName}.create(data);
  },
  
  async update(id: string, data: Partial<${name}>): Promise<${name} | null> {
    // Add validation logic here
    return ${modelName}.update(id, data) || null;
  },
  
  async delete(id: string): Promise<boolean> {
    // Check relationship constraints before deletion
    return ${modelName}.delete(id);
  },
};
`;
}

function generateRendererAPI(ir: CanonicalIR, config: ExportConfig): string {
  const apis = ir.tables.map(t => {
    const name = toCamelCase(t.originalName);
    const typeName = toPascalCase(t.originalName);
    
    return `export const ${name}API = {
  getAll: () => window.electronAPI.invoke<${typeName}[]>('${name}:getAll'),
  getById: (id: string) => window.electronAPI.invoke<${typeName} | null>('${name}:getById', id),
  create: (data: Create${typeName}Input) => window.electronAPI.invoke<${typeName}>('${name}:create', data),
  update: (id: string, data: Update${typeName}Input) => window.electronAPI.invoke<${typeName} | null>('${name}:update', id, data),
  delete: (id: string) => window.electronAPI.invoke<boolean>('${name}:delete', id),
};`;
  }).join('\n\n');

  const imports = ir.tables.map(t => {
    const name = toPascalCase(t.originalName);
    return `${name}, Create${name}Input, Update${name}Input`;
  }).join(', ');

  return `// Auto-generated Renderer API - Type-safe IPC calls
import type { ${imports} } from '../../shared/ipc-types';

${apis}
`;
}

function mapToTSType(type: string): string {
  const mapping: Record<string, string> = {
    string: 'string',
    text: 'string',
    int: 'number',
    integer: 'number',
    float: 'number',
    boolean: 'boolean',
    date: 'string',
    datetime: 'string',
    uuid: 'string',
    json: 'Record<string, unknown>',
    decimal: 'number',
    bigint: 'bigint',
    binary: 'Buffer',
  };
  return mapping[type] || 'unknown';
}

function mapToSQLiteType(type: string): string {
  const mapping: Record<string, string> = {
    string: 'TEXT',
    text: 'TEXT',
    int: 'INTEGER',
    integer: 'INTEGER',
    float: 'REAL',
    boolean: 'INTEGER',
    date: 'TEXT',
    datetime: 'TEXT',
    uuid: 'TEXT',
    json: 'TEXT',
    decimal: 'REAL',
    bigint: 'INTEGER',
    binary: 'BLOB',
  };
  return mapping[type] || 'TEXT';
}
