import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { ref, get } from "firebase/database";
import type { InventoryItem } from "@/integrations/firebase/types";

export const useInventory = () => {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      // Fetch both inventory and menu items
      const [inventorySnap, menuSnap] = await Promise.all([
        get(ref(db, "inventory")),
        get(ref(db, "menu")),
      ]);
      
      const items: InventoryItem[] = [];
      
      // Add inventory items
      if (inventorySnap.exists()) {
        const data = inventorySnap.val();
        Object.entries(data).forEach(([id, value]: [string, any]) => {
          items.push({
            id,
            name: value.name,
            category: value.category || "uncategorized",
            currentStock: value.currentStock || 0,
            restockThreshold: value.restockThreshold || 0,
            maxStock: value.maxStock,
            unit: value.unit || "unit",
            location: value.location,
            supplier: value.supplier,
            description: value.description,
            createdAt: value.createdAt,
            updatedAt: value.updatedAt,
          });
        });
      }
      
      // Add menu items (food/beverage inventory)
      if (menuSnap.exists()) {
        const data = menuSnap.val();
        Object.entries(data).forEach(([id, value]: [string, any]) => {
          items.push({
            id,
            name: value.name,
            category: value.category || "menu",
            currentStock: value.currentStock || 0,
            restockThreshold: value.restockThreshold || 0,
            maxStock: value.maxStock,
            unit: value.unit || "unit",
            location: value.location,
            supplier: value.supplier,
            description: value.description,
            createdAt: value.createdAt,
            updatedAt: value.updatedAt,
          });
        });
      }
      
      return items.sort((a, b) => a.name.localeCompare(b.name));
    },
  });
};

export const useInventoryStats = () => {
  const { data: items = [], isLoading } = useInventory();
  
  const totalItems = items.length;
  const totalStockUnits = items.reduce((sum, item) => sum + (item.currentStock || 0), 0);
  
  // Low stock: items where currentStock is below restockThreshold
  const lowStockCount = items.filter(item => 
    item.currentStock !== undefined && 
    item.restockThreshold !== undefined &&
    item.currentStock < item.restockThreshold
  ).length;
  
  // Get unique categories
  const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
  
  return {
    totalItems,
    totalStockUnits,
    lowStockCount,
    categories,
    isLoading,
  };
};
