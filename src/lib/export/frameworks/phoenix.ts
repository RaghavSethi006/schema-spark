// Phoenix Framework Adapter (Elixir)
import { FrameworkAdapter, FrameworkFeatures, ORMType } from '../types/frameworks';
import { DatabaseType, AnyDatabaseAdapter } from '../types/databases';
import { ExportConfig } from '../types/config';
import { GeneratedFile, toPascalCase, toSnakeCase } from '../types/core';
import { ERSchema } from '../../schema';

const phoenixFeatures: FrameworkFeatures = {
  orm: 'Ecto',
  migrations: true,
  validation: true,
  authentication: true,
  swagger: true,
  graphql: true,
  testing: true,
  docker: true,
};

export const phoenixAdapter: FrameworkAdapter = {
  id: 'phoenix',
  name: 'Phoenix',
  language: 'elixir',
  description: 'Productive web framework that does not compromise speed or maintainability',
  features: phoenixFeatures,
  supportedDatabases: ['postgresql', 'mysql', 'sqlite'] as DatabaseType[],
  supportedORMs: ['ecto'] as ORMType[],
  
  generateProject(schema: ERSchema, dbAdapter: AnyDatabaseAdapter, config: ExportConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const projectName = toSnakeCase(config.projectName);
    const moduleName = toPascalCase(config.projectName);
    const base = projectName;
    
    // mix.exs
    files.push({
      path: `${base}/mix.exs`,
      content: generateMixExs(projectName, moduleName),
      type: 'config',
    });
    
    // Schemas (Models)
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/lib/${projectName}/${toSnakeCase(entity.name)}.ex`,
        content: generateSchema(entity, moduleName, config),
        type: 'model',
      });
    });
    
    // Migrations
    if (config.generateMigrations) {
      schema.entities.forEach((entity, index) => {
        const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
        files.push({
          path: `${base}/priv/repo/migrations/${timestamp}${index}_create_${toSnakeCase(entity.name)}s.exs`,
          content: generateMigration(entity, moduleName, config),
          type: 'migration',
        });
      });
    }
    
    // Controllers
    if (config.generateControllers) {
      schema.entities.forEach(entity => {
        files.push({
          path: `${base}/lib/${projectName}_web/controllers/${toSnakeCase(entity.name)}_controller.ex`,
          content: generateController(entity, moduleName, config),
          type: 'controller',
        });
      });
      
      // JSON views
      schema.entities.forEach(entity => {
        files.push({
          path: `${base}/lib/${projectName}_web/controllers/${toSnakeCase(entity.name)}_json.ex`,
          content: generateJsonView(entity, moduleName, config),
          type: 'schema',
        });
      });
    }
    
    // Router
    files.push({
      path: `${base}/lib/${projectName}_web/router.ex`,
      content: generateRouter(schema, moduleName, config),
      type: 'config',
    });
    
    return files;
  },
  
  getModelFileName: (entityName) => `${toSnakeCase(entityName)}.ex`,
  getControllerFileName: (entityName) => `${toSnakeCase(entityName)}_controller.ex`,
  getSchemaFileName: (entityName) => `${toSnakeCase(entityName)}_json.ex`,
  getServiceFileName: (entityName) => `${toSnakeCase(entityName)}_service.ex`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}_create_${toSnakeCase(entityName)}s.exs`,
};

function generateMixExs(projectName: string, moduleName: string): string {
  return `defmodule ${moduleName}.MixProject do
  use Mix.Project

  def project do
    [
      app: :${projectName},
      version: "0.1.0",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      mod: {${moduleName}.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.7.10"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.10"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_live_dashboard, "~> 0.8.2"},
      {:jason, "~> 1.2"},
      {:bandit, "~> 1.0"}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end
`;
}

function generateSchema(entity: any, moduleName: string, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const tableName = config.tablePluralizer ? `${toSnakeCase(entity.name)}s` : toSnakeCase(entity.name);
  
  const fields = entity.fields
    .filter((f: any) => !f.isPrimaryKey)
    .map((f: any) => `    field :${toSnakeCase(f.name)}, ${mapToEctoType(f.type)}`)
    .join('\n');
  
  const castFields = entity.fields
    .filter((f: any) => !f.isPrimaryKey)
    .map((f: any) => `:${toSnakeCase(f.name)}`)
    .join(', ');
  
  const requiredFields = entity.fields
    .filter((f: any) => !f.isPrimaryKey && !f.isNullable)
    .map((f: any) => `:${toSnakeCase(f.name)}`)
    .join(', ');

  return `defmodule ${moduleName}.${name} do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "${tableName}" do
${fields}

    timestamps(type: :utc_datetime)
  end

  @doc false
  def changeset(${toSnakeCase(entity.name)}, attrs) do
    ${toSnakeCase(entity.name)}
    |> cast(attrs, [${castFields}])
    |> validate_required([${requiredFields}])
  end
end
`;
}

function generateMigration(entity: any, moduleName: string, config: ExportConfig): string {
  const tableName = config.tablePluralizer ? `${toSnakeCase(entity.name)}s` : toSnakeCase(entity.name);
  
  const columns = entity.fields
    .filter((f: any) => !f.isPrimaryKey)
    .map((f: any) => {
      let col = `      add :${toSnakeCase(f.name)}, ${mapToEctoType(f.type)}`;
      if (!f.isNullable) col += ', null: false';
      return col;
    })
    .join('\n');

  return `defmodule ${moduleName}.Repo.Migrations.Create${toPascalCase(entity.name)}s do
  use Ecto.Migration

  def change do
    create table(:${tableName}, primary_key: false) do
      add :id, :binary_id, primary_key: true
${columns}

      timestamps(type: :utc_datetime)
    end
  end
end
`;
}

function generateController(entity: any, moduleName: string, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const varName = toSnakeCase(entity.name);

  return `defmodule ${moduleName}Web.${name}Controller do
  use ${moduleName}Web, :controller

  alias ${moduleName}.${name}
  alias ${moduleName}.Repo

  action_fallback ${moduleName}Web.FallbackController

  def index(conn, _params) do
    ${varName}s = Repo.all(${name})
    render(conn, :index, ${varName}s: ${varName}s)
  end

  def create(conn, %{"${varName}" => ${varName}_params}) do
    changeset = ${name}.changeset(%${name}{}, ${varName}_params)

    case Repo.insert(changeset) do
      {:ok, ${varName}} ->
        conn
        |> put_status(:created)
        |> render(:show, ${varName}: ${varName})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:errors, changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    ${varName} = Repo.get!(${name}, id)
    render(conn, :show, ${varName}: ${varName})
  end

  def update(conn, %{"id" => id, "${varName}" => ${varName}_params}) do
    ${varName} = Repo.get!(${name}, id)
    changeset = ${name}.changeset(${varName}, ${varName}_params)

    case Repo.update(changeset) do
      {:ok, ${varName}} ->
        render(conn, :show, ${varName}: ${varName})

      {:error, changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> render(:errors, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    ${varName} = Repo.get!(${name}, id)

    case Repo.delete(${varName}) do
      {:ok, _${varName}} ->
        send_resp(conn, :no_content, "")

      {:error, _changeset} ->
        conn
        |> put_status(:unprocessable_entity)
        |> json(%{error: "Could not delete"})
    end
  end
end
`;
}

function generateJsonView(entity: any, moduleName: string, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const varName = toSnakeCase(entity.name);
  
  const fields = entity.fields
    .map((f: any) => `${toSnakeCase(f.name)}: ${varName}.${toSnakeCase(f.name)}`)
    .join(',\n      ');

  return `defmodule ${moduleName}Web.${name}JSON do
  alias ${moduleName}.${name}

  def index(%{${varName}s: ${varName}s}) do
    %{data: for(${varName} <- ${varName}s, do: data(${varName}))}
  end

  def show(%{${varName}: ${varName}}) do
    %{data: data(${varName})}
  end

  defp data(%${name}{} = ${varName}) do
    %{
      ${fields}
    }
  end
end
`;
}

function generateRouter(schema: ERSchema, moduleName: string, config: ExportConfig): string {
  const resources = schema.entities
    .map(e => `      resources "/${toSnakeCase(e.name)}s", ${toPascalCase(e.name)}Controller`)
    .join('\n');

  return `defmodule ${moduleName}Web.Router do
  use ${moduleName}Web, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", ${moduleName}Web do
    pipe_through :api

${resources}
  end
end
`;
}

function mapToEctoType(type: string): string {
  const mapping: Record<string, string> = {
    string: ':string',
    text: ':string',
    int: ':integer',
    integer: ':integer',
    float: ':float',
    boolean: ':boolean',
    date: ':date',
    datetime: ':utc_datetime',
    uuid: ':binary_id',
    json: ':map',
    decimal: ':decimal',
    bigint: ':integer',
  };
  return mapping[type] || ':string';
}
