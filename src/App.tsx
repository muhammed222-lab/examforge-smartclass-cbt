
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { initializeDefaultData } from "@/lib/csv-utils";

// Import pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import ClassesPage from "./pages/ClassesPage";
import StudentsPage from "./pages/StudentsPage";
import ResultsPage from "./pages/ResultsPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/AdminPage";
import CreateClassPage from "./pages/CreateClassPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import AddStudentPage from "./pages/AddStudentPage";
import AddQuestionPage from "./pages/AddQuestionPage";
import EditClassPage from "./pages/EditClassPage";
import UpgradePage from "./pages/UpgradePage";
import NotFound from "./pages/NotFound";
import ExamPage from "./pages/ExamPage";
import ExamResultPage from "./pages/ExamResultPage";

const queryClient = new QueryClient();

// Initialization function that doesn't use hooks
const initializeApp = () => {
  // Initialize default data
  initializeDefaultData().catch(console.error);
};

// Call the initialization function outside of component
initializeApp();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                {/* Exam routes */}
                <Route path="/exam/:classId" element={<ExamPage />} />
                <Route path="/exam-result/:resultId" element={<ExamResultPage />} />
                
                {/* Protected routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/classes" element={<ClassesPage />} />
                <Route path="/dashboard/classes/create" element={<CreateClassPage />} />
                <Route path="/dashboard/classes/:classId" element={<ClassDetailPage />} />
                <Route path="/dashboard/classes/:classId/edit" element={<EditClassPage />} />
                <Route path="/dashboard/classes/:classId/students/add" element={<AddStudentPage />} />
                <Route path="/dashboard/classes/:classId/questions/create" element={<AddQuestionPage />} />
                <Route path="/dashboard/students" element={<StudentsPage />} />
                <Route path="/dashboard/students/add" element={<AddStudentPage />} />
                <Route path="/dashboard/results" element={<ResultsPage />} />
                <Route path="/dashboard/upgrade" element={<UpgradePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
