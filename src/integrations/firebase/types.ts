// Firebase Database Types

export type BookingStatus = "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "paid";
export type TransactionStatus = "pending" | "completed" | "refunded" | "cancelled" | "voided";
export type FoodType = "breakfast" | "lunch" | "snack" | "dinner" | "appetizer" | "beverage" | "dessert" | "main-course";

// Booking structure from your Firebase
export interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
  guestEmail: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  isWalkIn: boolean;
  roomId: string;
  roomType: string;
  status: string;
  totalPrice: number;
  updatedAt: string;
  userId: string;
}

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: string;
  room_number: string;
  room_type: string;
  price_per_night: number;
  status: string;
  floor?: number;
  max_guests?: number;
  amenities?: string[] | null;
}

export interface POSCategory {
  id: string;
  created_at: string;
  icon: string | null;
  name: string;
}

export interface POSProduct {
  id: string;
  category_id: string;
  created_at: string;
  description: string | null;
  is_available: boolean;
  name: string;
  price: number;
  updated_at: string;
  foodType?: FoodType;
  serviceType?: string;
  requiresCheckedIn?: boolean; // true = only for checked-in guests, false/undefined = for all guests
  imageUrl?: string | null;
}

export interface POSTransactionItem {
  id: string;
  created_at: string;
  product_id: string;
  quantity: number;
  total_price: number;
  transaction_id: string;
  unit_price: number;
}

export interface POSTransaction {
  id: string;
  created_at: string;
  guest_id: string;
  guest_name: string;
  payment_method: string;
  status: TransactionStatus;
  subtotal: number;
  tax: number;
  total: number;
  transaction_number: string;
}

export interface InventoryItem {
  id: string;
  batchNumber?: string;
  category: string;
  createdAt: string;
  currentStock: number;
  description: string;
  expirationDate?: string;
  location: string;
  maxStock?: number;
  name: string;
  restockThreshold: number;
  supplier?: string;
  unit: string;
  unitCost?: number;
  price?: number; // For menu items
  updatedAt: string;
}

export interface User {
  id: string;
  createdAt: string;
  email: string;
  name: string;
  phone: string;
  role: "manager" | "receptionist";
  status: "active" | "inactive";
  updatedAt: string;
  password?: string; // Optional: for authentication (should be hashed in production)
}

export const Constants = {
  Enums: {
    booking_status: ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "paid"] as const,
    transaction_status: ["pending", "completed", "refunded", "cancelled", "voided"] as const,
    food_type: ["breakfast", "lunch", "snack", "dinner"] as const,
  },
} as const;
