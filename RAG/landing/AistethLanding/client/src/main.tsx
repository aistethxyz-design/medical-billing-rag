import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add a visible indicator that JavaScript is running
console.log("🚀 React app starting...");

// Ensure root element exists before rendering
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  // If root doesn't exist, create it
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  console.log("✅ Created root element");
  try {
    createRoot(root).render(<App />);
    console.log("✅ React app rendered successfully");
  } catch (error) {
    console.error("❌ Failed to render React app:", error);
    root.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: red;">Error Loading Application</h1>
        <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Reload Page</button>
      </div>
    `;
  }
} else {
  console.log("✅ Root element found");
  try {
    createRoot(rootElement).render(<App />);
    console.log("✅ React app rendered successfully");
  } catch (error) {
    console.error("❌ Failed to render React app:", error);
    // Fallback: render error message directly
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; background: white; min-height: 100vh;">
        <h1 style="color: red;">Error Loading Application</h1>
        <p style="color: #666;">Error: ${error instanceof Error ? error.message : String(error)}</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;">${error instanceof Error ? error.stack : String(error)}</pre>
        <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; margin-top: 20px;">Reload Page</button>
      </div>
    `;
  }
}
