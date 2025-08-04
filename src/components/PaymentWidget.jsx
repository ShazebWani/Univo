import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CreditCard, Package, Zap } from 'lucide-react';
import { TransactionService } from '@/lib/stripe';

export const PaymentWidget = ({ 
  product, 
  sellerId, 
  buyerId, 
  onPaymentSent, 
  isDigital = false 
}) => {
  const [amount, setAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setIsCreating(true);
    try {
      const paymentData = {
        amount: parseFloat(amount),
        productId: product.id,
        productTitle: product.title,
        sellerId,
        buyerId,
        isDigital,
        handoffCode: TransactionService.generateHandoffCode(),
        createdAt: new Date().toISOString()
      };

      // Send payment widget as a special message type
      onPaymentSent(paymentData);
      
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment request');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-primary">
          <DollarSign className="w-5 h-5" />
          Create Payment Request
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {isDigital ? (
            <>
              <Zap className="w-4 h-4" />
              <span>Digital Product</span>
            </>
          ) : (
            <>
              <Package className="w-4 h-4" />
              <span>Physical Product</span>
            </>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Agreed Price</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="pl-10"
            />
          </div>
        </div>

        <Button 
          onClick={handleCreatePayment}
          disabled={isCreating || !amount}
          className="w-full bg-primary hover:bg-primary/90 text-white"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Send Payment Request
            </div>
          )}
        </Button>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 text-center">
            {isDigital 
              ? "Buyer will receive product access after payment"
              : "Buyer will receive a handoff code after payment"
            }
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <span>Stripe Test Mode</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentWidget;