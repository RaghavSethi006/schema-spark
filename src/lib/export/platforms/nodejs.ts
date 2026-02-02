// Node.js Platform Adapter
import { PlatformAdapter, PlatformType } from '../types/platforms';
import { GeneratedFile, CanonicalIR, toSnakeCase, toKebabCase } from '../types/core';
import { FrameworkAdapter } from '../types/frameworks';
import { DatabaseAdapter } from '../types/databases';
import { ExportConfig } from '../types/config';

export const nodejsAdapter: PlatformAdapter = {
  id: 'nodejs',
  name: 'Node.js',
  description: 'Server-side JavaScript runtime',
  features: {
    ipc: false,
    filesystem: true,
    nativeModules: true,
    multiProcess: true,
    hotReload: true,
    bundling: false,
  },
  supportedFrameworks: ['express', 'nestjs', 'fastify', 'koa', 'nextjs'],
  supportedDatabases: ['postgresql', 'mysql', 'sqlite', 'mongodb', 'redis'],
  
  generateProjectStructure(ir, frameworkAdapter, dbAdapter, config) {
    const files: GeneratedFile[] = [];
    const projectName = toKebabCase(config.projectName);
    
    // Let framework adapter generate its files
    // This is called by the pipeline
    return files;
  },
  
  generatePackageJson(config) {
    const projectName = toKebabCase(config.projectName);
    const isTypeScript = ['express', 'nestjs', 'fastify', 'koa'].includes(config.framework);
    
    const pkg = {
      name: projectName,
      version: '1.0.0',
      description: `Generated ${config.framework} project`,
      main: isTypeScript ? 'dist/index.js' : 'src/index.js',
      scripts: {
        start: isTypeScript ? 'node dist/index.js' : 'node src/index.js',
        dev: isTypeScript ? 'ts-node-dev --respawn src/index.ts' : 'nodemon src/index.js',
        build: isTypeScript ? 'tsc' : 'echo "No build step needed"',
        test: 'jest',
        lint: 'eslint src --ext .ts,.js',
      },
      dependencies: {} as Record<string, string>,
      devDependencies: {} as Record<string, string>,
    };
    
    // Add framework-specific deps
    if (config.framework === 'express') {
      pkg.dependencies['express'] = '^4.18.2';
      pkg.dependencies['cors'] = '^2.8.5';
      if (isTypeScript) {
        pkg.devDependencies['@types/express'] = '^4.17.21';
        pkg.devDependencies['@types/cors'] = '^2.8.17';
      }
    }
    
    // Add ORM deps based on database
    if (config.orm === 'prisma') {
      pkg.dependencies['@prisma/client'] = '^5.0.0';
      pkg.devDependencies['prisma'] = '^5.0.0';
    }
    
    if (isTypeScript) {
      pkg.devDependencies['typescript'] = '^5.0.0';
      pkg.devDependencies['ts-node-dev'] = '^2.0.0';
      pkg.devDependencies['@types/node'] = '^20.0.0';
    }
    
    return {
      path: `${projectName}/package.json`,
      content: JSON.stringify(pkg, null, 2),
      type: 'config',
    };
  },
  
  generateTsConfig(config) {
    const projectName = toKebabCase(config.projectName);
    
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'commonjs',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };
    
    return {
      path: `${projectName}/tsconfig.json`,
      content: JSON.stringify(tsconfig, null, 2),
      type: 'config',
    };
  },
  
  generateBuildConfig(config) {
    return [];
  },
  
  generateScripts(config) {
    const projectName = toKebabCase(config.projectName);
    
    return [
      {
        path: `${projectName}/.env.example`,
        content: `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/${projectName}"

# Server
PORT=3000
NODE_ENV=development

# JWT (if auth enabled)
JWT_SECRET=your-secret-key-here
`,
        type: 'config',
      },
    ];
  },
};
