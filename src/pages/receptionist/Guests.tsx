import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  User, 
  Phone, 
  Mail, 
  BedDouble,
  Loader2,
  Receipt,
  Calendar,
  CreditCard,
  Banknote,
  CheckCircle,
  XCircle,
  ShieldAlert,
  ShoppingCart
} from "lucide-react";
import { toast } from "sonner";
import { 
  useActiveGuests, 
  useCheckedOutGuests,
  usePaidGuests,
  useActiveBookings,
  useGuestTransactions,
  useGuestTotalSpent,
  GuestWithBooking 
} from "@/hooks/useGuests";
import { usePayTransaction, useVoidTransaction } from "@/hooks/usePOS";
import { useAuth } from "@/contexts/AuthContext";

const Guests = () => {
  const { isManager, verifyManagerCode } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "checked-in" | "checked-out" | "paid" | "active">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGuest, setSelectedGuest] = useState<GuestWithBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [voidTransactionId, setVoidTransactionId] = useState<string | null>(null);
  const [managerCode, setManagerCode] = useState("");
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);

  const { data: activeGuests = [], isLoading: activeLoading } = useActiveGuests();
  const { data: checkedOutGuests = [], isLoading: checkedOutLoading } = useCheckedOutGuests();
  const { data: paidGuests = [], isLoading: paidLoading } = usePaidGuests();
  const { data: activeBookings = [], isLoading: activeBookingsLoading } = useActiveBookings();
  const { data: transactions = [], isLoading: transactionsLoading } = useGuestTransactions(selectedGuest?.guestId || null);
  const { totalSpent, transactionCount, pendingTotal, pendingCount } = useGuestTotalSpent(selectedGuest?.guestId || null);
  const payTransaction = usePayTransaction();
  const voidTransaction = useVoidTransaction();

  const filteredActiveGuests = activeGuests.filter(guest =>
    guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCheckedOutGuests = checkedOutGuests.filter(guest =>
    guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPaidGuests = paidGuests.filter(guest =>
    guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActiveBookings = activeBookings.filter(guest =>
    guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.roomId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combine all guests and apply filters
  const allGuests = [
    ...activeGuests.map(g => ({ ...g, statusType: 'checked-in' as const })),
    ...checkedOutGuests.map(g => ({ ...g, statusType: 'checked-out' as const })),
    ...paidGuests.map(g => ({ ...g, statusType: 'paid' as const })),
    ...activeBookings.map(g => ({ ...g, statusType: 'active' as const })),
  ];

  const allFilteredGuests = allGuests
    .filter(guest => {
      const matchesSearch = 
        guest.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.roomId.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || guest.statusType === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by latest action (updatedAt or createdAt), most recent first
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(allFilteredGuests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedGuests = allFilteredGuests.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (status: typeof statusFilter) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleGuestClick = (guest: GuestWithBooking) => {
    setSelectedGuest(guest);
    setSelectedTransactionIds([]);
    setIsDialogOpen(true);
  };

  const pendingTransactions = transactions.filter(t => t.status === "pending");
  const completedTransactions = transactions.filter(t => t.status === "completed");
  const voidedTransactions = transactions.filter(t => t.status === "voided");

  const selectedPendingTotal = pendingTransactions
    .filter(t => selectedTransactionIds.includes(t.id))
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactionIds(prev => 
      prev.includes(id) 
        ? prev.filter(tid => tid !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactionIds.length === pendingTransactions.length) {
      setSelectedTransactionIds([]);
    } else {
      setSelectedTransactionIds(pendingTransactions.map(t => t.id));
    }
  };

  const handlePayment = async (method: "card" | "cash") => {
    if (selectedTransactionIds.length === 0) {
      toast.error("Please select transactions to pay");
      return;
    }

    try {
      for (const transactionId of selectedTransactionIds) {
        await payTransaction.mutateAsync({ transactionId, paymentMethod: method });
      }
      
      toast.success(`Payment of ₱${selectedPendingTotal.toFixed(2)} processed via ${method}`);
      setSelectedTransactionIds([]);
      setIsPaymentDialogOpen(false);
    } catch (error) {
      toast.error("Failed to process payment");
    }
  };

  const handleVoidClick = (transactionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVoidTransactionId(transactionId);
    setManagerCode("");
    setIsVoidDialogOpen(true);
  };

  const handleVoidConfirm = async () => {
    if (!voidTransactionId) return;

    // Manager can void directly, receptionist needs code
    if (!isManager && !verifyManagerCode(managerCode)) {
      toast.error("Invalid manager code");
      return;
    }

    try {
      await voidTransaction.mutateAsync(voidTransactionId);
      toast.success("Transaction voided successfully");
      setIsVoidDialogOpen(false);
      setVoidTransactionId(null);
      setManagerCode("");
    } catch (error) {
      toast.error("Failed to void transaction");
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase().trim();
    
    if (normalizedStatus === "checked-in" || normalizedStatus === "checked in") {
      return {
        label: "Checked In",
        className: "bg-green-100 text-green-700 border-green-200"
      };
    } else if (normalizedStatus === "checked-out" || normalizedStatus === "checked out") {
      return {
        label: "Checked Out",
        className: "bg-gray-100 text-gray-600 border-gray-200"
      };
    } else if (normalizedStatus === "paid") {
      return {
        label: "Paid",
        className: "bg-blue-100 text-blue-700 border-blue-200"
      };
    } else if (normalizedStatus === "active") {
      return {
        label: "Active",
        className: "bg-orange-100 text-orange-700 border-orange-200"
      };
    } else if (normalizedStatus === "pending") {
      return {
        label: "Pending",
        className: "bg-yellow-100 text-yellow-700 border-yellow-200"
      };
    } else if (normalizedStatus === "cancelled") {
      return {
        label: "Cancelled",
        className: "bg-red-100 text-red-700 border-red-200"
      };
    } else {
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        className: "bg-gray-100 text-gray-600 border-gray-200"
      };
    }
  };

  return (
    <MainLayout title="Guests" subtitle="View guest bookings and process payments">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeGuests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
              <BedDouble className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{checkedOutGuests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paidGuests.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBookings.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by guest name or room..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Status Filters */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Status</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilterChange("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "checked-in" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilterChange("checked-in")}
                  >
                    Checked In
                  </Button>
                  <Button
                    variant={statusFilter === "checked-out" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilterChange("checked-out")}
                  >
                    Checked Out
                  </Button>
                  <Button
                    variant={statusFilter === "paid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilterChange("paid")}
                  >
                    Paid
                  </Button>
                  <Button
                    variant={statusFilter === "active" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilterChange("active")}
                  >
                    Active
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Guests</CardTitle>
          </CardHeader>
          <CardContent>
            {(activeLoading || checkedOutLoading || paidLoading || activeBookingsLoading) ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : allFilteredGuests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No guests match your filters"
                  : "No guests found"}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Guest Name</TableHead>
                        <TableHead>Room</TableHead>
                        <TableHead>Check-In</TableHead>
                        <TableHead>Check-Out</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedGuests.map((guest) => {
                        const statusBadge = getStatusBadge(guest.status);
                        return (
                          <TableRow key={guest.bookingId}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">{guest.guestName}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <BedDouble className="w-3 h-3 text-muted-foreground" />
                                <span>{guest.roomId}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(guest.checkIn)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(guest.checkOut)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {guest.guestPhone || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary"
                                className={statusBadge.className}
                              >
                                {statusBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(guest.totalPrice)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGuestClick(guest)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, allFilteredGuests.length)} of {allFilteredGuests.length} guests
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Guest Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div>{selectedGuest?.guestName}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  Room {selectedGuest?.roomId} • {selectedGuest?.roomType}
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedGuest && (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Guest Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedGuest.guestEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedGuest.guestPhone || "No phone"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Check-in: {formatDate(selectedGuest.checkIn)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Check-out: {formatDate(selectedGuest.checkOut)}</span>
                </div>
              </div>

              {/* Add to Tab Button */}
              {selectedGuest.status !== "checked_out" && 
               selectedGuest.status !== "Checked Out" && 
               selectedGuest.status !== "paid" && (
                <Button 
                  className="w-full"
                  onClick={() => {
                    // Store guest info in sessionStorage to pre-select in POS
                    sessionStorage.setItem('selectedGuest', JSON.stringify({
                      guestId: selectedGuest.guestId,
                      guestName: selectedGuest.guestName,
                      roomId: selectedGuest.roomId,
                    }));
                    navigate('/pos');
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add Items to Guest Tab
                </Button>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold">{formatCurrency(selectedGuest.totalPrice)}</p>
                    <p className="text-xs text-muted-foreground">Room Charge</p>
                  </CardContent>
                </Card>
                <Card className={pendingCount > 0 ? "border-orange-200 bg-orange-50" : ""}>
                  <CardContent className="p-4 text-center">
                    <p className={`text-xl font-bold ${pendingCount > 0 ? "text-orange-600" : ""}`}>
                      {formatCurrency(pendingTotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending ({pendingCount})</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold text-primary">
                      {formatCurrency(selectedGuest.totalPrice + totalSpent)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Transactions */}
              {pendingTransactions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-orange-500" />
                      Pending Charges ({pendingCount})
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleSelectAll}>
                        {selectedTransactionIds.length === pendingTransactions.length ? "Deselect All" : "Select All"}
                      </Button>
                      {selectedTransactionIds.length > 0 && (
                        <Button size="sm" onClick={() => setIsPaymentDialogOpen(true)}>
                          Pay Selected ({formatCurrency(selectedPendingTotal)})
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {pendingTransactions.map((transaction) => (
                      <Card 
                        key={transaction.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedTransactionIds.includes(transaction.id) 
                            ? "border-primary bg-primary/5" 
                            : "hover:border-gray-300"
                        }`}
                        onClick={() => handleSelectTransaction(transaction.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                selectedTransactionIds.includes(transaction.id)
                                  ? "border-primary bg-primary"
                                  : "border-gray-300"
                              }`}>
                                {selectedTransactionIds.includes(transaction.id) && (
                                  <CheckCircle className="w-4 h-4 text-white" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-mono">{transaction.transaction_number}</p>
                                <p className="text-xs text-muted-foreground">{formatDateTime(transaction.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <p className="font-medium">{formatCurrency(transaction.total || 0)}</p>
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                                  Pending
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => handleVoidClick(transaction.id, e)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          {transaction.items && transaction.items.length > 0 && (
                            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                              {transaction.items.map((item, idx) => (
                                <span key={idx}>
                                  {item.product_name} x{item.quantity}
                                  {idx < transaction.items!.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Transactions */}
              {completedTransactions.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-green-500" />
                    Paid Transactions ({completedTransactions.length})
                  </h3>
                  
                  <div className="space-y-2">
                    {completedTransactions.map((transaction) => (
                      <Card key={transaction.id} className="bg-gray-50">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-mono">{transaction.transaction_number}</p>
                              <p className="text-xs text-muted-foreground">{formatDateTime(transaction.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(transaction.total || 0)}</p>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                {transaction.payment_method}
                              </Badge>
                            </div>
                          </div>
                          {transaction.items && transaction.items.length > 0 && (
                            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                              {transaction.items.map((item, idx) => (
                                <span key={idx}>
                                  {item.product_name} x{item.quantity}
                                  {idx < transaction.items!.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {transactionsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!transactionsLoading && transactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg">
                  No POS transactions found
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-center mb-6">
              <p className="text-3xl font-bold">{formatCurrency(selectedPendingTotal)}</p>
              <p className="text-sm text-muted-foreground">
                {selectedTransactionIds.length} transaction{selectedTransactionIds.length > 1 ? "s" : ""} selected
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="h-20 flex-col gap-2"
                onClick={() => handlePayment("card")}
                disabled={payTransaction.isPending}
              >
                {payTransaction.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <CreditCard className="w-6 h-6" />
                )}
                <span>Card</span>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="h-20 flex-col gap-2"
                onClick={() => handlePayment("cash")}
                disabled={payTransaction.isPending}
              >
                {payTransaction.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Banknote className="w-6 h-6" />
                )}
                <span>Cash</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Transaction Dialog */}
      <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="w-5 h-5" />
              Void Transaction
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {isManager 
                ? "Are you sure you want to void this transaction? This action cannot be undone."
                : "Enter manager code to void this transaction."
              }
            </p>

            {!isManager && (
              <div className="space-y-2">
                <Label htmlFor="managerCode">Manager Code</Label>
                <Input
                  id="managerCode"
                  type="password"
                  placeholder="Enter 4-digit code"
                  value={managerCode}
                  onChange={(e) => setManagerCode(e.target.value)}
                  maxLength={4}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsVoidDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleVoidConfirm}
              disabled={voidTransaction.isPending || (!isManager && managerCode.length !== 4)}
            >
              {voidTransaction.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Void Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Guests;
