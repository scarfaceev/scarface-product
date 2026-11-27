import { useEffect, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Overlays from "./components/Overlays";
import Home from "./pages/Home";
import { authApiUrl } from "./utils/auth-api.js";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(authApiUrl("me"), { credentials: "include" })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) {
          setIsAuthenticated(false);
          if (response.status !== 401) {
            console.error(`Unable to verify the current session (HTTP ${response.status}).`);
          }
          return;
        }
        const payload = await response.json();
        if (!payload?.data?.phone) {
          window.location.replace("./complete-profile.html");
          return;
        }
        setIsAuthenticated(true);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Unable to verify the current session.", error);
        setIsAuthenticated(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    const response = await fetch(authApiUrl("logout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(`Logout request failed (HTTP ${response.status}).`);
    setIsAuthenticated(false);
  };

  return (
    <>
      <Header isAuthenticated={isAuthenticated} onLogout={logout} />
      <Home isAuthenticated={isAuthenticated} />
      <Footer />
      <Overlays />
    </>
  );
}
