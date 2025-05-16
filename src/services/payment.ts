
import { toast } from "@/hooks/use-toast";

interface PaymentConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  payment_options: string;
  customer: {
    email: string;
    phone_number: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
    logo: string;
  };
}

// Transaction object to store payment records
export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  planName: string;
  amount: number;
  currency: string;
  txRef: string;
  flwRef: string | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

// Flutterwave payment function
export const initiateFlutterwavePayment = async (
  amount: number,
  customerEmail: string,
  customerName: string,
  planName: string,
  onSuccess: () => void
) => {
  try {
    // Dynamically import FlutterWave
    const FlutterwaveCheckout = (window as any).FlutterwaveCheckout;
    
    if (!FlutterwaveCheckout) {
      // Load the Flutterwave script if it's not already loaded
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      document.body.appendChild(script);
      
      // Wait for script to load
      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }
    
    // Generate a unique transaction reference
    const txRef = `EF-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    
    const config: PaymentConfig = {
      public_key: "FLWPUBK_TEST-0ddb40b442d8517b066065c814a52c40-X",
      tx_ref: txRef,
      amount: amount,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: customerEmail,
        phone_number: "",
        name: customerName,
      },
      customizations: {
        title: `ExamForge ${planName} Plan`,
        description: `Payment for ${planName} Plan`,
        logo: window.location.origin + "/favicon.png",
      },
    };
    
    const handleFlutterwavePayment = (window as any).FlutterwaveCheckout;
    
    handleFlutterwavePayment({
      ...config,
      callback: (response: any) => {
        console.log(response);
        if (response.status === "successful") {
          toast({
            title: "Payment Successful",
            description: `Your payment of ₦${amount.toLocaleString()} has been processed.`,
          });
          
          // Save transaction record
          const transaction: Transaction = {
            id: `transaction_${Date.now()}`,
            userId: 'user_id', // This should be replaced with actual user ID
            userEmail: customerEmail,
            planName: planName,
            amount: amount,
            currency: "NGN",
            txRef: txRef,
            flwRef: response.flw_ref || response.transaction_id,
            status: 'completed',
            createdAt: new Date().toISOString()
          };
          
          // Save transaction to localStorage for history
          const transactions = JSON.parse(localStorage.getItem('examforge_transactions') || '[]');
          transactions.push(transaction);
          localStorage.setItem('examforge_transactions', JSON.stringify(transactions));
          
          // Update user plan immediately
          onSuccess();
        } else {
          toast({
            title: "Payment Failed",
            description: "Please try again or contact support.",
            variant: "destructive",
          });
        }
        handleFlutterwavePayment.close();
      },
      onclose: () => {
        // Payment modal closed
      },
    });
  } catch (error) {
    console.error("Payment error:", error);
    toast({
      title: "Payment Error",
      description: "Failed to initialize payment. Please try again.",
      variant: "destructive",
    });
  }
};

// Function to get payment history for a user
export const getPaymentHistory = (userEmail: string): Transaction[] => {
  const transactions = JSON.parse(localStorage.getItem('examforge_transactions') || '[]');
  return transactions.filter((transaction: Transaction) => transaction.userEmail === userEmail);
};
