
// User model
export interface User {
  id: string;
  email: string;
  password?: string; // Optional since we don't want to expose this in all contexts
  name: string;
  role: 'teacher' | 'admin';
  createdAt: string;
  updatedAt: string;
  paymentPlan: 'basic' | 'premium';
  examsRemaining: number | 'unlimited';
}

// Class model
export interface Class {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  numQuestions: number;
  duration: number; // in minutes
  accessKey: string;
  expiryDate: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'active' | 'expired';
}

// Student model
export interface Student {
  id: string;
  fullName: string;
  email: string;
  matricNumber: string;
  department: string;
  classId: string;
  createdAt: string;
}

// Question model
export interface Question {
  id: string;
  classId: string;
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: string | number;
  createdAt: string;
}

// Exam result model
export interface ExamResult {
  id: string;
  classId: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  timeStarted: string;
  timeEnded: string;
  answers: {
    questionId: string;
    selectedAnswer: string | number;
    isCorrect: boolean;
  }[];
  createdAt: string;
}

// Exam attempt tracking
export interface ExamAttempt {
  id: string;
  classId: string;
  studentId: string;
  accessKey: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  tabSwitches: number;
  startTime: string;
  endTime?: string;
  createdAt: string;
}

// Payment record
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  plan: 'basic' | 'premium';
  transactionRef: string;
  status: 'pending' | 'completed' | 'failed';
  provider: 'flutterwave';
  createdAt: string;
}

// Material for AI generation
export interface Material {
  id: string;
  classId: string;
  name: string;
  type: 'pdf' | 'docx' | 'ppt' | 'image' | 'text';
  content: string; // Extracted text content
  originalFileName: string;
  uploadedAt: string;
}
