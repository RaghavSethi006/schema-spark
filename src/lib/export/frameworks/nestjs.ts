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

const getTypeOrmType = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    string: 'varchar',
    text: 'text',
    int: 'int',
    float: 'float',
    boolean: 'boolean',
    date: 'date',
    datetime: 'timestamp',
    uuid: 'uuid',
    json: 'jsonb',
    decimal: 'decimal',
    bigint: 'bigint',
    binary: 'bytea',
  };
  return typeMap[fieldType] || 'varchar';
};

const generateEntity = (table: IRTable, ir: CanonicalIR): string => {
  const className = toPascalCase(table.originalName);
  const tableName = toSnakeCase(table.name);

  const columns = table.columns.map(col => {
    const propName = toCamelCase(col.name);
    const tsType = getTsType(col.type);
    const decorators: string[] = [];

    if (col.primaryKey) {
      if (col.type === 'uuid') {
        decorators.push(`@PrimaryGeneratedColumn('uuid')`);
      } else {
        decorators.push('@PrimaryGeneratedColumn()');
      }
    } else if (col.references) {
      const refEntity = toPascalCase(col.references.table);
      decorators.push(`@ManyToOne(() => ${refEntity}, { onDelete: '${col.references.onDelete || 'CASCADE'}' })`);
      decorators.push(`@JoinColumn({ name: '${toSnakeCase(col.name)}' })`);
    } else {
      const colOpts: string[] = [`type: '${getTypeOrmType(col.type)}'`];
      if (col.nullable) colOpts.push('nullable: true');
      if (col.unique) colOpts.push('unique: true');
      if (col.default) colOpts.push(`default: ${col.default}`);
      decorators.push(`@Column({ ${colOpts.join(', ')} })`);
    }

    return `  ${decorators.join('\n  ')}
  ${propName}: ${tsType};`;
  });

  // Add relationships
  const relationships: string[] = [];
  ir.relationships.forEach(rel => {
    if (rel.sourceTable === table.name && rel.type !== 'many-to-many') {
      const relEntity = toPascalCase(rel.targetTable);
      const relProp = toCamelCase(pluralize(rel.targetTable));
      relationships.push(`  @OneToMany(() => ${relEntity}, (${toCamelCase(rel.targetTable)}) => ${toCamelCase(rel.targetTable)}.${toCamelCase(table.name)})
  ${relProp}: ${relEntity}[];`);
    }
  });

  return `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('${tableName}')
export class ${className} {
${columns.join('\n\n')}
${relationships.length > 0 ? '\n' + relationships.join('\n\n') : ''}

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
`;
};

const generateDto = (table: IRTable): string => {
  const className = toPascalCase(table.originalName);
  
  const createFields = table.columns
    .filter(col => !col.primaryKey && !col.autoIncrement)
    .map(col => {
      const propName = toCamelCase(col.name);
      const tsType = getTsType(col.type);
      const decorators: string[] = [];
      
      if (!col.nullable) {
        decorators.push('@IsNotEmpty()');
      } else {
        decorators.push('@IsOptional()');
      }
      
      if (col.type === 'string' || (col.type as string) === 'text') {
        decorators.push('@IsString()');
      } else if (col.type === 'integer' || (col.type as string) === 'bigint') {
        decorators.push('@IsInt()');
      } else if (col.type === 'float' || (col.type as string) === 'decimal') {
        decorators.push('@IsNumber()');
      } else if (col.type === 'boolean') {
        decorators.push('@IsBoolean()');
      } else if (col.type === 'uuid') {
        decorators.push('@IsUUID()');
      } else if (col.type === 'date' || col.type === 'datetime') {
        decorators.push('@IsDateString()');
      }
      
      return `  ${decorators.join('\n  ')}
  ${propName}${col.nullable ? '?' : ''}: ${tsType};`;
    });

  const updateFields = table.columns
    .filter(col => !col.primaryKey && !col.autoIncrement)
    .map(col => {
      const propName = toCamelCase(col.name);
      const tsType = getTsType(col.type);
      return `  @IsOptional()
  ${propName}?: ${tsType};`;
    });

  return `import { IsString, IsInt, IsNumber, IsBoolean, IsOptional, IsNotEmpty, IsUUID, IsDateString } from 'class-validator';

export class Create${className}Dto {
${createFields.join('\n\n')}
}

export class Update${className}Dto {
${updateFields.join('\n\n')}
}
`;
};

const generateService = (table: IRTable): string => {
  const className = toPascalCase(table.originalName);
  const varName = toCamelCase(table.originalName);
  const pkCol = table.columns.find(c => c.primaryKey);
  const pkType = pkCol && pkCol.type === 'uuid' ? 'string' : 'number';

  return `import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ${className} } from './entities/${toSnakeCase(table.originalName)}.entity';
import { Create${className}Dto, Update${className}Dto } from './dto/${toSnakeCase(table.originalName)}.dto';

@Injectable()
export class ${className}Service {
  constructor(
    @InjectRepository(${className})
    private readonly ${varName}Repository: Repository<${className}>,
  ) {}

  async findAll(): Promise<${className}[]> {
    return this.${varName}Repository.find();
  }

  async findOne(id: ${pkType}): Promise<${className}> {
    const ${varName} = await this.${varName}Repository.findOne({ where: { id } as any });
    if (!${varName}) {
      throw new NotFoundException(\`${className} with ID \${id} not found\`);
    }
    return ${varName};
  }

  async create(dto: Create${className}Dto): Promise<${className}> {
    const ${varName} = this.${varName}Repository.create(dto);
    return this.${varName}Repository.save(${varName});
  }

  async update(id: ${pkType}, dto: Update${className}Dto): Promise<${className}> {
    const ${varName} = await this.findOne(id);
    Object.assign(${varName}, dto);
    return this.${varName}Repository.save(${varName});
  }

  async remove(id: ${pkType}): Promise<void> {
    const result = await this.${varName}Repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(\`${className} with ID \${id} not found\`);
    }
  }
}
`;
};

const generateController = (table: IRTable): string => {
  const className = toPascalCase(table.originalName);
  const varName = toCamelCase(table.originalName);
  const routeName = pluralize(toSnakeCase(table.originalName));
  const pkCol = table.columns.find(c => c.primaryKey);
  const pkType = pkCol && pkCol.type === 'uuid' ? 'string' : 'number';

  return `import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ${className}Service } from './${toSnakeCase(table.originalName)}.service';
import { Create${className}Dto, Update${className}Dto } from './dto/${toSnakeCase(table.originalName)}.dto';
import { ${className} } from './entities/${toSnakeCase(table.originalName)}.entity';

@ApiTags('${className}')
@Controller('${routeName}')
export class ${className}Controller {
  constructor(private readonly ${varName}Service: ${className}Service) {}

  @Get()
  @ApiOperation({ summary: 'Get all ${pluralize(table.originalName)}' })
  @ApiResponse({ status: 200, type: [${className}] })
  findAll(): Promise<${className}[]> {
    return this.${varName}Service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${table.originalName} by ID' })
  @ApiResponse({ status: 200, type: ${className} })
  findOne(@Param('id'${pkType === 'string' ? ', ParseUUIDPipe' : ', ParseIntPipe'}) id: ${pkType}): Promise<${className}> {
    return this.${varName}Service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ${table.originalName}' })
  @ApiResponse({ status: 201, type: ${className} })
  create(@Body() dto: Create${className}Dto): Promise<${className}> {
    return this.${varName}Service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ${table.originalName}' })
  @ApiResponse({ status: 200, type: ${className} })
  update(
    @Param('id'${pkType === 'string' ? ', ParseUUIDPipe' : ', ParseIntPipe'}) id: ${pkType},
    @Body() dto: Update${className}Dto,
  ): Promise<${className}> {
    return this.${varName}Service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${table.originalName}' })
  @ApiResponse({ status: 204 })
  remove(@Param('id'${pkType === 'string' ? ', ParseUUIDPipe' : ', ParseIntPipe'}) id: ${pkType}): Promise<void> {
    return this.${varName}Service.remove(id);
  }
}
`;
};

const generateModule = (table: IRTable): string => {
  const className = toPascalCase(table.originalName);

  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${className}Controller } from './${toSnakeCase(table.originalName)}.controller';
import { ${className}Service } from './${toSnakeCase(table.originalName)}.service';
import { ${className} } from './entities/${toSnakeCase(table.originalName)}.entity';

@Module({
  imports: [TypeOrmModule.forFeature([${className}])],
  controllers: [${className}Controller],
  providers: [${className}Service],
  exports: [${className}Service],
})
export class ${className}Module {}
`;
};

const generateAppModule = (ir: CanonicalIR, dbAdapter: DatabaseAdapter): string => {
  const imports = ir.tables.map(t => `import { ${toPascalCase(t.originalName)}Module } from './${toSnakeCase(t.originalName)}/${toSnakeCase(t.originalName)}.module';`).join('\n');
  const modules = ir.tables.map(t => `${toPascalCase(t.originalName)}Module`).join(', ');
  const entities = ir.tables.map(t => `${toPascalCase(t.originalName)}`).join(', ');
  const entityImports = ir.tables.map(t => `import { ${toPascalCase(t.originalName)} } from './${toSnakeCase(t.originalName)}/entities/${toSnakeCase(t.originalName)}.entity';`).join('\n');

  const dbType = dbAdapter.id === 'postgresql' ? 'postgres' : dbAdapter.id === 'mysql' || dbAdapter.id === 'mariadb' ? 'mysql' : 'sqlite';

  return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
${imports}
${entityImports}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: '${dbType}',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', ${dbAdapter.id === 'postgresql' ? 5432 : 3306}),
        username: configService.get('DB_USER', 'user'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_NAME', 'database'),
        entities: [${entities}],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    ${modules},
  ],
})
export class AppModule {}
`;
};

export const nestjsAdapter: FrameworkAdapter = {
  id: 'nestjs',
  name: 'NestJS',
  language: 'typescript',
  description: 'Progressive Node.js framework with TypeScript support',
  features: {
    orm: 'TypeORM',
    migrations: true,
    validation: true,
    authentication: true,
    swagger: true,
    graphql: true,
    testing: true,
    docker: true,
  },
  supportedDatabases: ['postgresql', 'mysql', 'sqlite', 'mariadb', 'oracle', 'sqlserver'],

  generateProject: (schema, dbAdapter, config) => {
    const ir = schema as unknown as CanonicalIR;
    const projectName = toSnakeCase(config.projectName);
    const files: GeneratedFile[] = [];

    // Generate per-entity modules
    ir.tables.forEach(table => {
      const entityFolder = toSnakeCase(table.originalName);
      files.push({ 
        path: `${projectName}/src/${entityFolder}/entities/${entityFolder}.entity.ts`, 
        content: generateEntity(table, ir), 
        type: 'model' 
      });
      files.push({ 
        path: `${projectName}/src/${entityFolder}/dto/${entityFolder}.dto.ts`, 
        content: generateDto(table), 
        type: 'schema' 
      });
      files.push({ 
        path: `${projectName}/src/${entityFolder}/${entityFolder}.service.ts`, 
        content: generateService(table), 
        type: 'service' 
      });
      files.push({ 
        path: `${projectName}/src/${entityFolder}/${entityFolder}.controller.ts`, 
        content: generateController(table), 
        type: 'controller' 
      });
      files.push({ 
        path: `${projectName}/src/${entityFolder}/${entityFolder}.module.ts`, 
        content: generateModule(table), 
        type: 'other' 
      });
    });

    // App module
    files.push({ 
      path: `${projectName}/src/app.module.ts`, 
      content: generateAppModule(ir, dbAdapter), 
      type: 'config' 
    });

    // Main file
    files.push({ 
      path: `${projectName}/src/main.ts`, 
      content: `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('${config.projectName} API')
    .setDescription('Auto-generated API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();`, 
      type: 'config' 
    });

    // Package.json
    files.push({
      path: `${projectName}/package.json`,
      content: JSON.stringify({
        name: projectName,
        version: '1.0.0',
        scripts: {
          start: 'nest start',
          'start:dev': 'nest start --watch',
          build: 'nest build',
        },
        dependencies: {
          '@nestjs/common': '^10.0.0',
          '@nestjs/core': '^10.0.0',
          '@nestjs/config': '^3.0.0',
          '@nestjs/platform-express': '^10.0.0',
          '@nestjs/swagger': '^7.0.0',
          '@nestjs/typeorm': '^10.0.0',
          'class-validator': '^0.14.0',
          'class-transformer': '^0.5.0',
          typeorm: '^0.3.0',
          [dbAdapter.id === 'postgresql' ? 'pg' : dbAdapter.id === 'mysql' ? 'mysql2' : 'better-sqlite3']: 'latest',
        },
        devDependencies: {
          '@nestjs/cli': '^10.0.0',
          typescript: '^5.0.0',
        },
      }, null, 2),
      type: 'config',
    });

    return files;
  },

  getModelFileName: (entityName) => `${toSnakeCase(entityName)}.entity.ts`,
  getControllerFileName: (entityName) => `${toSnakeCase(entityName)}.controller.ts`,
  getSchemaFileName: (entityName) => `${toSnakeCase(entityName)}.dto.ts`,
  getServiceFileName: (entityName) => `${toSnakeCase(entityName)}.service.ts`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}-Create${toPascalCase(entityName)}.ts`,
};
