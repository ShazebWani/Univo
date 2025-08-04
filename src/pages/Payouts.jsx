import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Banknote, Clock, Download } from 'lucide-react';

export default function Payouts() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 bg-background z-40 p-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h1 className="text-lg font-semibold text-foreground">Payouts</h1>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Balance Card */}
                <div className="bg-card rounded-xl shadow-sm p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                    <p className="text-4xl font-bold">$0.00</p>
                    <Button className="mt-4" onClick={() => alert("Withdraw funds functionality coming soon!")}>Withdraw Funds</Button>
                </div>
                
                {/* Info Section */}
                <div className="bg-card rounded-xl p-4">
                    <div className="flex items-start gap-4">
                        <Banknote className="w-8 h-8 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">How Payouts Work</h3>
                            <p className="text-sm text-muted-foreground">Once a sale is complete, funds will appear here. You can withdraw your balance to your linked bank account.</p>
                        </div>
                    </div>
                </div>

                {/* Transaction History */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-base font-semibold">Transaction History</h2>
                        <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                    <div className="bg-card rounded-xl p-6 text-center">
                        <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold">No transactions yet</h3>
                        <p className="text-sm text-muted-foreground">Your recent sales and withdrawals will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}