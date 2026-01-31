import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  const [selectedGuest, setSelectedGuest] = useState<GuestWithBooking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [voidTransactionId, setVoidTransactionId] = useState<string | null>(null);
  const [managerCode, setManagerCode] = useState("");
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);

  const { data: activeGuests = [], isLoading: activeLoading } = useActiveGuests();
  const { data: checkedOutGuests = [], isLoading: checkedOutLoading } = useCheckedOutGuests();
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

  const GuestCard = ({ guest, isActive }: { guest: GuestWithBooking; isActive: boolean }) => (
    <Card 
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => handleGuestClick(guest)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{guest.guestName}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <BedDouble className="w-3 h-3" />
                <span>Room {guest.roomId}</span>
              </div>
            </div>
          </div>
          <Badge 
            variant="secondary"
            className={isActive 
              ? "bg-green-100 text-green-700 border-green-200" 
              : "bg-gray-100 text-gray-600 border-gray-200"
            }
          >
            {isActive ? "Active" : "Checked Out"}
          </Badge>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(guest.checkIn)} - {formatDate(guest.checkOut)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3" />
            <span>{guest.guestPhone || "No phone"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout title="Guests" subtitle="View guest bookings and process payments">
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by guest name or room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Bookings - Left Side */}
        <div>
          <Card className="glass-card">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Active Bookings
                <Badge variant="secondary" className="ml-auto">
                  {filteredActiveGuests.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {activeLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredActiveGuests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {searchQuery ? "No active guests match your search" : "No active bookings"}
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredActiveGuests.map((guest) => (
                    <GuestCard key={guest.bookingId} guest={guest} isActive={true} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Checked Out Guests - Right Side */}
        <div>
          <Card className="glass-card">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                Checked Out
                <Badge variant="secondary" className="ml-auto">
                  {filteredCheckedOutGuests.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {checkedOutLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCheckedOutGuests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {searchQuery ? "No checked out guests match your search" : "No checked out guests"}
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredCheckedOutGuests.map((guest) => (
                    <GuestCard key={guest.bookingId} guest={guest} isActive={false} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
                    <p className="text-xl font-bold">₱{selectedGuest.totalPrice.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Room Charge</p>
                  </CardContent>
                </Card>
                <Card className={pendingCount > 0 ? "border-orange-200 bg-orange-50" : ""}>
                  <CardContent className="p-4 text-center">
                    <p className={`text-xl font-bold ${pendingCount > 0 ? "text-orange-600" : ""}`}>
                      ₱{pendingTotal.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending ({pendingCount})</p>
                  </CardContent>
                </Card>
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-xl font-bold text-primary">
                      ₱{(selectedGuest.totalPrice + totalSpent).toLocaleString()}
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
                          Pay Selected (₱{selectedPendingTotal.toFixed(2)})
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
                                <p className="font-medium">₱{transaction.total?.toFixed(2)}</p>
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
                              <p className="font-medium">₱{transaction.total?.toFixed(2)}</p>
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
              <p className="text-3xl font-bold">₱{selectedPendingTotal.toFixed(2)}</p>
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
