import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const navigation = [
  {
    name: 'Clients',
    href: '/clients',
    icon: Users,
    current: true,
  },
  {
    name: 'Team Members',
    href: '/team-members',
    icon: Users,
    current: false,
  },
];

export function AppSidebar({ open, onOpenChange, collapsed, onCollapsedChange }: AppSidebarProps) {
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
          'fixed inset-y-0 left-0 z-50 bg-card border-r flex flex-col',
          'transform transition-all duration-300 ease-in-out lg:translate-x-0',
          // Mobile: always full width when open, hidden when closed
          open ? 'translate-x-0 w-64' : '-translate-x-full w-64',
          // Desktop: responsive width based on collapsed state
          collapsed ? 'lg:w-16' : 'lg:w-64'
        )}
        role="navigation"
        aria-label="Main navigation"
        aria-expanded={open}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center border-b transition-all duration-300 ease-in-out",
          collapsed ? "justify-center p-3" : "justify-between p-6"
        )}>
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold truncate">Clients Admin</h2>
                <p className="text-sm text-muted-foreground truncate">Internal Tool</p>
              </div>
              
              {/* Desktop collapse toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex ml-2 shrink-0"
                onClick={() => onCollapsedChange(!collapsed)}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Mobile close button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden ml-2 shrink-0"
                onClick={() => onOpenChange(false)}
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              {/* Collapsed logo */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center cursor-pointer">
                    <Users className="h-4 w-4 text-primary-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p>Clients Admin</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Desktop expand toggle - positioned absolute in collapsed state */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex absolute -right-3 top-6 bg-card border rounded-full w-6 h-6 p-0 shadow-md hover:shadow-lg transition-shadow"
                onClick={() => onCollapsedChange(!collapsed)}
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
          collapsed ? "px-2 py-4" : "px-6 py-6"
        )}>
          <div className={cn(
            "space-y-1 transition-all duration-300 ease-in-out",
            collapsed && "space-y-2"
          )}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || 
                (item.href === '/clients' && location.pathname.startsWith('/clients')) ||
                (item.href === '/team-members' && location.pathname.startsWith('/team-members'));
              
              const linkContent = (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center rounded-lg transition-all duration-200 ease-in-out',
                    'text-sm font-medium relative group',
                    collapsed ? 'justify-center p-3 w-12 h-12' : 'gap-3 px-3 py-3',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onOpenChange(false);
                    }
                  }}
                >
                  <Icon className={cn(
                    "shrink-0 transition-all duration-200 ease-in-out",
                    collapsed ? "h-5 w-5" : "h-5 w-5"
                  )} />
                  {!collapsed && (
                    <span className="truncate transition-all duration-300 ease-in-out">
                      {item.name}
                    </span>
                  )}
                  
                  {/* Active indicator for collapsed state */}
                  {collapsed && isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.name} delayDuration={0}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={16} className="font-medium">
                      <p>{item.name}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t transition-all duration-300 ease-in-out",
          collapsed ? "p-3" : "p-6"
        )}>
          {!collapsed ? (
            <Card className="p-4 bg-muted/50 transition-all duration-300 ease-in-out">
              <div className="text-sm">
                <div className="font-medium">Need Help?</div>
                <div className="text-muted-foreground text-xs mt-1">
                  Contact the development team for support
                </div>
              </div>
            </Card>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="w-full flex justify-center">
                  <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center cursor-help">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={16} className="font-medium">
                <p>Need Help?</p>
                <p className="text-xs text-muted-foreground mt-1">Contact development team</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </>
  );
}