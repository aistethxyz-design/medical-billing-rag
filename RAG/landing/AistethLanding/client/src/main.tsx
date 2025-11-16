import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure root element exists before rendering
const rootElement = document.getElementById("root");
if (!rootElement) {
  // If root doesn't exist, create it
  const root = document.createElement("div");
  root.id = "root";
  document.body.appendChild(root);
  createRoot(root).render(<App />);
} else {
  try {
    createRoot(rootElement).render(<App />);
  } catch (error) {
    console.error("Failed to render React app:", error);
    // Fallback: render error message directly
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h1>Error Loading Application</h1>
        <p>Please refresh the page or contact support.</p>
        <button onclick="window.location.reload()">Reload Page</button>
      </div>
    `;
  }
}
