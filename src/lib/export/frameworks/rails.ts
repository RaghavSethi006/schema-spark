// Ruby on Rails Framework Adapter
import { FrameworkAdapter, FrameworkFeatures, ORMType } from '../types/frameworks';
import { DatabaseType, AnyDatabaseAdapter } from '../types/databases';
import { ExportConfig } from '../types/config';
import { GeneratedFile, toPascalCase, toSnakeCase, pluralize } from '../types/core';
import { ERSchema } from '../../schema';

const railsFeatures: FrameworkFeatures = {
  orm: 'ActiveRecord',
  migrations: true,
  validation: true,
  authentication: true,
  swagger: true,
  graphql: true,
  testing: true,
  docker: true,
};

export const railsAdapter: FrameworkAdapter = {
  id: 'rails',
  name: 'Ruby on Rails',
  language: 'ruby',
  description: 'Web application framework with conventions over configuration',
  features: railsFeatures,
  supportedDatabases: ['postgresql', 'mysql', 'sqlite'] as DatabaseType[],
  supportedORMs: ['activerecord'] as ORMType[],
  
  generateProject(schema: ERSchema, dbAdapter: AnyDatabaseAdapter, config: ExportConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const projectName = toSnakeCase(config.projectName);
    const base = projectName;
    
    // Models
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/app/models/${toSnakeCase(entity.name)}.rb`,
        content: generateModel(entity, schema, config),
        type: 'model',
      });
    });
    
    // Migrations
    if (config.generateMigrations) {
      schema.entities.forEach((entity, index) => {
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        files.push({
          path: `${base}/db/migrate/${timestamp}${index}_create_${pluralize(toSnakeCase(entity.name))}.rb`,
          content: generateMigration(entity, config),
          type: 'migration',
        });
      });
    }
    
    // Controllers
    if (config.generateControllers) {
      schema.entities.forEach(entity => {
        files.push({
          path: `${base}/app/controllers/${pluralize(toSnakeCase(entity.name))}_controller.rb`,
          content: generateController(entity, config),
          type: 'controller',
        });
      });
    }
    
    // Serializers
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/app/serializers/${toSnakeCase(entity.name)}_serializer.rb`,
        content: generateSerializer(entity, config),
        type: 'schema',
      });
    });
    
    // Routes
    files.push({
      path: `${base}/config/routes.rb`,
      content: generateRoutes(schema, config),
      type: 'config',
    });
    
    // Gemfile
    files.push({
      path: `${base}/Gemfile`,
      content: generateGemfile(config),
      type: 'config',
    });
    
    return files;
  },
  
  getModelFileName: (entityName) => `${toSnakeCase(entityName)}.rb`,
  getControllerFileName: (entityName) => `${pluralize(toSnakeCase(entityName))}_controller.rb`,
  getSchemaFileName: (entityName) => `${toSnakeCase(entityName)}_serializer.rb`,
  getServiceFileName: (entityName) => `${toSnakeCase(entityName)}_service.rb`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}_create_${pluralize(toSnakeCase(entityName))}.rb`,
};

function generateModel(entity: any, schema: ERSchema, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  
  const validations = entity.fields
    .filter((f: any) => !f.isPrimaryKey && !f.isNullable)
    .map((f: any) => `  validates :${toSnakeCase(f.name)}, presence: true`)
    .join('\n');

  return `class ${name} < ApplicationRecord
${validations}
end
`;
}

function generateMigration(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const tableName = pluralize(toSnakeCase(entity.name));
  
  const columns = entity.fields
    .filter((f: any) => !f.isPrimaryKey)
    .map((f: any) => {
      let col = `      t.${mapToRailsType(f.type)} :${toSnakeCase(f.name)}`;
      if (!f.isNullable) col += ', null: false';
      if (f.defaultValue) col += `, default: ${f.defaultValue}`;
      return col;
    })
    .join('\n');

  return `class Create${pluralize(name)} < ActiveRecord::Migration[7.1]
  def change
    create_table :${tableName}, id: :uuid do |t|
${columns}

      t.timestamps
    end
  end
end
`;
}

function generateController(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const varName = toSnakeCase(entity.name);
  const pluralVar = pluralize(varName);
  
  const permitParams = entity.fields
    .filter((f: any) => !f.isPrimaryKey)
    .map((f: any) => `:${toSnakeCase(f.name)}`)
    .join(', ');

  return `class ${pluralize(name)}Controller < ApplicationController
  before_action :set_${varName}, only: [:show, :update, :destroy]

  # GET /${pluralVar}
  def index
    @${pluralVar} = ${name}.all
    render json: @${pluralVar}
  end

  # GET /${pluralVar}/:id
  def show
    render json: @${varName}
  end

  # POST /${pluralVar}
  def create
    @${varName} = ${name}.new(${varName}_params)

    if @${varName}.save
      render json: @${varName}, status: :created
    else
      render json: @${varName}.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /${pluralVar}/:id
  def update
    if @${varName}.update(${varName}_params)
      render json: @${varName}
    else
      render json: @${varName}.errors, status: :unprocessable_entity
    end
  end

  # DELETE /${pluralVar}/:id
  def destroy
    @${varName}.destroy
    head :no_content
  end

  private

  def set_${varName}
    @${varName} = ${name}.find(params[:id])
  end

  def ${varName}_params
    params.require(:${varName}).permit(${permitParams})
  end
end
`;
}

function generateSerializer(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const attributes = entity.fields
    .map((f: any) => `:${toSnakeCase(f.name)}`)
    .join(', ');

  return `class ${name}Serializer < ActiveModel::Serializer
  attributes ${attributes}
end
`;
}

function generateRoutes(schema: ERSchema, config: ExportConfig): string {
  const resources = schema.entities
    .map(e => `  resources :${pluralize(toSnakeCase(e.name))}`)
    .join('\n');

  return `Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
${resources}
    end
  end
end
`;
}

function generateGemfile(config: ExportConfig): string {
  return `source "https://rubygems.org"

ruby "3.2.0"

gem "rails", "~> 7.1"
gem "pg", "~> 1.5"
gem "puma", "~> 6.0"
gem "bcrypt", "~> 3.1"
gem "jwt"
gem "rack-cors"
gem "active_model_serializers", "~> 0.10"

group :development, :test do
  gem "debug"
  gem "rspec-rails"
  gem "factory_bot_rails"
  gem "faker"
end

group :development do
  gem "rubocop-rails", require: false
end
`;
}

function mapToRailsType(type: string): string {
  const mapping: Record<string, string> = {
    string: 'string',
    text: 'text',
    int: 'integer',
    integer: 'integer',
    float: 'float',
    boolean: 'boolean',
    date: 'date',
    datetime: 'datetime',
    uuid: 'uuid',
    json: 'jsonb',
    decimal: 'decimal',
    bigint: 'bigint',
  };
  return mapping[type] || 'string';
}
