// Gin Framework Adapter (Go)
import { FrameworkAdapter, FrameworkFeatures, ORMType } from '../types/frameworks';
import { DatabaseType, AnyDatabaseAdapter } from '../types/databases';
import { ExportConfig } from '../types/config';
import { GeneratedFile, toPascalCase, toSnakeCase, toCamelCase } from '../types/core';
import { ERSchema } from '../../schema';

const ginFeatures: FrameworkFeatures = {
  orm: 'GORM',
  migrations: true,
  validation: true,
  authentication: true,
  swagger: true,
  graphql: false,
  testing: true,
  docker: true,
};

export const ginAdapter: FrameworkAdapter = {
  id: 'gin',
  name: 'Gin',
  language: 'go',
  description: 'High-performance HTTP web framework written in Go',
  features: ginFeatures,
  supportedDatabases: ['postgresql', 'mysql', 'sqlite', 'mongodb'] as DatabaseType[],
  supportedORMs: ['gorm'] as ORMType[],
  
  generateProject(schema: ERSchema, dbAdapter: AnyDatabaseAdapter, config: ExportConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const projectName = toSnakeCase(config.projectName);
    const base = projectName;
    
    // go.mod
    files.push({
      path: `${base}/go.mod`,
      content: generateGoMod(projectName),
      type: 'config',
    });
    
    // main.go
    files.push({
      path: `${base}/main.go`,
      content: generateMainGo(schema, config),
      type: 'config',
    });
    
    // Database config
    files.push({
      path: `${base}/internal/database/database.go`,
      content: generateDatabaseGo(config),
      type: 'config',
    });
    
    // Models
    schema.entities.forEach(entity => {
      files.push({
        path: `${base}/internal/models/${toSnakeCase(entity.name)}.go`,
        content: generateModel(entity, config),
        type: 'model',
      });
    });
    
    // Handlers
    if (config.generateControllers) {
      schema.entities.forEach(entity => {
        files.push({
          path: `${base}/internal/handlers/${toSnakeCase(entity.name)}.go`,
          content: generateHandler(entity, config),
          type: 'controller',
        });
      });
    }
    
    // Routes
    files.push({
      path: `${base}/internal/routes/routes.go`,
      content: generateRoutes(schema, config),
      type: 'controller',
    });
    
    return files;
  },
  
  getModelFileName: (entityName) => `${toSnakeCase(entityName)}.go`,
  getControllerFileName: (entityName) => `${toSnakeCase(entityName)}.go`,
  getSchemaFileName: (entityName) => `${toSnakeCase(entityName)}_dto.go`,
  getServiceFileName: (entityName) => `${toSnakeCase(entityName)}_service.go`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}_create_${toSnakeCase(entityName)}.go`,
};

function generateGoMod(projectName: string): string {
  return `module ${projectName}

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/google/uuid v1.5.0
	gorm.io/driver/postgres v1.5.4
	gorm.io/gorm v1.25.5
)
`;
}

function generateMainGo(schema: ERSchema, config: ExportConfig): string {
  return `package main

import (
	"log"
	"os"

	"${toSnakeCase(config.projectName)}/internal/database"
	"${toSnakeCase(config.projectName)}/internal/routes"
)

func main() {
	// Initialize database
	db, err := database.Connect()
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Run migrations
	if err := database.Migrate(db); err != nil {
		log.Fatal("Failed to run migrations:", err)
	}

	// Setup router
	router := routes.SetupRouter(db)

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
`;
}

function generateDatabaseGo(config: ExportConfig): string {
  return `package database

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect() (*gorm.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=${toSnakeCase(config.projectName)} port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	return db, nil
}

func Migrate(db *gorm.DB) error {
	// Auto-migrate models
	return nil
}
`;
}

function generateModel(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  
  const fields = entity.fields.map((f: any) => {
    const goType = mapToGoType(f.type, f.isNullable);
    const jsonTag = toSnakeCase(f.name);
    const gormTag = buildGormTag(f);
    return `	${toPascalCase(f.name)} ${goType} \`json:"${jsonTag}" gorm:"${gormTag}"\``;
  }).join('\n');

  return `package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ${name} struct {
${fields}
	CreatedAt time.Time      \`json:"created_at"\`
	UpdatedAt time.Time      \`json:"updated_at"\`
	DeletedAt gorm.DeletedAt \`json:"deleted_at,omitempty" gorm:"index"\`
}

type Create${name}Input struct {
${entity.fields.filter((f: any) => !f.isPrimaryKey).map((f: any) => {
  const goType = mapToGoType(f.type, f.isNullable);
  const jsonTag = toSnakeCase(f.name);
  const binding = f.isNullable ? '' : ',required';
  return `	${toPascalCase(f.name)} ${goType} \`json:"${jsonTag}" binding:"${binding}"\``;
}).join('\n')}
}

type Update${name}Input struct {
${entity.fields.filter((f: any) => !f.isPrimaryKey).map((f: any) => {
  const goType = mapToGoType(f.type, true); // All optional for updates
  const jsonTag = toSnakeCase(f.name);
  return `	${toPascalCase(f.name)} ${goType} \`json:"${jsonTag}"\``;
}).join('\n')}
}

func (${name.charAt(0).toLowerCase()} *${name}) BeforeCreate(tx *gorm.DB) error {
	if ${name.charAt(0).toLowerCase()}.ID == uuid.Nil {
		${name.charAt(0).toLowerCase()}.ID = uuid.New()
	}
	return nil
}
`;
}

function generateHandler(entity: any, config: ExportConfig): string {
  const name = toPascalCase(entity.name);
  const varName = toCamelCase(entity.name);
  const tableName = config.tablePluralizer ? `${toSnakeCase(entity.name)}s` : toSnakeCase(entity.name);

  return `package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"${toSnakeCase(config.projectName)}/internal/models"
)

type ${name}Handler struct {
	db *gorm.DB
}

func New${name}Handler(db *gorm.DB) *${name}Handler {
	return &${name}Handler{db: db}
}

// GetAll returns all ${name}s
func (h *${name}Handler) GetAll(c *gin.Context) {
	var items []models.${name}
	if err := h.db.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GetByID returns a single ${name}
func (h *${name}Handler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var item models.${name}
	if err := h.db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "${name} not found"})
		return
	}
	c.JSON(http.StatusOK, item)
}

// Create creates a new ${name}
func (h *${name}Handler) Create(c *gin.Context) {
	var input models.Create${name}Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	${varName} := models.${name}{
${entity.fields.filter((f: any) => !f.isPrimaryKey).map((f: any) => {
  return `		${toPascalCase(f.name)}: input.${toPascalCase(f.name)},`;
}).join('\n')}
	}

	if err := h.db.Create(&${varName}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, ${varName})
}

// Update updates an existing ${name}
func (h *${name}Handler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var item models.${name}
	if err := h.db.First(&item, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "${name} not found"})
		return
	}

	var input models.Update${name}Input
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Model(&item).Updates(input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, item)
}

// Delete deletes a ${name}
func (h *${name}Handler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := h.db.Delete(&models.${name}{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}
`;
}

function generateRoutes(schema: ERSchema, config: ExportConfig): string {
  const imports = schema.entities.map(e => 
    `	"${toSnakeCase(config.projectName)}/internal/handlers"`
  );
  
  const handlers = schema.entities.map(e => {
    const name = toPascalCase(e.name);
    const varName = toCamelCase(e.name);
    const route = toSnakeCase(e.name) + 's';
    return `
	${varName}Handler := handlers.New${name}Handler(db)
	${route} := api.Group("/${route}")
	{
		${route}.GET("", ${varName}Handler.GetAll)
		${route}.GET("/:id", ${varName}Handler.GetByID)
		${route}.POST("", ${varName}Handler.Create)
		${route}.PUT("/:id", ${varName}Handler.Update)
		${route}.DELETE("/:id", ${varName}Handler.Delete)
	}`;
  }).join('\n');

  return `package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"${toSnakeCase(config.projectName)}/internal/handlers"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()

	// CORS middleware
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	api := router.Group("/api/v1")
${handlers}

	return router
}
`;
}

function mapToGoType(type: string, nullable: boolean): string {
  const mapping: Record<string, string> = {
    string: 'string',
    text: 'string',
    int: 'int',
    integer: 'int',
    float: 'float64',
    boolean: 'bool',
    date: 'time.Time',
    datetime: 'time.Time',
    uuid: 'uuid.UUID',
    json: 'map[string]interface{}',
    decimal: 'float64',
    bigint: 'int64',
  };
  const goType = mapping[type] || 'string';
  return nullable ? `*${goType}` : goType;
}

function buildGormTag(field: any): string {
  const tags: string[] = [];
  if (field.isPrimaryKey) tags.push('primaryKey');
  if (field.type === 'uuid') tags.push('type:uuid');
  if (!field.isNullable && !field.isPrimaryKey) tags.push('not null');
  if (field.isUnique) tags.push('unique');
  return tags.join(';') || 'column:' + toSnakeCase(field.name);
}
