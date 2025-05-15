
import React, { ReactNode, useEffect } from 'react';
import Navbar from './Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

interface AppLayoutProps {
  children: ReactNode;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  requiresAuth = false,
  adminOnly = false
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && requiresAuth) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (adminOnly && user?.role !== 'admin') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, requiresAuth, adminOnly, user, navigate, isLoading]);

  if (isLoading && requiresAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <footer className="border-t border-border py-6 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ExamForge. All rights reserved.</p>
          <p className="mt-2">Where Learning Meets Intelligence</p>
        </div>
      </footer>
      <Toaster />
      <Sonner />
    </div>
  );
};

export default AppLayout;
