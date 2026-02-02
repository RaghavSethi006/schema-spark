// Export Configuration Types
import { FrameworkType, ORMType } from './frameworks';
import { DatabaseType, DatabaseCategory } from './databases';
import { PlatformType } from './platforms';

// ============= Export Configuration =============

export interface ExportConfig {
  // Platform & Framework
  platform: PlatformType;
  framework: FrameworkType;
  database: DatabaseType;
  databaseCategory: DatabaseCategory;
  orm?: ORMType;
  
  // Project settings
  projectName: string;
  
  // Code generation options
  generateControllers: boolean;
  generateServices: boolean;
  generateTests: boolean;
  generateMigrations: boolean;
  generateDocker: boolean;
  generateReadme: boolean;
  
  // Naming conventions
  namingConvention: 'snake_case' | 'camelCase' | 'PascalCase';
  tablePluralizer: boolean;
  
  // Auth & boilerplate
  includeAuthBoilerplate: boolean;
  includeCorsSetup: boolean;
  includeSwaggerDocs: boolean;
  
  // Electron-specific
  electronConfig?: {
    contextIsolation: boolean;
    generateIPC: boolean;
    generatePreload: boolean;
  };
  
  // NoSQL-specific
  noSQLConfig?: {
    embeddingStrategy: 'embed' | 'reference' | 'hybrid';
    denormalize: boolean;
  };
  
  // Advanced
  customTemplates?: Record<string, string>;
}

// ============= Export Preset =============

export interface ExportPreset {
  id: string;
  name: string;
  description: string;
  config: ExportConfig;
  isBuiltIn: boolean;
  createdAt: string;
  tags?: string[];
}

// ============= Compatibility Matrix =============

export interface CompatibilityEntry {
  framework: FrameworkType;
  databases: DatabaseType[];
  platforms: PlatformType[];
  orms: ORMType[];
}

export const compatibilityMatrix: CompatibilityEntry[] = [
  // Python
  { 
    framework: 'fastapi', 
    databases: ['postgresql', 'mysql', 'sqlite', 'mongodb'], 
    platforms: ['nodejs'], 
    orms: ['sqlalchemy', 'tortoise'] 
  },
  { 
    framework: 'django', 
    databases: ['postgresql', 'mysql', 'sqlite', 'oracle'], 
    platforms: ['nodejs'], 
    orms: ['django-orm'] 
  },
  { 
    framework: 'flask', 
    databases: ['postgresql', 'mysql', 'sqlite', 'mongodb'], 
    platforms: ['nodejs'], 
    orms: ['sqlalchemy'] 
  },
  // JavaScript/TypeScript
  { 
    framework: 'express', 
    databases: ['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis'], 
    platforms: ['nodejs', 'electron'], 
    orms: ['prisma', 'typeorm', 'sequelize', 'knex', 'mongoose'] 
  },
  { 
    framework: 'nestjs', 
    databases: ['postgresql', 'mysql', 'sqlite', 'mongodb'], 
    platforms: ['nodejs'], 
    orms: ['typeorm', 'prisma', 'mongoose'] 
  },
  { 
    framework: 'fastify', 
    databases: ['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis'], 
    platforms: ['nodejs'], 
    orms: ['prisma', 'typeorm', 'knex'] 
  },
  { 
    framework: 'nextjs', 
    databases: ['postgresql', 'mysql', 'sqlite', 'mongodb'], 
    platforms: ['nodejs'], 
    orms: ['prisma', 'drizzle'] 
  },
  { 
    framework: 'koa', 
    databases: ['postgresql', 'mysql', 'sqlite', 'mongodb'], 
    platforms: ['nodejs'], 
    orms: ['sequelize', 'knex'] 
  },
  // Java
  { 
    framework: 'spring-boot', 
    databases: ['postgresql', 'mysql', 'oracle', 'sqlserver', 'mongodb'], 
    platforms: ['nodejs'], 
    orms: ['jpa', 'hibernate'] 
  },
  // C#
  { 
    framework: 'aspnet-core', 
    databases: ['postgresql', 'mysql', 'sqlserver', 'sqlite'], 
    platforms: ['nodejs'], 
    orms: ['ef-core'] 
  },
  // PHP
  { 
    framework: 'laravel', 
    databases: ['postgresql', 'mysql', 'sqlite', 'sqlserver'], 
    platforms: ['nodejs'], 
    orms: ['eloquent'] 
  },
  // Ruby
  { 
    framework: 'rails', 
    databases: ['postgresql', 'mysql', 'sqlite'], 
    platforms: ['nodejs'], 
    orms: ['activerecord'] 
  },
  // Rust
  { 
    framework: 'actix', 
    databases: ['postgresql', 'mysql', 'sqlite'], 
    platforms: ['nodejs'], 
    orms: ['sqlx', 'diesel', 'sea-orm'] 
  },
  { 
    framework: 'axum', 
    databases: ['postgresql', 'mysql', 'sqlite'], 
    platforms: ['nodejs'], 
    orms: ['sqlx', 'sea-orm'] 
  },
  { 
    framework: 'rocket', 
    databases: ['postgresql', 'mysql', 'sqlite'], 
    platforms: ['nodejs'], 
    orms: ['diesel', 'sqlx'] 
  },
  // Go
  { 
    framework: 'gin', 
    databases: ['postgresql', 'mysql', 'sqlite', 'mongodb'], 
    platforms: ['nodejs'], 
    orms: ['gorm'] 
  },
  // Elixir
  { 
    framework: 'phoenix', 
    databases: ['postgresql', 'mysql', 'sqlite'], 
    platforms: ['nodejs'], 
    orms: ['ecto'] 
  },
];

// ============= Compatibility Helpers =============

export const isCompatible = (
  framework: FrameworkType, 
  database: DatabaseType, 
  platform: PlatformType
): boolean => {
  const entry = compatibilityMatrix.find(e => e.framework === framework);
  if (!entry) return false;
  return entry.databases.includes(database) && entry.platforms.includes(platform);
};

export const getSupportedDatabases = (framework: FrameworkType): DatabaseType[] => {
  const entry = compatibilityMatrix.find(e => e.framework === framework);
  return entry?.databases || [];
};

export const getSupportedORMs = (framework: FrameworkType): ORMType[] => {
  const entry = compatibilityMatrix.find(e => e.framework === framework);
  return entry?.orms || [];
};

export const getSupportedPlatforms = (framework: FrameworkType): PlatformType[] => {
  const entry = compatibilityMatrix.find(e => e.framework === framework);
  return entry?.platforms || [];
};
