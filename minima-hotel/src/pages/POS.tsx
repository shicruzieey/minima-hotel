import { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Coffee, 
  UtensilsCrossed, 
  Wine, 
  Sparkles, 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Search,
  Loader2,
  Package,
  Percent,
  Receipt,
  RotateCcw,
  User,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { usePOSCategories, usePOSProducts, useCreateTransaction, CartItem, ProductWithCategory } from "@/hooks/usePOS";
import { GuestSelectionDialog } from "@/components/pos/GuestSelectionDialog";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";
import { DiscountDialog } from "@/components/pos/DiscountDialog";
import { RefundDialog } from "@/components/pos/RefundDialog";
import { validateCartQuantity, validateCartTotal, validatePaymentMethod, validateRoomCharge, validateProductAvailability, validateSearchQuery, validateGuestAssignment } from "@/utils/validations";
import { Database } from "@/integrations/supabase/types";

type Guest = Database["public"]["Tables"]["guests"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];

interface BookingWithDetails extends Booking {
  guest?: Guest;
  room?: Room;
}

interface Discount {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  description: string;
  minAmount?: number;
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ElementType> = {
  restaurant: UtensilsCrossed,
  bar: Wine,
  cafe: Coffee,
  spa: Sparkles,
  default: Package,
};

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes("restaurant") || name.includes("food")) return categoryIcons.restaurant;
  if (name.includes("bar") || name.includes("drink") || name.includes("lounge")) return categoryIcons.bar;
  if (name.includes("cafe") || name.includes("coffee")) return categoryIcons.cafe;
  if (name.includes("spa") || name.includes("wellness")) return categoryIcons.spa;
  return categoryIcons.default;
};

const POS = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [lastTransactionNumber, setLastTransactionNumber] = useState<string>("");
  const [lastTransactionDetails, setLastTransactionDetails] = useState<any>(null);
  const [selectedGuest, setSelectedGuest] = useState<BookingWithDetails | null>(null);

  const { data: categories, isLoading: categoriesLoading } = usePOSCategories();
  const { data: products, isLoading: productsLoading } = usePOSProducts();
  const createTransaction = useCreateTransaction();

  // Set default category when data loads
  useMemo(() => {
    if (categories?.length && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const filteredProducts = useMemo(() => {
    // Validate search query
    const searchValidation = validateSearchQuery(searchQuery);
    if (!searchValidation.isValid) {
      toast.error(searchValidation.message || "Invalid search query");
      return products || [];
    }
    
    return products?.filter(
      (p) =>
        (!activeCategory || p.category_id === activeCategory) &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [products, activeCategory, searchQuery]);

  const addToCart = (product: ProductWithCategory) => {
    // Validate product availability
    const availabilityValidation = validateProductAvailability(product.is_available);
    if (!availabilityValidation.isValid) {
      toast.error(availabilityValidation.message || "Product not available");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const newQuantity = existing ? existing.quantity + 1 : 1;
      
      // Validate quantity
      const quantityValidation = validateCartQuantity(newQuantity);
      if (!quantityValidation.isValid) {
        toast.error(quantityValidation.message || "Invalid quantity");
        return prev;
      }
      
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((item) => item.id === id);
      if (!item) return prev;
      
      const newQty = item.quantity + delta;
      
      // Validate quantity
      const quantityValidation = validateCartQuantity(newQty);
      if (!quantityValidation.isValid && newQty > 0) {
        toast.error(quantityValidation.message || "Invalid quantity");
        return prev;
      }
      
      return prev
        .map((item) => {
          if (item.id === id) {
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === "percentage"
      ? subtotal * (appliedDiscount.value / 100)
      : appliedDiscount.value
    : 0;
  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * 0.1;
  const total = discountedSubtotal + tax;

  const handleApplyDiscount = (discount: Discount) => {
    setAppliedDiscount(discount);
    toast.success(`Discount applied: ${discount.code}`);
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    toast.info("Discount removed");
  };

  const handleCheckout = async (method: string, booking?: BookingWithDetails) => {
    // Validate cart is not empty
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Validate cart total
    const totalValidation = validateCartTotal(total);
    if (!totalValidation.isValid) {
      toast.error(totalValidation.message || "Invalid cart total");
      return;
    }

    // Validate payment method
    const paymentValidation = validatePaymentMethod(method);
    if (!paymentValidation.isValid) {
      toast.error(paymentValidation.message || "Invalid payment method");
      return;
    }

    // NEW VALIDATION: Require customer/room assignment for all payments
    if (!booking || !booking.guest || !booking.room) {
      toast.error("Payment must be assigned to a customer and room. Please select a guest first.");
      setIsGuestDialogOpen(true);
      return;
    }

    // Use the new guest assignment validation
    const guestValidation = validateGuestAssignment(booking.guest, booking.room);
    if (!guestValidation.isValid) {
      toast.error(guestValidation.message || "Invalid guest assignment");
      return;
    }

    // Validate room charge if applicable
    if (method.toLowerCase() === "room charge") {
      const roomChargeValidation = validateRoomCharge(booking?.guest?.id, booking?.id);
      if (!roomChargeValidation.isValid) {
        toast.error(roomChargeValidation.message || "Guest information required for room charge");
        return;
      }
    }

    try {
      const transactionNumber = `TX${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
      
      await createTransaction.mutateAsync({
        transaction: {
          subtotal: discountedSubtotal,
          tax,
          total,
          payment_method: method.toLowerCase(),
          status: "completed",
          guest_id: booking?.guest?.id || null,
          booking_id: booking?.id || null,
        },
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      });

      setLastTransactionNumber(transactionNumber);
      setLastTransactionDetails({
        items: cart,
        subtotal: discountedSubtotal,
        tax,
        total,
        paymentMethod: method,
        guest: booking?.guest,
        room: booking?.room,
        booking,
      });

      const guestInfo = booking 
        ? ` for ${booking.guest?.first_name} ${booking.guest?.last_name} (Room ${booking.room?.room_number})`
        : "";

      toast.success(`Payment of ₱${total.toFixed(2)} processed via ${method}${guestInfo}`);
      setCart([]);
      setAppliedDiscount(null);
      setIsReceiptDialogOpen(true);
    } catch (error) {
      toast.error("Failed to process transaction. Please try again.");
    }
  };

  const handleRoomCharge = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setIsGuestDialogOpen(true);
  };

  const handleGuestSelect = (booking: BookingWithDetails) => {
    setSelectedGuest(booking);
    toast.success(`Guest selected: ${booking.guest?.first_name} ${booking.guest?.last_name} (Room ${booking.room?.room_number})`);
  };

  const handlePaymentWithGuest = (method: string) => {
    if (!selectedGuest) {
      setIsGuestDialogOpen(true);
      return;
    }
    handleCheckout(method, selectedGuest);
  };

  const isLoading = categoriesLoading || productsLoading;

  return (
    <MainLayout 
      title="Point of Sale" 
      subtitle="Process guest transactions"
      actionButton={
        <Button
          variant="outline"
          onClick={() => setIsRefundDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Process Refund
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            ) : categories?.length === 0 ? (
              <p className="text-gray-500 text-sm">No categories available</p>
            ) : (
              categories?.map((cat) => {
                const Icon = getCategoryIcon(cat.name);
                return (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "secondary"}
                    size="sm"
                    className="flex items-center gap-2 whitespace-nowrap"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.name}
                  </Button>
                );
              })
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {productsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 text-sm">
                {products?.length === 0
                  ? "No products available. Add products to the database to get started."
                  : "No products match your search."}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:border-gray-400 transition-colors duration-200"
                  onClick={() => addToCart(product)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-sm mb-3 flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-gray-300" />
                    </div>
                    <h3 className="font-medium text-sm text-black">{product.name}</h3>
                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                        {product.description}
                      </p>
                    )}
                    <p className="text-base font-medium text-black mt-2">
                      ₱{Number(product.price).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Cart Section */}
        <Card className="h-fit sticky top-24">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="w-4 h-4" />
              Current Order
              {cart.length > 0 && (
                <span className="ml-auto text-sm font-normal text-gray-500">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Cart Items */}
            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">
                  Cart is empty
                </p>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-100 rounded-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-black text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₱{item.price.toFixed(2)} × {item.quantity} = ₱{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center font-medium text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-500 hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount Section */}
            {appliedDiscount && (
              <div className="bg-green-50 border border-green-200 rounded-sm p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {appliedDiscount.code}
                      </p>
                      <p className="text-xs text-green-600">
                        {appliedDiscount.type === "percentage" ? `${appliedDiscount.value}% off` : `₱${appliedDiscount.value} off`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveDiscount}
                    className="text-green-600 hover:text-green-800"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}

            {/* Guest Selection Status */}
            {cart.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-sm">
                {selectedGuest ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-blue-800">
                          {selectedGuest.guest?.first_name} {selectedGuest.guest?.last_name}
                        </p>
                        <p className="text-xs text-blue-600">
                          Room {selectedGuest.room?.room_number}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedGuest(null)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Guest selection required for payment</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsGuestDialogOpen(true)}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Select Guest
                    </Button>
                  </div>
                )}
              </div>
            )}
            {!appliedDiscount && cart.length > 0 && (
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={() => setIsDiscountDialogOpen(true)}
              >
                <Percent className="w-4 h-4 mr-2" />
                Apply Discount
              </Button>
            )}

            {/* Totals */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">₱{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedDiscount?.code})</span>
                  <span>-₱{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (10%)</span>
                <span className="font-medium">₱{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-medium pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-6">
              <Button
                onClick={() => handlePaymentWithGuest("Card")}
                disabled={createTransaction.isPending || cart.length === 0}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Card
              </Button>
              <Button
                variant="secondary"
                onClick={() => handlePaymentWithGuest("Cash")}
                disabled={createTransaction.isPending || cart.length === 0}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Cash
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => handlePaymentWithGuest("Room Charge")}
              disabled={createTransaction.isPending || cart.length === 0}
            >
              {createTransaction.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Charge to Room
            </Button>

            {/* Clear Cart */}
            {cart.length > 0 && (
              <Button
                variant="ghost"
                className="w-full mt-2 text-gray-500 hover:text-destructive"
                onClick={() => setCart([])}
              >
                Clear Cart
              </Button>
            )}

            {/* Receipt Button */}
            {lastTransactionNumber && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setIsReceiptDialogOpen(true)}
              >
                <Receipt className="w-4 h-4 mr-2" />
                View Last Receipt
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <GuestSelectionDialog
        open={isGuestDialogOpen}
        onOpenChange={setIsGuestDialogOpen}
        onSelect={handleGuestSelect}
        total={total}
      />

      <ReceiptDialog
        open={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
        items={lastTransactionDetails?.items || []}
        subtotal={lastTransactionDetails?.subtotal || 0}
        tax={lastTransactionDetails?.tax || 0}
        total={lastTransactionDetails?.total || 0}
        paymentMethod={lastTransactionDetails?.paymentMethod || ""}
        transactionNumber={lastTransactionNumber}
        guest={lastTransactionDetails?.guest}
        room={lastTransactionDetails?.room}
        booking={lastTransactionDetails?.booking}
      />

      <DiscountDialog
        open={isDiscountDialogOpen}
        onOpenChange={setIsDiscountDialogOpen}
        subtotal={subtotal}
        onApplyDiscount={handleApplyDiscount}
      />

      <RefundDialog
        open={isRefundDialogOpen}
        onOpenChange={setIsRefundDialogOpen}
      />
    </MainLayout>
  );
};

export default POS;
