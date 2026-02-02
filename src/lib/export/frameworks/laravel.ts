// Laravel Framework Adapter (PHP)
import { FrameworkAdapter, FrameworkFeatures, ORMType } from '../types/frameworks';
import { DatabaseType, AnyDatabaseAdapter } from '../types/databases';
import { ExportConfig } from '../types/config';
import { GeneratedFile, toPascalCase, toSnakeCase } from '../types/core';
import { ERSchema } from '../../schema';

const laravelFeatures: FrameworkFeatures = {
  orm: 'Eloquent',
  migrations: true,
  validation: true,
  authentication: true,
  swagger: true,
  graphql: true,
  testing: true,
  docker: true,
};

export const laravelAdapter: FrameworkAdapter = {
  id: 'laravel',
  name: 'Laravel',
  language: 'php',
  description: 'The PHP Framework for Web Artisans',
  features: laravelFeatures,
  supportedDatabases: ['postgresql', 'mysql', 'sqlite', 'sqlserver'] as DatabaseType[],
  supportedORMs: ['eloquent'] as ORMType[],
  
  generateProject(schema: ERSchema, dbAdapter: AnyDatabaseAdapter, config: ExportConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const projectName = toSnakeCase(config.projectName);
    const base = projectName;
    
    // Models
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/app/Models/${toPascalCase(entity.name)}.php`,
        content: generateModel(entity, config),
        type: 'model',
      });
    });
    
    // Migrations
    if (config.generateMigrations) {
      schema.entities.forEach((entity, index) => {
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        files.push({
          path: `${base}/database/migrations/${timestamp}${index}_create_${toSnakeCase(entity.name)}s_table.php`,
          content: generateMigration(entity, config),
          type: 'migration',
        });
      });
    }
    
    // Controllers
    if (config.generateControllers) {
      schema.entities.forEach(entity => {
        files.push({
          path: `${base}/app/Http/Controllers/${toPascalCase(entity.name)}Controller.php`,
          content: generateController(entity, config),
          type: 'controller',
        });
      });
    }
    
    // Form Requests (validation)
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/app/Http/Requests/Store${toPascalCase(entity.name)}Request.php`,
        content: generateFormRequest(entity, 'Store', config),
        type: 'schema',
      });
      files.push({
        path: `${base}/app/Http/Requests/Update${toPascalCase(entity.name)}Request.php`,
        content: generateFormRequest(entity, 'Update', config),
        type: 'schema',
      });
    });
    
    // Routes
    files.push({
      path: `${base}/routes/api.php`,
      content: generateRoutes(schema, config),
      type: 'controller',
    });
    
    return files;
  },
  
  getModelFileName: (entityName) => `${toPascalCase(entityName)}.php`,
  getControllerFileName: (entityName) => `${toPascalCase(entityName)}Controller.php`,
  getSchemaFileName: (entityName) => `${toPascalCase(entityName)}Resource.php`,
  getServiceFileName: (entityName) => `${toPascalCase(entityName)}Service.php`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}_create_${toSnakeCase(entityName)}s_table.php`,
};

function generateModel(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const tableName = config.tablePluralizer ? `${toSnakeCase(entity.name)}s` : toSnakeCase(entity.name);
  
  const fillable = entity.fields
    .filter((f: any) => !f.isPrimaryKey)
    .map((f: any) => `        '${toSnakeCase(f.name)}',`)
    .join('\n');
  
  const casts = entity.fields
    .filter((f: any) => ['boolean', 'date', 'datetime', 'json'].includes(f.type))
    .map((f: any) => {
      const cast = f.type === 'boolean' ? 'boolean' : 
                   f.type === 'date' ? 'date' :
                   f.type === 'datetime' ? 'datetime' : 'array';
      return `        '${toSnakeCase(f.name)}' => '${cast}',`;
    })
    .join('\n');

  return `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Concerns\\HasUuids;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;

class ${name} extends Model
{
    use HasFactory, HasUuids;

    protected $table = '${tableName}';

    protected $fillable = [
${fillable}
    ];

${casts ? `    protected $casts = [
${casts}
    ];` : ''}
}
`;
}

function generateMigration(entity: any, config: ExportConfig): string {
  const tableName = config.tablePluralizer ? `${toSnakeCase(entity.name)}s` : toSnakeCase(entity.name);
  
  const columns = entity.fields.map((f: any) => {
    let col = `            $table->${mapToLaravelType(f.type)}('${toSnakeCase(f.name)}')`;
    if (f.isPrimaryKey) col = `            $table->uuid('id')->primary()`;
    else if (f.isNullable) col += '->nullable()';
    if (f.isUnique) col += '->unique()';
    if (f.defaultValue) col += `->default(${f.defaultValue})`;
    return col + ';';
  }).join('\n');

  return `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('${tableName}', function (Blueprint $table) {
${columns}
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('${tableName}');
    }
};
`;
}

function generateController(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const varName = entity.name.toLowerCase();

  return `<?php

namespace App\\Http\\Controllers;

use App\\Models\\${name};
use App\\Http\\Requests\\Store${name}Request;
use App\\Http\\Requests\\Update${name}Request;
use Illuminate\\Http\\JsonResponse;

class ${name}Controller extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(${name}::all());
    }

    public function store(Store${name}Request $request): JsonResponse
    {
        $${varName} = ${name}::create($request->validated());
        return response()->json($${varName}, 201);
    }

    public function show(${name} $${varName}): JsonResponse
    {
        return response()->json($${varName});
    }

    public function update(Update${name}Request $request, ${name} $${varName}): JsonResponse
    {
        $${varName}->update($request->validated());
        return response()->json($${varName});
    }

    public function destroy(${name} $${varName}): JsonResponse
    {
        $${varName}->delete();
        return response()->json(null, 204);
    }
}
`;
}

function generateFormRequest(entity: any, prefix: string, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  
  const rules = entity.fields
    .filter((f: any) => !f.isPrimaryKey)
    .map((f: any) => {
      const validations: string[] = [];
      if (!f.isNullable && prefix === 'Store') validations.push('required');
      else validations.push('sometimes');
      validations.push(mapToLaravelValidation(f.type));
      if (f.isUnique) validations.push(`unique:${toSnakeCase(entity.name)}s`);
      return `            '${toSnakeCase(f.name)}' => '${validations.join('|')}',`;
    })
    .join('\n');

  return `<?php

namespace App\\Http\\Requests;

use Illuminate\\Foundation\\Http\\FormRequest;

class ${prefix}${name}Request extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
${rules}
        ];
    }
}
`;
}

function generateRoutes(schema: ERSchema, config: ExportConfig): string {
  const routes = schema.entities.map(e => {
    const name = toPascalCase(e.name);
    const resource = toSnakeCase(e.name) + 's';
    return `Route::apiResource('${resource}', ${name}Controller::class);`;
  }).join('\n');

  const imports = schema.entities.map(e => 
    `use App\\Http\\Controllers\\${toPascalCase(e.name)}Controller;`
  ).join('\n');

  return `<?php

use Illuminate\\Support\\Facades\\Route;
${imports}

${routes}
`;
}

function mapToLaravelType(type: string): string {
  const mapping: Record<string, string> = {
    string: 'string',
    text: 'text',
    int: 'integer',
    integer: 'integer',
    float: 'float',
    boolean: 'boolean',
    date: 'date',
    datetime: 'dateTime',
    uuid: 'uuid',
    json: 'json',
    decimal: 'decimal',
    bigint: 'bigInteger',
  };
  return mapping[type] || 'string';
}

function mapToLaravelValidation(type: string): string {
  const mapping: Record<string, string> = {
    string: 'string|max:255',
    text: 'string',
    int: 'integer',
    integer: 'integer',
    float: 'numeric',
    boolean: 'boolean',
    date: 'date',
    datetime: 'date',
    uuid: 'uuid',
    json: 'array',
  };
  return mapping[type] || 'string';
}
