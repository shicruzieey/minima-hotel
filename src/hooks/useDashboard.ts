import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { ref, get } from "firebase/database";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [bookingsSnap, roomsSnap, transactionsSnap] = await Promise.all([
        get(ref(db, "bookings")),
        get(ref(db, "rooms")),
        get(ref(db, "pos_transactions")),
      ]);

      // Process bookings
      const bookings = bookingsSnap.exists() 
        ? Object.values(bookingsSnap.val()) as any[]
        : [];
      
      const activeBookings = bookings.filter(b => 
        ["confirmed", "checked_in"].includes(b.status)
      );

      // Process rooms
      const rooms = roomsSnap.exists()
        ? Object.values(roomsSnap.val()) as any[]
        : [];
      
      const availableRooms = rooms.filter(r => r.status === "available");
      const totalRooms = rooms.length || 1; // Avoid division by zero
      const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
      const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

      // Process transactions
      const transactions = transactionsSnap.exists()
        ? Object.entries(transactionsSnap.val()).map(([id, val]) => ({ id, ...(val as any) }))
        : [];

      // Today's transactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTransactions = transactions.filter(t => {
        const txDate = new Date(t.created_at);
        return txDate >= today;
      });

      const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

      // Last 7 days revenue
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const weekTransactions = transactions.filter(t => {
        const txDate = new Date(t.created_at);
        return txDate >= last7Days;
      });

      const weekRevenue = weekTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
      const avgOrderValue = weekTransactions.length > 0 
        ? Math.round(weekRevenue / weekTransactions.length)
        : 0;

      // Revenue by day for chart
      const revenueByDay: Record<string, number> = {};
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = dayNames[d.getDay()];
        revenueByDay[dayName] = 0;
      }

      weekTransactions.forEach(t => {
        const txDate = new Date(t.created_at);
        const dayName = dayNames[txDate.getDay()];
        revenueByDay[dayName] = (revenueByDay[dayName] || 0) + (t.total || 0);
      });

      const revenueChartData = Object.entries(revenueByDay).map(([name, revenue]) => ({
        name,
        revenue: Math.round(revenue),
      }));

      return {
        totalRevenue: weekRevenue,
        occupancyRate,
        activeGuests: activeBookings.length,
        availableRooms: availableRooms.length,
        todayTransactions: todayTransactions.length,
        todayRevenue,
        avgOrderValue,
        revenueChartData,
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useRecentTransactions = () => {
  return useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const transactionsSnap = await get(ref(db, "pos_transactions"));
      
      if (!transactionsSnap.exists()) return [];

      const transactions = Object.entries(transactionsSnap.val())
        .map(([id, val]) => ({ id, ...(val as any) }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      return transactions;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};
