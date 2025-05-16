
import React, { useEffect, useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { initiateFlutterwavePayment, getPaymentHistory, Transaction } from '@/services/payment';
import { useIsMobile } from '@/hooks/use-mobile';

const plans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 30000,
    description: 'Perfect for individuals and small classes',
    features: [
      'Up to 5 CBTs daily',
      'Basic question generation',
      'Standard result analytics',
      'PDF and DOCX support',
      'Email support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 50000,
    description: 'For professionals and institutions',
    features: [
      'Unlimited CBTs',
      'Advanced AI question generation',
      'Advanced analytics and insights',
      'Support for all document types',
      'Priority support',
      'Custom branding options',
      'Advanced exam security features',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 100000,
    description: 'For large institutions with custom needs',
    features: [
      'Everything in Premium',
      'Multiple admin accounts',
      'Custom exam templates',
      'White-labeling options',
      'API access',
      'Dedicated support representative',
      'Custom integrations',
      'Bulk student imports',
    ],
  }
];

const UpgradePage: React.FC = () => {
  const { user, updateUserPlan } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('plans');
  const isMobile = useIsMobile();

  useEffect(() => {
    // Add Flutterwave script
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    document.body.appendChild(script);
    
    // Load transaction history if user exists
    if (user?.email) {
      const userTransactions = getPaymentHistory(user.email);
      setTransactions(userTransactions);
    }
    
    return () => {
      // Cleanup script
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user?.email]);

  const handleUpgrade = (planId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You need to be logged in to upgrade',
        variant: 'destructive',
      });
      return;
    }
    
    const selectedPlan = plans.find(plan => plan.id === planId);
    if (!selectedPlan) return;
    
    initiateFlutterwavePayment(
      selectedPlan.price,
      user.email,
      user.name,
      selectedPlan.name,
      async () => {
        // On successful payment
        if (planId === 'basic' || planId === 'premium') {
          await updateUserPlan(planId);
        } else if (planId === 'enterprise') {
          // For enterprise, default to premium features but mark as enterprise
          await updateUserPlan('premium');
          toast({
            title: 'Enterprise Plan Activated',
            description: 'Our team will contact you shortly to set up your custom features.',
          });
        }
        
        // Refresh transaction history
        if (user?.email) {
          const userTransactions = getPaymentHistory(user.email);
          setTransactions(userTransactions);
        }
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account & Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and view payment history
          </p>
        </div>

        <Tabs defaultValue="plans" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mb-6">
            <TabsTrigger value="plans" className="flex-1">Subscription Plans</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Payment History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {plans.map(plan => (
                <Card key={plan.id} className={user?.paymentPlan === plan.id ? 'border-primary' : ''}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{plan.name}</span>
                      <span className="text-xl">₦{plan.price.toLocaleString()}/year</span>
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                        <p>{feature}</p>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    {user?.paymentPlan === plan.id ? (
                      <Button className="w-full" disabled>
                        Your Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={user?.paymentPlan === 'premium' && plan.id === 'basic' ? "outline" : "default"}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {user?.paymentPlan === 'premium' && plan.id === 'basic' 
                          ? 'Downgrade to Basic' 
                          : `Upgrade to ${plan.name.split(' ')[0]}`}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="bg-muted p-6 rounded-lg">
              <h2 className="font-semibold text-lg mb-2">Need a custom plan?</h2>
              <p className="text-muted-foreground mb-4">
                For larger institutions or special requirements, we offer customized plans.
                Contact our team to discuss your specific needs.
              </p>
              <Button variant="outline">Contact Sales</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  View your previous transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <div className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} bg-muted p-3 font-medium text-sm`}>
                      <div>Date</div>
                      <div>Plan</div>
                      <div className="text-right">Amount</div>
                      {!isMobile && (
                        <>
                          <div>Reference</div>
                          <div>Status</div>
                        </>
                      )}
                    </div>
                    {transactions.map(transaction => (
                      <div key={transaction.id} className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} p-3 border-t items-center text-sm`}>
                        <div>{new Date(transaction.createdAt).toLocaleDateString()}</div>
                        <div>{transaction.planName}</div>
                        <div className="text-right">₦{transaction.amount.toLocaleString()}</div>
                        {!isMobile && (
                          <>
                            <div className="truncate max-w-[150px]" title={transaction.txRef}>{transaction.txRef}</div>
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' 
                                  : transaction.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-400'
                              }`}>
                                {transaction.status}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium text-lg mb-1">No payment history</h3>
                    <p>Your payment history will appear here once you make your first payment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UpgradePage;
