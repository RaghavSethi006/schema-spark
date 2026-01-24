import { FrameworkAdapter, DatabaseAdapter, ExportConfig, GeneratedFile, CanonicalIR, IRTable, toSnakeCase, toPascalCase, toCamelCase, pluralize } from '../types';

const getJavaType = (fieldType: string): string => {
  const typeMap: Record<string, string> = {
    string: 'String',
    text: 'String',
    int: 'Integer',
    float: 'Double',
    boolean: 'Boolean',
    date: 'LocalDate',
    datetime: 'LocalDateTime',
    uuid: 'UUID',
    json: 'String',
    decimal: 'BigDecimal',
    bigint: 'Long',
    binary: 'byte[]',
  };
  return typeMap[fieldType] || 'String';
};

const getJpaAnnotation = (col: { type: string; nullable: boolean; unique: boolean }): string[] => {
  const annotations: string[] = [];
  
  if (col.type === 'text') {
    annotations.push('@Lob');
  }
  
  const columnParts: string[] = [];
  if (!col.nullable) columnParts.push('nullable = false');
  if (col.unique) columnParts.push('unique = true');
  
  if (columnParts.length > 0) {
    annotations.push(`@Column(${columnParts.join(', ')})`);
  }
  
  return annotations;
};

const generateEntity = (table: IRTable, ir: CanonicalIR, basePackage: string): string => {
  const className = toPascalCase(table.originalName);
  const tableName = toSnakeCase(table.name);

  const imports = new Set([
    'jakarta.persistence.*',
    'lombok.Data',
    'lombok.NoArgsConstructor',
    'lombok.AllArgsConstructor',
  ]);

  const fields = table.columns.map(col => {
    const fieldName = toCamelCase(col.name);
    const javaType = getJavaType(col.type);
    const annotations: string[] = [];

    if (col.type === 'date') imports.add('java.time.LocalDate');
    if (col.type === 'datetime') imports.add('java.time.LocalDateTime');
    if (col.type === 'uuid') imports.add('java.util.UUID');
    if ((col.type as string) === 'decimal') imports.add('java.math.BigDecimal');

    if (col.primaryKey) {
      annotations.push('@Id');
      if (col.type === 'uuid') {
        annotations.push('@GeneratedValue(strategy = GenerationType.UUID)');
      } else {
        annotations.push('@GeneratedValue(strategy = GenerationType.IDENTITY)');
      }
    } else if (col.references) {
      const refEntity = toPascalCase(col.references.table);
      annotations.push(`@ManyToOne(fetch = FetchType.LAZY)`);
      annotations.push(`@JoinColumn(name = "${toSnakeCase(col.name)}")`);
      return `    ${annotations.join('\n    ')}
    private ${refEntity} ${toCamelCase(col.references.table)};`;
    } else {
      annotations.push(...getJpaAnnotation(col));
    }

    return `    ${annotations.length > 0 ? annotations.join('\n    ') + '\n    ' : ''}private ${javaType} ${fieldName};`;
  });

  // Add relationships
  const relationships: string[] = [];
  ir.relationships.forEach(rel => {
    if (rel.sourceTable === table.name) {
      const relEntity = toPascalCase(rel.targetTable);
      const relField = toCamelCase(pluralize(rel.targetTable));
      imports.add('java.util.List');
      imports.add('java.util.ArrayList');
      relationships.push(`    @OneToMany(mappedBy = "${toCamelCase(table.name)}", cascade = CascadeType.ALL)
    private List<${relEntity}> ${relField} = new ArrayList<>();`);
    }
  });

  return `package ${basePackage}.entity;

${Array.from(imports).map(i => `import ${i};`).join('\n')}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "${tableName}")
public class ${className} {
${fields.join('\n\n')}
${relationships.length > 0 ? '\n' + relationships.join('\n\n') : ''}
}
`;
};

const generateRepository = (table: IRTable, basePackage: string): string => {
  const className = toPascalCase(table.originalName);
  const pkCol = table.columns.find(c => c.primaryKey);
  const pkType = getJavaType(pkCol?.type || 'int');

  return `package ${basePackage}.repository;

import ${basePackage}.entity.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
${pkType === 'UUID' ? 'import java.util.UUID;' : ''}

@Repository
public interface ${className}Repository extends JpaRepository<${className}, ${pkType}> {
}
`;
};

const generateService = (table: IRTable, basePackage: string): string => {
  const className = toPascalCase(table.originalName);
  const varName = toCamelCase(table.originalName);
  const pkCol = table.columns.find(c => c.primaryKey);
  const pkType = getJavaType(pkCol?.type || 'int');

  return `package ${basePackage}.service;

import ${basePackage}.entity.${className};
import ${basePackage}.repository.${className}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
${pkType === 'UUID' ? 'import java.util.UUID;' : ''}

@Service
public class ${className}Service {

    @Autowired
    private ${className}Repository ${varName}Repository;

    public List<${className}> findAll() {
        return ${varName}Repository.findAll();
    }

    public Optional<${className}> findById(${pkType} id) {
        return ${varName}Repository.findById(id);
    }

    public ${className} save(${className} ${varName}) {
        return ${varName}Repository.save(${varName});
    }

    public ${className} update(${pkType} id, ${className} ${varName}) {
        ${varName}.set${pkCol?.name ? toPascalCase(pkCol.name) : 'Id'}(id);
        return ${varName}Repository.save(${varName});
    }

    public void deleteById(${pkType} id) {
        ${varName}Repository.deleteById(id);
    }
}
`;
};

const generateController = (table: IRTable, basePackage: string): string => {
  const className = toPascalCase(table.originalName);
  const varName = toCamelCase(table.originalName);
  const routeName = pluralize(toSnakeCase(table.originalName)).replace(/_/g, '-');
  const pkCol = table.columns.find(c => c.primaryKey);
  const pkType = getJavaType(pkCol?.type || 'int');

  return `package ${basePackage}.controller;

import ${basePackage}.entity.${className};
import ${basePackage}.service.${className}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
${pkType === 'UUID' ? 'import java.util.UUID;' : ''}

@RestController
@RequestMapping("/api/${routeName}")
@CrossOrigin(origins = "*")
public class ${className}Controller {

    @Autowired
    private ${className}Service ${varName}Service;

    @GetMapping
    public List<${className}> getAll() {
        return ${varName}Service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> getById(@PathVariable ${pkType} id) {
        return ${varName}Service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ${className} create(@RequestBody ${className} ${varName}) {
        return ${varName}Service.save(${varName});
    }

    @PutMapping("/{id}")
    public ResponseEntity<${className}> update(@PathVariable ${pkType} id, @RequestBody ${className} ${varName}) {
        return ${varName}Service.findById(id)
                .map(existing -> ResponseEntity.ok(${varName}Service.update(id, ${varName})))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable ${pkType} id) {
        if (${varName}Service.findById(id).isPresent()) {
            ${varName}Service.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
`;
};

const generateApplication = (config: ExportConfig, basePackage: string): string => {
  return `package ${basePackage};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${toPascalCase(config.projectName)}Application {
    public static void main(String[] args) {
        SpringApplication.run(${toPascalCase(config.projectName)}Application.class, args);
    }
}
`;
};

const generateApplicationProperties = (dbAdapter: DatabaseAdapter): string => {
  const dbConfigs: Record<string, string> = {
    postgresql: `spring.datasource.url=jdbc:postgresql://localhost:5432/dbname
spring.datasource.username=user
spring.datasource.password=password
spring.datasource.driver-class-name=org.postgresql.Driver`,
    mysql: `spring.datasource.url=jdbc:mysql://localhost:3306/dbname
spring.datasource.username=user
spring.datasource.password=password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver`,
    sqlite: `spring.datasource.url=jdbc:sqlite:./database.db
spring.datasource.driver-class-name=org.sqlite.JDBC`,
  };

  return `# Application Properties
server.port=8080

# Database Configuration
${dbConfigs[dbAdapter.id] || dbConfigs.postgresql}

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Swagger / OpenAPI
springdoc.swagger-ui.path=/swagger-ui.html
`;
};

const generatePom = (config: ExportConfig, dbAdapter: DatabaseAdapter): string => {
  const dbDependency = {
    postgresql: '<groupId>org.postgresql</groupId>\n            <artifactId>postgresql</artifactId>\n            <scope>runtime</scope>',
    mysql: '<groupId>com.mysql</groupId>\n            <artifactId>mysql-connector-j</artifactId>\n            <scope>runtime</scope>',
    sqlite: '<groupId>org.xerial</groupId>\n            <artifactId>sqlite-jdbc</artifactId>\n            <version>3.42.0.0</version>',
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    
    <groupId>com.example</groupId>
    <artifactId>${toSnakeCase(config.projectName).replace(/_/g, '-')}</artifactId>
    <version>1.0.0</version>
    <name>${config.projectName}</name>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            ${dbDependency[dbAdapter.id] || dbDependency.postgresql}
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
`;
};

export const springBootAdapter: FrameworkAdapter = {
  id: 'spring-boot',
  name: 'Spring Boot',
  language: 'java',
  description: 'Enterprise-grade Java framework with JPA support',
  features: {
    orm: 'JPA/Hibernate',
    migrations: true,
    validation: true,
    authentication: true,
    swagger: true,
    graphql: true,
    testing: true,
    docker: true,
  },
  supportedDatabases: ['postgresql', 'mysql', 'sqlite', 'oracle', 'sqlserver', 'mariadb'],

  generateProject: (schema, dbAdapter, config) => {
    const ir = schema as unknown as CanonicalIR;
    const projectName = toSnakeCase(config.projectName).replace(/_/g, '-');
    const basePackage = `com.example.${toSnakeCase(config.projectName).replace(/_/g, '')}`;
    const packagePath = basePackage.replace(/\./g, '/');
    const files: GeneratedFile[] = [];

    // Generate per-entity files
    ir.tables.forEach(table => {
      files.push({ 
        path: `${projectName}/src/main/java/${packagePath}/entity/${toPascalCase(table.originalName)}.java`, 
        content: generateEntity(table, ir, basePackage), 
        type: 'model' 
      });
      files.push({ 
        path: `${projectName}/src/main/java/${packagePath}/repository/${toPascalCase(table.originalName)}Repository.java`, 
        content: generateRepository(table, basePackage), 
        type: 'other' 
      });
      files.push({ 
        path: `${projectName}/src/main/java/${packagePath}/service/${toPascalCase(table.originalName)}Service.java`, 
        content: generateService(table, basePackage), 
        type: 'service' 
      });
      files.push({ 
        path: `${projectName}/src/main/java/${packagePath}/controller/${toPascalCase(table.originalName)}Controller.java`, 
        content: generateController(table, basePackage), 
        type: 'controller' 
      });
    });

    // Application class
    files.push({ 
      path: `${projectName}/src/main/java/${packagePath}/${toPascalCase(config.projectName)}Application.java`, 
      content: generateApplication(config, basePackage), 
      type: 'config' 
    });

    // Configuration
    files.push({ 
      path: `${projectName}/src/main/resources/application.properties`, 
      content: generateApplicationProperties(dbAdapter), 
      type: 'config' 
    });

    // Build file
    files.push({ path: `${projectName}/pom.xml`, content: generatePom(config, dbAdapter), type: 'config' });

    return files;
  },

  getModelFileName: (entityName) => `${toPascalCase(entityName)}.java`,
  getControllerFileName: (entityName) => `${toPascalCase(entityName)}Controller.java`,
  getSchemaFileName: (entityName) => `${toPascalCase(entityName)}Dto.java`,
  getServiceFileName: (entityName) => `${toPascalCase(entityName)}Service.java`,
  getMigrationFileName: (entityName, timestamp) => `V${timestamp}__Create${toPascalCase(entityName)}.sql`,
};
