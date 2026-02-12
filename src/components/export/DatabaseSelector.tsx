import { Check, ChevronDown, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { DatabaseType } from '@/lib/export/types';
import { getAllDatabaseAdapters } from '@/lib/export/databases';
import { getAllNoSQLAdapters } from '@/lib/export/databases/nosql';
import { useState } from 'react';

// Database icons/colors
const databaseConfig: Record<string, { color: string }> = {
  postgresql: { color: 'bg-blue-600' },
  mysql: { color: 'bg-orange-500' },
  sqlite: { color: 'bg-sky-400' },
  oracle: { color: 'bg-red-600' },
  sqlserver: { color: 'bg-red-500' },
  mariadb: { color: 'bg-amber-600' },
  db2: { color: 'bg-green-600' },
  mongodb: { color: 'bg-emerald-600' },
  couchdb: { color: 'bg-red-400' },
  redis: { color: 'bg-red-600' },
  dynamodb: { color: 'bg-yellow-500' },
  neo4j: { color: 'bg-blue-500' },
  arangodb: { color: 'bg-green-500' },
  cassandra: { color: 'bg-teal-600' },
  scylladb: { color: 'bg-purple-600' },
};

interface DatabaseSelectorProps {
  value: DatabaseType;
  onChange: (value: DatabaseType) => void;
  disabled?: boolean;
  supportedDatabases?: DatabaseType[];
}

export const DatabaseSelector = ({
  value,
  onChange,
  disabled,
  supportedDatabases,
}: DatabaseSelectorProps) => {
  const [open, setOpen] = useState(false);
  const relationalDbs = getAllDatabaseAdapters();
  const noSQLDbs = getAllNoSQLAdapters();

  // Filter by supported if provided
  const filteredRelational = supportedDatabases
    ? relationalDbs.filter((db) => supportedDatabases.includes(db.id))
    : relationalDbs;

  const allNoSQL = [
    ...noSQLDbs.document,
    ...noSQLDbs.keyValue,
    ...noSQLDbs.graph,
    ...noSQLDbs.wideColumn,
  ];
  const filteredNoSQL = supportedDatabases
    ? allNoSQL.filter((db) => supportedDatabases.includes(db.id as DatabaseType))
    : allNoSQL;

  const allDbs = [...filteredRelational, ...filteredNoSQL];
  const selected = allDbs.find((d) => d.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selected ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  databaseConfig[selected.id]?.color || 'bg-muted'
                )}
              />
              <span>{selected.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span>Select database...</span>
            </div>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search databases..." />
          <CommandList>
            <CommandEmpty>No database found.</CommandEmpty>
            {filteredRelational.length > 0 && (
              <CommandGroup heading="Relational (SQL)">
                {filteredRelational.map((db) => (
                  <CommandItem
                    key={db.id}
                    value={db.id}
                    onSelect={() => {
                      onChange(db.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === db.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          databaseConfig[db.id]?.color || 'bg-muted'
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{db.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {db.description}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {noSQLDbs.document.length > 0 && filteredNoSQL.some(db => ['mongodb', 'couchdb'].includes(db.id)) && (
              <CommandGroup heading="Document">
                {noSQLDbs.document
                  .filter(db => !supportedDatabases || supportedDatabases.includes(db.id as DatabaseType))
                  .map((db) => (
                  <CommandItem
                    key={db.id}
                    value={db.id}
                    onSelect={() => {
                      onChange(db.id as DatabaseType);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === db.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          databaseConfig[db.id]?.color || 'bg-muted'
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{db.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {db.description}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {noSQLDbs.keyValue.length > 0 && filteredNoSQL.some(db => ['redis', 'dynamodb'].includes(db.id)) && (
              <CommandGroup heading="Key-Value">
                {noSQLDbs.keyValue
                  .filter(db => !supportedDatabases || supportedDatabases.includes(db.id as DatabaseType))
                  .map((db) => (
                  <CommandItem
                    key={db.id}
                    value={db.id}
                    onSelect={() => {
                      onChange(db.id as DatabaseType);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === db.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          databaseConfig[db.id]?.color || 'bg-muted'
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{db.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {db.description}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {noSQLDbs.graph.length > 0 && filteredNoSQL.some(db => ['neo4j', 'arangodb'].includes(db.id)) && (
              <CommandGroup heading="Graph">
                {noSQLDbs.graph
                  .filter(db => !supportedDatabases || supportedDatabases.includes(db.id as DatabaseType))
                  .map((db) => (
                  <CommandItem
                    key={db.id}
                    value={db.id}
                    onSelect={() => {
                      onChange(db.id as DatabaseType);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === db.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          databaseConfig[db.id]?.color || 'bg-muted'
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{db.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {db.description}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {noSQLDbs.wideColumn.length > 0 && filteredNoSQL.some(db => ['cassandra', 'scylladb'].includes(db.id)) && (
              <CommandGroup heading="Wide-Column">
                {noSQLDbs.wideColumn
                  .filter(db => !supportedDatabases || supportedDatabases.includes(db.id as DatabaseType))
                  .map((db) => (
                  <CommandItem
                    key={db.id}
                    value={db.id}
                    onSelect={() => {
                      onChange(db.id as DatabaseType);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === db.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full',
                          databaseConfig[db.id]?.color || 'bg-muted'
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{db.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {db.description}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
