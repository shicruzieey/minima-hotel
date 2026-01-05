// Validation utilities for POS system

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  field?: string;
}

// Cart validations
export const validateCartQuantity = (quantity: number, maxQuantity: number = 99): ValidationResult => {
  if (quantity < 1) {
    return { isValid: false, message: "Quantity must be at least 1", field: "quantity" };
  }
  if (quantity > maxQuantity) {
    return { isValid: false, message: `Maximum quantity is ${maxQuantity}`, field: "quantity" };
  }
  return { isValid: true };
};

export const validateCartTotal = (total: number, maxTotal: number = 50000): ValidationResult => {
  if (total <= 0) {
    return { isValid: false, message: "Cart total must be greater than 0", field: "total" };
  }
  if (total > maxTotal) {
    return { isValid: false, message: `Transaction total cannot exceed ₱${maxTotal.toLocaleString()}`, field: "total" };
  }
  return { isValid: true };
};

// Discount validations
export const validateDiscountCode = (code: string): ValidationResult => {
  if (!code || code.trim().length === 0) {
    return { isValid: false, message: "Discount code is required", field: "discountCode" };
  }
  if (code.length < 3) {
    return { isValid: false, message: "Discount code must be at least 3 characters", field: "discountCode" };
  }
  if (!/^[A-Z0-9]+$/i.test(code)) {
    return { isValid: false, message: "Discount code can only contain letters and numbers", field: "discountCode" };
  }
  return { isValid: true };
};

export const validateDiscountApplicability = (
  subtotal: number,
  discount: { minAmount?: number; type: string; value: number }
): ValidationResult => {
  if (discount.minAmount && subtotal < discount.minAmount) {
    return {
      isValid: false,
      message: `Minimum purchase of ₱${discount.minAmount.toFixed(2)} required for this discount`,
      field: "discount"
    };
  }
  
  if (discount.type === "percentage" && (discount.value < 0 || discount.value > 100)) {
    return { isValid: false, message: "Percentage discount must be between 0% and 100%", field: "discount" };
  }
  
  if (discount.type === "fixed" && discount.value <= 0) {
    return { isValid: false, message: "Fixed discount must be greater than 0", field: "discount" };
  }
  
  return { isValid: true };
};

// Payment validations
export const validatePaymentMethod = (method: string): ValidationResult => {
  const validMethods = ["card", "cash", "room charge", "credit card", "debit card"];
  if (!method || method.trim().length === 0) {
    return { isValid: false, message: "Payment method is required", field: "paymentMethod" };
  }
  if (!validMethods.includes(method.toLowerCase())) {
    return { isValid: false, message: "Invalid payment method", field: "paymentMethod" };
  }
  return { isValid: true };
};

export const validateRoomCharge = (guestId?: string, bookingId?: string): ValidationResult => {
  if (!guestId || !bookingId) {
    return { isValid: false, message: "Guest and booking information required for room charge", field: "roomCharge" };
  }
  return { isValid: true };
};

// Refund validations
export const validateRefundReason = (reason: string): ValidationResult => {
  if (!reason || reason.trim().length === 0) {
    return { isValid: false, message: "Refund reason is required", field: "refundReason" };
  }
  if (reason.length < 10) {
    return { isValid: false, message: "Refund reason must be at least 10 characters", field: "refundReason" };
  }
  if (reason.length > 500) {
    return { isValid: false, message: "Refund reason cannot exceed 500 characters", field: "refundReason" };
  }
  return { isValid: true };
};

export const validateRefundAmount = (amount: number, maxRefundAmount: number = 10000): ValidationResult => {
  if (amount <= 0) {
    return { isValid: false, message: "Refund amount must be greater than 0", field: "refundAmount" };
  }
  if (amount > maxRefundAmount) {
    return { isValid: false, message: `Refund amount cannot exceed ₱${maxRefundAmount.toLocaleString()}`, field: "refundAmount" };
  }
  return { isValid: true };
};

// Product validations
export const validateProductAvailability = (isAvailable: boolean, stock?: number): ValidationResult => {
  if (!isAvailable) {
    return { isValid: false, message: "Product is not available", field: "product" };
  }
  if (stock !== undefined && stock <= 0) {
    return { isValid: false, message: "Product is out of stock", field: "product" };
  }
  return { isValid: true };
};

// Search validations
export const validateSearchQuery = (query: string): ValidationResult => {
  if (query && query.length > 100) {
    return { isValid: false, message: "Search query is too long", field: "search" };
  }
  return { isValid: true };
};

// Transaction validations
export const validateTransactionNumber = (number: string): ValidationResult => {
  if (!number || number.trim().length === 0) {
    return { isValid: false, message: "Transaction number is required", field: "transactionNumber" };
  }
  if (!/^TX\d{17}\d{3}$/.test(number)) {
    return { isValid: false, message: "Invalid transaction number format", field: "transactionNumber" };
  }
  return { isValid: true };
};

export const validateGuestAssignment = (guest?: any, room?: any): ValidationResult => {
  if (!guest) {
    return { isValid: false, message: "Guest selection is required", field: "guest" };
  }
  if (!room) {
    return { isValid: false, message: "Room assignment is required", field: "room" };
  }
  if (!guest.first_name || !guest.last_name) {
    return { isValid: false, message: "Guest name is required", field: "guest" };
  }
  if (!room.room_number) {
    return { isValid: false, message: "Room number is required", field: "room" };
  }
  return { isValid: true };
};

// General utility
export const getValidationMessage = (validation: ValidationResult): string => {
  return validation.message || "Validation failed";
};

export const hasValidationErrors = (validations: ValidationResult[]): boolean => {
  return validations.some(v => !v.isValid);
};

export const getFirstValidationError = (validations: ValidationResult[]): ValidationResult | null => {
  return validations.find(v => !v.isValid) || null;
};
