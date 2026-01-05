import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, BedDouble, Check } from "lucide-react";
import { useActiveBookings } from "@/hooks/usePOS";
import { Database } from "@/integrations/supabase/types";

type Guest = Database["public"]["Tables"]["guests"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Booking = Database["public"]["Tables"]["bookings"]["Row"];

interface BookingWithDetails extends Booking {
  guest?: Guest;
  room?: Room;
}

interface GuestSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (booking: BookingWithDetails) => void;
  total: number;
}

export const GuestSelectionDialog = ({
  open,
  onOpenChange,
  onSelect,
  total,
}: GuestSelectionDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: bookings, isLoading } = useActiveBookings();

  const filteredBookings = bookings?.filter((booking) => {
    const guestName = `${booking.guest?.first_name || ""} ${booking.guest?.last_name || ""}`.toLowerCase();
    const roomNumber = booking.room?.room_number?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return guestName.includes(query) || roomNumber.includes(query);
  }) || [];

  const handleSelect = (booking: BookingWithDetails) => {
    onSelect(booking);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Charge to Room - ₱{total.toFixed(2)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by guest name or room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-gray-500 py-8 text-sm">Loading...</p>
            ) : filteredBookings.length === 0 ? (
              <p className="text-center text-gray-500 py-8 text-sm">
                {bookings?.length === 0
                  ? "No active bookings found. Create a booking first."
                  : "No guests match your search."}
              </p>
            ) : (
              filteredBookings.map((booking) => (
                <button
                  key={booking.id}
                  onClick={() => handleSelect(booking)}
                  className="w-full p-4 rounded-sm bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-left flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-black text-sm">
                      {booking.guest?.first_name} {booking.guest?.last_name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-3 h-3" />
                        Room {booking.room?.room_number}
                      </span>
                      <span className="capitalize">{booking.status.replace("_", " ")}</span>
                    </div>
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
