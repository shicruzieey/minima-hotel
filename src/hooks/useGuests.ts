import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { ref, get } from "firebase/database";
import type { Booking, POSTransaction } from "@/integrations/firebase/types";

export interface GuestWithBooking {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomType: string;
  bookingId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
}

export const useActiveGuests = () => {
  return useQuery({
    queryKey: ["active-guests"],
    queryFn: async () => {
      const bookingsRef = ref(db, "bookings");
      const snapshot = await get(bookingsRef);
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const bookings: Booking[] = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<Booking, "id">),
      }));
      
      // Filter for checked-in guests only
      const checkedInBookings = bookings.filter(b => {
        if (!b.status) return false;
        const status = String(b.status).toLowerCase().trim();
        return status === "checked-in" || status === "checked in" || status === "checkedin";
      });
      
      return checkedInBookings.map(booking => ({
        id: booking.guestId,
        guestId: booking.guestId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        roomId: booking.roomId,
        roomType: booking.roomType,
        bookingId: booking.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        status: booking.status,
        totalPrice: booking.totalPrice,
      })).sort((a, b) => a.guestName.localeCompare(b.guestName)) as GuestWithBooking[];
    },
  });
};

export const useCheckedOutGuests = () => {
  return useQuery({
    queryKey: ["checked-out-guests"],
    queryFn: async () => {
      const bookingsRef = ref(db, "bookings");
      const snapshot = await get(bookingsRef);
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const bookings: Booking[] = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<Booking, "id">),
      }));
      
      // Filter for checked out guests - "Checked Out" or "Paid" status
      const checkedOutBookings = bookings.filter(b => {
        const status = b.status?.toLowerCase() || "";
        return status === "checked out" || status === "checked_out" || status === "checkedout" ||
               status === "paid";
      });
      
      return checkedOutBookings.map(booking => ({
        id: booking.guestId,
        guestId: booking.guestId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        roomId: booking.roomId,
        roomType: booking.roomType,
        bookingId: booking.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        status: booking.status,
        totalPrice: booking.totalPrice,
      })).sort((a, b) => 
        new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime()
      ) as GuestWithBooking[];
    },
  });
};

export interface TransactionWithItems extends POSTransaction {
  items?: {
    product_id: string;
    product_name?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

export const useGuestTransactions = (guestId: string | null) => {
  return useQuery({
    queryKey: ["guest-transactions", guestId],
    queryFn: async (): Promise<TransactionWithItems[]> => {
      if (!guestId) return [];
      
      const transactionsRef = ref(db, "pos_transactions");
      const snapshot = await get(transactionsRef);
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const transactions: POSTransaction[] = Object.entries(data)
        .map(([id, value]) => ({
          id,
          ...(value as Omit<POSTransaction, "id">),
        }))
        .filter(t => t.guest_id === guestId);
      
      // Get transaction items
      const itemsRef = ref(db, "pos_transaction_items");
      const itemsSnapshot = await get(itemsRef);
      const itemsData = itemsSnapshot.exists() ? itemsSnapshot.val() : {};
      
      // Get products for names
      const productsRef = ref(db, "pos_products");
      const productsSnapshot = await get(productsRef);
      const productsData = productsSnapshot.exists() ? productsSnapshot.val() : {};
      
      // Map items to transactions
      const transactionsWithItems = transactions.map(transaction => {
        const items = Object.entries(itemsData)
          .filter(([_, item]: [string, any]) => item.transaction_id === transaction.id)
          .map(([id, item]: [string, any]) => ({
            id,
            product_id: item.product_id,
            product_name: productsData[item.product_id]?.name || "Unknown Product",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          }));
        
        return { ...transaction, items };
      });
      
      return transactionsWithItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!guestId,
  });
};

export const useGuestTotalSpent = (guestId: string | null) => {
  const { data: transactions = [] } = useGuestTransactions(guestId);
  
  const totalSpent = transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const transactionCount = transactions.length;
  const pendingTransactions = transactions.filter(t => t.status === "pending");
  const pendingTotal = pendingTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const pendingCount = pendingTransactions.length;
  
  return { totalSpent, transactionCount, pendingTotal, pendingCount };
};
