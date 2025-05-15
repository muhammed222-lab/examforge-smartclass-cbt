
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { BookOpen, FileText, Shield, Zap, Check } from 'lucide-react';

const Index = () => {
  const { isAuthenticated } = useAuth();

  return (
    <AppLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-12 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="text-primary-600">Exam</span>
            <span className="text-secondary-600">Forge</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-6 max-w-2xl mx-auto">
            Where Learning Meets Intelligence
          </p>
          <p className="text-lg mb-8 max-w-3xl mx-auto">
            Create AI-powered exams from your learning materials. 
            Smart question generation, secure testing environment, and comprehensive analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button asChild size="lg" className="font-semibold">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="font-semibold">
                  <Link to="/signup">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/login">Log In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose ExamForge?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-all hover:shadow-md">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Questions</h3>
              <p className="text-muted-foreground">
                Upload your learning materials and let our AI generate relevant and challenging questions automatically.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-all hover:shadow-md">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Highly Secure Testing</h3>
              <p className="text-muted-foreground">
                Our exam environment prevents cheating with tab switching detection, copy/paste prevention, and more.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-all hover:shadow-md">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Detailed Analytics</h3>
              <p className="text-muted-foreground">
                Get comprehensive insights on student performance with easy-to-understand reports and exports.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-all hover:shadow-md">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple File Support</h3>
              <p className="text-muted-foreground">
                Upload content in PDF, DOCX, PPT, or image formats - our system extracts and processes all content types.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-all hover:shadow-md">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Student Management</h3>
              <p className="text-muted-foreground">
                Import student lists via CSV, manage access keys, and control who can take your exams.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-card border border-border rounded-lg p-6 transition-all hover:shadow-md">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightweight & Portable</h3>
              <p className="text-muted-foreground">
                Built with CSV database for portability and speed - no heavy database setup required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Choose the plan that works best for your needs
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-card border border-border rounded-lg overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold">Basic Plan</h3>
                <p className="text-accent-600 text-2xl font-bold mt-4">₦30,000<span className="text-muted-foreground text-sm font-normal">/year</span></p>
                <p className="text-muted-foreground mt-2">Perfect for small classes and occasional use</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>5 CBTs daily max</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>AI Question Generation</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Student Management</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Basic Analytics</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" asChild>
                  <Link to={isAuthenticated ? "/dashboard/upgrade" : "/signup"}>
                    {isAuthenticated ? "Upgrade Now" : "Get Started"}
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Premium Plan */}
            <div className="bg-card border-2 border-primary rounded-lg overflow-hidden transition-all hover:shadow-md relative">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>
              <div className="p-6 border-b border-border">
                <h3 className="text-xl font-bold">Premium Plan</h3>
                <p className="text-accent-600 text-2xl font-bold mt-4">₦50,000<span className="text-muted-foreground text-sm font-normal">/year</span></p>
                <p className="text-muted-foreground mt-2">Ideal for frequent use and comprehensive needs</p>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Unlimited CBTs</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Advanced AI Question Generation</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Priority Support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Detailed Analytics & Reports</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                    <span>Advanced Security Features</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="default" asChild>
                  <Link to={isAuthenticated ? "/dashboard/upgrade" : "/signup"}>
                    {isAuthenticated ? "Upgrade Now" : "Get Started"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Testing Experience?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join educators worldwide who are using ExamForge to create smarter, more secure exams.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to={isAuthenticated ? "/dashboard" : "/signup"}>
              {isAuthenticated ? "Go to Dashboard" : "Get Started for Free"}
            </Link>
          </Button>
        </div>
      </section>
    </AppLayout>
  );
};

export default Index;
