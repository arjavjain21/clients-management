import React from 'react';
import { Upload, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StagingViewer } from '@/components/clients/StagingViewer';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppSidebar } from '@/components/layout/AppSidebar';

export default function StagingData() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        
        <div className="flex flex-col lg:pl-64">
          <AppHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-7xl space-y-6">
              {/* Page Header */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Staging Data</h1>
                  <p className="text-muted-foreground">
                    Review and manage client data imports before processing
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Card className="flex items-center gap-2 px-3 py-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Import Status: Ready
                    </span>
                  </Card>
                </div>
              </div>

              {/* Staging Viewer */}
              <StagingViewer />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}