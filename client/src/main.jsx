import { AuthProvider } from "./Context/AuthContext";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./Dashboard/Dashboard.jsx";
import LandingPage from "./LandingPage/LandingPage.jsx";
import Login from "./Credentials/Login.jsx";
import LiveFeed from "./Dashboard/LiveFeed.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/feed" element={<LiveFeed />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
