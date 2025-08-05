import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DollarSign, CreditCard, Package, Zap, CheckCircle, Clock, Copy, Eye, EyeOff } from 'lucide-react';
import { getStripe, TransactionService } from '@/lib/stripe';
import confetti from 'canvas-confetti';

export const PaymentMessage = ({ 
  paymentData, 
  isCurrentUser, 
  currentUserId,
  onPaymentComplete,
  buyerProfile // Add buyer profile to get real email
}) => {
  // Initialize payment status based on payment data
  const initialStatus = paymentData.status || 'pending';
  const [paymentStatus, setPaymentStatus] = useState(initialStatus);
  const [showHandoffCode, setShowHandoffCode] = useState(initialStatus === 'completed');
  const [handoffCode, setHandoffCode] = useState(paymentData.handoffCode || '');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Prevent state changes if payment is already completed or failed
  const isPaymentFinal = paymentStatus === 'failed' || paymentStatus === 'verified';
  
  // If payment data has a final status, use that and don't allow changes
  const finalStatus = paymentData.status === 'failed' || paymentData.status === 'verified';
  if (finalStatus && paymentStatus !== paymentData.status) {
    setPaymentStatus(paymentData.status);
  }

  const isBuyer = currentUserId === paymentData.buyerId;
  const isSeller = currentUserId === paymentData.sellerId;

  // Confetti animation functions
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const triggerCelebration = () => {
    // Multiple confetti bursts
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min, max) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.3),
          y: Math.random() - 0.2
        }
      });
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.7, 0.9),
          y: Math.random() - 0.2
        }
      });
    }, 250);
  };


  const handlePayment = async () => {
    // Don't allow payment processing if already in final state
    if (isPaymentFinal) {
      return;
    }
    
    setIsProcessing(true);
    try {
      const stripe = await getStripe();
      
      // Create payment intent
      const paymentIntent = await TransactionService.createPaymentIntent({
        amount: paymentData.amount,
        productTitle: paymentData.productTitle,
        productId: paymentData.productId,
        sellerId: paymentData.sellerId,
        buyerId: paymentData.buyerId,
        isDigital: paymentData.isDigital,
        conversationId: paymentData.conversationId,
        handoffCode: paymentData.handoffCode
      });

      // For test mode, simulate successful payment
      // In production, you'd use Stripe Elements for actual card processing
      const result = {
        success: true,
        paymentIntentId: paymentIntent.payment_intent_id,
        clientSecret: paymentIntent.client_secret,
        paymentIntent: {
          id: paymentIntent.payment_intent_id,
          status: 'succeeded'
        }
      };

      if (result.success) {
        const generatedCode = paymentData.handoffCode;
        setHandoffCode(generatedCode);
        setPaymentStatus('completed');
        
        // Trigger confetti for payment completion
        setTimeout(() => triggerConfetti(), 500);
        
        // Handle digital products differently
        if (paymentData.isDigital) {
          const digitalDelivery = await TransactionService.deliverDigitalProduct(
            paymentData,
            buyerProfile?.email || 'unknown@email.com'
          );
          
          // Notify completion with digital delivery info
          onPaymentComplete && onPaymentComplete({
            ...paymentData,
            status: 'completed',
            digitalDelivery,
            stripePaymentIntent: result.paymentIntent
          });
        } else {
          setShowHandoffCode(true);
          // Notify completion with handoff code
          onPaymentComplete && onPaymentComplete({
            ...paymentData,
            status: 'completed',
            handoffCode: generatedCode,
            stripePaymentIntent: result.paymentIntent
          });
        }
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyCode = async () => {
    // Don't allow verification if already in final state
    if (isPaymentFinal) {
      return;
    }
    
    const result = await TransactionService.verifyHandoffCode(
      paymentData.stripePaymentIntent?.id, // transaction_id
      codeInput, // handoff_code (entered by seller)
      paymentData.sellerId // seller_id
    );
    
    if (result.success) {
      setPaymentStatus('verified');
      setShowCodeInput(false);
      
      // Trigger celebration confetti for transaction completion
      setTimeout(() => triggerCelebration(), 500);
      
      onPaymentComplete && onPaymentComplete({
        ...paymentData,
        status: 'verified'
      });
    } else {
      alert(result.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'pending': return 'border-yellow-200 bg-yellow-50';
      case 'processing': return 'border-blue-200 bg-blue-50';
      case 'completed': return 'border-green-200 bg-green-50';
      case 'verified': return 'border-green-200 bg-green-100';
      case 'failed': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'processing': return <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'completed': case 'verified': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <>
      <Card className={`w-full max-w-sm ${getStatusColor()} border-2 shadow-md`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span>Payment Request</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {paymentData.isDigital ? (
                <>
                  <Zap className="w-3 h-3" />
                  <span>Digital</span>
                </>
              ) : (
                <>
                  <Package className="w-3 h-3" />
                  <span>Physical</span>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              ${paymentData.amount.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              {paymentData.productTitle}
            </div>
            <div className="flex items-center justify-center gap-1 mt-1 text-xs text-blue-600">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              <span>Stripe Test</span>
            </div>
          </div>

          {/* Buyer Actions */}
          {isBuyer && paymentStatus === 'pending' && !isPaymentFinal && (
            <Button 
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </div>
              )}
            </Button>
          )}

          {/* Show persistent failed state */}
          {paymentStatus === 'failed' && (
            <div className="text-center">
              <div className="text-sm text-red-700 font-medium mb-2">
                ❌ Payment Failed
              </div>
              <div className="text-xs text-gray-600">
                This payment request failed and cannot be retried. Please create a new payment request.
              </div>
            </div>
          )}

          {/* Handoff Code Display (Buyer) */}
          {isBuyer && paymentStatus === 'completed' && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-center text-green-700">
                Payment Successful!
              </div>
              
              {paymentData.isDigital ? (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <div className="text-sm font-medium text-green-700">Digital Product Delivered!</div>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {paymentData.digitalDelivery?.accessInstructions || 'Check your email for access details.'}
                  </div>
                  {paymentData.digitalDelivery?.downloadLink && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => window.open(paymentData.digitalDelivery.downloadLink, '_blank')}
                    >
                      Download Now
                    </Button>
                  )}
                  {paymentData.digitalDelivery?.accessCode && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <div className="text-xs text-gray-600">Access Code:</div>
                      <div className="font-mono text-sm font-bold">{paymentData.digitalDelivery.accessCode}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="text-xs text-gray-600 mb-1">Your Handoff Code:</div>
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-lg font-bold tracking-wider">
                      {showHandoffCode ? handoffCode : '••••••'}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowHandoffCode(!showHandoffCode)}
                      >
                        {showHandoffCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(handoffCode)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Give this code to the seller when you meet
                  </div>
                  <div className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                    💰 <strong>Escrow Protection:</strong> Your money is safely held in escrow until the seller enters this handoff code, ensuring secure transactions.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seller Actions */}
          {isSeller && paymentStatus === 'completed' && !isPaymentFinal && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-center text-green-700">
                Payment Received!
              </div>
              
              {paymentData.isDigital ? (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div className="text-sm font-medium text-green-700">Digital Product Delivered!</div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Your digital product has been automatically delivered to the buyer.
                    Payment will be processed to your account.
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowCodeInput(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Enter Handoff Code
                </Button>
              )}
            </div>
          )}

          {/* Status Messages */}
          {paymentStatus === 'verified' && (
            <div className="text-center text-sm text-green-700 font-medium">
              ✅ Transaction Complete
            </div>
          )}

          {paymentStatus === 'failed' && (
            <div className="text-center text-sm text-red-700 font-medium">
              ❌ Payment Failed
            </div>
          )}
        </CardContent>
      </Card>

      {/* Handoff Code Input Modal */}
      {showCodeInput && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={() => setShowCodeInput(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-[10000]">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Enter Handoff Code</h2>
              <p className="text-sm text-gray-600">
                Enter the 6-digit code provided by the buyer to complete the transaction.
              </p>
            </div>
            
            {/* Close Button */}
            <button 
              onClick={() => setShowCodeInput(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
            
            {/* Content */}
            <div className="space-y-4">
              <Input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="text-center font-mono text-lg tracking-wider"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCodeInput(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleVerifyCode}
                  disabled={codeInput.length !== 6}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Verify & Complete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentMessage;