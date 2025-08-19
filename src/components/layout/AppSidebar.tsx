import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  Database,
  BarChart3,
  Settings,
  Home,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    current: false,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Users,
    current: true,
  },
  {
    name: 'Staging Data',
    href: '/staging',
    icon: Database,
    current: false,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    current: false,
    disabled: true,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    current: false,
    disabled: true,
  },
];

export function AppSidebar({ open, onOpenChange }: AppSidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Clients Admin</h2>
            <p className="text-sm text-muted-foreground">Internal Tool</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                (item.href === '/clients' && location.pathname.startsWith('/clients')) ||
                (item.href === '/staging' && location.pathname.startsWith('/staging'));
              
              return (
                <Link
                  key={item.name}
                  to={item.disabled ? '#' : item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    } else if (!item.disabled && window.innerWidth < 1024) {
                      onOpenChange(false);
                    }
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.disabled && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      Soon
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-6 border-t">
          <Card className="p-4 bg-muted/50">
            <div className="text-sm">
              <div className="font-medium">Need Help?</div>
              <div className="text-muted-foreground text-xs mt-1">
                Contact the development team for support
              </div>
            </div>
          </Card>
        </div>
      </aside>
    </>
  );
}