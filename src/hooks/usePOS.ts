import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { ref, get, push, set, update } from "firebase/database";
import type { POSCategory, POSProduct, POSTransactionItem, Booking, FoodType } from "@/integrations/firebase/types";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ProductWithCategory extends POSProduct {
  category?: POSCategory;
}

// Guest info extracted from bookings
export interface GuestFromBooking {
  id: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomId: string;
  roomType: string;
  bookingId: string;
}

export const useGuests = () => {
  return useQuery({
    queryKey: ["guests-from-bookings"],
    queryFn: async () => {
      const bookingsRef = ref(db, "bookings");
      const snapshot = await get(bookingsRef);
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const bookings: Booking[] = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<Booking, "id">),
      }));
      
      // Extract unique guests from bookings (use guestId to dedupe)
      const guestMap = new Map<string, GuestFromBooking>();
      bookings.forEach(booking => {
        if (!guestMap.has(booking.guestId)) {
          guestMap.set(booking.guestId, {
            id: booking.guestId,
            guestId: booking.guestId,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            guestPhone: booking.guestPhone,
            roomId: booking.roomId,
            roomType: booking.roomType,
            bookingId: booking.id,
          });
        }
      });
      
      return Array.from(guestMap.values()).sort((a, b) => 
        a.guestName.localeCompare(b.guestName)
      );
    },
  });
};

export const usePOSCategories = () => {
  return useQuery({
    queryKey: ["pos-categories"],
    queryFn: async () => {
      const categoriesRef = ref(db, "pos_categories");
      const snapshot = await get(categoriesRef);
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const categories: POSCategory[] = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<POSCategory, "id">),
      }));
      
      return categories.sort((a, b) => a.name.localeCompare(b.name));
    },
  });
};

export const usePOSProducts = () => {
  return useQuery({
    queryKey: ["pos-products"],
    queryFn: async () => {
      // Fetch menu items (food/beverages)
      const menuRef = ref(db, "menu");
      const menuSnapshot = await get(menuRef);
      
      // Fetch services
      const servicesRef = ref(db, "pos_products");
      const servicesSnapshot = await get(servicesRef);
      
      const allProducts: POSProduct[] = [];
      
      // Add menu items
      if (menuSnapshot.exists()) {
        const menuData = menuSnapshot.val();
        Object.entries(menuData).forEach(([id, value]: [string, any]) => {
          allProducts.push({
            id,
            name: value.name,
            description: value.description || null,
            price: value.cost || 0,
            category_id: "foods", // All menu items go to Foods category
            is_available: value.isAvailable !== false,
            created_at: value.createdAt || new Date().toISOString(),
            updated_at: value.updatedAt || new Date().toISOString(),
            foodType: value.category?.toLowerCase() as FoodType, // Store original menu category
          });
        });
      }
      
      // Add services
      if (servicesSnapshot.exists()) {
        const servicesData = servicesSnapshot.val();
        Object.entries(servicesData).forEach(([id, value]: [string, any]) => {
          allProducts.push({
            id,
            ...(value as Omit<POSProduct, "id">),
          });
        });
      }

      // Fetch categories
      const categoryIds = [...new Set(allProducts.map(p => p.category_id))];
      const categoriesRef = ref(db, "pos_categories");
      const categoriesSnapshot = await get(categoriesRef);
      
      const categoriesMap = new Map<string, POSCategory>();
      if (categoriesSnapshot.exists()) {
        const categoriesData = categoriesSnapshot.val();
        Object.entries(categoriesData).forEach(([id, value]) => {
          if (categoryIds.includes(id)) {
            categoriesMap.set(id, { id, ...(value as Omit<POSCategory, "id">) });
          }
        });
      }

      return allProducts
        .map(product => ({
          ...product,
          category: categoriesMap.get(product.category_id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)) as ProductWithCategory[];
    },
  });
};

export const usePOSProductsIncludeArchived = () => {
  return useQuery({
    queryKey: ["pos-products-all"],
    queryFn: async () => {
      // Fetch menu items (food/beverages) - including unavailable
      const menuRef = ref(db, "menu");
      const menuSnapshot = await get(menuRef);
      
      // Fetch services - including archived
      const servicesRef = ref(db, "pos_products");
      const servicesSnapshot = await get(servicesRef);
      
      const allProducts: POSProduct[] = [];
      
      // Add menu items
      if (menuSnapshot.exists()) {
        const menuData = menuSnapshot.val();
        Object.entries(menuData).forEach(([id, value]: [string, any]) => {
          allProducts.push({
            id,
            name: value.name,
            description: value.description || null,
            price: value.cost || 0,
            category_id: "foods",
            is_available: value.isAvailable !== false,
            created_at: value.createdAt || new Date().toISOString(),
            updated_at: value.updatedAt || new Date().toISOString(),
            foodType: value.category?.toLowerCase() as FoodType, // Store original menu category
          });
        });
      }
      
      // Add services
      if (servicesSnapshot.exists()) {
        const servicesData = servicesSnapshot.val();
        Object.entries(servicesData).forEach(([id, value]: [string, any]) => {
          allProducts.push({
            id,
            ...(value as Omit<POSProduct, "id">),
          });
        });
      }

      // Fetch categories
      const categoryIds = [...new Set(allProducts.map(p => p.category_id))];
      const categoriesRef = ref(db, "pos_categories");
      const categoriesSnapshot = await get(categoriesRef);
      
      const categoriesMap = new Map<string, POSCategory>();
      if (categoriesSnapshot.exists()) {
        const categoriesData = categoriesSnapshot.val();
        Object.entries(categoriesData).forEach(([id, value]) => {
          if (categoryIds.includes(id)) {
            categoriesMap.set(id, { id, ...(value as Omit<POSCategory, "id">) });
          }
        });
      }

      return allProducts
        .map(product => ({
          ...product,
          category: categoriesMap.get(product.category_id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)) as ProductWithCategory[];
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
      transaction: {
        subtotal: number;
        tax: number;
        total: number;
        payment_method: string;
        status: string;
        guest_id: string;
        guest_name: string;
      };
      items: { product_id: string; quantity: number; unit_price: number }[];
    }) => {
      // Generate transaction number
      const transactionNumber = `TX${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

      // Create the transaction
      const transactionsRef = ref(db, "pos_transactions");
      const newTransactionRef = push(transactionsRef);
      const transactionId = newTransactionRef.key!;

      const transactionData = {
        ...transaction,
        transaction_number: transactionNumber,
        created_at: new Date().toISOString(),
      };

      await set(newTransactionRef, transactionData);

      // Create transaction items
      const itemsRef = ref(db, "pos_transaction_items");
      for (const item of items) {
        const newItemRef = push(itemsRef);
        const itemData: Omit<POSTransactionItem, "id"> = {
          transaction_id: transactionId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.unit_price * item.quantity,
          created_at: new Date().toISOString(),
        };
        await set(newItemRef, itemData);
      }

      return { id: transactionId, ...transactionData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-transactions"] });
    },
  });
};

interface TransactionData {
  id: string;
  created_at?: string;
  [key: string]: any;
}

export const usePOSTransactions = () => {
  return useQuery({
    queryKey: ["pos-transactions"],
    queryFn: async (): Promise<TransactionData[]> => {
      const transactionsRef = ref(db, "pos_transactions");
      const snapshot = await get(transactionsRef);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const transactionsList: TransactionData[] = [];
      
      Object.entries(data).forEach(([id, value]) => {
        transactionsList.push({
          id,
          ...(value as Record<string, any>),
        });
      });
      
      return transactionsList
        .sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 50);
    },
  });
};


export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      name: string;
      description: string;
      price: number;
      category_id: string;
      is_available: boolean;
      foodType?: FoodType;
      serviceType?: string;
    }) => {
      const productsRef = ref(db, "pos_products");
      const newProductRef = push(productsRef);
      
      const productData = {
        ...product,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await set(newProductRef, productData);
      return { id: newProductRef.key!, ...productData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-products-all"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...product
    }: {
      id: string;
      name: string;
      description: string;
      price: number;
      category_id: string;
      is_available: boolean;
      foodType?: FoodType;
      serviceType?: string;
    }) => {
      const productRef = ref(db, `pos_products/${id}`);
      
      const productData = {
        ...product,
        updated_at: new Date().toISOString(),
      };

      await update(productRef, productData);
      return { id, ...productData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-products"] });
      queryClient.invalidateQueries({ queryKey: ["pos-products-all"] });
    },
  });
};


export const usePayTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      paymentMethod,
    }: {
      transactionId: string;
      paymentMethod: "card" | "cash";
    }) => {
      const transactionRef = ref(db, `pos_transactions/${transactionId}`);
      
      await update(transactionRef, {
        payment_method: paymentMethod,
        status: "completed",
        paid_at: new Date().toISOString(),
      });

      return { transactionId, paymentMethod };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["guest-transactions"] });
    },
  });
};

// Get active guests (checked in) for POS selection
export const useActiveGuestsForPOS = () => {
  return useQuery({
    queryKey: ["active-guests-pos"],
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
      const activeBookings = bookings.filter(b => {
        if (!b.status) return false;
        const status = String(b.status).toLowerCase().trim();
        return status === "checked-in" || status === "checked in" || status === "checkedin";
      });
      
      return activeBookings.map(booking => ({
        id: booking.guestId,
        guestId: booking.guestId,
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestPhone: booking.guestPhone,
        roomId: booking.roomId,
        roomType: booking.roomType,
        bookingId: booking.id,
      })).sort((a, b) => a.guestName.localeCompare(b.guestName)) as GuestFromBooking[];
    },
  });
};


export const useVoidTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      const transactionRef = ref(db, `pos_transactions/${transactionId}`);
      
      await update(transactionRef, {
        status: "voided",
        voided_at: new Date().toISOString(),
      });

      return { transactionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["guest-transactions"] });
    },
  });
};
