import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { 
  BedDouble, 
  Users, 
  DollarSign, 
  Package,
  ShoppingCart,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { useDashboardStats, useRecentTransactions } from "@/hooks/useDashboard";
import { formatDistanceToNow } from "date-fns";

const Index = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentTransactions, isLoading: transactionsLoading } = useRecentTransactions();

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString()}`;
  };

  return (
    <MainLayout title="Dashboard" subtitle="Welcome back to Minima Hotel">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Weekly Revenue"
          value={statsLoading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
          change="Last 7 days"
          changeType="neutral"
          icon={DollarSign}
        />
        <StatCard
          title="Occupancy Rate"
          value={statsLoading ? "..." : `${stats?.occupancyRate || 0}%`}
          change="Current occupancy"
          changeType={stats?.occupancyRate && stats.occupancyRate > 50 ? "positive" : "neutral"}
          icon={BedDouble}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Active Bookings"
          value={statsLoading ? "..." : String(stats?.activeGuests || 0)}
          change="Confirmed & checked in"
          changeType="neutral"
          icon={Users}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Available Rooms"
          value={statsLoading ? "..." : String(stats?.availableRooms || 0)}
          change="Ready for booking"
          changeType="positive"
          icon={BedDouble}
          iconColor="bg-success/10 text-success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Revenue Overview (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats?.revenueChartData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 32%, 91%)" />
                  <XAxis dataKey="name" stroke="hsl(215, 16%, 47%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 16%, 47%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(0, 0%, 100%)", 
                      border: "1px solid hsl(214, 32%, 91%)",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number) => [`₱${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(38, 92%, 50%)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* POS Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">POS Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">Today's Transactions</p>
                    <p className="text-sm text-muted-foreground">{stats?.todayTransactions || 0} completed</p>
                  </div>
                  <div className="text-2xl font-bold text-accent">
                    {formatCurrency(stats?.todayRevenue || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">Average Order Value</p>
                    <p className="text-sm text-muted-foreground">Last 7 days</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(stats?.avgOrderValue || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">Weekly Revenue</p>
                    <p className="text-sm text-muted-foreground">Last 7 days total</p>
                  </div>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Access & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Access */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a href="/pos" className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <div className="p-2 rounded-lg bg-accent/10">
                <ShoppingCart className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-medium text-foreground">Point of Sale</p>
                <p className="text-sm text-muted-foreground">Process transactions</p>
              </div>
            </a>
            <a href="/inventory" className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Inventory</p>
                <p className="text-sm text-muted-foreground">Manage stock</p>
              </div>
            </a>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Recent POS Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{tx.transaction_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {tx.guest_name} • {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{formatCurrency(tx.total)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tx.status === "completed" 
                          ? "bg-success/10 text-success" 
                          : "bg-warning/10 text-warning"
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent transactions
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
