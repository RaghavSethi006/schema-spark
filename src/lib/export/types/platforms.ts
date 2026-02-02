// Platform Layer Types - Runtime & Deployment Targets
import { GeneratedFile, CanonicalIR } from './core';
import { DatabaseAdapter } from './databases';
import { FrameworkAdapter } from './frameworks';
import { ExportConfig } from './config';

// ============= Platform Types =============

export type PlatformType = 
  | 'nodejs'      // Node.js server runtime
  | 'electron'    // Desktop application
  | 'browser'     // Browser-based (future)
  | 'serverless'; // Serverless functions (future)

export interface PlatformFeatures {
  ipc: boolean;           // Inter-process communication
  filesystem: boolean;    // Direct filesystem access
  nativeModules: boolean; // Can use native Node modules
  multiProcess: boolean;  // Multi-process architecture
  hotReload: boolean;     // Hot module replacement
  bundling: boolean;      // Requires bundling
}

export interface PlatformAdapter {
  id: PlatformType;
  name: string;
  description: string;
  features: PlatformFeatures;
  supportedFrameworks: string[];
  supportedDatabases: string[];
  
  // Platform-specific generation
  generateProjectStructure: (
    ir: CanonicalIR,
    frameworkAdapter: FrameworkAdapter,
    dbAdapter: DatabaseAdapter,
    config: ExportConfig
  ) => GeneratedFile[];
  
  // Platform config files
  generatePackageJson: (config: ExportConfig) => GeneratedFile;
  generateTsConfig: (config: ExportConfig) => GeneratedFile;
  generateBuildConfig: (config: ExportConfig) => GeneratedFile[];
  generateScripts: (config: ExportConfig) => GeneratedFile[];
}

// ============= Electron-Specific Types =============

export interface ElectronConfig {
  contextIsolation: boolean;
  nodeIntegration: boolean;
  sandbox: boolean;
  preloadScript: boolean;
  ipcHandlers: IPCHandler[];
}

export interface IPCHandler {
  channel: string;
  direction: 'main-to-renderer' | 'renderer-to-main' | 'bidirectional';
  payload?: string;
  returnType?: string;
}

// ============= Node.js-Specific Types =============

export interface NodeConfig {
  runtime: 'node' | 'bun' | 'deno';
  moduleSystem: 'esm' | 'commonjs';
  typescript: boolean;
}
