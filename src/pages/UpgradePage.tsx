
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
    id: 'free',
    name: 'Free Plan',
    price: 0,
    billingCycle: 'forever',
    description: 'Get started with basic features',
    features: [
      'Up to 5 exams daily',
      'Basic question generation',
      'Standard result analytics',
      'PDF exam export',
      'Email support',
    ],
  },
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 5,
    billingCycle: 'month',
    yearlyPrice: 50,
    description: 'Perfect for individuals and small classes',
    features: [
      'Up to 20 exams daily',
      'Enhanced question generation',
      'Detailed result analytics',
      'PDF and DOCX support',
      'Priority email support',
      'Student performance tracking',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 10,
    billingCycle: 'month',
    yearlyPrice: 100,
    description: 'For professionals and institutions',
    features: [
      'Unlimited exams',
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
    price: 25,
    billingCycle: 'month',
    yearlyPrice: 250,
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
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
    if (!selectedPlan || selectedPlan.id === 'free') return;
    
    // Calculate the price based on billing cycle
    const price = billingCycle === 'yearly' 
      ? selectedPlan.yearlyPrice || selectedPlan.price * 10 
      : selectedPlan.price;
      
    // Convert USD to NGN for Flutterwave (using approximate conversion rate)
    const ngnAmount = price * 1500; // Approximate USD to NGN conversion
    
    initiateFlutterwavePayment(
      ngnAmount,
      user.email,
      user.name,
      `${selectedPlan.name} (${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'})`,
      async () => {
        // On successful payment
        await updateUserPlan(planId as 'free' | 'basic' | 'premium' | 'enterprise');
        
        // Refresh transaction history
        if (user?.email) {
          const userTransactions = getPaymentHistory(user.email);
          setTransactions(userTransactions);
        }
      }
    );
  };

  const getButtonLabel = (planId: string) => {
    if (planId === 'free') {
      return 'Free Plan';
    }
    
    if (user?.paymentPlan === planId) {
      return 'Current Plan';
    }
    
    if (user?.paymentPlan === 'premium' && (planId === 'basic' || planId === 'free')) {
      return `Downgrade to ${planId === 'basic' ? 'Basic' : 'Free'}`;
    }
    
    if (user?.paymentPlan === 'basic' && planId === 'free') {
      return 'Downgrade to Free';
    }

    if (user?.paymentPlan === 'enterprise' && (planId === 'premium' || planId === 'basic' || planId === 'free')) {
      return `Downgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`;
    }
    
    return `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`;
  };

  // Calculate days remaining in current plan
  const getDaysRemaining = () => {
    if (!user?.planExpiryDate) return null;
    
    const expiryDate = new Date(user.planExpiryDate);
    const today = new Date();
    const differenceInTime = expiryDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays > 0 ? differenceInDays : 0;
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

        {/* Current subscription status */}
        {user?.paymentPlan !== 'free' && user?.planExpiryDate && (
          <Card className="bg-muted/30 border-primary">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    Current Plan: {user?.paymentPlan.charAt(0).toUpperCase() + user?.paymentPlan.slice(1)}
                  </h3>
                  <p className="text-muted-foreground">
                    {getDaysRemaining() !== null
                      ? `Your plan will expire in ${getDaysRemaining()} days (${new Date(user?.planExpiryDate).toLocaleDateString()})`
                      : 'Your plan is active'}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <Button variant="outline" onClick={() => handleUpgrade(user?.paymentPlan)}>
                    Renew Plan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="plans" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full max-w-md mb-6">
            <TabsTrigger value="plans" className="flex-1">Subscription Plans</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Payment History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="plans" className="space-y-6">
            <div className="flex justify-end mb-4">
              <div className="bg-muted inline-flex rounded-lg p-1">
                <button
                  className={`px-3 py-1 rounded-md transition-colors ${
                    billingCycle === 'monthly' ? 'bg-background shadow-sm' : ''
                  }`}
                  onClick={() => setBillingCycle('monthly')}
                >
                  Monthly
                </button>
                <button
                  className={`px-3 py-1 rounded-md transition-colors ${
                    billingCycle === 'yearly' ? 'bg-background shadow-sm' : ''
                  }`}
                  onClick={() => setBillingCycle('yearly')}
                >
                  Yearly (Save 15%)
                </button>
              </div>
            </div>
          
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {plans.map(plan => (
                <Card 
                  key={plan.id} 
                  className={user?.paymentPlan === plan.id ? 'border-primary' : ''}
                >
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <span>{plan.name}</span>
                      {plan.price > 0 ? (
                        <div className="text-right">
                          <span className="text-xl">${plan.price}</span>
                          <span className="text-xs text-muted-foreground block">
                            {billingCycle === 'yearly' ? '/year' : '/month'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xl">Free</span>
                      )}
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
                    <Button 
                      className="w-full" 
                      variant={user?.paymentPlan === plan.id ? 'outline' : 'default'}
                      disabled={user?.paymentPlan === plan.id || (plan.id === 'free' && user?.paymentPlan === 'free')}
                      onClick={() => plan.id !== 'free' ? handleUpgrade(plan.id) : updateUserPlan('free')}
                    >
                      {getButtonLabel(plan.id)}
                    </Button>
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
            
            <div className="bg-muted/50 p-4 rounded-lg border border-muted">
              <h3 className="font-medium mb-2">About Payments</h3>
              <p className="text-sm text-muted-foreground mb-2">
                • Prices are listed in USD, but you'll pay in your local currency via Flutterwave
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                • The currency conversion is handled automatically during checkout
              </p>
              <p className="text-sm text-muted-foreground">
                • Your subscription will activate immediately after a successful payment
              </p>
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
                        <div className="text-right">₦{transaction.amount.toLocaleString()} (≈${transaction.usdAmount})</div>
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
