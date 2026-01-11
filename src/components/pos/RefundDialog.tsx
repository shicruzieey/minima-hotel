import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, AlertCircle, Check } from "lucide-react";
import { usePOSTransactions } from "@/hooks/usePOS";
import { validateRefundReason, validateRefundAmount, validateTransactionNumber } from "@/utils/validations";
import type { POSTransaction, POSTransactionItem, POSProduct } from "@/integrations/firebase/types";
import { toast } from "sonner";

interface TransactionWithItems extends POSTransaction {
  items: (POSTransactionItem & { product: POSProduct })[];
}

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RefundDialog = ({ open, onOpenChange }: RefundDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithItems | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { data: transactions, isLoading } = usePOSTransactions();

  // Mock transaction data with items - in real app, you'd fetch this from your API
  const mockTransactions: TransactionWithItems[] = transactions?.map(t => ({
    ...t,
    items: [] // Would be populated with actual items from API
  })) || [];

  const filteredTransactions = mockTransactions.filter((transaction) =>
    transaction.transaction_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transaction.payment_method.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefund = async () => {
    // Clear previous errors
    setValidationErrors({});
    
    // Validate selected transaction
    if (!selectedTransaction) {
      setValidationErrors({ transaction: "Please select a transaction to refund" });
      return;
    }
    
    // Validate refund reason
    const reasonValidation = validateRefundReason(refundReason);
    if (!reasonValidation.isValid) {
      setValidationErrors({ reason: reasonValidation.message || "Invalid refund reason" });
      return;
    }
    
    // Validate refund amount
    const amountValidation = validateRefundAmount(selectedTransaction.total);
    if (!amountValidation.isValid) {
      setValidationErrors({ amount: amountValidation.message || "Invalid refund amount" });
      return;
    }

    setIsProcessing(true);
    try {
      // In a real app, you would call your refund API here
      console.log("Processing refund:", {
        transactionId: selectedTransaction.id,
        amount: selectedTransaction.total,
        reason: refundReason,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success(`Refund of ₱${selectedTransaction.total.toFixed(2)} processed successfully`);
      setSelectedTransaction(null);
      setRefundReason("");
      setValidationErrors({});
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to process refund. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by transaction number or payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Loading transactions...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {transactions?.length === 0
                  ? "No transactions found"
                  : "No transactions match your search"}
              </p>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card
                  key={transaction.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTransaction?.id === transaction.id
                      ? "border-blue-500 bg-blue-50"
                      : "hover:border-gray-300"
                  }`}
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{transaction.transaction_number}</span>
                          <Badge variant={transaction.status === "completed" ? "default" : "secondary"}>
                            {transaction.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <p>Payment: {transaction.payment_method}</p>
                          <p>Date: {new Date(transaction.created_at).toLocaleString()}</p>
                          <p>Amount: ₱{transaction.total.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedTransaction?.id === transaction.id && (
                          <Check className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Refund Form */}
          {selectedTransaction && (
            <div className="space-y-4 border-t pt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Refund Details</p>
                    <p className="text-yellow-600">
                      You are about to refund ₱{selectedTransaction.total.toFixed(2)} from transaction{" "}
                      {selectedTransaction.transaction_number}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Refund Reason *</label>
                <Input
                  placeholder="Enter reason for refund..."
                  value={refundReason}
                  onChange={(e) => {
                    setRefundReason(e.target.value);
                    if (validationErrors.reason) {
                      setValidationErrors(prev => ({ ...prev, reason: "" }));
                    }
                  }}
                  className={validationErrors.reason ? "border-red-500" : ""}
                  maxLength={500}
                />
                {validationErrors.reason && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{validationErrors.reason}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {refundReason.length}/500 characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleRefund}
                  disabled={isProcessing || !refundReason.trim() || !selectedTransaction}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RotateCcw className="w-4 h-4 mr-2" />
                  )}
                  Process Refund
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTransaction(null);
                    setRefundReason("");
                    setValidationErrors({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
