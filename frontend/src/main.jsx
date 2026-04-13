import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#111111",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 18px rgba(15, 23, 42, 0.08)",
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
