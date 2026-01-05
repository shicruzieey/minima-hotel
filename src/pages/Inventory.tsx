import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Package, 
  AlertTriangle,
  TrendingDown,
  MoreHorizontal,
  Filter
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";

const inventoryItems = [
  { id: 1, name: "Fresh Towels", category: "Housekeeping", stock: 450, minStock: 100, unit: "pcs", lastUpdated: "2 hours ago" },
  { id: 2, name: "Shampoo Bottles", category: "Amenities", stock: 280, minStock: 200, unit: "bottles", lastUpdated: "1 day ago" },
  { id: 3, name: "Coffee Beans", category: "F&B", stock: 45, minStock: 50, unit: "kg", lastUpdated: "3 hours ago" },
  { id: 4, name: "Bed Linens", category: "Housekeeping", stock: 180, minStock: 50, unit: "sets", lastUpdated: "1 week ago" },
  { id: 5, name: "Mini Bar Snacks", category: "F&B", stock: 320, minStock: 100, unit: "pcs", lastUpdated: "5 hours ago" },
  { id: 6, name: "Body Lotion", category: "Amenities", stock: 25, minStock: 100, unit: "bottles", lastUpdated: "2 days ago" },
  { id: 7, name: "Wine Bottles", category: "F&B", stock: 85, minStock: 30, unit: "bottles", lastUpdated: "1 day ago" },
  { id: 8, name: "Slippers", category: "Amenities", stock: 350, minStock: 200, unit: "pairs", lastUpdated: "4 hours ago" },
];

const categories = ["All", "Housekeeping", "Amenities", "F&B"];

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = inventoryItems.filter(item => item.stock < item.minStock).length;
  const totalItems = inventoryItems.length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.stock, 0);

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock < minStock) return "critical";
    if (stock < minStock * 1.5) return "low";
    return "normal";
  };

  return (
    <MainLayout title="Inventory Management" subtitle="Track and manage hotel supplies">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Items"
          value={totalItems}
          change="8 categories"
          icon={Package}
        />
        <StatCard
          title="Total Stock Units"
          value={totalValue.toLocaleString()}
          change="Across all items"
          icon={Package}
          iconColor="bg-primary/10 text-primary"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockCount}
          change="Needs attention"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Reorder Pending"
          value="3"
          change="Awaiting delivery"
          icon={TrendingDown}
          iconColor="bg-warning/10 text-warning"
        />
      </div>

      {/* Filters and Search */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={activeCategory === cat ? "bg-primary text-primary-foreground" : ""}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min. Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const status = getStockStatus(item.stock, item.minStock);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.stock} {item.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={
                          status === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                          status === "low" ? "bg-warning/10 text-warning border-warning/20" :
                          "bg-success/10 text-success border-success/20"
                        }
                      >
                        {status === "critical" ? "Critical" : status === "low" ? "Low" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.lastUpdated}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Inventory;
