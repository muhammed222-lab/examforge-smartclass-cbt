
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
