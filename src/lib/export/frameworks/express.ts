import { FrameworkAdapter, DatabaseAdapter, ExportConfig, GeneratedFile, CanonicalIR, IRTable, toSnakeCase, toPascalCase, toCamelCase, pluralize } from '../types';

const getTsType = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    string: 'string',
    text: 'string',
    int: 'number',
    float: 'number',
    boolean: 'boolean',
    date: 'Date',
    datetime: 'Date',
    uuid: 'string',
    json: 'Record<string, any>',
    decimal: 'number',
    bigint: 'bigint',
    binary: 'Buffer',
  };
  return typeMap[fieldType] || 'string';
};

const getPrismaType = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    string: 'String',
    text: 'String',
    int: 'Int',
    float: 'Float',
    boolean: 'Boolean',
    date: 'DateTime',
    datetime: 'DateTime',
    uuid: 'String',
    json: 'Json',
    decimal: 'Decimal',
    bigint: 'BigInt',
    binary: 'Bytes',
  };
  return typeMap[fieldType] || 'String';
};

const generatePrismaSchema = (ir: CanonicalIR, dbAdapter: DatabaseAdapter): string => {
  const provider = dbAdapter.id === 'postgresql' ? 'postgresql' 
    : dbAdapter.id === 'mysql' || dbAdapter.id === 'mariadb' ? 'mysql'
    : 'sqlite';

  const models = ir.tables.map(table => {
    const modelName = toPascalCase(table.originalName);
    
    const fields = table.columns.map(col => {
      const fieldName = toCamelCase(col.name);
      let prismaType = getPrismaType(col.type);
      const attributes: string[] = [];

      if (col.primaryKey) {
        attributes.push('@id');
        if (col.type === 'uuid') {
          attributes.push('@default(uuid())');
        } else if (col.autoIncrement) {
          attributes.push('@default(autoincrement())');
        }
      }
      
      if (col.unique && !col.primaryKey) {
        attributes.push('@unique');
      }
      
      if (col.nullable) {
        prismaType += '?';
      }

      if (col.references) {
        const refModel = toPascalCase(col.references.table);
        return `  ${toCamelCase(col.references.table)} ${refModel}? @relation(fields: [${fieldName}], references: [${toCamelCase(col.references.column)}])
  ${fieldName} ${prismaType}${col.nullable ? '?' : ''}`;
      }

      const attrStr = attributes.length > 0 ? ' ' + attributes.join(' ') : '';
      return `  ${fieldName} ${prismaType}${attrStr}`;
    });

    // Add reverse relations
    const reverseRelations: string[] = [];
    ir.relationships.forEach(rel => {
      if (rel.targetTable === table.name) {
        const sourceModel = toPascalCase(rel.sourceTable);
        reverseRelations.push(`  ${toCamelCase(pluralize(rel.sourceTable))} ${sourceModel}[]`);
      }
    });

    return `model ${modelName} {
${fields.join('\n')}
${reverseRelations.length > 0 ? '\n' + reverseRelations.join('\n') : ''}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("${toSnakeCase(table.name)}")
}`;
  });

  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${provider}"
  url      = env("DATABASE_URL")
}

${models.join('\n\n')}
`;
};

const generateModel = (table: IRTable): string => {
  const className = toPascalCase(table.originalName);
  
  const fields = table.columns.map(col => {
    const fieldName = toCamelCase(col.name);
    const tsType = getTsType(col.type);
    return `  ${fieldName}${col.nullable && !col.primaryKey ? '?' : ''}: ${tsType};`;
  });

  return `export interface ${className} {
${fields.join('\n')}
  createdAt: Date;
  updatedAt: Date;
}

export type Create${className}Input = Omit<${className}, 'id' | 'createdAt' | 'updatedAt'>;
export type Update${className}Input = Partial<Create${className}Input>;
`;
};

const generateService = (table: IRTable): string => {
  const className = toPascalCase(table.originalName);
  const varName = toCamelCase(table.originalName);

  return `import { PrismaClient } from '@prisma/client';
import { Create${className}Input, Update${className}Input } from '../models/${toSnakeCase(table.originalName)}';

const prisma = new PrismaClient();

export const ${varName}Service = {
  async findAll() {
    return prisma.${varName}.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string | number) {
    return prisma.${varName}.findUnique({
      where: { id: typeof id === 'string' ? id : Number(id) },
    });
  },

  async create(data: Create${className}Input) {
    return prisma.${varName}.create({ data });
  },

  async update(id: string | number, data: Update${className}Input) {
    return prisma.${varName}.update({
      where: { id: typeof id === 'string' ? id : Number(id) },
      data,
    });
  },

  async delete(id: string | number) {
    return prisma.${varName}.delete({
      where: { id: typeof id === 'string' ? id : Number(id) },
    });
  },
};
`;
};

const generateController = (table: IRTable): string => {
  const className = toPascalCase(table.originalName);
  const varName = toCamelCase(table.originalName);
  const routeName = pluralize(toSnakeCase(table.originalName)).replace(/_/g, '-');

  return `import { Router, Request, Response } from 'express';
import { ${varName}Service } from '../services/${toSnakeCase(table.originalName)}.service';

const router = Router();

// GET /${routeName}
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await ${varName}Service.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ${pluralize(table.originalName)}' });
  }
});

// GET /${routeName}/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const item = await ${varName}Service.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: '${className} not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ${table.originalName}' });
  }
});

// POST /${routeName}
router.post('/', async (req: Request, res: Response) => {
  try {
    const item = await ${varName}Service.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ${table.originalName}' });
  }
});

// PUT /${routeName}/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const item = await ${varName}Service.update(req.params.id, req.body);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ${table.originalName}' });
  }
});

// DELETE /${routeName}/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await ${varName}Service.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete ${table.originalName}' });
  }
});

export default router;
`;
};

const generateApp = (ir: CanonicalIR, config: ExportConfig): string => {
  const imports = ir.tables.map(t => 
    `import ${toCamelCase(t.originalName)}Router from './controllers/${toSnakeCase(t.originalName)}.controller';`
  ).join('\n');
  
  const routes = ir.tables.map(t => {
    const routeName = pluralize(toSnakeCase(t.originalName)).replace(/_/g, '-');
    return `app.use('/api/${routeName}', ${toCamelCase(t.originalName)}Router);`;
  }).join('\n');

  return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
${imports}

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
${routes}

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});

export default app;
`;
};

const generatePackageJson = (config: ExportConfig): string => {
  return JSON.stringify({
    name: toSnakeCase(config.projectName).replace(/_/g, '-'),
    version: '1.0.0',
    main: 'dist/app.js',
    scripts: {
      dev: 'ts-node-dev --respawn src/app.ts',
      build: 'tsc',
      start: 'node dist/app.js',
      'prisma:generate': 'prisma generate',
      'prisma:migrate': 'prisma migrate dev',
    },
    dependencies: {
      '@prisma/client': '^5.0.0',
      cors: '^2.8.5',
      express: '^4.18.0',
      helmet: '^7.0.0',
      morgan: '^1.10.0',
    },
    devDependencies: {
      '@types/cors': '^2.8.0',
      '@types/express': '^4.17.0',
      '@types/morgan': '^1.9.0',
      '@types/node': '^20.0.0',
      prisma: '^5.0.0',
      'ts-node-dev': '^2.0.0',
      typescript: '^5.0.0',
    },
  }, null, 2);
};

export const expressAdapter: FrameworkAdapter = {
  id: 'express',
  name: 'Express.js + Prisma',
  language: 'typescript',
  description: 'Minimalist Node.js framework with Prisma ORM',
  features: {
    orm: 'Prisma',
    migrations: true,
    validation: true,
    authentication: false,
    swagger: false,
    graphql: false,
    testing: true,
    docker: true,
  },
  supportedDatabases: ['postgresql', 'mysql', 'sqlite', 'sqlserver'],

  generateProject: (schema, dbAdapter, config) => {
    const ir = schema as unknown as CanonicalIR;
    const projectName = toSnakeCase(config.projectName).replace(/_/g, '-');
    const files: GeneratedFile[] = [];

    // Prisma schema
    files.push({ 
      path: `${projectName}/prisma/schema.prisma`, 
      content: generatePrismaSchema(ir, dbAdapter), 
      type: 'model' 
    });

    // Generate per-entity files
    ir.tables.forEach(table => {
      files.push({ 
        path: `${projectName}/src/models/${toSnakeCase(table.originalName)}.ts`, 
        content: generateModel(table), 
        type: 'model' 
      });
      files.push({ 
        path: `${projectName}/src/services/${toSnakeCase(table.originalName)}.service.ts`, 
        content: generateService(table), 
        type: 'service' 
      });
      files.push({ 
        path: `${projectName}/src/controllers/${toSnakeCase(table.originalName)}.controller.ts`, 
        content: generateController(table), 
        type: 'controller' 
      });
    });

    // App entry
    files.push({ path: `${projectName}/src/app.ts`, content: generateApp(ir, config), type: 'config' });
    files.push({ path: `${projectName}/package.json`, content: generatePackageJson(config), type: 'config' });
    files.push({ 
      path: `${projectName}/tsconfig.json`, 
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          lib: ['ES2020'],
          outDir: './dist',
          rootDir: './src',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ['src/**/*'],
        exclude: ['node_modules'],
      }, null, 2), 
      type: 'config' 
    });
    files.push({ 
      path: `${projectName}/.env.example`, 
      content: `DATABASE_URL="${dbAdapter.id === 'postgresql' ? 'postgresql://user:password@localhost:5432/dbname' : dbAdapter.id === 'mysql' ? 'mysql://user:password@localhost:3306/dbname' : 'file:./dev.db'}"
PORT=3000`, 
      type: 'config' 
    });

    return files;
  },

  getModelFileName: (entityName) => `${toSnakeCase(entityName)}.ts`,
  getControllerFileName: (entityName) => `${toSnakeCase(entityName)}.controller.ts`,
  getSchemaFileName: (entityName) => `${toSnakeCase(entityName)}.schema.ts`,
  getServiceFileName: (entityName) => `${toSnakeCase(entityName)}.service.ts`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}_create_${toSnakeCase(entityName)}.ts`,
};
