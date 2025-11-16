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
  const [error, setError] = useState<string>("");
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    const encoder = params?.encoder;
    
    console.log("RAG Page - Encoder:", encoder);
    
    if (!encoder || encoder.length !== 12) {
      console.log("RAG Page - Invalid encoder length");
      setIsValid(false);
      setLoading(false);
      setError("Invalid encoder format");
      return;
    }

    // Get user info from sessionStorage
    const userStr = sessionStorage.getItem("user");
    console.log("RAG Page - User from sessionStorage:", userStr);
    
    if (!userStr) {
      console.log("RAG Page - No user in sessionStorage");
      setIsValid(false);
      setLoading(false);
      setError("No active session. Please login again.");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log("RAG Page - Parsed user:", user);
      
      // Find the user's password from USERS object
      const userData = USERS[user.username as keyof typeof USERS];
      if (!userData) {
        console.log("RAG Page - User not found in USERS:", user.username);
        setIsValid(false);
        setLoading(false);
        setError("User not found");
        return;
      }

      // Verify encoder matches
      const valid = verifyEncoder(encoder, user.username, userData.password);
      console.log("RAG Page - Encoder valid:", valid);
      setIsValid(valid);
      
      if (!valid) {
        console.log("RAG Page - Encoder verification failed");
        setError("Invalid access code");
        // Invalid encoder, redirect to login
        setTimeout(() => {
          setLocation("/login");
        }, 2000);
      }
    } catch (error) {
      console.error("RAG Page - Error:", error);
      setIsValid(false);
      setError("Error verifying access");
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
            {error || "Invalid or expired access code. Redirecting to login..."}
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
  useEffect(() => {
    if (isValid) {
      // Set a timeout to check if iframe loads
      const timer = setTimeout(() => {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          try {
            // Try to access iframe content (will fail if CORS blocks it, but that's ok)
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
              console.log("Iframe loaded (CORS may prevent content access check)");
            }
          } catch (e) {
            // CORS error is expected, but iframe might still be loading
            console.log("Iframe CORS check (expected):", e);
          }
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isValid]);

  if (iframeError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Unable to Load RAG Agent</h1>
          <p className="text-muted-foreground mb-4">
            The RAG agent could not be loaded from {RAG_AGENT_URL}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Please ensure the Streamlit app is running and accessible.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 mr-2"
          >
            Retry
          </button>
          <button
            onClick={() => setLocation("/login")}
            className="bg-secondary text-secondary-foreground px-6 py-2 rounded-md hover:bg-secondary/90"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="w-full h-screen border-0 relative">
        <iframe
          src={RAG_AGENT_URL}
          className="w-full h-full border-0"
          title="Medical Billing RAG Agent"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-modals"
          onLoad={() => {
            console.log("Iframe loaded successfully");
            setIframeError(false);
          }}
          onError={() => {
            console.error("Iframe failed to load");
            setIframeError(true);
          }}
        />
        <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">
          RAG Agent: {RAG_AGENT_URL}
        </div>
      </div>
    </div>
  );
}

