import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Search,
  Loader2,
  Package,
  Percent,
  User,
  Sun,
  Sunset,
  Cookie,
  Moon,
  Edit,
  PlusCircle,
  Send,
  BedDouble,
  ChevronRight,
  Shirt,
  Car,
  Dumbbell,
  Wifi,
  Bed,
  Clock,
  Baby,
  PawPrint,
  Printer,
  Waves,
  MapPin,
  Plane,
  SprayCan,
  Utensils,
  ConciergeBell
} from "lucide-react";
import { toast } from "sonner";
import { usePOSCategories, usePOSProducts, usePOSProductsIncludeArchived, useCreateTransaction, useCreateProduct, useUpdateProduct, useActiveGuestsForPOS, CartItem, ProductWithCategory, GuestFromBooking } from "@/hooks/usePOS";
import { DiscountDialog } from "@/components/pos/DiscountDialog";
import { ProductDialog, ProductFormData } from "@/components/pos/ProductDialog";
import { validateCartQuantity, validateCartTotal, validateProductAvailability, validateSearchQuery } from "@/utils/validations";
import { useAuth } from "@/contexts/AuthContext";

interface SelectedGuest {
  guestId: string;
  guestName: string;
  roomId: string;
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

type FoodType = "all" | "breakfast" | "lunch" | "snack" | "dinner";
type ServiceType = "all" | "laundry" | "spa" | "transport" | "room" | "other";

const foodTypeOptions: { value: FoodType; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Package },
  { value: "breakfast", label: "Breakfast", icon: Sun },
  { value: "lunch", label: "Lunch", icon: Sunset },
  { value: "snack", label: "Snack", icon: Cookie },
  { value: "dinner", label: "Dinner", icon: Moon },
];

const serviceTypeOptions: { value: ServiceType; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All", icon: Package },
  { value: "laundry", label: "Laundry", icon: Shirt },
  { value: "spa", label: "Spa & Wellness", icon: Sparkles },
  { value: "transport", label: "Transport", icon: Car },
  { value: "room", label: "Room Services", icon: Bed },
  { value: "other", label: "Other", icon: ConciergeBell },
];

// Get icon for product based on name
const getProductIcon = (productName: string): React.ElementType => {
  const name = productName.toLowerCase();
  if (name.includes("laundry") || name.includes("dry clean") || name.includes("iron")) return Shirt;
  if (name.includes("massage") || name.includes("spa") || name.includes("facial")) return Sparkles;
  if (name.includes("airport") || name.includes("car") || name.includes("tour")) return Car;
  if (name.includes("gym") || name.includes("fitness")) return Dumbbell;
  if (name.includes("wifi") || name.includes("internet")) return Wifi;
  if (name.includes("bed") || name.includes("checkout") || name.includes("checkin") || name.includes("upgrade")) return Bed;
  if (name.includes("baby") || name.includes("child")) return Baby;
  if (name.includes("pet")) return PawPrint;
  if (name.includes("print")) return Printer;
  if (name.includes("pool") || name.includes("towel")) return Waves;
  if (name.includes("minibar") || name.includes("bar")) return Wine;
  if (name.includes("coffee") || name.includes("cafe")) return Coffee;
  if (name.includes("food") || name.includes("meal") || name.includes("breakfast") || name.includes("lunch") || name.includes("dinner")) return Utensils;
  return ConciergeBell;
};

// Get service type for filtering
const getServiceType = (productName: string): ServiceType => {
  const name = productName.toLowerCase();
  if (name.includes("laundry") || name.includes("dry clean") || name.includes("iron")) return "laundry";
  if (name.includes("massage") || name.includes("spa") || name.includes("facial") || name.includes("gym") || name.includes("pool")) return "spa";
  if (name.includes("airport") || name.includes("car") || name.includes("tour") || name.includes("transfer")) return "transport";
  if (name.includes("bed") || name.includes("checkout") || name.includes("checkin") || name.includes("upgrade") || name.includes("minibar")) return "room";
  return "other";
};

const POS = () => {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeFoodType, setActiveFoodType] = useState<FoodType>("all");
  const [activeServiceType, setActiveServiceType] = useState<ServiceType>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<SelectedGuest | null>(null);

  const { data: categories, isLoading: categoriesLoading } = usePOSCategories();
  const { data: products, isLoading: productsLoading } = usePOSProducts();
  const { data: allProducts, isLoading: allProductsLoading } = usePOSProductsIncludeArchived();
  const { data: activeGuests = [], isLoading: guestsLoading } = useActiveGuestsForPOS();
  const createTransaction = useCreateTransaction();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  // Check for pre-selected guest from Guests page
  useEffect(() => {
    const savedGuest = sessionStorage.getItem('selectedGuest');
    if (savedGuest) {
      try {
        const guest = JSON.parse(savedGuest);
        setSelectedGuest(guest);
        sessionStorage.removeItem('selectedGuest'); // Clear after loading
        toast.success(`Selected: ${guest.guestName} (Room ${guest.roomId})`);
      } catch (error) {
        console.error('Failed to parse saved guest:', error);
      }
    }
  }, []);

  // Set default category when data loads
  useMemo(() => {
    if (categories?.length && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  // Check if current category is Foods
  const isFoodsCategory = useMemo(() => {
    const currentCategory = categories?.find(c => c.id === activeCategory);
    return currentCategory?.name.toLowerCase() === "foods";
  }, [categories, activeCategory]);

  // Check if current category is Services
  const isServicesCategory = useMemo(() => {
    const currentCategory = categories?.find(c => c.id === activeCategory);
    return currentCategory?.name.toLowerCase() === "services";
  }, [categories, activeCategory]);

  // Check if there are archived services
  const hasArchivedServices = useMemo(() => {
    return allProducts?.some(p => p.category_id === "services" && !p.is_available) || false;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    const searchValidation = validateSearchQuery(searchQuery);
    if (!searchValidation.isValid) {
      return products || [];
    }
    
    // When showing archived, only show archived products. Otherwise, only show active products.
    const productsToFilter = showArchived && isManager 
      ? allProducts?.filter(p => !p.is_available) 
      : products?.filter(p => p.is_available);
    
    return productsToFilter?.filter(
      (p) => {
        const matchesCategory = !activeCategory || p.category_id === activeCategory;
        const matchesFoodType = !isFoodsCategory || activeFoodType === "all" || p.foodType === activeFoodType;
        const matchesServiceType = !isServicesCategory || activeServiceType === "all" || getServiceType(p.name) === activeServiceType;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesFoodType && matchesServiceType && matchesSearch;
      }
    ) || [];
  }, [products, allProducts, activeCategory, activeFoodType, activeServiceType, searchQuery, isFoodsCategory, isServicesCategory, showArchived, isManager]);

  const addToCart = (product: ProductWithCategory) => {
    // Prevent adding archived products to cart
    if (!product.is_available) {
      toast.error("This service is archived and cannot be added to cart");
      return;
    }

    const availabilityValidation = validateProductAvailability(product.is_available);
    if (!availabilityValidation.isValid) {
      toast.error(availabilityValidation.message || "Product not available");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const newQuantity = existing ? existing.quantity + 1 : 1;
      
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

  const handleGuestSelect = (guest: GuestFromBooking) => {
    setSelectedGuest({ 
      guestId: guest.guestId, 
      guestName: guest.guestName,
      roomId: guest.roomId 
    });
    toast.success(`Selected: ${guest.guestName} (Room ${guest.roomId})`);
  };

  // Add to guest's tab (pending transaction)
  const handleAddToTab = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    const totalValidation = validateCartTotal(total);
    if (!totalValidation.isValid) {
      toast.error(totalValidation.message || "Invalid cart total");
      return;
    }

    if (!selectedGuest) {
      toast.error("Please select a guest first");
      return;
    }

    try {
      await createTransaction.mutateAsync({
        transaction: {
          subtotal: discountedSubtotal,
          tax,
          total,
          payment_method: "pending",
          status: "pending",
          guest_id: selectedGuest.guestId,
          guest_name: selectedGuest.guestName,
        },
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      });

      toast.success(`₱${total.toFixed(2)} added to ${selectedGuest.guestName}'s tab`);
      setCart([]);
      setAppliedDiscount(null);
    } catch (error) {
      toast.error("Failed to add to tab. Please try again.");
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product: ProductWithCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = async (data: ProductFormData) => {
    try {
      if (data.id) {
        await updateProduct.mutateAsync({
          id: data.id,
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: data.category_id,
          is_available: data.is_available,
          serviceType: data.serviceType,
        });
        toast.success("Service updated successfully");
        
        // If we just unarchived a service while viewing archived, switch back to active view
        if (showArchived && data.is_available) {
          setShowArchived(false);
        }
      } else {
        await createProduct.mutateAsync({
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: data.category_id,
          is_available: data.is_available,
          serviceType: data.serviceType,
        });
        toast.success("Service added successfully");
      }
    } catch (error) {
      toast.error("Failed to save service");
    }
  };

  const isLoading = categoriesLoading || productsLoading;

  return (
    <MainLayout 
      title="Point of Sale" 
      subtitle="Add items to guest tabs"
    >
      {/* Guest Selection Bar */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-fit">
              <User className="w-4 h-4" />
              Select Guest:
            </div>
            {guestsLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : activeGuests.length === 0 ? (
              <span className="text-sm text-muted-foreground">No active guests</span>
            ) : (
              <div className="flex-1 flex items-center gap-3">
                <select
                  value={selectedGuest?.guestId || ""}
                  onChange={(e) => {
                    const guest = activeGuests.find(g => g.guestId === e.target.value);
                    if (guest) handleGuestSelect(guest);
                  }}
                  className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                >
                  <option value="">-- Select a guest --</option>
                  {activeGuests.map((guest) => (
                    <option key={guest.guestId} value={guest.guestId}>
                      {guest.guestName} - Room {guest.roomId}
                    </option>
                  ))}
                </select>
                {selectedGuest && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-md">
                    <BedDouble className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                      Room {selectedGuest.roomId}
                    </span>
                  </div>
                )}
              </div>
            )}
            {selectedGuest && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/guests")}
                className="ml-auto whitespace-nowrap"
              >
                View Guest Tab
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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

          {/* Food Type Filter - Only show for Foods category */}
          {isFoodsCategory && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {foodTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={activeFoodType === option.value ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2 whitespace-nowrap"
                    onClick={() => setActiveFoodType(option.value)}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Service Type Filter - Only show for Services category */}
          {isServicesCategory && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {serviceTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.value}
                    variant={activeServiceType === option.value ? "default" : "outline"}
                    size="sm"
                    className="flex items-center gap-2 whitespace-nowrap"
                    onClick={() => setActiveServiceType(option.value)}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Search and Add Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {isServicesCategory && isManager && (
              <>
                <Button onClick={handleAddProduct} className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Add Service
                </Button>
                {hasArchivedServices && (
                  <Button 
                    variant={showArchived ? "default" : "outline"}
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2"
                  >
                    {showArchived ? "Show Active Services" : "Show Archived Services"}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {productsLoading || allProductsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500 text-sm">
                {showArchived ? (
                  <div className="space-y-2">
                    <p>No archived services found</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowArchived(false)}
                    >
                      View Active Services
                    </Button>
                  </div>
                ) : products?.length === 0 ? (
                  "No products available. Add products to the database to get started."
                ) : (
                  "No products match your search."
                )}
              </div>
            ) : (
              <>
                {showArchived && (
                  <div className="col-span-full bg-orange-50 border border-orange-200 rounded-md p-3 text-sm text-orange-700">
                    Viewing {filteredProducts.length} archived service{filteredProducts.length !== 1 ? 's' : ''}. 
                    <Button 
                      variant="link" 
                      className="text-orange-700 underline p-0 h-auto ml-1"
                      onClick={() => setShowArchived(false)}
                    >
                      Switch to active services
                    </Button>
                  </div>
                )}
                {filteredProducts.map((product) => {
                const ProductIcon = getProductIcon(product.name);
                return (
                  <Card
                    key={product.id}
                    className={`transition-colors duration-200 relative group ${
                      !product.is_available 
                        ? "opacity-60 bg-gray-50 cursor-not-allowed" 
                        : "cursor-pointer hover:border-gray-400"
                    }`}
                    onClick={() => product.is_available && addToCart(product)}
                  >
                    {!product.is_available && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg pointer-events-none">
                        <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
                          Archived
                        </span>
                      </div>
                    )}
                    {isServicesCategory && isManager && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white z-10"
                        onClick={(e) => handleEditProduct(product, e)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                    <CardContent className="p-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-sm mb-2 flex items-center justify-center mx-auto">
                        <ProductIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <h3 className="font-medium text-xs text-black text-center line-clamp-2">{product.name}</h3>
                      <p className="text-sm font-medium text-black mt-1 text-center">
                        ₱{Number(product.price).toFixed(0)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
              </>
            )}
          </div>
        </div>

        {/* Cart Section */}
        <Card className="h-fit sticky top-24">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="w-4 h-4" />
              Current Order
              {selectedGuest && (
                <span className="ml-auto text-sm font-normal text-primary">
                  {selectedGuest.guestName}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Selected Guest Info */}
            {selectedGuest && (
              <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedGuest.guestName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <BedDouble className="w-3 h-3" />
                      Room {selectedGuest.roomId}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!selectedGuest && cart.length > 0 && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-sm">
                <p className="text-sm text-orange-700 font-medium">
                  Please select a guest above to add items to their tab
                </p>
              </div>
            )}

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

            {/* Add to Tab Button */}
            <Button
              className="w-full mt-6"
              onClick={handleAddToTab}
              disabled={createTransaction.isPending || cart.length === 0 || !selectedGuest}
            >
              {createTransaction.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Add to Guest Tab
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
          </CardContent>
        </Card>
      </div>

      <DiscountDialog
        open={isDiscountDialogOpen}
        onOpenChange={setIsDiscountDialogOpen}
        subtotal={subtotal}
        onApplyDiscount={handleApplyDiscount}
      />

      <ProductDialog
        open={isProductDialogOpen}
        onOpenChange={setIsProductDialogOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
        isLoading={createProduct.isPending || updateProduct.isPending}
      />
    </MainLayout>
  );
};

export default POS;
