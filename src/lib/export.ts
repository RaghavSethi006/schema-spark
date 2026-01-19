import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ERSchema, validateSchema } from './schema';
import { generateProject, GeneratedFile } from './generator';

export interface ExportResult {
  success: boolean;
  message: string;
  errors?: string[];
}

export const exportAsZip = async (schema: ERSchema): Promise<ExportResult> => {
  // Validate schema before export
  const validationErrors = validateSchema(schema);
  const criticalErrors = validationErrors.filter(e => e.type === 'error');
  
  if (criticalErrors.length > 0) {
    return {
      success: false,
      message: 'Schema has validation errors',
      errors: criticalErrors.map(e => e.message),
    };
  }

  if (schema.entities.length === 0) {
    return {
      success: false,
      message: 'No entities to export',
      errors: ['Add at least one entity before exporting'],
    };
  }

  try {
    const zip = new JSZip();
    const projectFolder = zip.folder(schema.name.toLowerCase().replace(/\s+/g, '-'));
    
    if (!projectFolder) {
      throw new Error('Failed to create project folder');
    }

    // Generate all project files
    const files: GeneratedFile[] = generateProject(schema);
    
    // Add each file to the zip
    files.forEach(file => {
      projectFolder.file(file.path, file.content);
    });

    // Add .gitignore
    projectFolder.file('.gitignore', `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
ENV/

# SQLite
*.db
*.db-journal

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`);

    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    const fileName = `${schema.name.toLowerCase().replace(/\s+/g, '-')}-api.zip`;
    
    saveAs(blob, fileName);

    return {
      success: true,
      message: `Successfully exported ${files.length} files`,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to generate export',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
};

// Export just the JSON schema
export const exportSchema = (schema: ERSchema): void => {
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
  const fileName = `${schema.name.toLowerCase().replace(/\s+/g, '-')}-schema.json`;
  saveAs(blob, fileName);
};

// Import schema from JSON
export const importSchema = (file: File): Promise<ERSchema> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const schema = JSON.parse(content) as ERSchema;
        
        // Basic validation
        if (!schema.version || !schema.entities || !schema.relations) {
          throw new Error('Invalid schema format');
        }
        
        resolve(schema);
      } catch (error) {
        reject(new Error('Failed to parse schema file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};
