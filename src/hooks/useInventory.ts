import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { ref, get } from "firebase/database";
import type { InventoryItem } from "@/integrations/firebase/types";

export const useInventory = () => {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const inventoryRef = ref(db, "inventory");
      const snapshot = await get(inventoryRef);
      
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      const items: InventoryItem[] = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<InventoryItem, "id">),
      }));
      
      return items.sort((a, b) => a.name.localeCompare(b.name));
    },
  });
};

export const useInventoryStats = () => {
  const { data: items = [], isLoading } = useInventory();
  
  const totalItems = items.length;
  const totalStockUnits = items.reduce((sum, item) => sum + item.currentStock, 0);
  const lowStockCount = items.filter(item => item.currentStock < item.restockThreshold).length;
  const categories = [...new Set(items.map(item => item.category))];
  
  return {
    totalItems,
    totalStockUnits,
    lowStockCount,
    categories,
    isLoading,
  };
};
