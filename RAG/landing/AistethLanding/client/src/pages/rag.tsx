import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { verifyEncoder } from "@/lib/encoder";
import { USERS } from "./login";

// RAG Agent URL - can be configured via environment variable
// This should point to where your Streamlit RAG agent is actually deployed
// For example: http://5.161.47.228:8501 or https://your-streamlit-host.com
const RAG_AGENT_URL = import.meta.env.VITE_RAG_AGENT_URL || 
  (import.meta.env.PROD 
    ? "http://5.161.47.228:8501"  // Default production IP (update this to your actual Streamlit host)
    : "http://localhost:8501");  // Development localhost

export default function RAG() {
  const [, params] = useRoute("/RAG/:encoder");
  const [, setLocation] = useLocation();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const encoder = params?.encoder;
    
    if (!encoder || encoder.length !== 12) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    // Get user info from sessionStorage
    const userStr = sessionStorage.getItem("user");
    if (!userStr) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      
      // Find the user's password from USERS object
      const userData = USERS[user.username as keyof typeof USERS];
      if (!userData) {
        setIsValid(false);
        setLoading(false);
        return;
      }

      // Verify encoder matches
      const valid = verifyEncoder(encoder, user.username, userData.password);
      setIsValid(valid);
      
      if (!valid) {
        // Invalid encoder, redirect to login
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      }
    } catch (error) {
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  }, [params?.encoder, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            Invalid or expired access code. Redirecting to login...
          </p>
          <button
            onClick={() => setLocation("/login")}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Valid encoder - embed RAG agent
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full h-screen border-0">
        <iframe
          src={RAG_AGENT_URL}
          className="w-full h-full border-0"
          title="Medical Billing RAG Agent"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
        />
      </div>
    </div>
  );
}

