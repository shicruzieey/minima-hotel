import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, ShoppingCart, Loader2, Clock, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveGuests } from "@/hooks/useGuests";
import { usePOSTransactions } from "@/hooks/usePOS";
import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const ReceptionistDashboard = () => {
  const { user } = useAuth();
  const { data: checkedInGuests = [], isLoading: guestsLoading } = useActiveGuests();
  const { data: transactions = [], isLoading: transactionsLoading } = usePOSTransactions();

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Today's check-ins (guests who checked in today)
    const todayCheckIns = checkedInGuests.filter(guest => {
      const checkInDate = new Date(guest.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      return checkInDate.getTime() === today.getTime();
    }).length;

    // Today's POS sales
    const todaySales = transactions
      .filter(t => {
        const transactionDate = new Date(t.created_at || "");
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate.getTime() === today.getTime() && t.status === "completed";
      })
      .reduce((sum, t) => sum + (t.total || 0), 0);

    // Pending transactions count
    const pendingCount = transactions.filter(t => t.status === "pending").length;

    // Today's transaction count
    const todayTransactionCount = transactions.filter(t => {
      const transactionDate = new Date(t.created_at || "");
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate.getTime() === today.getTime();
    }).length;

    return {
      todayCheckIns,
      checkedInCount: checkedInGuests.length,
      todaySales,
      pendingCount,
      todayTransactionCount,
    };
  }, [checkedInGuests, transactions]);

  // Sales by hour (last 24 hours)
  const salesByHour = useMemo(() => {
    const hourlyData: { [key: string]: number } = {};
    const now = new Date();
    
    // Initialize last 8 hours
    for (let i = 7; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.getHours();
      hourlyData[hourKey] = 0;
    }

    // Aggregate sales by hour
    transactions
      .filter(t => t.status === "completed" && t.created_at)
      .forEach(t => {
        const transactionDate = new Date(t.created_at);
        const hoursDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60));
        
        if (hoursDiff < 8) {
          const hour = transactionDate.getHours();
          hourlyData[hour] = (hourlyData[hour] || 0) + (t.total || 0);
        }
      });

    return Object.entries(hourlyData)
      .map(([hour, sales]) => ({
        hour: `${hour}:00`,
        sales: Math.round(sales),
      }))
      .slice(-8);
  }, [transactions]);

  // Transaction status breakdown
  const transactionStatusData = useMemo(() => {
    const statusCounts = transactions.reduce((acc, t) => {
      const status = t.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  }, [transactions]);

  const isLoading = guestsLoading || transactionsLoading;

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle={`Welcome back, ${user?.name}`}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{todayStats.todayCheckIns}</div>
                  <p className="text-xs text-muted-foreground">Guests arrived today</p>
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
                  <div className="text-2xl font-bold">{todayStats.checkedInCount}</div>
                  <p className="text-xs text-muted-foreground">Currently staying</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{todayStats.pendingCount}</div>
                  <p className="text-xs text-muted-foreground">Awaiting payment</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold">₱{todayStats.todaySales.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{todayStats.todayTransactionCount} transactions</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Sales by Hour */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sales by Hour (Last 8 Hours)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => `₱${value}`} />
                    <Bar dataKey="sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Transaction Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Status</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={transactionStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {transactionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReceptionistDashboard;
