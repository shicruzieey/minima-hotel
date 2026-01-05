import MainLayout from "@/components/layout/MainLayout";
import StatCard from "@/components/dashboard/StatCard";
import { 
  BedDouble, 
  Users, 
  DollarSign, 
  Package,
  ShoppingCart
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

const revenueData = [
  { name: "Mon", revenue: 4000 },
  { name: "Tue", revenue: 3000 },
  { name: "Wed", revenue: 5000 },
  { name: "Thu", revenue: 4500 },
  { name: "Fri", revenue: 6000 },
  { name: "Sat", revenue: 8000 },
  { name: "Sun", revenue: 7500 },
];

const Index = () => {
  return (
    <MainLayout title="Dashboard" subtitle="Welcome back to Minima Hotel">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value="₱45,231"
          change="+12.5% from last week"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Occupancy Rate"
          value="78%"
          change="+5% from yesterday"
          changeType="positive"
          icon={BedDouble}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Active Guests"
          value="142"
          change="23 checking out today"
          changeType="neutral"
          icon={Users}
          iconColor="bg-success/10 text-success"
        />
        <StatCard
          title="Available Rooms"
          value="24"
          change="8 rooms ready"
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
            <CardTitle className="font-heading text-lg">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
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
          </CardContent>
        </Card>

        {/* POS Stats */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="font-heading text-lg">POS Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium">Today's Transactions</p>
                  <p className="text-sm text-muted-foreground">47 completed</p>
                </div>
                <div className="text-2xl font-bold text-accent">₱12,450</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium">Average Order Value</p>
                  <p className="text-sm text-muted-foreground">Last 7 days</p>
                </div>
                <div className="text-2xl font-bold text-primary">₱265</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <p className="font-medium">Top Category</p>
                  <p className="text-sm text-muted-foreground">Restaurant</p>
                </div>
                <div className="text-2xl font-bold text-success">68%</div>
              </div>
            </div>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Restaurant Order #1234</p>
                    <p className="text-sm text-muted-foreground">Table 5 • 2 mins ago</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Bar Order #1233</p>
                    <p className="text-sm text-muted-foreground">Lounge • 5 mins ago</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                  Completed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Room Service #1232</p>
                    <p className="text-sm text-muted-foreground">Suite 401 • 8 mins ago</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                  Pending
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Index;
