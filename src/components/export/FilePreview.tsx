import { useState, useMemo } from 'react';
import { File, Folder, ChevronRight, ChevronDown, Code, Eye, EyeOff } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { GeneratedFile } from '@/lib/export/types';

interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileTreeNode[];
  file?: GeneratedFile;
}

const buildFileTree = (files: GeneratedFile[]): FileTreeNode[] => {
  const root: FileTreeNode[] = [];

  files.forEach((file) => {
    const parts = file.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      const existing = current.find((n) => n.name === part);

      if (existing) {
        if (!isFile && existing.children) {
          current = existing.children;
        }
      } else {
        const node: FileTreeNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          file: isFile ? file : undefined,
        };
        current.push(node);
        if (!isFile) {
          current = node.children!;
        }
      }
    });
  });

  return root;
};

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  excludedFiles: Set<string>;
  onToggleExclude: (path: string) => void;
}

const FileTreeItem = ({
  node,
  depth,
  selectedFile,
  onSelectFile,
  excludedFiles,
  onToggleExclude,
}: FileTreeItemProps) => {
  const [expanded, setExpanded] = useState(true);
  const isExcluded = excludedFiles.has(node.path);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full px-2 py-1 hover:bg-muted/50 rounded text-sm"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          <Folder className="w-4 h-4 text-amber-500" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                excludedFiles={excludedFiles}
                onToggleExclude={onToggleExclude}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 text-sm group cursor-pointer rounded',
        selectedFile === node.path ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50',
        isExcluded && 'opacity-50 line-through'
      )}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
      onClick={() => onSelectFile(node.path)}
    >
      <File className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="truncate flex-1">{node.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleExclude(node.path);
        }}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded"
        title={isExcluded ? 'Include file' : 'Exclude file'}
      >
        {isExcluded ? (
          <Eye className="w-3 h-3" />
        ) : (
          <EyeOff className="w-3 h-3" />
        )}
      </button>
    </div>
  );
};

interface FilePreviewProps {
  files: GeneratedFile[];
  excludedFiles: Set<string>;
  onToggleExclude: (path: string) => void;
}

export const FilePreview = ({
  files,
  excludedFiles,
  onToggleExclude,
}: FilePreviewProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const fileTree = useMemo(() => buildFileTree(files), [files]);

  const selectedContent = useMemo(() => {
    if (!selectedFile) return null;
    return files.find((f) => f.path === selectedFile);
  }, [files, selectedFile]);

  return (
    <div className="flex h-[300px] border rounded-lg overflow-hidden bg-background">
      {/* File Tree */}
      <div className="w-1/3 border-r bg-muted/30">
        <div className="p-2 border-b bg-muted/50">
          <p className="text-xs font-medium text-muted-foreground">
            {files.length} files • {excludedFiles.size} excluded
          </p>
        </div>
        <ScrollArea className="h-[calc(100%-33px)]">
          <div className="py-1">
            {fileTree.map((node) => (
              <FileTreeItem
                key={node.path}
                node={node}
                depth={0}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                excludedFiles={excludedFiles}
                onToggleExclude={onToggleExclude}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Code Preview */}
      <div className="flex-1 flex flex-col">
        <div className="p-2 border-b bg-muted/50 flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium truncate">
            {selectedFile || 'Select a file to preview'}
          </span>
        </div>
        <ScrollArea className="flex-1">
          {selectedContent ? (
            <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
              <code>{selectedContent.content}</code>
            </pre>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Select a file to preview its contents
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
