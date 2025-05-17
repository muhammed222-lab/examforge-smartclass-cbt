
import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen,
  Users,
  FileText,
  BarChart2,
  Settings,
  Home,
  LogOut,
  User,
  Menu,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from './AppLayout';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Navigation items for sidebar
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Classes', path: '/dashboard/classes', icon: BookOpen },
    { name: 'Students', path: '/dashboard/students', icon: Users },
    { name: 'Results', path: '/dashboard/results', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];
  
  // Add admin links if user is admin
  if (user?.role === 'admin') {
    navItems.push(
      { name: 'Admin Panel', path: '/admin', icon: User },
      { name: 'CSV Database', path: '/admin/csv', icon: FileSpreadsheet }
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="mb-6 pb-4 border-b border-border">
        <h2 className="font-semibold text-lg mb-1">{user?.name}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
            {user?.paymentPlan === 'premium' ? 'Premium Plan' : user?.paymentPlan === 'basic' ? 'Basic Plan' : 'Free Plan'}
          </span>
        </div>
        {user?.paymentPlan !== 'premium' && (
          <div className="mt-2 text-xs text-muted-foreground">
            Remaining exams today: {user?.examsRemaining}
          </div>
        )}
      </div>
      
      <nav className="space-y-1 flex-grow">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location.pathname === item.path
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
            onClick={() => isMobile && setSidebarOpen(false)}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </nav>
      
      <div className="mt-6 pt-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <AppLayout requiresAuth>
      <div className="container mx-auto px-0 sm:px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* Mobile Menu */}
        {isMobile && (
          <div className="px-4 mb-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        )}
        
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-card rounded-lg shadow-sm border border-border p-4 sticky top-24">
              <SidebarContent />
            </div>
          </aside>
        )}
        
        {/* Main content */}
        <div className="flex-grow">
          {children}
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardLayout;
