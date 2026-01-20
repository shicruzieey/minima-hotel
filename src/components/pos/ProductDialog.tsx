import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { ProductWithCategory } from "@/hooks/usePOS";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductWithCategory | null;
  onSave: (data: ProductFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  is_available: boolean;
  serviceType?: string;
}

const SERVICE_TYPES = [
  { value: "laundry", label: "Laundry" },
  { value: "spa", label: "Spa & Wellness" },
  { value: "transport", label: "Transport" },
  { value: "room", label: "Room Services" },
  { value: "other", label: "Other" },
];

export const ProductDialog = ({
  open,
  onOpenChange,
  product,
  onSave,
  isLoading,
}: ProductDialogProps) => {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    category_id: "services",
    is_available: true,
    serviceType: "other",
  });

  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        description: product.description || "",
        price: product.price,
        category_id: "services",
        is_available: product.is_available,
        serviceType: product.serviceType || "other",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        category_id: "services",
        is_available: true,
        serviceType: "other",
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    if (formData.price < 0) return;
    if (!formData.category_id) return;

    await onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Service" : "Add New Service"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Service name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Service description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₱) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Service Type *</Label>
            <select
              id="serviceType"
              value={formData.serviceType || "other"}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              value="Services"
              disabled
              className="bg-gray-100"
            />
            <input type="hidden" value="services" />
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div>
              <Label htmlFor="available" className="text-sm font-medium">Available for sale</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.is_available 
                  ? "✓ Service is visible in POS" 
                  : "✗ Service is archived (hidden from POS)"}
              </p>
            </div>
            <Switch
              id="available"
              checked={formData.is_available}
              onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {isEditing ? "Save Changes" : "Add Service"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
