import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, User, CheckCircle } from "lucide-react";

// RAG Agent URL - can be configured via environment variable
// Default to production URL, fallback to localhost for development
const RAG_AGENT_URL = import.meta.env.VITE_RAG_AGENT_URL || 
  (import.meta.env.PROD 
    ? "https://rag.aisteth.xyz"  // Production subdomain
    : "http://localhost:8501");  // Development localhost

// User credentials (matching the login_system.py)
const USERS = {
  "aistethxyz@gmail.com": {
    password: "bestaisteth",
    role: "admin",
    name: "AI Steth Admin"
  },
  "admin": {
    password: "admin123",
    role: "admin",
    name: "Administrator"
  },
  "doctor": {
    password: "doctor456",
    role: "doctor",
    name: "Dr. Smith"
  },
  "billing": {
    password: "billing789",
    role: "billing",
    name: "Billing Specialist"
  }
};

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Simple authentication check
    if (!username || !password) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }

    // Check credentials
    const user = USERS[username as keyof typeof USERS];
    if (user && user.password === password) {
      // Store user info in sessionStorage
      sessionStorage.setItem("user", JSON.stringify({
        username,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString()
      }));

      // Show success message
      setSuccess(`Login successful! Redirecting to RAG Agent at ${RAG_AGENT_URL}...`);
      setIsLoading(false);

      // Redirect to RAG agent after a short delay
      setTimeout(() => {
        console.log("Redirecting to:", RAG_AGENT_URL);
        window.location.href = RAG_AGENT_URL;
      }, 1500);
    } else {
      setError("Invalid username or password");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-stethoscope text-primary-foreground text-2xl"></i>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to AISTETH</CardTitle>
          <p className="text-muted-foreground">
            Sign in to access the Medical Billing RAG Agent
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setLocation("/")}
              className="text-sm"
            >
              ← Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
