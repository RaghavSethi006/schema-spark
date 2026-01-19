import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export const AppLayout = ({ children, sidebar }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Main Canvas */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>

        {/* Sidebar */}
        {sidebar && (
          <aside
            className={cn(
              'w-80 border-l border-border bg-card overflow-hidden transition-all duration-300',
              'hidden md:block',
              !isSidebarOpen && 'md:w-0 md:border-0'
            )}
          >
            {isSidebarOpen && sidebar}
          </aside>
        )}

        {/* Mobile Sidebar Overlay */}
        {sidebar && isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <aside className="absolute right-0 top-14 bottom-0 w-80 bg-card border-l border-border overflow-y-auto animate-slide-in-right">
              {sidebar}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
