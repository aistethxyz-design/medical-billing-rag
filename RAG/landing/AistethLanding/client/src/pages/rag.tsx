import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { verifyEncoder, generateEncoder } from "@/lib/encoder";
import { USERS } from "./login";

// Simple error boundary component
function RAGErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// RAG Agent URL - can be configured via environment variable
// This should point to where your Streamlit RAG agent is actually deployed
// For example: http://5.161.47.228:8501 or https://your-streamlit-host.com
const RAG_AGENT_URL = import.meta.env.VITE_RAG_AGENT_URL || 
  (import.meta.env.PROD 
    ? "http://5.161.47.228:8501"  // Default production IP (update this to your actual Streamlit host)
    : "http://localhost:8501");  // Development localhost

function RAGContent() {
  const [match, params] = useRoute("/RAG/:encoder");
  const [, setLocation] = useLocation();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [iframeError, setIframeError] = useState(false);

  // Debug: Always log to see if component renders
  console.log("RAG Component rendered", { match, params });

  // IMMEDIATE render - show something right away
  if (loading && isValid === null) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
          <p className="text-xs text-muted-foreground mt-2">URL: /RAG/{params?.encoder || 'loading...'}</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Safety timeout - if validation takes too long, show error
    const timeoutId = setTimeout(() => {
      console.warn("RAG Page - Validation timeout");
      setIsValid(false);
      setLoading(false);
      setError("Validation timeout. Please try logging in again.");
    }, 5000); // 5 second timeout

    // If route doesn't match, redirect
    if (!match) {
      console.log("RAG Page - Route doesn't match, redirecting to login");
      clearTimeout(timeoutId);
      setLocation("/login");
      return;
    }

    const encoder = params?.encoder;
    
    console.log("RAG Page - Encoder:", encoder);
    
    if (!encoder || encoder.length !== 12) {
      console.log("RAG Page - Invalid encoder length:", encoder?.length);
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
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
        clearTimeout(timeoutId);
        setIsValid(false);
        setLoading(false);
        setError("User not found");
        return;
      }

      // Verify encoder matches
      const valid = verifyEncoder(encoder, user.username, userData.password);
      console.log("RAG Page - Encoder valid:", valid, "Expected:", generateEncoder(user.username, userData.password), "Got:", encoder);
      clearTimeout(timeoutId);
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
      clearTimeout(timeoutId);
      setIsValid(false);
      setError("Error verifying access");
    } finally {
      setLoading(false);
    }

    return () => clearTimeout(timeoutId);
  }, [match, params?.encoder, setLocation]);

  // Always show something - even if route doesn't match
  if (!match) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-muted-foreground">Route not matched. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
          <p className="text-xs text-muted-foreground mt-2">Encoder: {params?.encoder}</p>
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
      // Set a timeout to detect if iframe fails to load
      const timer = setTimeout(() => {
        const iframe = document.querySelector('iframe') as HTMLIFrameElement;
        if (iframe) {
          try {
            // Check if iframe has loaded (CORS will block this, but that's ok)
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            console.log("Iframe check:", iframeDoc ? "Loaded" : "CORS blocked (expected)");
          } catch (e) {
            // CORS error is expected for cross-origin iframes
            console.log("Iframe CORS check (expected for cross-origin):", e);
          }
        }
      }, 5000);

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

  // Try iframe first, but if it fails, offer direct link
  const handleDirectRedirect = () => {
    window.open(RAG_AGENT_URL, '_blank');
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header with info */}
      <div className="bg-card border-b border-border p-2 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Medical Billing RAG Agent
        </div>
        <button
          onClick={handleDirectRedirect}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded shadow-lg"
          title="Open RAG Agent in new tab if iframe doesn't load"
        >
          Open in New Tab
        </button>
      </div>
      
      <div className="w-full" style={{ height: 'calc(100vh - 50px)' }}>
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
      </div>
      
      {/* Loading indicator overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading RAG Agent...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Export with error boundary
export default function RAG() {
  try {
    return <RAGContent />;
  } catch (error) {
    console.error("RAG Component Error:", error);
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Error Loading RAG Page</h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            onClick={() => window.location.href = "/login"}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }
}

