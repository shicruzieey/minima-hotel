import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/shared/Login";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerInventory from "./pages/manager/Inventory";
import ReceptionistPOS from "./pages/receptionist/POS";
import ReceptionistGuests from "./pages/receptionist/Guests";
import TransactionHistory from "./pages/shared/TransactionHistory";
import NotFound from "./pages/shared/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Manager Routes */}
            <Route path="/manager/dashboard" element={<ProtectedRoute requiredRole="manager"><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/manager/inventory" element={<ProtectedRoute requiredRole="manager"><ManagerInventory /></ProtectedRoute>} />
            <Route path="/manager/transactions" element={<ProtectedRoute requiredRole="manager"><TransactionHistory /></ProtectedRoute>} />
            
            {/* Receptionist Routes */}
            <Route path="/receptionist/pos" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistPOS /></ProtectedRoute>} />
            <Route path="/receptionist/guests" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistGuests /></ProtectedRoute>} />
            <Route path="/receptionist/transactions" element={<ProtectedRoute requiredRole="receptionist"><TransactionHistory /></ProtectedRoute>} />
            
            {/* Legacy Routes - Redirect to role-specific routes */}
            <Route path="/pos" element={<ProtectedRoute><ReceptionistPOS /></ProtectedRoute>} />
            <Route path="/guests" element={<ProtectedRoute><ReceptionistGuests /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><ManagerInventory /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
