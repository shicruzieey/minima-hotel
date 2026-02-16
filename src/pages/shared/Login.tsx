import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Mail, Lock, Eye, EyeOff, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth, UserRole } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("receptionist");
  const { login, isAuthenticated, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      const redirectPath = user.role === "manager" ? "/manager/dashboard" : "/receptionist/pos";
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email, password, selectedRole);
      
      if (success) {
        toast.success("Login successful");
        // Navigate based on role
        if (selectedRole === "manager") {
          navigate("/manager/dashboard");
        } else {
          navigate("/receptionist/pos");
        }
      } else {
        toast.error("Invalid credentials or access denied");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Show specific error messages
      if (error?.message === "ACCOUNT_INACTIVE") {
        toast.error("Your account is inactive. Please contact administrator.");
      } else if (error?.message === "ROLE_MISMATCH") {
        toast.error("You don't have permission to login as " + selectedRole);
      } else if (error?.message?.includes("Index not defined")) {
        toast.error("Database configuration error. Please contact administrator.");
      } else if (error?.code === "auth/user-not-found") {
        toast.error("No account found with this email");
      } else if (error?.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (error?.code === "auth/invalid-email") {
        toast.error("Invalid email format");
      } else if (error?.code === "auth/too-many-requests") {
        toast.error("Too many failed attempts. Please try again later.");
      } else {
        toast.error("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-whitesmoke flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-lg overflow-hidden">
            <img 
              src="/logo.jpg" 
              alt="Minima Hotel Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-heading">Minima Hotel</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Management System</p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="receptionist" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Receptionist
              </TabsTrigger>
              <TabsTrigger value="manager" className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Manager
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                `Sign In as ${selectedRole === "manager" ? "Manager" : "Receptionist"}`
              )}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
