
import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const UpgradePage: React.FC = () => {
  const { user } = useAuth();

  const handleUpgrade = (plan: string) => {
    // Here you would integrate with Flutterwave payment
    toast({
      title: 'Payment process',
      description: 'Redirecting to payment gateway...',
    });

    // Mock payment process for now
    setTimeout(() => {
      toast({
        title: 'Success',
        description: 'Your account has been upgraded successfully!',
      });
    }, 2000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upgrade Your Plan</h1>
          <p className="text-muted-foreground mt-1">
            Choose the right plan to enhance your exam capabilities
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className={user?.paymentPlan === 'basic' ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>Basic Plan</span>
                <span>₦30,000/year</span>
              </CardTitle>
              <CardDescription>Perfect for individuals and small classes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Up to 5 CBTs daily</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Basic question generation</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Standard result analytics</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>PDF and DOCX support</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Email support</p>
              </div>
            </CardContent>
            <CardFooter>
              {user?.paymentPlan === 'basic' ? (
                <Button className="w-full" disabled>
                  Your Current Plan
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleUpgrade('basic')}
                >
                  Downgrade to Basic
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className={user?.paymentPlan === 'premium' ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>Premium Plan</span>
                <span>₦50,000/year</span>
              </CardTitle>
              <CardDescription>For professionals and institutions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Unlimited CBTs</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Advanced AI question generation</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Advanced analytics and insights</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Support for all document types</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Priority support</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Custom branding options</p>
              </div>
              <div className="flex items-start">
                <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                <p>Advanced exam security features</p>
              </div>
            </CardContent>
            <CardFooter>
              {user?.paymentPlan === 'premium' ? (
                <Button className="w-full" disabled>
                  Your Current Plan
                </Button>
              ) : (
                <Button className="w-full" onClick={() => handleUpgrade('premium')}>
                  Upgrade to Premium
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div className="bg-muted p-6 rounded-lg">
          <h2 className="font-semibold text-lg mb-2">Need a custom plan?</h2>
          <p className="text-muted-foreground mb-4">
            For larger institutions or special requirements, we offer customized plans.
            Contact our team to discuss your specific needs.
          </p>
          <Button variant="outline">Contact Sales</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UpgradePage;
