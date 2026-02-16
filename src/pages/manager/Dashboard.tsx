import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, DollarSign, Package, Loader2, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { ref, get } from "firebase/database";
import { db } from "@/integrations/firebase/client";
import { usePOSTransactions } from "@/hooks/usePOS";
import { useActiveGuests } from "@/hooks/useGuests";
import { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const ManagerDashboard = () => {
  const { user } = useAuth();
  
  // Fetch checked-in guests using the dedicated hook
  const { data: checkedInGuests = [], isLoading: guestsLoading } = useActiveGuests();
  
  // Fetch all bookings for status breakdown
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["all-bookings"],
    queryFn: async () => {
      const bookingsRef = ref(db, "bookings");
      const snapshot = await get(bookingsRef);
      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      return Object.entries(data).map(([id, value]: [string, any]) => ({
        id,
        ...value,
      }));
    },
  });

  // Fetch inventory (menu items for food/beverage)
  const { data: inventory = [], isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory-menu-count"],
    queryFn: async () => {
      // Fetch both inventory and menu items
      const [inventorySnap, menuSnap] = await Promise.all([
        get(ref(db, "inventory")),
        get(ref(db, "menu")),
      ]);
      
      const items = [];
      
      if (inventorySnap.exists()) {
        const data = inventorySnap.val();
        items.push(...Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        })));
      }
      
      if (menuSnap.exists()) {
        const data = menuSnap.val();
        items.push(...Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        })));
      }
      
      return items;
    },
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: transactionsLoading } = usePOSTransactions();

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Total revenue from completed transactions (last 7 days)
    const totalRevenue = transactions
      .filter(t => {
        if (t.status !== "completed") return false;
        if (!t.created_at) return false;
        const txDate = new Date(t.created_at);
        return txDate >= last7Days;
      })
      .reduce((sum, t) => sum + (t.total || 0), 0);

    // Checked-in guests count (from useActiveGuests hook)
    const checkedInGuestsCount = checkedInGuests.length;

    // POS transactions count (completed, last 7 days)
    const posSalesCount = transactions.filter(t => {
      if (t.status !== "completed") return false;
      if (!t.created_at) return false;
      const txDate = new Date(t.created_at);
      return txDate >= last7Days;
    }).length;

    // Inventory items count (both inventory and menu)
    const inventoryCount = inventory.length;

    // Low stock items (items where currentStock <= restockThreshold)
    const lowStockCount = inventory.filter((item: any) => 
      item.currentStock !== undefined && 
      item.restockThreshold !== undefined &&
      item.currentStock <= item.restockThreshold
    ).length;

    return {
      totalRevenue,
      checkedInGuests: checkedInGuestsCount,
      posSalesCount,
      inventoryCount,
      lowStockCount,
    };
  }, [checkedInGuests, transactions, inventory]);

  // Revenue by day (last 7 days)
  const revenueByDay = useMemo(() => {
    const dailyData: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyData[dateKey] = 0;
    }

    // Aggregate revenue by day
    transactions
      .filter(t => t.status === "completed" && t.created_at)
      .forEach(t => {
        const transactionDate = new Date(t.created_at);
        const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 7) {
          const dateKey = transactionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyData[dateKey] = (dailyData[dateKey] || 0) + (t.total || 0);
        }
      });

    return Object.entries(dailyData).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue),
    }));
  }, [transactions]);

  // Bookings by status
  const bookingsByStatus = useMemo(() => {
    const statusCounts = bookings.reduce((acc, b) => {
      const status = b.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      count,
    }));
  }, [bookings]);

  const isLoading = guestsLoading || bookingsLoading || inventoryLoading || transactionsLoading;

  return (
    <MainLayout 
      title="Manager Dashboard" 
      subtitle={`Welcome back, ${user?.name}`}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">₱{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked-In Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.checkedInGuests}</div>
                  <p className="text-xs text-muted-foreground">Currently staying</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">POS Transactions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.posSalesCount}</div>
                  <p className="text-xs text-muted-foreground">Last 7 days</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.inventoryCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.lowStockCount > 0 ? (
                      <span className="text-orange-600 font-medium">{stats.lowStockCount} low stock items</span>
                    ) : (
                      "All items in stock"
                    )}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₱${value}`} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Bookings by Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bookings by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={bookingsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ManagerDashboard;
