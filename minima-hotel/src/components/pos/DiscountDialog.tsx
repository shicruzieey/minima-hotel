import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Percent, Tag, Check, AlertCircle } from "lucide-react";
import { validateDiscountCode, validateDiscountApplicability } from "@/utils/validations";
import { toast } from "sonner";

interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description: string;
  minAmount?: number;
  isActive: boolean;
}

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  onApplyDiscount: (discount: Discount) => void;
}

// Sample discounts - in real app, these would come from database
const availableDiscounts: Discount[] = [
  {
    id: "1",
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    description: "Welcome discount - 10% off",
    minAmount: 500,
    isActive: true,
  },
  {
    id: "2", 
    code: "SPA20",
    type: "percentage",
    value: 20,
    description: "Spa services - 20% off",
    minAmount: 1000,
    isActive: true,
  },
  {
    id: "3",
    code: "FIXED100",
    type: "fixed",
    value: 100,
    description: "Fixed ₱100 discount",
    minAmount: 800,
    isActive: true,
  },
];

export const DiscountDialog = ({
  open,
  onOpenChange,
  subtotal,
  onApplyDiscount,
}: DiscountDialogProps) => {
  const [codeInput, setCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyCode = async () => {
    setIsSubmitting(true);
    setValidationError("");
    
    // Validate discount code format
    const codeValidation = validateDiscountCode(codeInput);
    if (!codeValidation.isValid) {
      setValidationError(codeValidation.message || "Invalid discount code");
      setIsSubmitting(false);
      return;
    }

    // Find discount
    const discount = availableDiscounts.find(
      (d) => d.code.toLowerCase() === codeInput.toLowerCase() && d.isActive
    );

    if (!discount) {
      setValidationError("Invalid or expired discount code");
      setIsSubmitting(false);
      return;
    }

    // Validate discount applicability
    const applicabilityValidation = validateDiscountApplicability(subtotal, discount);
    if (!applicabilityValidation.isValid) {
      setValidationError(applicabilityValidation.message || "Discount cannot be applied");
      setIsSubmitting(false);
      return;
    }

    setAppliedDiscount(discount);
    onApplyDiscount(discount);
    toast.success(`Discount applied: ${discount.code}`);
    onOpenChange(false);
    setCodeInput("");
    setValidationError("");
    setIsSubmitting(false);
  };

  const handleSelectDiscount = (discount: Discount) => {
    // Validate discount applicability
    const applicabilityValidation = validateDiscountApplicability(subtotal, discount);
    if (!applicabilityValidation.isValid) {
      toast.error(applicabilityValidation.message || "Discount cannot be applied");
      return;
    }

    setAppliedDiscount(discount);
    onApplyDiscount(discount);
    onOpenChange(false);
  };

  const calculateDiscountAmount = (discount: Discount) => {
    if (discount.type === "percentage") {
      return subtotal * (discount.value / 100);
    }
    return discount.value;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Enter Discount Code</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter code..."
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  setValidationError("");
                }}
                className={`flex-1 ${validationError ? "border-red-500" : ""}`}
                maxLength={20}
              />
              <Button 
                onClick={handleApplyCode} 
                disabled={isSubmitting || !codeInput.trim()}
              >
                {isSubmitting ? "Applying..." : "Apply"}
              </Button>
            </div>
            {validationError && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Available Discounts */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Discounts</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableDiscounts
                .filter((discount) => discount.isActive)
                .map((discount) => {
                  const isValid = !discount.minAmount || subtotal >= discount.minAmount;
                  const discountAmount = calculateDiscountAmount(discount);
                  
                  return (
                    <div
                      key={discount.id}
                      className={`p-3 rounded-sm border ${
                        isValid
                          ? "border-gray-200 hover:border-gray-300 cursor-pointer"
                          : "border-gray-100 opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => isValid && handleSelectDiscount(discount)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            <span className="font-medium">{discount.code}</span>
                            <Badge variant="secondary">
                              {discount.type === "percentage" ? `${discount.value}%` : `₱${discount.value}`}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {discount.description}
                          </p>
                          {discount.minAmount && (
                            <p className="text-xs text-gray-400">
                              Min. purchase: ₱{discount.minAmount}
                            </p>
                          )}
                        </div>
                        {isValid && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      {isValid && (
                        <div className="mt-2 text-xs text-green-600">
                          You'll save: ₱{discountAmount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Current Subtotal */}
          <div className="text-sm text-gray-500 text-center">
            Current subtotal: ₱{subtotal.toFixed(2)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
