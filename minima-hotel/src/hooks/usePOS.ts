import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type POSCategory = Database["public"]["Tables"]["pos_categories"]["Row"];
type POSProduct = Database["public"]["Tables"]["pos_products"]["Row"];
type POSTransaction = Database["public"]["Tables"]["pos_transactions"]["Row"];
type POSTransactionInsert = Database["public"]["Tables"]["pos_transactions"]["Insert"];
type POSTransactionItem = Database["public"]["Tables"]["pos_transaction_items"]["Row"];
type POSTransactionItemInsert = Database["public"]["Tables"]["pos_transaction_items"]["Insert"];

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ProductWithCategory extends POSProduct {
  category?: POSCategory;
}

export const usePOSCategories = () => {
  return useQuery({
    queryKey: ["pos-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
};

export const usePOSProducts = () => {
  return useQuery({
    queryKey: ["pos-products"],
    queryFn: async () => {
      const { data: products, error: productsError } = await supabase
        .from("pos_products")
        .select("*")
        .eq("is_available", true)
        .order("name");

      if (productsError) throw productsError;

      const categoryIds = [...new Set(products?.map(p => p.category_id) || [])];
      
      const { data: categories, error: categoriesError } = await supabase
        .from("pos_categories")
        .select("*")
        .in("id", categoryIds);

      if (categoriesError) throw categoriesError;

      const categoriesMap = new Map(categories?.map(c => [c.id, c]) || []);

      return products?.map(product => ({
        ...product,
        category: categoriesMap.get(product.category_id),
      })) as ProductWithCategory[];
    },
  });
};

export const useActiveBookings = () => {
  return useQuery({
    queryKey: ["active-bookings-for-pos"],
    queryFn: async () => {
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["confirmed", "checked_in"]);

      if (bookingsError) throw bookingsError;

      // Fetch related guests and rooms
      const guestIds = [...new Set(bookings?.map(b => b.guest_id) || [])];
      const roomIds = [...new Set(bookings?.map(b => b.room_id) || [])];

      const [guestsResult, roomsResult] = await Promise.all([
        supabase.from("guests").select("*").in("id", guestIds),
        supabase.from("rooms").select("*").in("id", roomIds)
      ]);

      const guestsMap = new Map(guestsResult.data?.map(g => [g.id, g]) || []);
      const roomsMap = new Map(roomsResult.data?.map(r => [r.id, r]) || []);

      return bookings?.map(booking => ({
        ...booking,
        guest: guestsMap.get(booking.guest_id),
        room: roomsMap.get(booking.room_id)
      })) || [];
    },
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transaction,
      items,
    }: {
      transaction: Omit<POSTransactionInsert, "transaction_number">;
      items: { product_id: string; quantity: number; unit_price: number }[];
    }) => {
      // Generate transaction number
      const transactionNumber = `TX${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

      // Create the transaction
      const { data: createdTransaction, error: transactionError } = await supabase
        .from("pos_transactions")
        .insert({
          ...transaction,
          transaction_number: transactionNumber,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems: POSTransactionItemInsert[] = items.map(item => ({
        transaction_id: createdTransaction.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("pos_transaction_items")
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      return createdTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-transactions"] });
    },
  });
};

export const usePOSTransactions = () => {
  return useQuery({
    queryKey: ["pos-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });
};
