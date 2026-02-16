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
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X } from "lucide-react";
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
  price: number | string;
  category_id: string;
  is_available: boolean;
  serviceType?: string;
  imageUrl?: string | null;
  imageFile?: File | null;
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
    price: 0,
    category_id: "services",
    is_available: true,
    serviceType: "other",
    imageUrl: null,
    imageFile: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        name: product.name,
        price: Math.round(product.price), // Convert to whole number
        category_id: "services",
        is_available: product.is_available,
        serviceType: product.serviceType || "other",
        imageUrl: product.imageUrl || null,
        imageFile: null,
      });
      setImagePreview(product.imageUrl || null);
    } else {
      setFormData({
        name: "",
        price: 0,
        category_id: "services",
        is_available: true,
        serviceType: "other",
        imageUrl: null,
        imageFile: null,
      });
      setImagePreview(null);
    }
  }, [product, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setFormData({ ...formData, imageFile: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageFile: null, imageUrl: null });
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    const priceValue = typeof formData.price === 'string' ? parseInt(formData.price) || 0 : formData.price;
    if (priceValue < 0) return;
    if (!formData.category_id) return;

    await onSave({
      ...formData,
      price: priceValue,
    });
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
            <Label htmlFor="image">Service Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-40 border rounded-lg overflow-hidden bg-gray-50">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload image</span>
                  <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                </label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₱) *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="1"
              value={formData.price}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers (and empty string for backspace)
                if (value === '' || /^\d+$/.test(value)) {
                  setFormData({ ...formData, price: value });
                }
              }}
              onKeyDown={(e) => {
                // Prevent non-numeric keys except backspace, delete, arrow keys, tab
                if (
                  !/^\d$/.test(e.key) && 
                  e.key !== 'Backspace' && 
                  e.key !== 'Delete' && 
                  e.key !== 'ArrowLeft' && 
                  e.key !== 'ArrowRight' &&
                  e.key !== 'Tab'
                ) {
                  e.preventDefault();
                }
              }}
              placeholder="0"
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
