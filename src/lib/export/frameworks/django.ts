import { FrameworkAdapter, DatabaseAdapter, ExportConfig, GeneratedFile, CanonicalIR, IRTable, toSnakeCase, toPascalCase, pluralize } from '../types';

const getDjangoFieldType = (fieldType: string, nullable: boolean): string => {
  const typeMap: Record<string, string> = {
    string: 'CharField(max_length=255)',
    text: 'TextField()',
    int: 'IntegerField()',
    float: 'FloatField()',
    boolean: 'BooleanField()',
    date: 'DateField()',
    datetime: 'DateTimeField()',
    uuid: 'UUIDField(default=uuid.uuid4, editable=False)',
    json: 'JSONField()',
    decimal: 'DecimalField(max_digits=10, decimal_places=2)',
    bigint: 'BigIntegerField()',
    binary: 'BinaryField()',
  };
  const baseType = typeMap[fieldType] || 'CharField(max_length=255)';
  
  if (nullable && !baseType.includes('null=')) {
    return baseType.replace('()', '(null=True, blank=True)').replace(')', ', null=True, blank=True)');
  }
  return baseType;
};

const generateModels = (ir: CanonicalIR): string => {
  const imports = `from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

`;

  const models = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);
    
    const fields = table.columns
      .filter(col => !col.primaryKey || col.type === 'uuid') // Django auto-adds pk unless it's UUID
      .map(col => {
        const fieldName = toSnakeCase(col.name);
        
        if (col.primaryKey && col.type === 'uuid') {
          return `    ${fieldName} = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)`;
        }
        
        if (col.references) {
          const refModel = toPascalCase(col.references.table);
          const onDelete = col.references.onDelete === 'SET NULL' ? 'models.SET_NULL' : 'models.CASCADE';
          return `    ${fieldName.replace('_id', '')} = models.ForeignKey('${refModel}', on_delete=${onDelete}${col.nullable ? ', null=True, blank=True' : ''})`;
        }
        
        const fieldType = getDjangoFieldType(col.type, col.nullable);
        let fieldDef = `    ${fieldName} = models.${fieldType}`;
        
        if (col.unique && !col.primaryKey) {
          fieldDef = fieldDef.replace(')', ', unique=True)');
        }
        
        return fieldDef;
      });

    return `
class ${className}(models.Model):
${fields.join('\n') || '    pass'}

    class Meta:
        db_table = '${toSnakeCase(table.name)}'
        ordering = ['-id']

    def __str__(self):
        return f"${className} {self.pk}"
`;
  }).join('\n');

  return imports + models;
};

const generateAdmin = (ir: CanonicalIR): string => {
  const imports = `from django.contrib import admin
from .models import ${ir.tables.map(t => toPascalCase(t.originalName)).join(', ')}

`;

  const admins = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);
    const listDisplay = table.columns.slice(0, 5).map(c => `'${toSnakeCase(c.name)}'`).join(', ');
    const searchFields = table.columns
      .filter(c => c.type === 'string' || c.type === 'text')
      .slice(0, 3)
      .map(c => `'${toSnakeCase(c.name)}'`)
      .join(', ');

    return `
@admin.register(${className})
class ${className}Admin(admin.ModelAdmin):
    list_display = [${listDisplay}]
    ${searchFields ? `search_fields = [${searchFields}]` : ''}
    list_per_page = 25
`;
  }).join('\n');

  return imports + admins;
};

const generateSerializers = (ir: CanonicalIR): string => {
  const imports = `from rest_framework import serializers
from .models import ${ir.tables.map(t => toPascalCase(t.originalName)).join(', ')}

`;

  const serializers = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);

    return `
class ${className}Serializer(serializers.ModelSerializer):
    class Meta:
        model = ${className}
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
`;
  }).join('\n');

  return imports + serializers;
};

const generateViews = (ir: CanonicalIR): string => {
  const modelImports = ir.tables.map(t => toPascalCase(t.originalName)).join(', ');
  const serializerImports = ir.tables.map(t => `${toPascalCase(t.originalName)}Serializer`).join(', ');

  const imports = `from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import ${modelImports}
from .serializers import ${serializerImports}

`;

  const views = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);

    return `
class ${className}ViewSet(viewsets.ModelViewSet):
    queryset = ${className}.objects.all()
    serializer_class = ${className}Serializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Add custom filtering here
        return queryset
`;
  }).join('\n');

  return imports + views;
};

const generateUrls = (ir: CanonicalIR): string => {
  const imports = `from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
`;

  const routes = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);
    const routeName = pluralize(toSnakeCase(table.originalName));
    return `router.register('${routeName}', views.${className}ViewSet)`;
  }).join('\n');

  return `${imports}
${routes}

urlpatterns = [
    path('api/', include(router.urls)),
]
`;
};

const generateSettings = (dbAdapter: DatabaseAdapter, config: ExportConfig): string => {
  const dbConfig: Record<string, string> = {
    postgresql: `'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'dbname',
        'USER': 'user',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',`,
    mysql: `'ENGINE': 'django.db.backends.mysql',
        'NAME': 'dbname',
        'USER': 'user',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '3306',`,
    sqlite: `'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',`,
  };

  return `from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'change-me-in-production')
DEBUG = os.getenv('DEBUG', 'True') == 'True'
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = '${toSnakeCase(config.projectName)}.urls'

DATABASES = {
    'default': {
        ${dbConfig[dbAdapter.id] || dbConfig.sqlite}
    }
}

${config.includeCorsSetup ? `CORS_ALLOW_ALL_ORIGINS = True` : ''}

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
}

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
`;
};

const generateRequirements = (dbAdapter: DatabaseAdapter): string => {
  const dbDrivers: Record<string, string> = {
    postgresql: 'psycopg2-binary>=2.9.0',
    mysql: 'mysqlclient>=2.1.0',
    sqlite: '',
  };

  return `Django>=4.2.0
djangorestframework>=3.14.0
django-cors-headers>=4.0.0
${dbDrivers[dbAdapter.id] || ''}
`.trim();
};

export const djangoAdapter: FrameworkAdapter = {
  id: 'django',
  name: 'Django',
  language: 'python',
  description: 'Full-featured Python web framework with ORM and admin',
  features: {
    orm: 'Django ORM',
    migrations: true,
    validation: true,
    authentication: true,
    swagger: true,
    graphql: false,
    testing: true,
    docker: true,
  },
  supportedDatabases: ['postgresql', 'mysql', 'sqlite', 'oracle'],

  generateProject: (schema, dbAdapter, config) => {
    const ir = schema as unknown as CanonicalIR;
    const projectName = toSnakeCase(config.projectName);
    const files: GeneratedFile[] = [];

    // Core app
    files.push({ path: `${projectName}/core/__init__.py`, content: '', type: 'other' });
    files.push({ path: `${projectName}/core/models.py`, content: generateModels(ir), type: 'model' });
    files.push({ path: `${projectName}/core/admin.py`, content: generateAdmin(ir), type: 'other' });
    files.push({ path: `${projectName}/core/serializers.py`, content: generateSerializers(ir), type: 'schema' });
    files.push({ path: `${projectName}/core/views.py`, content: generateViews(ir), type: 'controller' });
    files.push({ path: `${projectName}/core/urls.py`, content: generateUrls(ir), type: 'config' });
    
    // Project settings
    files.push({ path: `${projectName}/${projectName}/__init__.py`, content: '', type: 'other' });
    files.push({ path: `${projectName}/${projectName}/settings.py`, content: generateSettings(dbAdapter, config), type: 'config' });
    files.push({ path: `${projectName}/${projectName}/urls.py`, content: `from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
]`, type: 'config' });
    
    files.push({ path: `${projectName}/manage.py`, content: `#!/usr/bin/env python
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', '${projectName}.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)`, type: 'config' });
    
    files.push({ path: `${projectName}/requirements.txt`, content: generateRequirements(dbAdapter), type: 'config' });

    return files;
  },

  getModelFileName: (entityName) => `${toSnakeCase(entityName)}.py`,
  getControllerFileName: (entityName) => `${toSnakeCase(entityName)}_views.py`,
  getSchemaFileName: (entityName) => `${toSnakeCase(entityName)}_serializers.py`,
  getServiceFileName: (entityName) => `${toSnakeCase(entityName)}_service.py`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}_create_${toSnakeCase(entityName)}.py`,
};
