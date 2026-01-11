import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Check } from "lucide-react";
import { useGuests, GuestFromBooking } from "@/hooks/usePOS";

interface GuestSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (guest: GuestFromBooking) => void;
  total: number;
}

export const GuestSelectionDialog = ({
  open,
  onOpenChange,
  onSelect,
  total,
}: GuestSelectionDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: guests, isLoading } = useGuests();

  const filteredGuests = guests?.filter((guest) => {
    const query = searchQuery.toLowerCase();
    return (
      guest.guestName.toLowerCase().includes(query) ||
      guest.guestEmail.toLowerCase().includes(query) ||
      guest.guestPhone.includes(query)
    );
  }) || [];

  const handleSelect = (guest: GuestFromBooking) => {
    onSelect(guest);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Select Guest - ₱{total.toFixed(2)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-gray-500 py-8 text-sm">Loading...</p>
            ) : filteredGuests.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">
                {guests?.length === 0
                  ? "No guests found. Guests are loaded from bookings."
                  : "No guests match your search."}
              </p>
            ) : (
              filteredGuests.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => handleSelect(guest)}
                  className="w-full p-4 rounded-sm bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-left flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black text-sm">
                      {guest.guestName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {guest.guestEmail} • {guest.guestPhone}
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-gray-400" />
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
