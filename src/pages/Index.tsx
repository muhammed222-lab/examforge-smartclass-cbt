
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';

const Index: React.FC = () => {
  return (
    <AppLayout>
      <div className="relative">
        {/* Hero Section */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-muted">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Where Learning Meets <span className="text-primary">Intelligence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Create intelligent, AI-powered exams from your teaching materials. Transform how you assess learning with ExamForge.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/signup">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Log In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4 bg-card">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Powerful Features for Modern Education</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-t-4 border-t-blue-500">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3">AI Question Generation</h3>
                  <p className="text-muted-foreground">
                    Upload your teaching materials and let our AI create tailored exam questions automatically.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-t-4 border-t-green-500">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3">Secure Exam Environment</h3>
                  <p className="text-muted-foreground">
                    Prevent cheating with our advanced security features for online examinations.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-t-4 border-t-purple-500">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-3">Comprehensive Analytics</h3>
                  <p className="text-muted-foreground">
                    Get detailed insights on student performance and exam results in real-time.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 text-center bg-primary/5">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to transform your assessment process?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of educators already using ExamForge to create smarter, more efficient exams.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">Create Your Free Account</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
