import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getFromCSV, CSVFileType, appendToCSV, updateInCSV } from '@/lib/csv-utils';
import { useToast } from '@/hooks/use-toast';

// User types
export type UserRole = 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  paymentPlan: 'basic' | 'premium';
  examsRemaining: number | 'unlimited';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  updateUserPlan: (plan: 'basic' | 'premium') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('examforge_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('examforge_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const users = await getFromCSV<{
        id: string;
        email: string;
        password: string;
        name: string;
        role: UserRole;
        createdAt: string;
        updatedAt: string;
        paymentPlan: 'basic' | 'premium';
        examsRemaining: string;
      }>(CSVFileType.USERS);
      
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive',
        });
        throw new Error('Invalid email or password');
      }
      
      // Convert examsRemaining to number if it's not 'unlimited'
      const examsRemaining = foundUser.examsRemaining === 'unlimited' 
        ? 'unlimited' 
        : parseInt(foundUser.examsRemaining || '0', 10);
      
      const authenticatedUser: User = {
        ...foundUser,
        examsRemaining,
      };
      
      // Store user data in localStorage
      localStorage.setItem('examforge_user', JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${authenticatedUser.name}!`,
      });
      
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('examforge_user');
    setUser(null);
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
    });
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const users = await getFromCSV<{ id: string; email: string }>(CSVFileType.USERS);
      
      // Check if user already exists
      if (users.some(u => u.email === email)) {
        toast({
          title: 'Signup Failed',
          description: 'Email already exists',
          variant: 'destructive',
        });
        throw new Error('Email already exists');
      }
      
      // Generate a new user ID
      const newUserId = `user_${Date.now()}`;
      const timestamp = new Date().toISOString();
      
      const newUser: User = {
        id: newUserId,
        email,
        name,
        role: 'teacher',
        createdAt: timestamp,
        updatedAt: timestamp,
        paymentPlan: 'basic',
        examsRemaining: 5, // Default 5 exams daily for free tier
      };
      
      // Store in users CSV (with password)
      const userWithPassword = {
        ...newUser,
        password,
      };
      
      await appendToCSV(userWithPassword, CSVFileType.USERS);
      
      // Store user data in localStorage (without password)
      localStorage.setItem('examforge_user', JSON.stringify(newUser));
      setUser(newUser);
      
      toast({
        title: 'Signup Successful',
        description: `Welcome to ExamForge, ${name}!`,
      });
      
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update the updateUserPlan function to use updateInCSV instead of updateCSV
  const updateUserPlan = async (plan: 'basic' | 'premium') => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You need to be logged in to update your plan',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const examsRemaining = plan === 'premium' ? 'unlimited' : 5;
      const updatedTimestamp = new Date().toISOString();
      
      const updatedUser: User = {
        ...user,
        paymentPlan: plan,
        examsRemaining: examsRemaining,
        updatedAt: updatedTimestamp
      };

      // Update the user in CSV using updateInCSV instead of updateCSV
      await updateInCSV(
        user.id,
        {
          paymentPlan: plan,
          examsRemaining: examsRemaining,
          updatedAt: updatedTimestamp
        },
        CSVFileType.USERS
      );

      // Update local storage
      localStorage.setItem('examforge_user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast({
        title: 'Plan Updated',
        description: `Your subscription has been upgraded to ${plan === 'premium' ? 'Premium' : 'Basic'} plan!`,
      });
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription plan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated: !!user, 
        login, 
        logout, 
        signup,
        updateUserPlan
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
