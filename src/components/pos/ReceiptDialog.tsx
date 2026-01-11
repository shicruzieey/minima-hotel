import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Download } from "lucide-react";
import { CartItem } from "@/hooks/usePOS";

interface ReceiptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  transactionNumber: string;
  guestName?: string;
}

export const ReceiptDialog = ({
  open,
  onOpenChange,
  items,
  subtotal,
  tax,
  total,
  paymentMethod,
  transactionNumber,
  guestName,
}: ReceiptProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${transactionNumber}</title>
              <style>
                body { font-family: monospace; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .line { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      const content = receiptRef.current.innerText;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${transactionNumber}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Receipt</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Receipt Content */}
          <div ref={receiptRef} className="bg-white p-6 rounded-sm border text-sm">
            {/* Header */}
            <div className="header">
              <h2 className="text-lg font-bold">MINIMA HOTEL</h2>
              <p className="text-xs">Hotel Management System</p>
              <p className="text-xs">Receipt</p>
            </div>

            {/* Transaction Info */}
            <div className="space-y-1 mt-4">
              <div className="line">
                <span>Transaction #:</span>
                <span>{transactionNumber}</span>
              </div>
              <div className="line">
                <span>Date:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="line">
                <span>Payment:</span>
                <span>{paymentMethod}</span>
              </div>
              {guestName && (
                <div className="line">
                  <span>Guest:</span>
                  <span>{guestName}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="mt-4">
              <div className="border-b pb-2 mb-2">
                <div className="line font-bold">
                  <span>ITEMS</span>
                  <span>TOTAL</span>
                </div>
              </div>
              {items.map((item, index) => (
                <div key={index} className="line">
                  <span>{item.name} x{item.quantity}</span>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="total">
              <div className="line">
                <span>Subtotal:</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="line">
                <span>Tax (10%):</span>
                <span>₱{tax.toFixed(2)}</span>
              </div>
              <div className="line font-bold">
                <span>TOTAL:</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              <p>Thank you for your business!</p>
              <p>Visit us again soon</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
