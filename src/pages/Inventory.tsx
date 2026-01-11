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
  Package, 
  AlertTriangle,
  TrendingDown,
  Loader2
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { useInventory, useInventoryStats } from "@/hooks/useInventory";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  const { data: inventoryItems = [], isLoading } = useInventory();
  const { totalItems, lowStockCount, categories } = useInventoryStats();

  const allCategories = ["All", ...categories];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (currentStock: number, restockThreshold: number) => {
    if (currentStock < restockThreshold) return "critical";
    if (currentStock < restockThreshold * 1.5) return "low";
    return "normal";
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <MainLayout title="Inventory Management" subtitle="Track and manage hotel supplies">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Items"
          value={isLoading ? "..." : totalItems}
          change={`${categories.length} categories`}
          icon={Package}
        />
        <StatCard
          title="Low Stock Alerts"
          value={isLoading ? "..." : lowStockCount}
          change="Needs attention"
          changeType={lowStockCount > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          iconColor="bg-destructive/10 text-destructive"
        />
        <StatCard
          title="Reorder Pending"
          value={lowStockCount}
          change="Below threshold"
          icon={TrendingDown}
          iconColor="bg-warning/10 text-warning"
        />
      </div>

      {/* Filters and Search */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {allCategories.map((cat) => (
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || activeCategory !== "All" 
                ? "No items match your filters" 
                : "No inventory items found"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min. Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const status = getStockStatus(item.currentStock, item.restockThreshold);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{item.name}</div>
                          {item.description && (
                            <div className="text-xs text-muted-foreground">{item.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.currentStock} {item.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.restockThreshold} {item.unit}
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
                        {item.location || "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.updatedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default Inventory;
