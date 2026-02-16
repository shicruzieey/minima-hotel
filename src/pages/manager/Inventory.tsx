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
  Loader2,
  PackageX
} from "lucide-react";
import { useInventory, useInventoryStats } from "@/hooks/useInventory";

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const { data: inventoryItems = [], isLoading } = useInventory();
  const { totalItems, lowStockCount, categories } = useInventoryStats();

  const allCategories = ["All", ...categories];
  const statusFilters = ["All", "In Stock", "Low Stock", "Critical", "Out of Stock"];

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    
    // Status filter logic
    let matchesStatus = true;
    if (statusFilter !== "All") {
      const stockStatus = getStockStatus(item.currentStock, item.restockThreshold);
      if (statusFilter === "In Stock") {
        matchesStatus = stockStatus === "normal";
      } else if (statusFilter === "Low Stock") {
        matchesStatus = stockStatus === "low";
      } else if (statusFilter === "Critical") {
        matchesStatus = stockStatus === "critical";
      } else if (statusFilter === "Out of Stock") {
        matchesStatus = stockStatus === "out";
      }
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStockStatus = (currentStock: number, restockThreshold: number) => {
    if (!currentStock || currentStock === 0) return "out";
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
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">{categories.length} categories</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{lowStockCount}</div>
                <p className="text-xs text-muted-foreground">
                  {lowStockCount > 0 ? (
                    <span className="text-orange-600 font-medium">Needs attention</span>
                  ) : (
                    "All items in stock"
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Pending</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{lowStockCount}</div>
                <p className="text-xs text-muted-foreground">Below threshold</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Category Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Category</p>
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
            
            {/* Status Filters */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Status</p>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {statusFilters.map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status}
                  </Button>
                ))}
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
                            status === "out" ? "bg-gray-500/10 text-gray-600 border-gray-500/20" :
                            status === "critical" ? "bg-destructive/10 text-destructive border-destructive/20" :
                            status === "low" ? "bg-warning/10 text-warning border-warning/20" :
                            "bg-success/10 text-success border-success/20"
                          }
                        >
                          {status === "out" ? "Out of Stock" : 
                           status === "critical" ? "Critical" : 
                           status === "low" ? "Low" : 
                           "In Stock"}
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
