import { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Loader2,
  Receipt,
  Calendar,
  User,
  DollarSign,
  Filter,
  Download,
  Printer
} from "lucide-react";
import { usePOSTransactions } from "@/hooks/usePOS";
import { useQuery } from "@tanstack/react-query";
import { ref, get } from "firebase/database";
import { db } from "@/integrations/firebase/client";

type TransactionStatus = "all" | "completed" | "pending" | "voided";

interface TransactionWithItems {
  id: string;
  transaction_number: string;
  guest_id: string;
  guest_name: string;
  payment_method: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  items?: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

const TransactionHistory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithItems | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: transactions = [], isLoading } = usePOSTransactions();

  // Fetch transaction items and products
  const { data: transactionsWithItems = [] } = useQuery({
    queryKey: ["transactions-with-items", transactions],
    queryFn: async (): Promise<TransactionWithItems[]> => {
      if (transactions.length === 0) return [];

      // Fetch items
      const itemsRef = ref(db, "pos_transaction_items");
      const itemsSnapshot = await get(itemsRef);
      const itemsData = itemsSnapshot.exists() ? itemsSnapshot.val() : {};

      // Fetch products
      const productsRef = ref(db, "pos_products");
      const productsSnapshot = await get(productsRef);
      const productsData = productsSnapshot.exists() ? productsSnapshot.val() : {};

      // Fetch menu items
      const menuRef = ref(db, "menu");
      const menuSnapshot = await get(menuRef);
      const menuData = menuSnapshot.exists() ? menuSnapshot.val() : {};

      // Combine products and menu
      const allProducts = { ...productsData, ...menuData };

      return transactions.map(transaction => {
        const items = Object.entries(itemsData)
          .filter(([_, item]: [string, any]) => item.transaction_id === transaction.id)
          .map(([id, item]: [string, any]) => ({
            product_id: item.product_id,
            product_name: allProducts[item.product_id]?.name || "Unknown Product",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          }));

        return { ...transaction, items } as TransactionWithItems;
      });
    },
    enabled: transactions.length > 0,
  });

  const filteredTransactions = useMemo(() => {
    return transactionsWithItems.filter(t => {
      const matchesSearch = 
        t.transaction_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.guest_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transactionsWithItems, searchQuery, statusFilter]);

  const handleViewDetails = (transaction: TransactionWithItems) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handlePrintReceipt = () => {
    if (!selectedTransaction) return;
    
    // Create a printable receipt
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${selectedTransaction.transaction_number}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              max-width: 300px;
              margin: 20px auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 20px;
            }
            .header p {
              margin: 5px 0;
              font-size: 12px;
            }
            .info {
              margin-bottom: 15px;
              font-size: 12px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .items {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin: 15px 0;
            }
            .item {
              margin: 8px 0;
              font-size: 12px;
            }
            .item-name {
              font-weight: bold;
            }
            .item-details {
              display: flex;
              justify-content: space-between;
              margin-top: 2px;
            }
            .totals {
              margin-top: 15px;
              font-size: 12px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
            }
            .total-row.grand {
              font-size: 14px;
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px dashed #000;
              font-size: 11px;
            }
            @media print {
              body {
                margin: 0;
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Minima Hotel</h1>
            <p>Point of Sale Receipt</p>
            <p>${formatDate(selectedTransaction.created_at)}</p>
          </div>
          
          <div class="info">
            <div class="info-row">
              <span>Transaction #:</span>
              <span>${selectedTransaction.transaction_number}</span>
            </div>
            <div class="info-row">
              <span>Guest:</span>
              <span>${selectedTransaction.guest_name}</span>
            </div>
            <div class="info-row">
              <span>Payment:</span>
              <span>${selectedTransaction.payment_method.toUpperCase()}</span>
            </div>
            <div class="info-row">
              <span>Status:</span>
              <span>${selectedTransaction.status.toUpperCase()}</span>
            </div>
          </div>
          
          <div class="items">
            <h3 style="margin: 0 0 10px 0; font-size: 13px;">Items</h3>
            ${selectedTransaction.items?.map(item => `
              <div class="item">
                <div class="item-name">${item.product_name}</div>
                <div class="item-details">
                  <span>₱${item.unit_price.toFixed(2)} × ${item.quantity}</span>
                  <span>₱${item.total_price.toFixed(2)}</span>
                </div>
              </div>
            `).join('') || ''}
          </div>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₱${selectedTransaction.subtotal?.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax (10%):</span>
              <span>₱${selectedTransaction.tax?.toFixed(2)}</span>
            </div>
            <div class="total-row grand">
              <span>TOTAL:</span>
              <span>₱${selectedTransaction.total?.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Please keep this receipt for your records</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: "default" as const, className: "bg-green-100 text-green-700 border-green-200" },
      pending: { variant: "secondary" as const, className: "bg-orange-100 text-orange-700 border-orange-200" },
      voided: { variant: "secondary" as const, className: "bg-red-100 text-red-700 border-red-200" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.completed;

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const completedTransactions = filteredTransactions.filter(t => t.status === "completed");
    
    // All-time revenue
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    
    // Last 7 days revenue
    const last7DaysRevenue = completedTransactions
      .filter(t => {
        if (!t.created_at) return false;
        const txDate = new Date(t.created_at);
        return txDate >= last7Days;
      })
      .reduce((sum, t) => sum + (t.total || 0), 0);
    
    return {
      totalRevenue,
      last7DaysRevenue,
      completedCount: completedTransactions.length,
      pendingCount: filteredTransactions.filter(t => t.status === "pending").length,
    };
  }, [filteredTransactions]);

  return (
    <MainLayout 
      title="Transaction History" 
      subtitle="View all POS transactions"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₱{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ₱{stats.last7DaysRevenue.toLocaleString()} last 7 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by transaction number or guest name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("completed")}
                >
                  Completed
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === "voided" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("voided")}
                >
                  Voided
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "No transactions match your filters" 
                  : "No transactions found"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.transaction_number}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{transaction.guest_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm capitalize">
                          {transaction.payment_method}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₱{transaction.total?.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintReceipt}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
          </div>

          {selectedTransaction && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction Number</p>
                  <p className="font-mono font-medium">{selectedTransaction.transaction_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{formatDate(selectedTransaction.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Guest</p>
                  <p className="font-medium">{selectedTransaction.guest_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">{selectedTransaction.payment_method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium mb-3">Items</h3>
                <div className="space-y-2">
                  {selectedTransaction.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₱{item.unit_price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">₱{item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₱{selectedTransaction.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span>₱{selectedTransaction.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>₱{selectedTransaction.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TransactionHistory;
