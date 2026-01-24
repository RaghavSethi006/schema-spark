import { FrameworkAdapter, DatabaseAdapter, ExportConfig, GeneratedFile, CanonicalIR, IRTable, IRColumn, toSnakeCase, toPascalCase, pluralize } from '../types';

const getFieldType = (col: IRColumn, dbAdapter: DatabaseAdapter): string => {
  const pyType = getPydanticType(col.type, col.nullable);
  return col.nullable ? `Optional[${pyType}]` : pyType;
};

const getPydanticType = (fieldType: string, nullable: boolean): string => {
  const typeMap: Record<string, string> = {
    string: 'str',
    text: 'str',
    int: 'int',
    float: 'float',
    boolean: 'bool',
    date: 'date',
    datetime: 'datetime',
    uuid: 'UUID',
    json: 'dict',
    decimal: 'Decimal',
    bigint: 'int',
    binary: 'bytes',
  };
  return typeMap[fieldType] || 'str';
};

const getSQLAlchemyType = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    string: 'String(255)',
    text: 'Text',
    int: 'Integer',
    float: 'Float',
    boolean: 'Boolean',
    date: 'Date',
    datetime: 'DateTime',
    uuid: 'UUID(as_uuid=True)',
    json: 'JSON',
    decimal: 'Numeric(10, 2)',
    bigint: 'BigInteger',
    binary: 'LargeBinary',
  };
  return typeMap[fieldType] || 'String(255)';
};

const generateModels = (ir: CanonicalIR, dbAdapter: DatabaseAdapter): string => {
  const imports = `from sqlalchemy import Column, Integer, String, Text, Float, Boolean, Date, DateTime, ForeignKey, JSON, Numeric, BigInteger, LargeBinary, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.declarative import declarative_base
import uuid

Base = declarative_base()
`;

  const models = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);
    const tableName = toSnakeCase(table.name);
    
    const columns = table.columns.map(col => {
      const colName = toSnakeCase(col.name);
      const sqlType = getSQLAlchemyType(col.type);
      const parts: string[] = [`Column(${sqlType}`];
      
      if (col.primaryKey) {
        parts.push('primary_key=True');
      }
      if (col.autoIncrement && !col.type.includes('uuid')) {
        parts.push('autoincrement=True');
      }
      if (col.type === 'uuid') {
        parts.push('default=uuid.uuid4');
      }
      if (col.unique && !col.primaryKey) {
        parts.push('unique=True');
      }
      if (col.nullable && !col.primaryKey) {
        parts.push('nullable=True');
      } else if (!col.primaryKey) {
        parts.push('nullable=False');
      }
      if (col.references) {
        parts.push(`ForeignKey("${toSnakeCase(col.references.table)}.${toSnakeCase(col.references.column)}")`);
      }
      
      return `    ${colName} = ${parts.join(', ')})`;
    });

    // Add relationships
    const relationships: string[] = [];
    ir.relationships.forEach(rel => {
      if (rel.sourceTable === table.name) {
        const relName = toSnakeCase(rel.targetTable);
        const targetClass = toPascalCase(rel.targetTable);
        relationships.push(`    ${relName} = relationship("${targetClass}", back_populates="${toSnakeCase(table.name)}")`);
      }
    });

    return `
class ${className}(Base):
    __tablename__ = "${tableName}"
    
${columns.join('\n')}
${relationships.length > 0 ? '\n' + relationships.join('\n') : ''}

    def __repr__(self):
        return f"<${className}(id={self.id})>"
`;
  }).join('\n');

  return imports + models;
};

const generateSchemas = (ir: CanonicalIR): string => {
  const imports = `from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

`;

  const schemas = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);
    
    const baseFields = table.columns
      .filter(col => !col.autoIncrement && !col.primaryKey)
      .map(col => {
        const fieldName = toSnakeCase(col.name);
        const pyType = getPydanticType(col.type, col.nullable);
        const typeStr = col.nullable ? `Optional[${pyType}]` : pyType;
        const defaultVal = col.nullable ? ' = None' : '';
        return `    ${fieldName}: ${typeStr}${defaultVal}`;
      });

    const responseFields = table.columns.map(col => {
      const fieldName = toSnakeCase(col.name);
      const pyType = getPydanticType(col.type, col.nullable);
      const typeStr = col.nullable ? `Optional[${pyType}]` : pyType;
      return `    ${fieldName}: ${typeStr}`;
    });

    return `
class ${className}Base(BaseModel):
${baseFields.join('\n') || '    pass'}

class ${className}Create(${className}Base):
    pass

class ${className}Update(BaseModel):
${baseFields.map(f => f.replace(': ', ': Optional[').replace(/\n$/, '').replace(/$/, '] = None' )).join('\n') || '    pass'}

class ${className}Response(${className}Base):
${responseFields.join('\n')}

    class Config:
        from_attributes = True
`;
  }).join('\n');

  return imports + schemas;
};

const generateCrud = (ir: CanonicalIR): string => {
  const imports = `from sqlalchemy.orm import Session
from typing import List, Optional
from . import models, schemas

`;

  const cruds = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);
    const varName = toSnakeCase(table.originalName);
    const pkCol = table.columns.find(c => c.primaryKey);
    const pkName = pkCol ? toSnakeCase(pkCol.name) : 'id';
    const pkType = pkCol && pkCol.type === 'uuid' ? 'str' : 'int';

    return `
# ${className} CRUD operations
def get_${varName}(db: Session, ${pkName}: ${pkType}) -> Optional[models.${className}]:
    return db.query(models.${className}).filter(models.${className}.${pkName} == ${pkName}).first()

def get_${varName}_list(db: Session, skip: int = 0, limit: int = 100) -> List[models.${className}]:
    return db.query(models.${className}).offset(skip).limit(limit).all()

def create_${varName}(db: Session, ${varName}: schemas.${className}Create) -> models.${className}:
    db_${varName} = models.${className}(**${varName}.model_dump())
    db.add(db_${varName})
    db.commit()
    db.refresh(db_${varName})
    return db_${varName}

def update_${varName}(db: Session, ${pkName}: ${pkType}, ${varName}: schemas.${className}Update) -> Optional[models.${className}]:
    db_${varName} = get_${varName}(db, ${pkName})
    if db_${varName}:
        update_data = ${varName}.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_${varName}, key, value)
        db.commit()
        db.refresh(db_${varName})
    return db_${varName}

def delete_${varName}(db: Session, ${pkName}: ${pkType}) -> bool:
    db_${varName} = get_${varName}(db, ${pkName})
    if db_${varName}:
        db.delete(db_${varName})
        db.commit()
        return True
    return False
`;
  }).join('\n');

  return imports + cruds;
};

const generateRouters = (ir: CanonicalIR): string => {
  const imports = `from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas

router = APIRouter()

`;

  const routes = ir.tables.map(table => {
    const className = toPascalCase(table.originalName);
    const varName = toSnakeCase(table.originalName);
    const routeName = pluralize(varName);
    const pkCol = table.columns.find(c => c.primaryKey);
    const pkName = pkCol ? toSnakeCase(pkCol.name) : 'id';
    const pkType = pkCol && pkCol.type === 'uuid' ? 'str' : 'int';

    return `
# ${className} routes
@router.get("/${routeName}", response_model=List[schemas.${className}Response], tags=["${className}"])
def list_${routeName}(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_${varName}_list(db, skip=skip, limit=limit)

@router.get("/${routeName}/{${pkName}}", response_model=schemas.${className}Response, tags=["${className}"])
def get_${varName}(${pkName}: ${pkType}, db: Session = Depends(get_db)):
    db_${varName} = crud.get_${varName}(db, ${pkName})
    if db_${varName} is None:
        raise HTTPException(status_code=404, detail="${className} not found")
    return db_${varName}

@router.post("/${routeName}", response_model=schemas.${className}Response, status_code=status.HTTP_201_CREATED, tags=["${className}"])
def create_${varName}(${varName}: schemas.${className}Create, db: Session = Depends(get_db)):
    return crud.create_${varName}(db, ${varName})

@router.put("/${routeName}/{${pkName}}", response_model=schemas.${className}Response, tags=["${className}"])
def update_${varName}(${pkName}: ${pkType}, ${varName}: schemas.${className}Update, db: Session = Depends(get_db)):
    db_${varName} = crud.update_${varName}(db, ${pkName}, ${varName})
    if db_${varName} is None:
        raise HTTPException(status_code=404, detail="${className} not found")
    return db_${varName}

@router.delete("/${routeName}/{${pkName}}", status_code=status.HTTP_204_NO_CONTENT, tags=["${className}"])
def delete_${varName}(${pkName}: ${pkType}, db: Session = Depends(get_db)):
    if not crud.delete_${varName}(db, ${pkName}):
        raise HTTPException(status_code=404, detail="${className} not found")
`;
  }).join('\n');

  return imports + routes;
};

const generateMain = (ir: CanonicalIR, config: ExportConfig): string => {
  return `from fastapi import FastAPI
${config.includeCorsSetup ? 'from fastapi.middleware.cors import CORSMiddleware' : ''}
from .database import engine, Base
from .routers import api_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="${config.projectName} API",
    description="Auto-generated API from ER Model",
    version="1.0.0",
)

${config.includeCorsSetup ? `
# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
` : ''}

# Include routers
app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Welcome to ${config.projectName} API", "docs": "/docs"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
`;
};

const generateDatabase = (dbAdapter: DatabaseAdapter): string => {
  const dbUrl = dbAdapter.id === 'sqlite' 
    ? 'sqlite:///./app.db'
    : dbAdapter.id === 'postgresql'
    ? 'postgresql://user:password@localhost:5432/dbname'
    : dbAdapter.id === 'mysql' || dbAdapter.id === 'mariadb'
    ? 'mysql+pymysql://user:password@localhost:3306/dbname'
    : 'sqlite:///./app.db';

  return `from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "${dbUrl}")

engine = create_engine(
    DATABASE_URL,
    ${dbAdapter.id === 'sqlite' ? 'connect_args={"check_same_thread": False}' : 'pool_pre_ping=True'}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`;
};

const generateRequirements = (dbAdapter: DatabaseAdapter): string => {
  const dbDrivers: Record<string, string> = {
    postgresql: 'psycopg2-binary>=2.9.0',
    mysql: 'pymysql>=1.0.0',
    mariadb: 'pymysql>=1.0.0',
    sqlite: '',
    oracle: 'cx_Oracle>=8.0.0',
    sqlserver: 'pyodbc>=4.0.0',
    db2: 'ibm_db>=3.0.0',
  };

  return `fastapi>=0.100.0
uvicorn[standard]>=0.22.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
python-dotenv>=1.0.0
${dbDrivers[dbAdapter.id] || ''}
`.trim();
};

const generateReadme = (ir: CanonicalIR, config: ExportConfig): string => {
  return `# ${config.projectName}

Auto-generated FastAPI backend from ER Model.

## Setup

\`\`\`bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (optional)
export DATABASE_URL="your-database-url"

# Run the server
uvicorn app.main:app --reload
\`\`\`

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Entities

${ir.tables.map(t => `- **${toPascalCase(t.originalName)}**: ${t.columns.length} columns`).join('\n')}

## Project Structure

\`\`\`
${toSnakeCase(config.projectName)}/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── crud.py
│   └── routers/
│       ├── __init__.py
│       └── api.py
├── requirements.txt
└── README.md
\`\`\`
`;
};

export const fastapiAdapter: FrameworkAdapter = {
  id: 'fastapi',
  name: 'FastAPI',
  language: 'python',
  description: 'Modern, fast Python web framework with automatic API docs',
  features: {
    orm: 'SQLAlchemy',
    migrations: true,
    validation: true,
    authentication: true,
    swagger: true,
    graphql: false,
    testing: true,
    docker: true,
  },
  supportedDatabases: ['postgresql', 'mysql', 'sqlite', 'mariadb', 'oracle', 'sqlserver'],

  generateProject: (schema, dbAdapter, config) => {
    // This will be called with the canonical IR
    const ir = schema as unknown as CanonicalIR;
    const projectName = toSnakeCase(config.projectName);
    const files: GeneratedFile[] = [];

    // App files
    files.push({ path: `${projectName}/app/__init__.py`, content: '', type: 'other' });
    files.push({ path: `${projectName}/app/main.py`, content: generateMain(ir, config), type: 'config' });
    files.push({ path: `${projectName}/app/database.py`, content: generateDatabase(dbAdapter), type: 'config' });
    files.push({ path: `${projectName}/app/models.py`, content: generateModels(ir, dbAdapter), type: 'model' });
    files.push({ path: `${projectName}/app/schemas.py`, content: generateSchemas(ir), type: 'schema' });
    files.push({ path: `${projectName}/app/crud.py`, content: generateCrud(ir), type: 'service' });
    
    // Routers
    files.push({ path: `${projectName}/app/routers/__init__.py`, content: 'from .api import router as api_router', type: 'other' });
    files.push({ path: `${projectName}/app/routers/api.py`, content: generateRouters(ir), type: 'controller' });
    
    // Root files
    files.push({ path: `${projectName}/requirements.txt`, content: generateRequirements(dbAdapter), type: 'config' });
    files.push({ path: `${projectName}/README.md`, content: generateReadme(ir, config), type: 'readme' });

    return files;
  },

  getModelFileName: (entityName) => `${toSnakeCase(entityName)}.py`,
  getControllerFileName: (entityName) => `${toSnakeCase(entityName)}_router.py`,
  getSchemaFileName: (entityName) => `${toSnakeCase(entityName)}_schema.py`,
  getServiceFileName: (entityName) => `${toSnakeCase(entityName)}_crud.py`,
  getMigrationFileName: (entityName, timestamp) => `${timestamp}_create_${toSnakeCase(entityName)}.py`,
};
